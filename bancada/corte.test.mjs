// Cortes calados (revisão do passo 2, 18/11/2026). O caminho de verdade da conversa da janela (enviarTexto -> /api/send)
// cortava em 40.000 caracteres sem avisar e tirava o FIM, onde ficam a mensagem do assessor e as instruções da Mesa.
// Agora: o motor corta o miolo (o contexto e o pedido que está na tela), nunca o fim protegido, e devolve "cortado" e
// "aviso"; a tela mostra. Os outros cortes calados (vídeo em 8.000, caixa de continuar a conversa em 4.000, instruções
// da tarefa em 4.000) passam a avisar, sem mudar os limites. Rodar: node --test bancada/*.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { corteDoMotor } from './catalogo.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = process.env.MESA_RAIZ || path.resolve(AQUI, '..');
const C = await import(pathToFileURL(path.join(RAIZ, 'janela', 'corte.mjs')).href);
const MOTOR = path.join(RAIZ, 'janela', 'motor.mjs');
const ARQ_JANELA = path.join(RAIZ, 'janela', 'mesa-janela.html');
const ARQ_PAINEL = path.join(RAIZ, 'servidor', 'painel-v2.html');
const FALSO = path.join(AQUI, 'falso-claude', 'claude.cmd');
const SO_WINDOWS = process.platform !== 'win32' && 'o Claude falso é um .cmd do Windows';
const milhar = (n) => n.toLocaleString('pt-BR');
const ler = (arq) => readFileSync(arq, 'utf8').replace(/\r\n/g, '\n');
const trecho = (s, re, nome) => { const m = s.match(re); assert.ok(m, `não achei ${nome || re}`); return m[0]; };
const FIM = '\nMensagem do assessor: compare com o mês passado\n\n(Instruções da Mesa. Responda em português do Brasil.)';

// ---------- a conta do corte (janela/corte.mjs) ----------
test('dentro do limite, a mensagem passa inteira e sem aviso', () => {
  assert.deepEqual(C.cortarMensagem('abc', 10, 2), { texto: 'abc', cortado: false });
});

test('acima do limite sai o miolo: o começo e o fim protegido ficam inteiros, com a marca e o aviso do que saiu', () => {
  const corpo = 'C'.repeat(30000) + 'P'.repeat(30000), original = corpo + FIM;
  const r = C.cortarMensagem(original, 40000, FIM.length);
  assert.equal(r.cortado, true);
  assert.ok(r.texto.length <= 40000, `ficou com ${r.texto.length}`);
  assert.ok(r.texto.endsWith(FIM), 'a mensagem do assessor e as instruções não chegaram inteiras');
  assert.ok(r.texto.startsWith('C'.repeat(15000)), 'o começo não ficou');
  const marca = r.texto.match(/\n\n\[… ([\d.]+) caracteres do meio cortados pela Mesa para caber no limite de envio …\]\n\n/);
  assert.ok(marca, 'sem a marca no lugar do corte');
  assert.equal(Number(marca[1].replace(/\./g, '')), r.tirados);
  assert.equal(r.texto.length - marca[0].length + r.tirados, original.length, 'a conta do que saiu não fecha');
  assert.ok(r.texto.slice(0, r.texto.length - FIM.length).endsWith('P'.repeat(1000)), 'o fim do pedido (antes da mensagem) não ficou');
  for (const x of [milhar(original.length), milhar(40000), milhar(r.tirados)]) assert.ok(r.aviso.includes(x), `o aviso não traz ${x}: ${r.aviso}`);
  assert.match(r.aviso, /mensagem e as instruções da Mesa foram inteiras/);
});

test('sem fim protegido, o corte também sai do meio: ficam o começo e o fim do texto', () => {
  const r = C.cortarMensagem('A'.repeat(500) + 'M'.repeat(1000) + 'Z'.repeat(500), 1000);
  assert.ok(r.texto.length <= 1000);
  assert.ok(r.texto.startsWith('A'.repeat(300)) && r.texto.endsWith('Z'.repeat(300)));
  assert.ok(!/inteiras/.test(r.aviso), 'diz que protegeu a mensagem sem ter protegido');
});

