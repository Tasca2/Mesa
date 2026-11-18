import http from 'node:http';
import net from 'node:net';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, statSync, rmSync, existsSync, createWriteStream, createReadStream, renameSync, copyFileSync, readdirSync } from 'node:fs';
import { pastaBase, navegador } from '../servidor/gerador.mjs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { acharClaude, precisaShell, ARQUIVO_MOTOR, FERRAMENTAS_WEB, PASTA_DADOS } from './comum.mjs';
import { openSync, readSync, closeSync } from 'node:fs';
import { MAX_ANEXOS, PASTA_ANEXOS, PASTA_FONTES, TERMINAL, tipoDoAnexo, assinaturaConfere, erroDeTamanho, dentroDe, destinoDoAnexo, argsDeFerramentas, blocoDeAnexos } from './anexos.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SERVIDOR = path.resolve(AQUI, '..', 'servidor');
const PORTA = Number(process.env.MESA_JANELA_PORTA || 47821);
const TOKEN = crypto.randomBytes(24).toString('hex');
const SEGREDO = crypto.randomBytes(24).toString('hex');
const COOKIE = crypto.randomBytes(24).toString('hex');
const bilhetes = new Map();
const igual = (a, b) => { const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || '')); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const CABECALHOS = {
  'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cross-origin-resource-policy': 'same-origin',
  'content-security-policy': "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};
const CAPTAMAIS_URL = (process.env.CAPTAMAIS_URL || 'https://captamais.me').replace(/\/+$/, '');
const CLAUDE = acharClaude();
const aspasCmd = (a) => (/[\s()&|<>^"]/.test(String(a)) ? `"${String(a).replace(/"/g, '""')}"` : String(a));
const abrirClaude = (args, cwd) => {
  const shell = !!CLAUDE && precisaShell(CLAUDE);
  return spawn(shell ? aspasCmd(CLAUDE) : (CLAUDE || 'claude'), shell ? args.map(aspasCmd) : args, { cwd: cwd || TRABALHO, windowsHide: true, shell });
};
const matar = (p) => {
  if (!p) return;
  if (process.platform === 'win32' && p.pid) { try { spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }).on('error', () => { try { p.kill(); } catch { } }); return; } catch { } }
  try { p.kill(); } catch { }
};
const TRABALHO = path.join(os.tmpdir(), 'mesa-janela');
mkdirSync(TRABALHO, { recursive: true });

const FERRAMENTAS = new Set(['mesa_perfil', 'mesa_ler_andamento', 'mesa_andamento', 'mesa_baixar', 'mesa_registrar', 'mesa_conectar']);

const SEGREDO_LOCAL = crypto.randomBytes(32).toString('hex');
const envServidor = {
  ...process.env,
  MESA_SEGREDO_LOCAL: SEGREDO_LOCAL,
  METODO_SKILLS: path.join(SERVIDOR, 'skills'),
  ROTINAS_SKILLS: path.join(SERVIDOR, 'rotinas'),
  MESA_BASE: path.join(SERVIDOR, 'base-assessor.md'),
};

let clientePromessa = null;
function cliente() {
  if (!clientePromessa) {
    clientePromessa = (async () => {
      const req = createRequire(path.join(SERVIDOR, 'package.json'));
      const imp = (p) => import(pathToFileURL(req.resolve(p)).href);
      const { Client } = await imp('@modelcontextprotocol/sdk/client/index.js');
      const { StdioClientTransport } = await imp('@modelcontextprotocol/sdk/client/stdio.js');
      const c = new Client({ name: 'mesa-janela', version: '1.0.0' }, { capabilities: {} });
      await c.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(SERVIDOR, 'server.mjs')], env: envServidor }));
      return c;
    })().catch((e) => { clientePromessa = null; throw e; });
  }
  return clientePromessa;
}

writeFileSync(path.join(TRABALHO, 'mcp.json'), JSON.stringify({
  mcpServers: { mesa: { command: process.execPath, args: [path.join(SERVIDOR, 'server.mjs')], env: {
    METODO_SKILLS: envServidor.METODO_SKILLS, ROTINAS_SKILLS: envServidor.ROTINAS_SKILLS, MESA_BASE: envServidor.MESA_BASE,
    ...(process.env.MESA_PERFIL_DIR ? { MESA_PERFIL_DIR: process.env.MESA_PERFIL_DIR } : {}), ...(process.env.MESA_ANDAMENTO ? { MESA_ANDAMENTO: process.env.MESA_ANDAMENTO } : {}), ...(process.env.MESA_COFRE ? { MESA_COFRE: process.env.MESA_COFRE } : {}) } } },
}));
const ARQUIVO_GERACAO = path.join(os.tmpdir(), 'mesa-do-assessor-geracao.json');
const AVISO_JANELA = 'Você está rodando dentro da janela da Mesa do Assessor, não no chat do Claude. "O chat" é a caixa de conversa que fica abaixo do painel; ' +
  'o assessor responde ali. Responda em português do Brasil. Entregue o resultado final como texto na resposta e também com mesa_andamento (concluido=true e entrega.texto). ' +
  'Resultado em PDF: use a ferramenta mesa_documento; para apresentação ou slides use a ferramenta mesa_apresentacao (PDF 16:9 com a marca do assessor, guardada no perfil). Carrossel ou arte de Instagram: use a ferramenta mesa_carrossel. Depois chame mesa_andamento com entrega.arquivo = caminho do PDF devolvido. Se a geração falhar, entregue o texto e diga em uma frase que o arquivo não foi gerado.';
const PROTOCOLO = 'Você é o assistente dentro da janela da Mesa do Assessor. A Mesa só cria uma tarefa, atualiza o pedido da tela ou apaga uma tarefa quando a sua RESPOSTA FINAL traz a marca correspondente: ' +
  '<tarefa>JSON</tarefa>, <pedido>texto completo do pedido</pedido> ou <apagar_tarefa>id</apagar_tarefa>. Você NÃO tem ferramenta para criar tarefas: só a marca cria. ' +
  'Para mudar uma tarefa que já existe (opções de uma pergunta, regras pessoais) use <editar_tarefa>, para evoluir uma skill use <ajustar_skill> e para desfazer use <restaurar>, no formato descrito nas instruções da Mesa; nunca crie uma tarefa nova quando o assessor pedir para mudar a que está aberta. ' +
  'Nunca diga que criou, atualizou ou apagou algo sem incluir a marca na resposta final (depois de usar qualquer ferramenta). Escreva o JSON da tarefa em uma única marca, sem comentários dentro dele. ' +
  'Fora das marcas, explique em 1 ou 2 frases. Responda em português do Brasil. ' +
  'FORMATO DO TEXTO: escreva em Markdown simples (negrito **assim**, listas com "- ", títulos curtos com ##); a Mesa mostra formatado. ' +
  'Quando o assessor pedir texto para WhatsApp, entregue no formato do WhatsApp: negrito com UM asterisco de cada lado (*assim*), itálico com _underline_, sem **, sem # de título, sem tabelas e sem blocos de citação; listas com "- "; frases e parágrafos curtos; no máximo 2 emojis. ' +
  'ENTREGA EM PEÇAS: quando a entrega tiver partes que o assessor usa separadamente, coloque cada parte em <peca tipo="TIPO" titulo="título curto">texto</peca>. ' +
  'Tipos: whatsapp, email, roteiro-ligacao, roteiro-reuniao, roteiro-video, nota-crm, relatorio, slides, legenda, imagem. Dentro da peça vai SÓ o texto pronto para usar, sem comentários nem explicações: ' +
  'whatsapp sem ** e sem # (um asterisco para negrito); email com "Assunto: ..." na primeira linha; roteiros e relatórios em Markdown simples. ' +
  'Diagnóstico, avisos, o que conferir e perguntas ao assessor ficam FORA das peças, em Markdown. Não repita fora da peça o que está dentro dela. Uma mensagem de WhatsApp por peça. ' +
  'Quando o Resultado for "Texto no chat", a resposta final traz o TEXTO COMPLETO da entrega, pronto para copiar, e não só um resumo; as dúvidas e o que conferir vêm depois, em poucas linhas. ' +
  'ENTREGA COMPLETA: nunca entregue só a lista ou a descrição do que cada peça contém ("3 peças entregues: roteiro, resumo..."). O texto integral e pronto de cada peça vai na resposta final, cada um em sua marca <peca>; o cartão da entrega leva o mesmo conteúdo. ' +
  'REVISÃO: antes de entregar texto para cliente ou público, confira sem promessa nem projeção de retorno, sem "compre/venda/indico", com a identificação do profissional, e com [CONFERIR] em todo número sem fonte; corrija antes de entregar.';
const VERSAO = '1.13';
const MODELOS = [['', 'Padrão do Claude Code'], ['claude-fable-5-2', 'Fable 5.2'], ['claude-opus-5-5', 'Opus 5.5'], ['claude-sonnet-5-5', 'Sonnet 5.5'], ['claude-haiku-5-5', 'Haiku 5.5']];
const ARQ_MODELO = path.join(PASTA_DADOS, 'modelo.json');
let modeloEscolhido = ''; let modeloUsado = '';
try { const m = JSON.parse(readFileSync(ARQ_MODELO, 'utf8')).modelo; if (MODELOS.some((x) => x[0] === m)) modeloEscolhido = m; } catch {   }
const nomeModelo = (id) => { const x = MODELOS.find((m) => m[0] === id); if (x) return x[1]; return String(id || '').replace(/^claude-/, '').replace(/-(\d+)-(\d+)(-.*)?$/, ' $1.$2').replace(/^./, (c) => c.toUpperCase()); };
const infoModelo = () => ({ versao: VERSAO, modelo: modeloEscolhido, usado: modeloUsado, nome: nomeModelo(modeloEscolhido || modeloUsado) || 'Padrão do Claude Code', opcoes: MODELOS.map(([id, nome]) => ({ id, nome })) });
const estado = { rodando: false, inicio: 0, sessao: null, turnos: [], erro: '', meta: null, video: null };
let filho = null;
const ARQ_CONVERSA = path.join(PASTA_DADOS, 'janela-conversa.json');
const ARQ_HIST = path.join(PASTA_DADOS, 'janela-historico.json');
const HIST_DIAS = 30, HIST_MAX = 40;
function lerHist() {
  try { const a = JSON.parse(readFileSync(ARQ_HIST, 'utf8')); const lim = Date.now() - HIST_DIAS * 864e5; return Array.isArray(a) ? a.filter((x) => x && x.em > lim && Array.isArray(x.turnos)) : []; } catch { return []; }
}
function gravarHist(a) { try { mkdirSync(path.dirname(ARQ_HIST), { recursive: true }); writeFileSync(ARQ_HIST, JSON.stringify(a.slice(0, HIST_MAX)), { mode: 0o600 }); } catch {   } }
const limpaMeta = (m) => ({ tarefa: String(m?.tarefa || '').slice(0, 60), nome: String(m?.nome || '').slice(0, 80), area: String(m?.area || '').slice(0, 30), areaNome: String(m?.areaNome || '').slice(0, 60) });
function arquivar(turnos, sessao, meta, video) {
  if (!Array.isArray(turnos) || !turnos.some((t) => t.papel === 'claude')) return;
  const h = lerHist();
  h.unshift({ id: crypto.randomBytes(6).toString('hex'), ...limpaMeta(meta), em: Date.now(), turnos: turnos.slice(-80), sessao: sessao || null, video: video || null });
  gravarHist(h);
}
if (process.env.MESA_MANTER_CONVERSA) { try { const c = JSON.parse(readFileSync(ARQ_CONVERSA, 'utf8')); if (Array.isArray(c.turnos)) { estado.turnos = c.turnos.slice(-80); estado.meta = c.meta || null; estado.video = c.video || null; } } catch {   } }
else {
  try { const c = JSON.parse(readFileSync(ARQ_CONVERSA, 'utf8')); arquivar(c.turnos, c.sessao, c.meta, c.video); } catch {   }
  try { rmSync(ARQ_CONVERSA, { force: true }); } catch {   }
}
function guardarConversa() {
  try { mkdirSync(path.dirname(ARQ_CONVERSA), { recursive: true }); writeFileSync(ARQ_CONVERSA, JSON.stringify({ sessao: estado.sessao, turnos: estado.turnos.slice(-80), meta: estado.meta, video: estado.video }), { mode: 0o600 }); } catch {   }
}

const VIDEOS_DIR = path.join(pastaBase(), 'Videos');
const EDVID_DIR = path.join(os.homedir(), '.claude', 'skills', 'edvid');
const EXT_VIDEO = ['.mp4', '.mov', '.m4v', '.mkv', '.webm', '.avi'];
const LIMITE_VIDEO = 4 * 1024 ** 3;
const venv = process.platform === 'win32' ? path.join(EDVID_DIR, '.venv', 'Scripts', 'python.exe') : path.join(EDVID_DIR, '.venv', 'bin', 'python');
const FERRAMENTAS_VIDEO = ['Skill', 'Read', 'Write', 'Edit', 'Glob', 'Grep',
  ...['ffmpeg', 'ffprobe', 'python', 'python3', 'py', 'uv', 'node', 'npm', 'npx', 'mkdir', 'ls'].map((c) => `Bash(${c}:*)`),
  `Bash(${venv.replace(/\\/g, '/')}:*)`, `Bash(${venv}:*)`];
const NEGADAS_VIDEO = ['Read(**/.env)', 'Write(**/.env)', 'Edit(**/.env)', 'Read(~/.claude/skills/edvid/.env)', 'Write(~/.claude/skills/edvid/.env)', 'Edit(~/.claude/skills/edvid/.env)'];
function escolherArquivoDeVideo() {
  return new Promise((ok) => {
    let cmd, args;
    if (process.platform === 'win32') {
      cmd = 'powershell.exe';
      args = ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-Command',
        "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; " +
        "$f=New-Object System.Windows.Forms.Form -Property @{TopMost=$true}; $d=New-Object System.Windows.Forms.OpenFileDialog; " +
        "$d.Title='Escolha o vídeo para editar'; $d.Filter='Vídeos|*.mp4;*.mov;*.m4v;*.mkv;*.webm;*.avi|Todos os arquivos|*.*'; " +
        "$d.InitialDirectory=[Environment]::GetFolderPath('MyVideos'); if($d.ShowDialog($f) -eq 'OK'){ Write-Output $d.FileName }"];
    } else if (process.platform === 'darwin') {
      cmd = 'osascript';
      args = ['-e', 'POSIX path of (choose file with prompt "Escolha o vídeo para editar" of type {"public.movie"})'];
    } else {
      cmd = 'zenity'; args = ['--file-selection', '--title=Escolha o vídeo para editar'];
    }
    execFile(cmd, args, { timeout: 10 * 60 * 1000, windowsHide: false, encoding: 'utf8' }, (e, saida) => {
      const caminho = String(saida || '').trim().split(/\r?\n/).pop().trim();
      if (e && !caminho) {
        if (e.code === 'ENOENT') return ok({ erro: 'Não consegui abrir a janela de escolha de arquivo neste computador.' });
        return ok({ caminho: '' });
      }
      ok({ caminho });
    });
  });
}
const EDITADOS_DIR = path.join(pastaBase(), 'Videos editados');
function publicarEditado() {
  const d = estado.video?.dir; if (!d) return null;
  const fin = path.join(d, 'edit', 'final.mp4'); let s; try { s = statSync(fin); } catch { return null; }
  const base = path.basename(estado.video.nome || 'video', path.extname(estado.video.nome || '')).replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 60);
  const dest = path.join(EDITADOS_DIR, `${base}-editado.mp4`);
  try { const t = statSync(dest); if (t.size === s.size && t.mtimeMs >= s.mtimeMs) return dest; } catch {   }
  try { mkdirSync(EDITADOS_DIR, { recursive: true }); copyFileSync(fin, dest); return dest; } catch { return null; }
}
function videosAtuais() {
  const d = estado.video?.dir; if (!d) return null;
  const um = (n) => { try { const s = statSync(path.join(d, 'edit', n)); return { kb: Math.round(s.size / 1024), em: Math.round(s.mtimeMs) }; } catch { return null; } };
  const cut = um('cut.mp4'), final = um('final.mp4');
  return cut || final ? { nome: estado.video.nome, cut, final, editado: final ? !!publicarEditado() : false } : null;
}

let editorProc = null, editorPorta = 0, editorDir = '';
const portaLivre = () => new Promise((ok, no) => { const s = net.createServer(); s.on('error', no); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
function escreverStateEditor(edit) {
  const tem = (n) => existsSync(path.join(edit, n));
  let s = {}; try { s = JSON.parse(readFileSync(path.join(edit, 'state.json'), 'utf8')); } catch {   }
  s = { ...s, project: s.project || estado.video?.nome || 'Vídeo', video: 'cut.mp4', fps: s.fps || 24 };
  if (tem('edl.json')) s.edl = 'edl.json';
  if (tem('remotion/public/captions.json')) s.captions = 'remotion/public/captions.json';
  if (tem('remotion/public/edit-data.json')) s.editData = 'remotion/public/edit-data.json';
  if (tem('final.mp4')) { s.finalVideo = 'final.mp4'; s.phase = 2; } else s.phase = s.phase || 1;
  s.message = s.message || (tem('final.mp4') ? 'Vídeo final pronto' : 'Corte pronto para aprovar');
  writeFileSync(path.join(edit, 'state.json'), JSON.stringify(s, null, 2));
}
async function abrirEditorEdvid() {
  const d = estado.video?.dir; if (!d) return { erro: 'Escolha um vídeo primeiro.' };
  const edit = path.join(d, 'edit');
  if (!existsSync(path.join(edit, 'cut.mp4')) && !existsSync(path.join(edit, 'final.mp4'))) return { erro: 'O corte ainda não ficou pronto. Quando ele aparecer, abra o editor.' };
  const servidorPy = path.join(EDVID_DIR, 'helpers', 'preview_server.py');
  if (!existsSync(servidorPy)) return { erro: 'Não achei o editor do Edvid neste computador.' };
  escreverStateEditor(edit);
  if (!editorProc || editorProc.exitCode !== null || editorDir !== edit) {
    try { editorProc?.kill(); } catch {   }
    editorPorta = await portaLivre(); editorDir = edit;
    const py = existsSync(venv) ? venv : (process.platform === 'win32' ? 'python' : 'python3');
    editorProc = spawn(py, [servidorPy, '--root', edit, '--port', String(editorPorta)], { windowsHide: true, stdio: 'ignore', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } });
    editorProc.on('error', () => { editorProc = null; });
    let ok = false;
    for (let i = 0; i < 40 && !ok && editorProc; i++) { try { ok = (await fetch(`http://127.0.0.1:${editorPorta}/api/state`, { signal: AbortSignal.timeout(800) })).ok; } catch { await new Promise((r) => setTimeout(r, 250)); } }
    if (!ok) { try { editorProc?.kill(); } catch {   } editorProc = null; return { erro: 'Não consegui ligar o editor do Edvid.' }; }
  }
  const url = `http://127.0.0.1:${editorPorta}/`, nav = navegador();
  if (nav) spawn(nav, [`--app=${url}`, '--window-size=1400,900', `--user-data-dir=${path.join(PASTA_DADOS, 'navegador')}`, '--disable-extensions', '--no-first-run', '--no-default-browser-check'], { detached: true, stdio: 'ignore' }).unref();
  else spawn(...(process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]]), { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  return { ok: true };
}
const vistoEditor = {};
setInterval(() => {
  if (!editorProc || estado.rodando || !estado.video?.ativo) return;
  for (const [arq, texto, exibir] of [
    ['preview_edits.json', 'Salvei ajustes no editor do Edvid. Leia preview_edits.json na pasta edit, confira as bordas dos cortes contra as falas (speech_regions.py), aplique, refaça o corte, apague o arquivo e diga em uma frase o que mudou, sem termos técnicos.', 'Salvei ajustes no editor do Edvid.'],
    ['preview_style.json', 'Escolhi o estilo no editor do Edvid. Leia preview_style.json na pasta edit, monte as legendas e os elementos com essa escolha, apague o arquivo ao terminar e diga em uma frase o que mudou, sem termos técnicos.', 'Escolhi o estilo no editor do Edvid.'],
  ]) {
    let mt = 0; try { mt = statSync(path.join(editorDir, arq)).mtimeMs; } catch { continue; }
    if (mt === vistoEditor[arq]) continue;
    vistoEditor[arq] = mt;
    rodarClaude(texto, '', exibir);
    return;
  }
}, 2000);
process.on('exit', () => { try { editorProc?.kill(); } catch {   } });

// Anexos (PDF e imagem): a tela sobe o arquivo, o motor guarda uma cópia em Documentos › Mesa do Assessor ›
// Anexos › dia e o pedido seguinte diz ao Claude onde ela está. Fora do vídeo, o Claude só lê as pastas
// Anexos e Fontes da Mesa (além da própria pasta de trabalho) e não vê o terminal.
const pastaAnexos = () => path.join(pastaBase(), PASTA_ANEXOS);
let anexosPendentes = [];
const anexoParaTela = (a) => ({ id: a.id, nome: a.nome, original: a.original, tipo: a.tipo, kb: a.kb });
function pastasDeLeitura() {
  return [PASTA_ANEXOS, PASTA_FONTES].map((n) => path.join(pastaBase(), n)).filter((d) => { try { mkdirSync(d, { recursive: true }); return true; } catch { return false; } });
}
function receberAnexo(req, res) {
  const nomeOrig = String(new URL(req.url, 'http://x').searchParams.get('nome') || '').slice(0, 200);
  const original = nomeOrig.split(/[\\/]/).pop().trim().slice(0, 100);
  const t = tipoDoAnexo(nomeOrig);
  const recusar = (cod, erro) => { req.resume(); return json(res, cod, { erro }); };
  if (anexosPendentes.length >= MAX_ANEXOS) return recusar(400, `Até ${MAX_ANEXOS} arquivos por mensagem. Envie estes antes de anexar mais.`);
  if (!t) return recusar(415, 'Anexe PDF ou imagem (PNG, JPG ou WEBP).');
  const declarado = Number(req.headers['content-length'] || 0);
  if (declarado > t.limite) return recusar(413, erroDeTamanho(t.ext, declarado));
  const base = pastaAnexos(), d = destinoDoAnexo(base, nomeOrig, new Date());
  if (!d) return recusar(400, 'Não consegui dar nome ao anexo.');
  try { mkdirSync(d.pasta, { recursive: true }); } catch { return recusar(500, 'Não consegui criar a pasta Anexos.'); }
  const parcial = d.arquivo + '.part', out = createWriteStream(parcial, { flags: 'wx' });
  let recebido = 0, falhou = false;
  const falha = (cod, msg) => { if (falhou) return; falhou = true; try { out.destroy(); } catch {   } try { rmSync(parcial, { force: true }); } catch {   } if (!res.headersSent) json(res, cod, { erro: msg }); };
  req.on('data', (b) => { recebido += b.length; if (recebido > t.limite) { falha(413, erroDeTamanho(t.ext, recebido)); req.destroy(); } });
  req.on('aborted', () => falha(499, 'Envio cancelado.'));
  req.on('error', () => falha(500, 'O envio falhou.'));
  out.on('error', () => falha(500, 'Não consegui gravar o anexo no computador.'));
  out.on('close', () => {
    if (falhou) return;
    const erroTam = erroDeTamanho(t.ext, recebido);
    if (erroTam) return falha(recebido ? 413 : 400, erroTam);
    let inicio = Buffer.alloc(0);
    try { const fd = openSync(parcial, 'r'); try { const b = Buffer.alloc(16); inicio = b.subarray(0, readSync(fd, b, 0, 16, 0)); } finally { closeSync(fd); } } catch {   }
    if (!assinaturaConfere(t.ext, inicio)) return falha(415, t.tipo === 'pdf' ? 'Esse arquivo não parece ser um PDF de verdade.' : 'Esse arquivo não parece ser uma imagem PNG, JPG ou WEBP de verdade.');
    if (!dentroDe(base, d.arquivo)) return falha(400, 'Nome de arquivo inválido.');
    try { renameSync(parcial, d.arquivo); } catch { return falha(500, 'Não consegui concluir o anexo.'); }
    const a = { id: crypto.randomBytes(8).toString('hex'), nome: d.nome, original: original || d.nome, tipo: t.tipo, kb: Math.max(1, Math.round(recebido / 1024)), caminho: d.arquivo };
    anexosPendentes.push(a);
    json(res, 200, { ok: true, anexo: { ...anexoParaTela(a), caminho: a.caminho } });
  });
  req.pipe(out);
}
// Tira da caixa os anexos pedidos para esta mensagem; null se algum não está mais esperando envio.
function separarAnexos(ids) {
  if (!Array.isArray(ids) || !ids.length) return [];
  const lista = [...new Set(ids.map(String))].map((id) => anexosPendentes.find((a) => a.id === id));
  if (lista.some((a) => !a || !existsSync(a.caminho))) return null;
  anexosPendentes = anexosPendentes.filter((a) => !lista.includes(a));
  return lista;
}

function rodarClaude(texto, contexto, exibir, anexos = []) {
  estado.rodando = true; estado.inicio = Date.now(); estado.erro = '';
  estado.turnos.push({ papel: 'assessor', texto: (exibir || texto) + (anexos.length ? '\nAnexos: ' + anexos.map((a) => a.original).join(', ') : '') }); guardarConversa();
  const primeiro = !estado.sessao;
  const viaShell0 = !!CLAUDE && precisaShell(CLAUDE);
  const prompt = (viaShell0 ? `${PROTOCOLO}\n\n` : '') + (primeiro ? `${AVISO_JANELA}\n${contexto || ''}\n\n` : '') + blocoDeAnexos(anexos) + texto;
  const video = !!estado.video?.ativo && !!estado.video.dir && existsSync(estado.video.dir);
  const args = ['-p', '--output-format', 'json', '--mcp-config', path.join(TRABALHO, 'mcp.json'), '--strict-mcp-config'];
  args.push(...argsDeFerramentas(video
    ? { video: true, pastasVideo: [estado.video.dir, ...['helpers', 'references', 'assets'].map((n) => path.join(EDVID_DIR, n)).filter((d) => existsSync(d))], permitidasVideo: FERRAMENTAS_VIDEO, negadasVideo: NEGADAS_VIDEO }
    : { permitidasWeb: FERRAMENTAS_WEB, pastasLeitura: pastasDeLeitura() }));
  const viaShell = !!CLAUDE && precisaShell(CLAUDE);
  if (!viaShell) args.push('--append-system-prompt', PROTOCOLO);
  if (modeloEscolhido) args.push('--model', modeloEscolhido);
  if (estado.sessao) args.push('--resume', estado.sessao);
  let saida = '', erroTxt = '';
  try { filho = abrirClaude(args, video ? estado.video.dir : undefined); }
  catch (e) { return terminar(`Não consegui iniciar o Claude Code: ${e.message}`); }
  const limite = setTimeout(() => { matar(filho); terminar(video ? 'A edição passou de 2 horas e foi interrompida.' : 'O Claude demorou mais de 15 minutos e foi interrompido.'); }, (video ? 120 : 15) * 60 * 1000);
  filho.stdout.on('data', (d) => { saida += d; });
  filho.stderr.on('data', (d) => { erroTxt += d; });
  filho.on('error', (e) => { clearTimeout(limite); terminar(e.code === 'ENOENT' ? 'O Claude Code não está instalado neste computador (comando "claude" não encontrado).' : `Falha ao iniciar o Claude Code: ${e.message}`); });
  filho.on('close', () => {
    clearTimeout(limite);
    if (!estado.rodando) return;
    try {
      const j = JSON.parse(saida.trim().split('\n').pop());
      if (j.session_id) estado.sessao = j.session_id;
      try { const k = Object.keys(j.modelUsage || {}); if (k.length) modeloUsado = k.sort((a, b) => ((j.modelUsage[b] || {}).outputTokens || 0) - ((j.modelUsage[a] || {}).outputTokens || 0))[0].replace(/\[.*\]$/, ''); } catch {   }
      if (j.is_error) return terminar(String(j.result || 'O Claude não conseguiu concluir.'));
      estado.turnos.push({ papel: 'claude', texto: String(j.result ?? '').trim() || '(sem texto)' });
      terminar('');
    } catch { terminar((erroTxt || saida || 'Resposta inesperada do Claude Code.').trim().slice(0, 600)); }
  });
  filho.stdin.on('error', () => {});
  filho.stdin.end(prompt);
  if (video) vigiarAndamento();
}
let vigiaAndamento = null;
function vigiarAndamento() {
  clearInterval(vigiaAndamento);
  const arq = process.env.MESA_ANDAMENTO ?? path.join(os.tmpdir(), 'mesa-do-assessor-andamento.json');
  const lerA = () => { try { return JSON.parse(readFileSync(arq, 'utf8')); } catch { return null; } };
  const j0 = lerA(), vistos = new Set((j0?.passos || []).filter((p) => p.estado === 'feito').map((p) => p.nome));
  let ultAgora = j0?.agora || '';
  vigiaAndamento = setInterval(() => {
    const j = lerA(); if (!j) return;
    let mudou = false;
    for (const p of (j.passos || [])) if (p.estado === 'feito' && !vistos.has(p.nome)) { vistos.add(p.nome); estado.turnos.push({ papel: 'progresso', texto: `✓ ${p.nome}` }); mudou = true; }
    if (j.agora && j.agora !== ultAgora) { ultAgora = j.agora; estado.turnos.push({ papel: 'progresso', texto: String(j.agora).slice(0, 400) }); mudou = true; }
    if (mudou) guardarConversa();
    publicarEditado();
  }, 2000);
}
function terminar(erro) { clearInterval(vigiaAndamento); vigiaAndamento = null; estado.rodando = false; estado.erro = erro; filho = null; guardarConversa(); }

function melhorarPedido(texto, pedido) {
  const prompt = 'Você ajuda assessores de investimentos no Brasil a melhorar pedidos (prompts) para o Claude. Abaixo estão o PEDIDO ATUAL e a MELHORIA que o assessor quer. ' +
    'Reescreva o pedido incorporando a melhoria. Regras: a primeira linha continua começando com [Mesa]; mantenha as seções (Objetivo, Minhas escolhas, O que preciso receber, Dados que vou te passar com [COLE AQUI], Regras); ' +
    'preserve as regras de compliance (nada de recomendação de compra ou venda, nem promessa de retorno; números com fonte e data; [CONFERIR] no que o assessor deve validar); ' +
    'não invente dados e não preencha os [COLE AQUI]. Se a melhoria pedir pesquisa na internet, pesquise antes de reescrever. Responda SOMENTE com o texto do novo pedido, em português do Brasil, sem comentários e sem aspas.\n\n' +
    'PEDIDO ATUAL:\n' + texto + '\n\nMELHORIA PEDIDA:\n' + pedido;
  return new Promise((ok, no) => {
    let saida = '', erroTxt = '';
    let f; try { f = abrirClaude(['-p', '--output-format', 'json', '--allowedTools', FERRAMENTAS_WEB.join(','), '--disallowedTools', TERMINAL.join(',')]); } catch (e) { return no(e); }
    const limite = setTimeout(() => { matar(f); no(new Error('O Claude demorou demais.')); }, 3 * 60 * 1000);
    f.stdout.on('data', (d) => { saida += d; }); f.stderr.on('data', (d) => { erroTxt += d; });
    f.on('error', (e) => { clearTimeout(limite); no(new Error(e.code === 'ENOENT' ? 'O Claude Code não está instalado neste computador.' : e.message)); });
    f.on('close', () => {
      clearTimeout(limite);
      try {
        const j = JSON.parse(saida.trim().split('\n').pop());
        if (j.is_error) return no(new Error(String(j.result || 'Falha.')));
        ok(String(j.result ?? '').trim().replace(/^```[a-z]*\n?|\n?```$/g, '').trim());
      } catch { no(new Error((erroTxt || 'Resposta inesperada do Claude Code.').trim().slice(0, 300))); }
    });
    f.stdin.on('error', () => {}); f.stdin.end(prompt);
  });
}

function lerGeracao() { try { return JSON.parse(readFileSync(ARQUIVO_GERACAO, 'utf8')); } catch { return null; } }
function geracaoAtual() {
  const g = lerGeracao();
  if (!g || g.em < sessaoInicio) return null;
  return { tipo: g.tipo, titulo: g.titulo, imagens: (g.imagens || []).length, pdf: g.pdf ? path.basename(g.pdf) : '', em: g.em };
}
const sessaoInicio = Date.now() - 60 * 1000;

const urlSegura = (u) => { try { const x = new URL(u); return x.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(x.hostname); } catch { return false; } };
const tentativasEntrar = [];
const ARQ_BLOQUEIO = path.join(PASTA_DADOS, 'entrar-bloqueio.json');
const ESPERAS_ENTRAR = [15 * 60_000, 60 * 60_000, 6 * 3600_000, 24 * 3600_000];
const LIMITE_ERROS = 5;
const lerBloqueio = () => { try { return { falhas: 0, ate: 0, nivel: 0, em: 0, ...JSON.parse(readFileSync(ARQ_BLOQUEIO, 'utf8')) }; } catch { return { falhas: 0, ate: 0, nivel: 0, em: 0 }; } };
const gravarBloqueio = (b) => { try { mkdirSync(PASTA_DADOS, { recursive: true }); writeFileSync(ARQ_BLOQUEIO, JSON.stringify(b), { mode: 0o600 }); } catch {   } };
const textoEspera = (ms) => { const min = Math.ceil(ms / 60_000); if (min < 60) return `${min} minuto${min === 1 ? '' : 's'}`; const h = Math.ceil(min / 60); return `${h} hora${h === 1 ? '' : 's'}`; };
const mensagemBloqueio = (ms) => `Muitas senhas erradas. Por segurança, novas tentativas ficam bloqueadas por ${textoEspera(ms)}.`;
function registrarErroSenha() {
  const agora = Date.now(), b = lerBloqueio();
  const nivel0 = agora - (b.em || 0) > 24 * 3600_000 ? 0 : b.nivel || 0;
  let falhas = (b.falhas || 0) + 1, ate = 0, nivel = nivel0;
  if (falhas >= LIMITE_ERROS) { ate = agora + ESPERAS_ENTRAR[Math.min(nivel0, ESPERAS_ENTRAR.length - 1)]; nivel = nivel0 + 1; falhas = 0; }
  gravarBloqueio({ falhas, ate, nivel, em: agora });
  if (ate) return { status: 'bloqueado', mensagem: mensagemBloqueio(ate - agora) };
  const restam = LIMITE_ERROS - falhas;
  return { status: 'erro', mensagem: 'E-mail ou senha incorretos. Se você entra com o Google, use «Entrar com o Google ou criar conta».' + (restam <= 3 ? ` Você ainda tem ${restam} tentativa${restam === 1 ? '' : 's'} antes do bloqueio.` : '') };
}
async function entrarComSenha(email, senha) {
  const agora = Date.now();
  while (tentativasEntrar.length && agora - tentativasEntrar[0] > 60_000) tentativasEntrar.shift();
  const bloq = lerBloqueio();
  if (bloq.ate > agora) return { status: 'bloqueado', mensagem: mensagemBloqueio(bloq.ate - agora) };
  if (tentativasEntrar.length >= 5) return { status: 'erro', mensagem: 'Muitas tentativas. Espere um minuto e tente de novo.' };
  tentativasEntrar.push(agora);
  if (!urlSegura(CAPTAMAIS_URL)) return { status: 'erro', mensagem: 'Endereço do CaptaMais inválido.' };
  const post = async (rota, corpo, token) => {
    for (let tentativa = 0; ; tentativa++) {
      try {
        const r = await fetch(CAPTAMAIS_URL + rota, {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000),
          headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(corpo),
        });
        return { status: r.status, json: await r.json().catch(() => ({})) };
      } catch (e) { if (tentativa >= 1) throw e; await new Promise((ok) => setTimeout(ok, 700)); }
    }
  };
  const conta = `${CAPTAMAIS_URL}/my-account`;
  let token = '';
  try {
    const ini = await post('/api/mcp/pair/start', { device: 'Mesa do Assessor' });
    if (ini.status !== 200 || !ini.json?.success) return { status: 'erro', mensagem: String(ini.json?.message || 'Não consegui iniciar a conexão agora. Tente de novo.') };
    const codigo = String(ini.json.code).replace(/-/g, '');
    let l = await post('/api/mcp/pair/login', { email, password: senha, code: codigo });
    const antigo = l.status === 404 && !l.json?.code;
    if (antigo) l = await post('/api/login', { email, password: senha });
    if (l.status === 429 && l.json?.code === 'login_locked') return { status: 'bloqueado', mensagem: String(l.json.message || 'Login bloqueado por segurança. Tente mais tarde.') };
    if (l.status === 429) return { status: 'erro', mensagem: 'Muitas tentativas. Espere um pouco e tente de novo.' };
    if (l.json?.code === 'MESA_PRIVACY_REQUIRED') return { status: 'privacidade', mensagem: 'Falta aceitar os Termos e a Política de Privacidade atualizados. Abra o CaptaMais, aceite e tente de novo.', url: conta };
    if (l.status === 403 && l.json?.code === 'email_not_verified') return { status: 'erro', mensagem: 'Confirme o seu e-mail antes de entrar (veja a caixa de entrada e o spam).' };
    if (l.status === 403) return { status: 'erro', mensagem: 'Ocorreu um problema com esta conta. Fale com o suporte do CaptaMais.' };
    if (!antigo && l.status === 400 && l.json?.code === 'invalid_code') return { status: 'erro', mensagem: 'A conexão não foi concluída. Tente de novo.' };
    if (![200, 400, 401].includes(l.status)) return { status: 'erro', mensagem: 'O CaptaMais não respondeu agora. Tente de novo em instantes.' };
    if (![200, 400, 401].includes(l.status)) return { status: 'erro', mensagem: 'O CaptaMais não respondeu agora. Tente de novo em instantes.' };
    if (!(l.status === 200 && l.json?.success && (antigo ? l.json?.authToken : true))) return registrarErroSenha();
    { const b = lerBloqueio(); gravarBloqueio({ ...b, falhas: 0 }); }
    if (antigo) {
      token = String(l.json.authToken);
      const apr = await post('/api/mcp/pair/approve', { code: codigo }, token);
      if (apr.json?.code === 'MESA_PRIVACY_REQUIRED' || /Pol[ií]tica de Privacidade/i.test(String(apr.json?.message || ''))) return { status: 'privacidade', mensagem: 'Falta aceitar os Termos e a Política de Privacidade atualizados. Abra o CaptaMais, aceite e tente de novo.', url: conta };
      if (apr.status !== 200 || !apr.json?.success) return { status: 'erro', mensagem: String(apr.json?.message || 'Não foi possível conectar agora.') };
    }
    const poll = await post('/api/mcp/pair/poll', { code: String(ini.json.code).replace(/-/g, ''), deviceSecret: ini.json.deviceSecret });
    if (poll.json?.status === 'privacy_required') return { status: 'privacidade', mensagem: 'Falta aceitar a Política de Privacidade atualizada. Abra o CaptaMais, aceite e tente de novo.', url: conta };
    if (poll.json?.status !== 'approved' || !poll.json?.apiKey) return { status: 'erro', mensagem: 'A conexão não foi concluída. Tente de novo.' };
    const guardado = await (await cliente()).callTool({ name: 'mesa_conectar', arguments: { acao: 'guardar', chave: String(poll.json.apiKey), nome: String(poll.json.name || ''), plano: String(poll.json.plan || ''), segredo: SEGREDO_LOCAL } });
    if (guardado.structuredContent?.status !== 'conectado') return { status: 'erro', mensagem: 'Não consegui guardar a conexão neste computador.' };
    return { status: 'conectado', nome: String(poll.json.name || '') };
  } catch {
    return { status: 'erro', mensagem: 'Não consegui falar com o CaptaMais agora. Confira a internet e tente de novo.' };
  } finally { token = ''; }
}

let ultimoPing = Date.now(), houvePing = false;
const lerCorpo = (req) => new Promise((ok, no) => { let b = ''; req.on('data', (d) => { b += d; if (b.length > 2e6) { no(new Error('grande')); req.destroy(); } }); req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch { ok({}); } }); });
const json = (res, cod, obj) => { res.writeHead(cod, { ...CABECALHOS, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };

const servidor = http.createServer(async (req, res) => {
  const host = req.headers.host || '';
  if (host !== `127.0.0.1:${PORTA}` && host !== `localhost:${PORTA}`) { res.writeHead(403); return res.end(); }
  if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) {
    const bilhete = String(new URL(req.url, 'http://x').searchParams.get('b') || '');
    const comBilhete = !!bilhete && (bilhetes.get(bilhete) || 0) > Date.now();
    bilhetes.delete(bilhete);
    const comCookie = String(req.headers.cookie || '').split(/;\s*/).some((c) => igual(c, `mesa=${COOKIE}`));
    if (!comBilhete && !comCookie && !igual(req.headers['x-mesa-segredo'], SEGREDO)) {
      res.writeHead(403, { ...CABECALHOS, 'content-type': 'text/plain; charset=utf-8' });
      return res.end('Abra a Mesa pelo ícone da área de trabalho ou digitando /mesa no Claude.');
    }
    const html = readFileSync(path.join(AQUI, 'mesa-janela.html'), 'utf8').replace('__MOTOR_TOKEN__', TOKEN);
    res.writeHead(200, { ...CABECALHOS, 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'set-cookie': `mesa=${COOKIE}; HttpOnly; SameSite=Strict; Path=/` });
    return res.end(html);
  }
  if (req.method === 'GET' && req.url.startsWith('/api/img?')) {
    const u = new URL(req.url, 'http://x'); const g = lerGeracao();
    if (u.searchParams.get('t') !== TOKEN || !g) { res.writeHead(403); return res.end(); }
    const i = Number(u.searchParams.get('i'));
    const alvo = (g.imagens || [])[i];
    if (!alvo) { res.writeHead(404); return res.end(); }
    try { const b = readFileSync(alvo); res.writeHead(200, { ...CABECALHOS, 'content-type': 'image/png', 'cache-control': 'no-store' }); return res.end(b); } catch { res.writeHead(404); return res.end(); }
  }
  if (req.method === 'GET' && req.url.startsWith('/api/video?')) {
    const u = new URL(req.url, 'http://x');
    const nome = { cut: 'cut.mp4', final: 'final.mp4' }[u.searchParams.get('f')];
    if (u.searchParams.get('t') !== TOKEN || !estado.video?.dir || !nome) { res.writeHead(403); return res.end(); }
    const arq = path.join(estado.video.dir, 'edit', nome);
    let st; try { st = statSync(arq); } catch { res.writeHead(404); return res.end(); }
    const cab = { ...CABECALHOS, 'content-type': 'video/mp4', 'accept-ranges': 'bytes', 'cache-control': 'no-store' };
    if (u.searchParams.get('baixar') === '1') { const base = path.parse(estado.video.nome || 'video').name.replace(/[^A-Za-z0-9._-]+/g, '-'); cab['content-disposition'] = `attachment; filename="${base}-${nome === 'final.mp4' ? 'editado' : 'corte'}.mp4"`; }
    const r = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (r) {
      let ini = r[1] === '' ? Math.max(0, st.size - Number(r[2])) : Number(r[1]), fim = r[1] === '' || r[2] === '' ? st.size - 1 : Math.min(Number(r[2]), st.size - 1);
      if (ini > fim || ini >= st.size) { res.writeHead(416, { ...cab, 'content-range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { ...cab, 'content-range': `bytes ${ini}-${fim}/${st.size}`, 'content-length': fim - ini + 1 });
      return createReadStream(arq, { start: ini, end: fim }).pipe(res);
    }
    res.writeHead(200, { ...cab, 'content-length': st.size });
    return createReadStream(arq).pipe(res);
  }
  if (req.method !== 'POST' || !req.url.startsWith('/api/')) { res.writeHead(404); return res.end(); }
  if (req.url === '/api/bilhete') {
    if (!igual(req.headers['x-mesa-segredo'], SEGREDO)) return json(res, 403, { erro: 'sem permissão' });
    for (const [k, v] of bilhetes) if (v < Date.now()) bilhetes.delete(k);
    const b = crypto.randomBytes(24).toString('hex'); bilhetes.set(b, Date.now() + 60_000);
    return json(res, 200, { b });
  }
  if (req.headers['x-mesa-token'] !== TOKEN) return json(res, 403, { erro: 'sem permissão' });
  if (req.url.startsWith('/api/anexo?')) return receberAnexo(req, res);
  if (req.url.startsWith('/api/upload?')) {
    const nomeOrig = String(new URL(req.url, 'http://x').searchParams.get('nome') || 'video.mp4').slice(0, 200);
    const ext = path.extname(nomeOrig).toLowerCase();
    if (!EXT_VIDEO.includes(ext)) { req.resume(); return json(res, 400, { erro: 'Envie um vídeo (mp4, mov, m4v, mkv, webm ou avi).' }); }
    if (Number(req.headers['content-length'] || 0) > LIMITE_VIDEO) { req.resume(); return json(res, 413, { erro: 'O vídeo passa de 4 GB.' }); }
    const base = path.basename(nomeOrig, ext).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'video';
    const pasta = path.join(VIDEOS_DIR, `${base}-${Date.now().toString(36)}`);
    const destino = path.join(pasta, base + ext), parcial = destino + '.part';
    try { mkdirSync(pasta, { recursive: true }); } catch { return json(res, 500, { erro: 'Não consegui criar a pasta do vídeo.' }); }
    const out = createWriteStream(parcial);
    let recebido = 0, falhou = false;
    const falha = (cod, msg) => { if (falhou) return; falhou = true; try { out.destroy(); } catch {   } try { rmSync(pasta, { recursive: true, force: true }); } catch {   } if (!res.headersSent) json(res, cod, { erro: msg }); };
    req.on('data', (d) => { recebido += d.length; if (recebido > LIMITE_VIDEO) { falha(413, 'O vídeo passa de 4 GB.'); req.destroy(); } });
    req.on('aborted', () => falha(499, 'Envio cancelado.'));
    req.on('error', () => falha(500, 'O envio falhou.'));
    out.on('error', () => falha(500, 'Não consegui gravar o vídeo no computador.'));
    out.on('finish', () => {
      if (falhou) return;
      try { renameSync(parcial, destino); } catch { return falha(500, 'Não consegui concluir o arquivo.'); }
      estado.video = { ativo: true, dir: pasta, nome: base + ext };
      guardarConversa();
      json(res, 200, { ok: true, caminho: destino, pasta, edvid: existsSync(EDVID_DIR), kb: Math.round(recebido / 1024) });
    });
    req.pipe(out);
    return;
  }
  const corpo = await lerCorpo(req).catch(() => ({}));
  try {
    switch (req.url) {
      case '/api/ping': ultimoPing = Date.now(); houvePing = true; return json(res, 200, { ok: true });
      case '/api/tool': {
        if (!FERRAMENTAS.has(corpo.name)) return json(res, 400, { erro: 'ferramenta não permitida' });
        if (corpo.name === 'mesa_conectar' && corpo.arguments?.acao === 'guardar') return json(res, 400, { erro: 'ação não permitida' });
        const r = await (await cliente()).callTool({ name: corpo.name, arguments: corpo.arguments || {} });
        return json(res, 200, { structuredContent: r.structuredContent, content: r.content, isError: r.isError });
      }
      case '/api/entrar': {
        const email = String(corpo.email || '').trim().slice(0, 160), senha = String(corpo.senha || '').slice(0, 200);
        corpo.senha = '';
        if (!email || !senha) return json(res, 400, { status: 'erro', mensagem: 'Escreva o e-mail e a senha.' });
        return json(res, 200, await entrarComSenha(email, senha));
      }
      case '/api/modelo': {
        if (typeof corpo.modelo === 'string') {
          if (!MODELOS.some((x) => x[0] === corpo.modelo)) return json(res, 400, { erro: 'Modelo desconhecido.' });
          modeloEscolhido = corpo.modelo;
          try { mkdirSync(PASTA_DADOS, { recursive: true }); writeFileSync(ARQ_MODELO, JSON.stringify({ modelo: modeloEscolhido })); } catch {   }
        }
        return json(res, 200, infoModelo());
      }
      case '/api/novo':
        if (!estado.rodando) {
          estado.sessao = null; estado.erro = '';
          if (estado.turnos.length && estado.turnos[estado.turnos.length - 1].papel !== 'sistema') estado.turnos.push({ papel: 'sistema', texto: 'Nova tarefa' });
          guardarConversa();
        }
        return json(res, 200, { ok: true });
      case '/api/limpar':
        if (!estado.rodando) { if (!corpo.descartar) arquivar(estado.turnos, estado.sessao, estado.meta, estado.video); estado.sessao = null; estado.turnos = []; estado.erro = ''; estado.meta = null; estado.video = null; guardarConversa(); }
        return json(res, 200, { ok: true });
      case '/api/diag': {
        return json(res, 200, { versao: VERSAO, modelo: modeloEscolhido || 'padrão', modeloUsado, plataforma: `${process.platform} ${os.release()}`, node: process.version, claude: !!CLAUDE, edvid: existsSync(EDVID_DIR),
          ffmpeg: await new Promise((ok) => { try { const p = spawn('ffmpeg', ['-version'], { windowsHide: true }); p.on('error', () => ok(false)); p.on('close', (c) => ok(c === 0)); } catch { ok(false); } }),
          rodando: estado.rodando, ultimoErro: String(estado.erro || '').slice(0, 300), conversasNoHistorico: lerHist().length, modoVideo: !!estado.video?.ativo });
      }
      case '/api/historico': {
        const itens = lerHist().map((x) => {
          const p = x.turnos.find((t) => t.papel === 'assessor');
          return { id: x.id, tarefa: x.tarefa, nome: x.nome, area: x.area, areaNome: x.areaNome, em: x.em, resumo: String(p?.texto || '').replace(/^Pedido enviado:\s*/, '').replace(/\s+/g, ' ').slice(0, 90) };
        });
        return json(res, 200, { itens });
      }
      case '/api/historico/abrir': {
        if (estado.rodando) return json(res, 409, { erro: 'O Claude ainda está respondendo. Espere terminar.' });
        const h = lerHist(); const i = h.findIndex((x) => x.id === String(corpo.id));
        if (i < 0) return json(res, 404, { erro: 'Não achei essa conversa.' });
        const [it] = h.splice(i, 1);
        gravarHist(h);
        arquivar(estado.turnos, estado.sessao, estado.meta, estado.video);
        estado.turnos = it.turnos; estado.sessao = it.sessao || null; estado.meta = limpaMeta(it); estado.video = it.video || null; estado.erro = '';
        guardarConversa();
        return json(res, 200, { ok: true, tarefa: it.tarefa, area: it.area, nome: it.nome, em: it.em });
      }
      case '/api/historico/apagar': {
        if (corpo.todos) gravarHist([]); else gravarHist(lerHist().filter((x) => x.id !== String(corpo.id)));
        return json(res, 200, { ok: true });
      }
      case '/api/send': {
        if (estado.rodando) return json(res, 409, { erro: 'O Claude ainda está respondendo.' });
        const texto = String(corpo.texto || '').trim().slice(0, 40000);
        if (!texto) return json(res, 400, { erro: 'vazio' });
        const anexos = separarAnexos(corpo.anexos);
        if (!anexos) return json(res, 400, { erro: 'Um anexo não está mais disponível. Anexe o arquivo de novo.' });
        if (corpo.meta) estado.meta = limpaMeta(corpo.meta);
        rodarClaude(texto, String(corpo.contexto || '').slice(0, 4000), corpo.exibir ? String(corpo.exibir).slice(0, 4000) : '', anexos);
        return json(res, 200, { ok: true });
      }
      case '/api/anexo/remover': {
        const a = anexosPendentes.find((x) => x.id === String(corpo.id || ''));
        if (!a) return json(res, 404, { erro: 'Esse anexo já saiu da caixa.' });
        anexosPendentes = anexosPendentes.filter((x) => x !== a);
        if (dentroDe(pastaAnexos(), a.caminho)) { try { rmSync(a.caminho, { force: true }); } catch {   } }
        return json(res, 200, { ok: true });
      }
      case '/api/estado': return json(res, 200, { videos: videosAtuais(), videoAtivo: !!estado.video?.ativo, geracao: geracaoAtual(), rodando: estado.rodando, segundos: estado.rodando ? Math.round((Date.now() - estado.inicio) / 1000) : 0, turnos: estado.turnos, erro: estado.erro, anexos: anexosPendentes.map(anexoParaTela) });
      case '/api/melhorar': {
        // Mesmo corte do /api/send (40.000). O que for cortado volta dito em "aviso", para a tela mostrar.
        const bruto = String(corpo.texto || ''), pedidoBruto = String(corpo.pedido || '');
        const texto = bruto.slice(0, 40000), pedido = pedidoBruto.slice(0, 1000);
        if (!texto || !pedido) return json(res, 400, { erro: 'vazio' });
        const avisos = [];
        if (bruto.length > texto.length) avisos.push(`O pedido tinha ${bruto.length} caracteres e só os primeiros ${texto.length} foram para o Claude reescrever.`);
        if (pedidoBruto.length > pedido.length) avisos.push(`A melhoria pedida tinha ${pedidoBruto.length} caracteres e só os primeiros ${pedido.length} foram considerados.`);
        return json(res, 200, { texto: await melhorarPedido(texto, pedido), cortado: avisos.length > 0, ...(avisos.length ? { aviso: avisos.join(' ') } : {}) });
      }
      case '/api/abrir-pasta': {
        const ed = corpo.video ? publicarEditado() : null;
        const g = corpo.video ? (estado.video?.dir ? { pasta: ed ? EDITADOS_DIR : path.join(estado.video.dir, 'edit'), pdf: ed } : null) : lerGeracao();
        const pasta = g?.pasta && existsSync(g.pasta) ? g.pasta : (corpo.video ? null : pastaBase());
        if (!pasta) return json(res, 404, { erro: 'nada gerado' });
        const pdf = g?.pdf && existsSync(g.pdf) ? g.pdf : null;
        const cmd = process.platform === 'win32' ? (pdf ? ['explorer.exe', [`/select,"${pdf}"`]] : ['explorer.exe', [pasta]])
          : process.platform === 'darwin' ? (pdf ? ['open', ['-R', pdf]] : ['open', [pasta]]) : ['xdg-open', [pasta]];
        spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore', windowsVerbatimArguments: true }).unref();
        return json(res, 200, { ok: true });
      }
      case '/api/abrir-entregas': {
        const base = path.join(pastaBase(), 'Entregas'); mkdirSync(base, { recursive: true });
        const cliente = path.basename(String(corpo.cliente || '').slice(0, 60));
        const alvo = cliente && cliente !== '.' && cliente !== '..' && existsSync(path.join(base, cliente)) ? path.join(base, cliente) : base;
        const cmd = process.platform === 'win32' ? ['explorer.exe', [alvo]] : process.platform === 'darwin' ? ['open', [alvo]] : ['xdg-open', [alvo]];
        spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore' }).unref();
        return json(res, 200, { ok: true });
      }
      case '/api/escolher-video': {
        if (estado.rodando) return json(res, 409, { erro: 'O Claude ainda está respondendo. Espere terminar.' });
        const escolhido = await escolherArquivoDeVideo();
        if (escolhido.erro) return json(res, 500, { erro: escolhido.erro });
        if (!escolhido.caminho) return json(res, 200, { cancelado: true });
        const orig = escolhido.caminho, ext = path.extname(orig).toLowerCase();
        if (!EXT_VIDEO.includes(ext)) return json(res, 400, { erro: 'Escolha um vídeo (mp4, mov, m4v, mkv, webm ou avi).' });
        let st; try { st = statSync(orig); } catch { return json(res, 404, { erro: 'Não achei o arquivo escolhido.' }); }
        if (!st.isFile()) return json(res, 400, { erro: 'Escolha um arquivo de vídeo.' });
        if (st.size > LIMITE_VIDEO) return json(res, 413, { erro: 'O vídeo passa de 4 GB.' });
        const base = path.basename(orig, ext).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'video';
        const pasta = path.join(VIDEOS_DIR, `${base}-${Date.now().toString(36)}`), destino = path.join(pasta, base + ext);
        try { mkdirSync(pasta, { recursive: true }); copyFileSync(orig, destino); }
        catch { try { rmSync(pasta, { recursive: true, force: true }); } catch {   } return json(res, 500, { erro: 'Não consegui copiar o vídeo para a pasta da Mesa.' }); }
        estado.video = { ativo: true, dir: pasta, nome: base + ext }; guardarConversa();
        return json(res, 200, { ok: true, caminho: destino, nome: base + ext, mb: Math.max(1, Math.round(st.size / 1048576)), edvid: existsSync(EDVID_DIR) });
      }
      case '/api/videos': {
        const itens = [];
        try {
          for (const d of readdirSync(VIDEOS_DIR, { withFileTypes: true })) {
            if (!d.isDirectory()) continue;
            const arq = readdirSync(path.join(VIDEOS_DIR, d.name)).find((n) => EXT_VIDEO.includes(path.extname(n).toLowerCase()));
            if (arq) itens.push({ pasta: d.name, nome: arq, em: Math.round(statSync(path.join(VIDEOS_DIR, d.name, arq)).mtimeMs) });
          }
        } catch {   }
        itens.sort((a, b) => b.em - a.em);
        return json(res, 200, { itens: itens.slice(0, 10), edvid: existsSync(EDVID_DIR) });
      }
      case '/api/usar-video': {
        if (estado.rodando) return json(res, 409, { erro: 'O Claude ainda está respondendo. Espere terminar.' });
        const nomePasta = path.basename(String(corpo.pasta || '')), dir = path.join(VIDEOS_DIR, nomePasta);
        let arq; try { arq = readdirSync(dir).find((n) => EXT_VIDEO.includes(path.extname(n).toLowerCase())); } catch {   }
        if (!nomePasta || !arq) return json(res, 404, { erro: 'Não achei esse vídeo.' });
        estado.video = { ativo: true, dir, nome: arq }; guardarConversa();
        return json(res, 200, { ok: true, caminho: path.join(dir, arq), nome: arq, edvid: existsSync(EDVID_DIR) });
      }
      case '/api/editor': { const r = await abrirEditorEdvid(); return json(res, r.erro ? 409 : 200, r); }
      case '/api/parar': matar(filho); terminar('Interrompido.'); return json(res, 200, { ok: true });
      case '/api/open': {
        let u; try { u = new URL(String(corpo.url)); } catch { return json(res, 400, { erro: 'link inválido' }); }
        const permitido = u.origin === new URL(CAPTAMAIS_URL).origin || u.origin === 'https://wa.me' || u.protocol === 'mailto:';
        if (!permitido || u.href.length > 6000) return json(res, 400, { erro: 'link não permitido' });
        const cmd = process.platform === 'win32' ? ['rundll32', ['url.dll,FileProtocolHandler', u.href]] : process.platform === 'darwin' ? ['open', [u.href]] : ['xdg-open', [u.href]];
        spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
        return json(res, 200, { ok: true });
      }
      default: return json(res, 404, { erro: 'rota' });
    }
  } catch (e) { return json(res, 500, { erro: String(e?.message || e).slice(0, 300) }); }
});
servidor.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? 'A Mesa já está aberta.' : e.message); process.exit(e.code === 'EADDRINUSE' ? 0 : 1); });
servidor.listen(PORTA, '127.0.0.1', () => {
  try { mkdirSync(path.dirname(ARQUIVO_MOTOR), { recursive: true }); writeFileSync(ARQUIVO_MOTOR, JSON.stringify({ porta: PORTA, segredo: SEGREDO, pid: process.pid }), { mode: 0o600 }); } catch {   }
  console.log(`Mesa do Assessor em http://127.0.0.1:${PORTA}/`);
});

setInterval(() => { if (houvePing && !estado.rodando && Date.now() - ultimoPing > 60000) process.exit(0); if (!houvePing && Date.now() - ultimoPing > 120000) process.exit(0); }, 5000);
