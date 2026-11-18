// Passo 5 do plano de melhorias (Anexar arquivo): o motor da janela de verdade, com um Claude falso.
// Sobe janela/motor.mjs numa pasta temporária que faz papel de "casa" do usuário (nada vai para os
// Documentos de verdade), anexa arquivos pela mesma rota que a tela usa e confere o que o Claude receberia.
// Rodar: node --test bancada/*.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = process.env.MESA_RAIZ || path.resolve(AQUI, '..');
const MOTOR = path.join(RAIZ, 'janela', 'motor.mjs');
const FALSO = path.join(AQUI, 'falso-claude', 'claude.cmd');
const SO_WINDOWS = process.platform !== 'win32' && 'o Claude falso é um .cmd do Windows';
const MB = 1024 * 1024;
const PDF = Buffer.from('%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const portaLivre = () => new Promise((ok, no) => { const s = net.createServer(); s.on('error', no); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

let raiz, casa, chamadas, motor, base, token;
const mesa = () => path.join(casa, 'Documents', 'Mesa do Assessor');
const api = async (rota, corpo) => {
  const r = await fetch(base + rota, { method: 'POST', headers: { 'content-type': 'application/json', 'x-mesa-token': token }, body: JSON.stringify(corpo || {}) });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const subir = async (nome, bytes, rota = '/api/anexo') => {
  const r = await fetch(`${base}${rota}?nome=${encodeURIComponent(nome)}`, { method: 'POST', headers: { 'x-mesa-token': token, 'content-type': 'application/octet-stream' }, body: bytes });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const lerChamadas = () => (existsSync(chamadas) ? readFileSync(chamadas, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
async function enviarEEsperar(corpo) {
  const antes = lerChamadas().length;
  const r = await api('/api/send', corpo);
  if (r.status !== 200) return { r };
  for (let i = 0; i < 100; i++) { await espera(150); const e = (await api('/api/estado')).json; if (!e.rodando && lerChamadas().length > antes) return { r, chamada: lerChamadas().at(-1), estado: e }; }
  throw new Error('o Claude falso não foi chamado');
}
const valor = (args, opcao) => { const i = args.indexOf(opcao); return i < 0 ? null : args[i + 1]; };
const pastasDe = (args) => { const i = args.indexOf('--add-dir'); if (i < 0) return []; const r = []; for (let k = i + 1; k < args.length && !args[k].startsWith('--'); k++) r.push(args[k]); return r; };
const arquivosEm = (pasta) => (existsSync(pasta) ? readdirSync(pasta) : []);

before(async () => {
  if (SO_WINDOWS) return;
  raiz = mkdtempSync(path.join(os.tmpdir(), 'mesa-motor-'));
  casa = path.join(raiz, 'casa'); mkdirSync(path.join(casa, 'Documents'), { recursive: true });
  const tmp = path.join(raiz, 'tmp'); mkdirSync(tmp, { recursive: true });
  const perfil = path.join(raiz, 'perfil');
  chamadas = path.join(raiz, 'chamadas.jsonl');
  const porta = await portaLivre();
  motor = spawn(process.execPath, [MOTOR], {
    cwd: path.dirname(MOTOR), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    env: { ...process.env, MESA_JANELA_PORTA: String(porta), MESA_PERFIL_DIR: perfil, TEMP: tmp, TMP: tmp, USERPROFILE: casa, HOME: casa, CLAUDE_BIN: FALSO, FALSO_CLAUDE_SAIDA: chamadas },
  });
  let log = ''; motor.stdout.on('data', (d) => { log += d; }); motor.stderr.on('data', (d) => { log += d; });
  base = `http://127.0.0.1:${porta}`;
  let segredo = '';
  for (let i = 0; i < 80 && !segredo; i++) { try { const j = JSON.parse(readFileSync(path.join(perfil, 'motor.json'), 'utf8')); if (j.porta === porta) segredo = j.segredo; } catch { } if (!segredo) await espera(150); }
  if (!segredo) throw new Error('o motor não subiu: ' + log.slice(0, 400));
  const html = await (await fetch(base + '/', { headers: { 'x-mesa-segredo': segredo } })).text();
  token = (html.match(/const TOKEN = "([0-9a-f]+)"/) || [])[1];
  await api('/api/ping');
});

after(async () => {
  if (motor) { try { spawn('taskkill', ['/pid', String(motor.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch { } await espera(400); }
  if (raiz) rmSync(raiz, { recursive: true, force: true });
});

test('anexo com nome perigoso fica dentro de Documentos › Mesa do Assessor › Anexos › dia, com nome seguro', { skip: SO_WINDOWS }, async () => {
  const r = await subir('..\\..\\Fato Relevante — Petrobras (10.11).PDF', PDF);
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const a = r.json.anexo;
  assert.match(a.nome, /^\d{6}-Fato-Relevante-Petrobras-10\.11\.pdf$/);
  assert.equal(a.tipo, 'pdf');
  const arquivo = path.join(mesa(), 'Anexos', hoje(), a.nome);
  assert.deepEqual(readFileSync(arquivo), PDF);
  assert.ok(!existsSync(path.join(casa, 'Documents', 'Fato Relevante — Petrobras (10.11).PDF')));
  const e = (await api('/api/estado')).json;
  assert.ok(e.anexos.some((x) => x.id === a.id && x.nome === a.nome), 'o anexo aparece na lista para a tela');
  assert.equal((await api('/api/anexo/remover', { id: a.id })).status, 200);
});

test('recusa tipo errado, conteúdo que não bate com o nome, arquivo vazio e arquivo grande, sem deixar sobra', { skip: SO_WINDOWS }, async () => {
  const pasta = path.join(mesa(), 'Anexos', hoje());
  const antes = arquivosEm(pasta).length;
  assert.equal((await subir('programa.exe', Buffer.from('MZ'))).status, 415);
  assert.equal((await subir('print.png', PDF)).status, 415);
  assert.equal((await subir('vazio.pdf', Buffer.alloc(0))).status, 400);
  const grande = Buffer.concat([PNG, Buffer.alloc(10 * MB)]);
  const g = await subir('grande.png', grande);
  assert.equal(g.status, 413);
  assert.match(g.json.erro, /10 MB/);
  assert.equal(arquivosEm(pasta).length, antes, 'sobrou arquivo de anexo recusado');
});

test('remover o anexo apaga a cópia da Mesa e tira da lista', { skip: SO_WINDOWS }, async () => {
  const { json } = await subir('lamina.pdf', PDF);
  const arquivo = path.join(mesa(), 'Anexos', hoje(), json.anexo.nome);
  assert.ok(existsSync(arquivo));
  assert.equal((await api('/api/anexo/remover', { id: json.anexo.id })).status, 200);
  assert.ok(!existsSync(arquivo));
  assert.ok(!(await api('/api/estado')).json.anexos.some((x) => x.id === json.anexo.id));
  assert.equal((await api('/api/anexo/remover', { id: json.anexo.id })).status, 404);
});

test('enviar com anexos: o pedido diz onde está cada arquivo; o Claude lê só Anexos e Fontes e fica sem terminal', { skip: SO_WINDOWS }, async () => {
  const pdf = (await subir('Fato Relevante.pdf', PDF)).json.anexo;
  const png = (await subir('gráfico do dólar.png', PNG)).json.anexo;
  const { r, chamada, estado } = await enviarEEsperar({ texto: '[Mesa] Mercado hoje › Fato relevante\nResuma o comunicado anexado.', exibir: 'Pedido enviado: Fato relevante', anexos: [pdf.id, png.id] });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const anexos = path.join(mesa(), 'Anexos'), fontes = path.join(mesa(), 'Fontes');
  for (const a of [pdf, png]) assert.ok(chamada.entrada.includes(path.join(anexos, hoje(), a.nome)), `o pedido não diz onde está ${a.nome}`);
  assert.ok(chamada.entrada.indexOf('[Anexos') < chamada.entrada.indexOf('Resuma o comunicado anexado.'), 'o aviso dos anexos vem antes do pedido');
  assert.deepEqual(pastasDe(chamada.args), [anexos, fontes]);
  assert.ok(existsSync(fontes), 'a pasta Fontes existe para o Claude poder ler');
  const regra = (p) => 'Read(//' + p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, l) => l.toLowerCase()) + '/**)';
  const permitidas = valor(chamada.args, '--allowedTools').split(',');
  assert.ok(permitidas.includes(regra(anexos)) && permitidas.includes(regra(fontes)), permitidas.join(' | '));
  assert.ok(permitidas.includes('mcp__mesa') && permitidas.includes('WebSearch'));
  assert.equal(valor(chamada.args, '--disallowedTools'), 'Bash,PowerShell');
  const eu = estado.turnos.filter((t) => t.papel === 'assessor').at(-1);
  assert.match(eu.texto, /\nAnexos: Fato Relevante\.pdf, gráfico do dólar\.png$/);
  assert.ok(chamada.entrada.includes('gráfico do dólar.png'), 'o pedido mostra o nome que o assessor deu ao arquivo');
  assert.deepEqual(estado.anexos, [], 'depois de enviado, o anexo sai da caixa');
  const de_novo = await api('/api/send', { texto: 'De novo.', anexos: [pdf.id] });
  assert.equal(de_novo.status, 400, 'anexo já enviado não volta a ser usado');
  assert.equal((await api('/api/send', { texto: 'Outro.', anexos: ['nao-existe'] })).status, 400);
});

test('a mensagem seguinte da conversa continua sem terminal e com a leitura das duas pastas', { skip: SO_WINDOWS }, async () => {
  const { chamada } = await enviarEEsperar({ texto: 'Gere o PDF para o cliente.' });
  assert.equal(valor(chamada.args, '--disallowedTools'), 'Bash,PowerShell');
  assert.equal(pastasDe(chamada.args).length, 2);
  assert.ok(!chamada.entrada.includes('[Anexos'), 'sem anexo novo, sem aviso de anexo');
});

test('melhorar o pedido também roda sem terminal', { skip: SO_WINDOWS }, async () => {
  const antes = lerChamadas().length;
  const r = await api('/api/melhorar', { texto: '[Mesa] Pedido de teste', pedido: 'mais curto' });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const c = lerChamadas().slice(antes).at(-1);
  assert.equal(valor(c.args, '--disallowedTools'), 'Bash,PowerShell');
});

test('pedido de vídeo: mesmos argumentos da 1.13, com terminal liberado para o edvid e sem as pastas de anexo', { skip: SO_WINDOWS }, async () => {
  const v = await subir('clipe.mp4', Buffer.from('nao e um video de verdade'), '/api/upload');
  assert.equal(v.status, 200, JSON.stringify(v.json));
  const { chamada } = await enviarEEsperar({ texto: 'Vídeo anexado: ' + v.json.caminho + '. Pode começar.' });
  const edvid = path.join(casa, '.claude', 'skills', 'edvid');
  const venv = path.join(edvid, '.venv', 'Scripts', 'python.exe');
  const FERRAMENTAS_VIDEO_1_13 = ['Skill', 'Read', 'Write', 'Edit', 'Glob', 'Grep',
    ...['ffmpeg', 'ffprobe', 'python', 'python3', 'py', 'uv', 'node', 'npm', 'npx', 'mkdir', 'ls'].map((c) => `Bash(${c}:*)`),
    `Bash(${venv.replace(/\\/g, '/')}:*)`, `Bash(${venv}:*)`];
  const NEGADAS_VIDEO_1_13 = ['Read(**/.env)', 'Write(**/.env)', 'Edit(**/.env)', 'Read(~/.claude/skills/edvid/.env)', 'Write(~/.claude/skills/edvid/.env)', 'Edit(~/.claude/skills/edvid/.env)'];
  assert.deepEqual(pastasDe(chamada.args), [v.json.pasta]);
  assert.equal(valor(chamada.args, '--allowedTools'), ['mcp__mesa', ...FERRAMENTAS_VIDEO_1_13].join(','));
  assert.equal(valor(chamada.args, '--disallowedTools'), NEGADAS_VIDEO_1_13.join(','));
  assert.equal(path.resolve(chamada.cwd), path.resolve(v.json.pasta));
  await api('/api/limpar', { descartar: true });
});