test('se só a mensagem e as instruções já passam do limite, nada é cortado nem enviado: volta o erro', () => {
  const r = C.cortarMensagem('x'.repeat(100) + 'm'.repeat(2000), 1000, 2000);
  assert.equal(r.texto, undefined);
  assert.match(r.erro, /2\.000 caracteres/);
  assert.match(r.erro, /1\.000/);
  assert.match(r.erro, /Encurte/);
});

test('instruções da tarefa acima de 4.000: o fim sai e o aviso diz quanto', () => {
  assert.deepEqual(C.cortarFim('curto', 4000, 'As instruções'), { texto: 'curto', cortado: false });
  const r = C.cortarFim('i'.repeat(5000), 4000, 'As instruções da tarefa');
  assert.equal(r.texto.length, 4000);
  assert.match(r.aviso, /^As instruções da tarefa tinham 5\.000 caracteres e vão até 4\.000: os últimos 1\.000 ficaram de fora\./);
});

test('o texto que aparece na conversa acima de 4.000 mostra que foi encurtado só ali', () => {
  assert.equal(C.paraExibir('oi', 4000), 'oi');
  const r = C.paraExibir('m'.repeat(9000), 4000);
  assert.ok(r.length <= 4000);
  assert.match(r, /\[mensagem longa: aqui aparece só o começo; o Claude recebeu inteira\]$/);
});

