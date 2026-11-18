// Bancada de teste da Mesa do Assessor.
// Roda um caso pela Mesa de verdade: sobe o motor da janela em outra porta e com outra pasta de dados,
// monta o pedido com o código da tela, envia, espera o Claude terminar e grava pedido e resposta.
// Não faz parte do produto: nada aqui é copiado para o computador do assessor.
//
// Uso: node bancada/rodar.mjs --caso <arquivo.json> --saida <pasta> --dados <pasta>
//        [--raiz <pasta da Mesa>] [--porta 47822] [--perfil <arquivo.json>] [--claude <executável>] [--rotulo antes] [--seguir "mensagem"] [--so-montar] [--so-abrir]
//
// --dados: pasta só da bancada; recebe o perfil (dados/perfil) e os temporários (dados/tmp).
// --claude: executável do Claude Code a usar (por exemplo bancada/claude-limpo.cmd).
// --seguir: depois da resposta, manda esta segunda mensagem na mesma conversa (por exemplo, pedir o PDF) e grava a resposta.
// --so-montar: grava só o pedido montado, sem chamar o Claude.
// --so-abrir: sobe a Mesa com o perfil de teste e fica no ar, para conferir a tela no navegador.
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { carregar, corteDaTela } from './catalogo.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const arg = (nome, padrao) => { const i = process.argv.indexOf('--' + nome); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao; };
const RAIZ = path.resolve(arg('raiz', path.join(AQUI, '..')));
const PORTA = Number(arg('porta', 47822));
const DADOS = path.resolve(arg('dados', ''));
const SAIDA = path.resolve(arg('saida', ''));
const ROTULO = arg('rotulo', '');
const CLAUDE = arg('claude', '');
if (!arg('caso') || !arg('saida') || !arg('dados')) { console.error('Faltou --caso, --saida ou --dados.'); process.exit(2); }
const caso = JSON.parse(readFileSync(arg('caso'), 'utf8'));
const perfilTeste = arg('perfil') ? JSON.parse(readFileSync(arg('perfil'), 'utf8')) : null;
const TELA = path.join(RAIZ, 'janela', 'mesa-janela.html');
const PERFIL_DIR = path.join(DADOS, 'perfil'), TMP = path.join(DADOS, 'tmp');
mkdirSync(PERFIL_DIR, { recursive: true }); mkdirSync(TMP, { recursive: true }); mkdirSync(SAIDA, { recursive: true });

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const base = `http://127.0.0.1:${PORTA}`;
const ARQ_MOTOR = path.join(PERFIL_DIR, 'motor.json');
rmSync(ARQ_MOTOR, { force: true });