// ---------- o motor de verdade, com o Claude falso ----------
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const portaLivre = () => new Promise((ok, no) => { const s = net.createServer(); s.on('error', no); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
let pasta, chamadas, motor, base, token;
const api = async (rota, corpo) => {
  const r = await fetch(base + rota, { method: 'POST', headers: { 'content-type': 'application/json', 'x-mesa-token': token }, body: JSON.stringify(corpo || {}) });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const lerChamadas = () => (existsSync(chamadas) ? readFileSync(chamadas, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
async function enviarEEsperar(corpo) {
  const antes = lerChamadas().length;
  const r = await api('/api/send', corpo);
  if (r.status !== 200) return { r, chamadas: lerChamadas().length - antes };
  for (let i = 0; i < 100; i++) { await espera(150); const e = (await api('/api/estado')).json; if (!e.rodando && lerChamadas().length > antes) return { r, chamada: lerChamadas().at(-1), estado: e }; }
  throw new Error('o Claude falso não foi chamado');
}

before(async () => {
  if (SO_WINDOWS) return;
  pasta = mkdtempSync(path.join(os.tmpdir(), 'mesa-corte-'));
  const casa = path.join(pasta, 'casa'); mkdirSync(path.join(casa, 'Documents'), { recursive: true });
  const tmp = path.join(pasta, 'tmp'); mkdirSync(tmp, { recursive: true });
  const perfil = path.join(pasta, 'perfil');
  chamadas = path.join(pasta, 'chamadas.jsonl');
  const porta = await portaLivre();
  motor = spawn(process.execPath, [MOTOR], {
    cwd: path.dirname(MOTOR), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    env: { ...process.env, MESA_JANELA_PORTA: String(porta), MESA_PERFIL_DIR: perfil, TEMP: tmp, TMP: tmp, USERPROFILE: casa, HOME: casa, CLAUDE_BIN: FALSO, FALSO_CLAUDE_SAIDA: chamadas },
  });
  let log = ''; motor.stdout.on('data', (d) => { log += d; }); motor.stderr.on('data', (d) => { log += d; });
  base = `http://127.0.0.1:${porta}`;
  // O segredo é o do motor deste teste (pasta temporária): fica só nesta variável, não é impresso nem gravado.
  let segredo = '';
  for (let i = 0; i < 80 && !segredo; i++) { try { const j = JSON.parse(readFileSync(path.join(perfil, 'motor.json'), 'utf8')); if (j.porta === porta) segredo = j.segredo; } catch { } if (!segredo) await espera(150); }
  if (!segredo) throw new Error('o motor não subiu: ' + log.slice(0, 400));
  const html = await (await fetch(base + '/', { headers: { 'x-mesa-segredo': segredo } })).text();
  token = (html.match(/const TOKEN = "([0-9a-f]+)"/) || [])[1];
  await api('/api/ping');
});

after(async () => {
  if (motor) { try { spawn('taskkill', ['/pid', String(motor.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch { } await espera(400); }
  if (pasta) rmSync(pasta, { recursive: true, force: true });
});

test('a bancada lê o limite do motor na constante nova', () => {
  assert.equal(corteDoMotor(MOTOR), 40000);
});

test('motor: conversa de 60.000 caracteres chega ao Claude com a mensagem e as instruções inteiras, o miolo cortado, e a resposta avisa', { skip: SO_WINDOWS }, async () => {
  const texto = '[Pedido que está na tela]\n' + 'X'.repeat(60000) + '\n[Fim do pedido]\n' + FIM;
  const { r, chamada, estado } = await enviarEEsperar({ texto, fimProtegido: FIM.length, exibir: 'compare com o mês passado' });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.cortado, true);
  assert.ok(r.json.aviso.includes(milhar(texto.length)) && r.json.aviso.includes(milhar(40000)), r.json.aviso);
  assert.ok(chamada.entrada.endsWith(FIM), 'a mensagem do assessor e as instruções não chegaram inteiras ao Claude');
  assert.match(chamada.entrada, /caracteres do meio cortados pela Mesa/);
  const xs = (chamada.entrada.match(/X/g) || []).length;
  assert.ok(xs > 30000 && xs < 40000, `${xs} caracteres do pedido chegaram`);
  assert.equal(estado.turnos.filter((t) => t.papel === 'assessor').at(-1).texto, 'compare com o mês passado');
});

test('motor: mensagem que sozinha passa do limite volta 413 com o motivo, e o Claude não é chamado', { skip: SO_WINDOWS }, async () => {
  const fim = '\nMensagem do assessor: ' + 'y'.repeat(41000);
  const { r, chamadas: n } = await enviarEEsperar({ texto: 'contexto\n' + fim, fimProtegido: fim.length, exibir: 'y' });
  assert.equal(r.status, 413);
  assert.match(r.json.erro, /Encurte/);
  assert.equal(n, 0);
});

test('motor: dentro do limite não há aviso; instruções da tarefa acima de 4.000 voltam avisadas', { skip: SO_WINDOWS }, async () => {
  const curto = await enviarEEsperar({ texto: 'Resuma o dia.', exibir: 'Resuma o dia.' });
  assert.equal(curto.r.status, 200);
  assert.equal(curto.r.json.cortado, false);
  assert.equal(curto.r.json.aviso, undefined);
  await api('/api/novo');
  const { r, chamada } = await enviarEEsperar({ texto: 'Pedido da tarefa', contexto: 'I'.repeat(5000), exibir: 'Pedido enviado: Juros' });
  assert.equal(r.status, 200);
  assert.equal(r.json.cortado, true);
  assert.match(r.json.aviso, /5\.000 caracteres e vão até 4\.000/);
  assert.equal((chamada.entrada.match(/I/g) || []).length >= 4000, true);
  assert.ok(!chamada.entrada.includes('I'.repeat(4001)), 'as instruções passaram de 4.000');
});

test('motor: mensagem longa aparece encurtada na conversa, com a marca, e o Claude recebe inteira', { skip: SO_WINDOWS }, async () => {
  const longa = 'L'.repeat(6000);
  const { r, chamada, estado } = await enviarEEsperar({ texto: '\nMensagem do assessor: ' + longa, fimProtegido: 6030, exibir: longa });
  assert.equal(r.status, 200);
  assert.ok(chamada.entrada.includes(longa));
  const vista = estado.turnos.filter((t) => t.papel === 'assessor').at(-1).texto;
  assert.ok(vista.length <= 4000, `a conversa mostra ${vista.length}`);
  assert.match(vista, /o Claude recebeu inteira\]$/);
});

// ---------- as telas ----------
// Elementos falsos, só o que o aviso usa: a caixa da conversa e o aviso criado antes dela.
function domFalso() {
  const els = {};
  const cx = { before: (e) => { els[e.id] = e; } };
  return {
    els,
    raiz: { querySelector: (q) => (q === '#cvCaixa' ? cx : els[q.slice(1)] ?? null) },
    document: { createElement: () => ({ id: '', className: '', style: {}, textContent: '', setAttribute() {} }), querySelector: () => null },
  };
}

function preparaConversa() {
  const s = ler(ARQ_JANELA);
  const i = s.indexOf('  const INSTRUCOES ='), instr = s.slice(i, s.indexOf('";\n', i) + 2);
  const fonte = [instr, trecho(s, /^ {2}function avisoCorte\(t\) \{[\s\S]*?\n {2}\}$/m, 'avisoCorte'), 'let esperandoAcao = false, rodando = false;',
    trecho(s, /^ {4}const enviarTexto = async \(t\) => \{[\s\S]*?\n {4}\};$/m, 'enviarTexto'), 'globalThis.__enviar = enviarTexto; globalThis.__INSTRUCOES = INSTRUCOES;'].join('\n');
  const dom = domFalso(), corpos = [];
  const ctx = vm.createContext({
    ...dom, pedido: 'P'.repeat(100), resposta: { ok: true }, falha: null,
    window: { __mesaPedido: { get: () => ctx.pedido } }, descreverContexto: () => '[Contexto da Mesa] tela=pedido\n',
    anexoSubindo: () => false, avisoAnexo: (t) => { ctx.avisoDoAnexo = t; }, idsProntos: () => [], metaAtual: () => null, tirarEnviados: () => {}, acompanhar: () => {},
    api: async (rota, corpo) => { corpos.push([rota, corpo]); if (ctx.falha) throw ctx.falha; return ctx.resposta; },
  });
  new vm.Script(fonte, { filename: ARQ_JANELA }).runInContext(ctx);
  return { ctx, dom, corpos };
}

test('janela · conversa: o fim (mensagem do assessor e instruções) vai marcado como protegido', async () => {
  const { ctx, corpos } = preparaConversa();
  assert.equal(await ctx.__enviar('compare com o mês passado'), true);
  const [rota, corpo] = corpos[0];
  assert.equal(rota, '/api/send');
  const fim = '\nMensagem do assessor: compare com o mês passado\n\n' + ctx.__INSTRUCOES;
  assert.equal(corpo.fimProtegido, fim.length);
  assert.ok(corpo.texto.endsWith(fim));
  assert.ok(corpo.texto.includes('[Pedido que está na tela]\n' + 'P'.repeat(100)));
});

test('janela · conversa: o aviso de corte do motor aparece na conversa e some no envio seguinte', async () => {
  const { ctx, dom } = preparaConversa();
  ctx.resposta = { ok: true, cortado: true, aviso: 'A conversa tinha 60.000 caracteres e o envio vai até 40.000.' };
  await ctx.__enviar('primeira');
  assert.equal(dom.els.cvCorteAviso.textContent, ctx.resposta.aviso);
  assert.notEqual(dom.els.cvCorteAviso.style.display, 'none');
  ctx.resposta = { ok: true, cortado: false };
  await ctx.__enviar('segunda');
  assert.equal(dom.els.cvCorteAviso.style.display, 'none');
});

test('janela · conversa: recusa do motor por tamanho (413) aparece na conversa e o texto não sai da caixa', async () => {
  const { ctx, dom } = preparaConversa();
  ctx.falha = Object.assign(new Error('A mensagem e as instruções da Mesa somam 45.000 caracteres e o envio vai até 40.000. Encurte a mensagem ou divida em duas.'), { status: 413 });
  assert.equal(await ctx.__enviar('y'.repeat(45000)), false, 'deu como enviada');
  assert.match(dom.els.cvCorteAviso.textContent, /Encurte/);
});

test('janela · pedido enviado pelo cartão: o aviso de corte do motor aparece na conversa', async () => {
  const s = ler(ARQ_JANELA);
  const ini = s.indexOf('  class App {'), fim = s.indexOf('\n  }\n', ini);
  const fonte = [trecho(s, /^ {2}function avisoCorte\(t\) \{[\s\S]*?\n {2}\}$/m, 'avisoCorte'), s.slice(ini, fim + 4), 'globalThis.__app = new App();'].join('\n');
  const dom = domFalso();
  const ctx = vm.createContext({
    ...dom, ctxPendente: 'Tarefa da Mesa do Assessor: Juros.', anexoSubindo: () => false, idsProntos: () => [], metaAtual: () => null, avisoAnexo: () => {}, tirarEnviados: () => {}, acompanhar: () => {},
    api: async () => ({ ok: true, cortado: true, aviso: 'As instruções da tarefa tinham 5.000 caracteres e vão até 4.000: os últimos 1.000 ficaram de fora.' }),
  });
  new vm.Script(fonte, { filename: ARQ_JANELA }).runInContext(ctx);
  assert.equal(JSON.stringify(await ctx.__app.sendMessage({ content: [{ type: 'text', text: '[Mesa] Juros\nPedido' }] })), '{}', 'o envio não foi aceito');
  assert.match(dom.els.cvCorteAviso.textContent, /5\.000 caracteres/);
});

// Pedido de edição de vídeo (só na janela): até 8.000 caracteres, com a linha do vídeo sempre inteira.
function preparaVideo() {
  const s = ler(ARQ_JANELA);
  const linha = (re) => trecho(s, re);
  const ini = s.indexOf('  async function enviarPedido(t, ps) {'), fim = s.indexOf('\n  }\n', ini);
  const iniD = s.indexOf('  async function enviarEdicaoDireta(caminho) {'), fimD = s.indexOf('\n  }\n', iniD);
  const fonte = ['let enviando = false, conectado = true, videoEscolhido = "";', linha(/^ {2}const CORTE_PEDIDO = \d+;$/m), linha(/^ {2}const CORTE_VIDEO = \d+;$/m),
    linha(/^ {2}let medirPedido = null, corteAvisado = "";$/m), linha(/^ {2}const milhar = .*$/m), linha(/^ {2}const avisoDeCorte = .*$/m),
    s.slice(ini, fim + 4), s.slice(iniD, fimD + 4), 'globalThis.__enviar = enviarPedido; globalThis.__direta = enviarEdicaoDireta;'].join('\n');
  const enviados = [], alertas = [], st = { className: '', textContent: '' };
  const ctx = vm.createContext({
    textoAtual: '', window: {}, tarefasUsuario: [], AREAS: [{ id: 'instagram', nome: 'Instagram' }], estado: { area: 'instagram', respostas: {} }, T: { 'editar-reels': { nome: 'Editar Reels' } }, perfil: { nome: 'Assessor Teste' },
    $: () => st, promptAtual: () => ({ texto: ctx.textoAtual }), instrucao: () => '', acompanhar: () => {}, aplicarHost: () => {}, ehEdicaoVideo: () => true,
    perguntarVideo: async () => 'C:\\Videos\\reels.mp4', pedidoEdicaoVideo: () => ctx.textoAtual, alert: (m) => alertas.push(m),
    app: { escolherVideo: () => {}, callServerTool: async () => ({}), updateModelContext: async () => {}, sendMessage: async (m) => { enviados.push(m.content[0].text); return {}; }, getHostContext: () => ({ displayMode: 'fullscreen' }), requestDisplayMode: async () => {} },
  });
  new vm.Script(fonte, { filename: ARQ_JANELA }).runInContext(ctx);
  return { ctx, enviados, alertas, st, enviar: () => ctx.__enviar({ id: 'editar-reels', nome: 'Editar Reels' }, []) };
}
const LINHA_VIDEO = '\n\nVídeo anexado: C:\\Videos\\reels.mp4. Pode começar.';

test('janela · vídeo: pedido acima de 8.000 avisa no primeiro clique; no segundo vai cortado, com a linha do vídeo inteira', async () => {
  const { ctx, enviados, st, enviar } = preparaVideo();
  ctx.textoAtual = 'v'.repeat(9000);
  await enviar();
  assert.equal(enviados.length, 0, 'enviou sem avisar');
  assert.equal(st.className, 'estado erro');
  for (const x of [milhar(9000), milhar(8000 - LINHA_VIDEO.length), 'clique de novo']) assert.ok(st.textContent.includes(x), `o aviso não traz ${x}: ${st.textContent}`);
  await enviar();
  assert.equal(enviados.length, 1);
  assert.ok(enviados[0].endsWith(LINHA_VIDEO), 'a linha do vídeo foi cortada');
  assert.equal(enviados[0].length, 8000);
  ctx.textoAtual = 'w'.repeat(1000);
  await enviar();
  assert.equal(enviados[1], 'w'.repeat(1000) + LINHA_VIDEO, 'pedido curto não foi direto e inteiro');
});

test('janela · edição direta de vídeo: acima de 8.000 avisa e mantém a linha do vídeo', async () => {
  const { ctx, enviados, alertas } = preparaVideo();
  ctx.textoAtual = 'd'.repeat(9000);
  await ctx.__direta('C:\\Videos\\reels.mp4');
  assert.equal(alertas.length, 1);
  assert.ok(alertas[0].includes(milhar(9000 + LINHA_VIDEO.length)) && alertas[0].includes(milhar(8000)), alertas[0]);
  assert.ok(enviados[0].endsWith(LINHA_VIDEO) && enviados[0].length === 8000);
  ctx.textoAtual = 'e'.repeat(500);
  await ctx.__direta('C:\\Videos\\reels.mp4');
  assert.equal(alertas.length, 1, 'avisou sem corte');
  assert.equal(enviados[1], 'e'.repeat(500) + LINHA_VIDEO);
});

for (const [nome, arq] of [['janela', ARQ_JANELA], ['painel', ARQ_PAINEL]]) {
  test(`${nome} · caixa de continuar a conversa: acima de 4.000 não corta calado, avisa e não envia`, async () => {
    const s = ler(arq);
    const ini = s.indexOf('  async function enviarMensagem(texto, st) {'), fim = s.indexOf('\n  }\n', ini);
    const fonte = [trecho(s, /^ {2}const milhar = .*$/m), trecho(s, /^ {2}const LIMITE_CAIXA = \d+;$/m, 'LIMITE_CAIXA'), 'let conversa = [], rascunhoChat = "";', s.slice(ini, fim + 4), 'globalThis.__m = enviarMensagem;'].join('\n');
    const enviados = [], st = { className: '', textContent: '' };
    const ctx = vm.createContext({ conectado: true, registrar: () => {}, app: { sendMessage: async (m) => { enviados.push(m.content[0].text); return {}; } } });
    new vm.Script(fonte, { filename: arq }).runInContext(ctx);
    assert.equal(await ctx.__m('k'.repeat(4001), st), false);
    assert.equal(enviados.length, 0, 'enviou cortado');
    assert.equal(st.className, 'estado erro');
    assert.ok(st.textContent.includes('4.001') && st.textContent.includes('4.000'), st.textContent);
    assert.equal(await ctx.__m('k'.repeat(4000), st), true);
    assert.equal(enviados[0].length, 4000);
  });

  test(`${nome} · apagar o modelo salvo refaz o aviso de tamanho do pedido`, () => {
    const s = ler(arq);
    const h = trecho(s, /apagar\.onclick = async \(\) => \{[\s\S]*?\n {6}\};/, 'apagar.onclick');
    assert.match(h, /area\.value = pr\.base;[^\n]*\n?[^\n]*medir\(\);/, 'depois de voltar ao texto padrão, o aviso de tamanho não é refeito');
  });
}