const motor = spawn(process.execPath, [path.join(RAIZ, 'janela', 'motor.mjs')], {
  cwd: path.join(RAIZ, 'janela'), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  env: { ...process.env, MESA_JANELA_PORTA: String(PORTA), MESA_PERFIL_DIR: PERFIL_DIR, TEMP: TMP, TMP, ...(CLAUDE ? { CLAUDE_BIN: path.resolve(CLAUDE) } : {}) },
});
let saidaMotor = '';
motor.stdout.on('data', (d) => { saidaMotor += d; }); motor.stderr.on('data', (d) => { saidaMotor += d; });
const desligar = () => { try { if (process.platform === 'win32') spawn('taskkill', ['/pid', String(motor.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); else motor.kill(); } catch { } };
const falhar = (msg) => { console.error(msg); desligar(); process.exit(1); };

let segredo = '';
for (let i = 0; i < 80 && !segredo; i++) { try { const j = JSON.parse(readFileSync(ARQ_MOTOR, 'utf8')); if (j.porta === PORTA && j.pid === motor.pid) segredo = j.segredo; } catch { } if (!segredo) await espera(250); }
if (!segredo) falhar(`O motor não subiu na porta ${PORTA}. Saída: ${saidaMotor.slice(0, 400)}`);
const html = await (await fetch(base + '/', { headers: { 'x-mesa-segredo': segredo } })).text();
const token = (html.match(/const TOKEN = "([0-9a-f]+)"/) || [])[1];
if (!token) falhar('Não achei o token na tela servida pelo motor.');
const api = async (rota, corpo) => {
  const r = await fetch(base + rota, { method: 'POST', headers: { 'content-type': 'application/json', 'x-mesa-token': token }, body: JSON.stringify(corpo || {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${rota}: ${r.status} ${j.erro || ''}`);
  return j;
};
await api('/api/ping');
const pulso = setInterval(() => api('/api/ping').catch(() => { }), 10000);

// Perfil e estado da ligação com o CaptaMais, lidos como a tela lê ao abrir.
if (perfilTeste) await api('/api/tool', { name: 'mesa_perfil', arguments: { salvar: perfilTeste } });
const lido = (await api('/api/tool', { name: 'mesa_perfil', arguments: {} })).structuredContent || {};
const tela = carregar(TELA);
tela.definir({ perfil: lido.perfil ?? null, captamais: lido.captamais ?? null });

// --so-abrir: deixa a Mesa no ar com o perfil de teste, para ver a tela no navegador (o bilhete de entrada sai em /api/bilhete).
if (process.argv.includes('--so-abrir')) { console.log(`Mesa no ar em ${base}/ (porta ${PORTA}); encerre este processo para desligar.`); await new Promise(() => { }); }

// Respostas e campos: o caso informa por id da pergunta e por pedaço do rótulo do campo; o que o caso
// não informa fica na primeira opção (pergunta) ou no padrão da tela (campo).
const rascunho = tela.montar(caso.tarefa, {}, []);
const respostas = Object.fromEntries(rascunho.perguntas.map((p) => [p.id, caso.respostas?.[p.id] ?? [p.opcoes[0]]]));
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const usados = new Set();
const campos = rascunho.campos.map((f) => {
  const chave = Object.keys(caso.campos || {}).find((k) => norm(f.rotulo).includes(norm(k)));
  if (chave) usados.add(chave);
  const v = chave ? caso.campos[chave] : undefined;
  return v && typeof v === 'object' && v.arquivo ? readFileSync(path.resolve(path.dirname(arg('caso')), v.arquivo), 'utf8').trim() : v; // texto longo fica num arquivo ao lado do caso
});
const semUso = Object.keys(caso.campos || {}).filter((k) => !usados.has(k));
const montado = tela.montar(caso.tarefa, respostas, campos);
const corte = corteDaTela(TELA);
const texto = montado.texto.trim().slice(0, corte);
const primeira = texto.split('\n')[0].replace(/^\[Mesa\]\s*/, '').slice(0, 120);

const nome = (ROTULO ? ROTULO + '-' : '') + (caso.nome || caso.tarefa);
if (process.argv.includes('--so-montar')) {
  writeFileSync(path.join(SAIDA, nome + '-pedido.txt'), texto);
  console.log(`${nome}: pedido montado com ${montado.texto.length} caracteres (corte da tela: ${corte})${semUso.length ? ' · campos do caso sem lugar: ' + semUso.join(', ') : ''}`);
  clearInterval(pulso); desligar(); await espera(300); process.exit(0);
}

await api('/api/limpar', { descartar: true });
await api('/api/novo');
await api('/api/send', { texto, contexto: montado.contexto, exibir: 'Pedido enviado: ' + primeira, meta: { tarefa: caso.tarefa, nome: montado.nome, area: montado.area, areaNome: montado.areaNome } });
const inicio = Date.now();
let est = { rodando: true };
while (est.rodando && Date.now() - inicio < 17 * 60 * 1000) { await espera(4000); try { est = await api('/api/estado'); } catch { } }
const segundos = Math.round((Date.now() - inicio) / 1000);
const resposta = [...(est.turnos || [])].reverse().find((t) => t.papel === 'claude')?.texto || '';
let seguimento = null;
if (arg('seguir') && !est.rodando && !est.erro) {
  await api('/api/send', { texto: arg('seguir') });
  const inicio2 = Date.now(); let est2 = { rodando: true };
  while (est2.rodando && Date.now() - inicio2 < 10 * 60 * 1000) { await espera(4000); try { est2 = await api('/api/estado'); } catch { } }
  seguimento = { texto: arg('seguir'), segundos: Math.round((Date.now() - inicio2) / 1000), terminou: !est2.rodando, erro: est2.erro || '', resposta: [...(est2.turnos || [])].reverse().find((t) => t.papel === 'claude')?.texto || '' };
}
const lidoAndamento = (await api('/api/tool', { name: 'mesa_ler_andamento', arguments: {} }).catch(() => ({}))).structuredContent || null;
const andamento = lidoAndamento?.andamento ?? lidoAndamento; // o cartão vem dentro de "andamento"
const diag = await api('/api/diag').catch(() => ({}));
await api('/api/limpar', { descartar: true }).catch(() => { });
clearInterval(pulso);

const registro = {
  caso: caso.nome || caso.tarefa, tarefa: caso.tarefa, rotulo: ROTULO, raiz: RAIZ, versao: diag.versao, modelo: diag.modeloUsado || diag.modelo, segundos,
  terminou: !est.rodando, erro: est.erro || '', respostas, camposDoCasoSemLugarNestaVersao: semUso,
  tamanhoDoPedido: montado.texto.length, corteDaTela: corte, pedidoCortado: montado.texto.trim().length > corte,
  pedido: texto, contexto: montado.contexto, resposta, seguimento, entrega: andamento?.entrega ?? null, passos: andamento?.passos ?? null,
};
writeFileSync(path.join(SAIDA, nome + '.json'), JSON.stringify(registro, null, 2));
const entregaTexto = String(andamento?.entrega?.texto || '');
writeFileSync(path.join(SAIDA, nome + '.md'), [
  `# ${montado.nome} (${ROTULO || 'sem rótulo'})`, '',
  `Versão ${diag.versao || '?'} · modelo ${registro.modelo || '?'} · ${segundos} s · pedido com ${montado.texto.length} caracteres${registro.pedidoCortado ? ` (CORTADO em ${corte})` : ''}${registro.erro ? ' · ERRO: ' + registro.erro : ''}`, '',
  '## Pedido enviado', '', '```text', texto, '```', '',
  '## Resposta na conversa', '', resposta || '(vazia)', '',
  ...(seguimento ? ['## Segunda mensagem na mesma conversa (' + seguimento.segundos + ' s)', '', '> ' + seguimento.texto, '', seguimento.resposta || '(vazia)', ''] : []),
  ...(entregaTexto && entregaTexto.trim() !== resposta.trim() ? ['## Entrega registrada no cartão', '', entregaTexto, ''] : []),
  ...(andamento?.entrega?.arquivo ? [`Arquivo gerado: ${andamento.entrega.arquivo}`, ''] : []),
].join('\n'));
console.log(`${nome}: ${registro.terminou ? 'terminou' : 'NÃO terminou'} em ${segundos} s · modelo ${registro.modelo || '?'} · pedido ${montado.texto.length} car.${registro.pedidoCortado ? ' (cortado)' : ''} · resposta ${resposta.length} car.${registro.erro ? ' · ERRO: ' + registro.erro.slice(0, 200) : ''}${semUso.length ? ' · campos do caso sem lugar: ' + semUso.join(', ') : ''}`);
desligar();
await espera(500);
process.exit(registro.terminou && !registro.erro ? 0 : 1);
