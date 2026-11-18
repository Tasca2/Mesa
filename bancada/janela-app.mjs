// Bancada de teste da Mesa do Assessor: a janela --app de verdade (visível), com perfil temporário do navegador.
// Sobe o motor do ramo com o Claude falso e uma "casa" temporária (nada vai para os Documentos de verdade), abre a
// janela como o atalho da Mesa abre (--app) e comanda pelo protocolo de depuração: clique no botão Anexar (a janela
// de arquivos do sistema é interceptada e recebe o PDF), arrastar e soltar um arquivo com o mouse do navegador,
// colar um print e colar células do Excel. Grava um print da janela e um registro em JSON. Fecha tudo no fim.
// Não faz parte do produto.
//
// Uso: node bancada/janela-app.mjs --dados <pasta> --porta <n> --saida <pasta> --print <arquivo.png> [--manter <segundos>]
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navegador } from '../servidor/gerador.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const arg = (n, p) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : p; };
const PORTA = Number(arg('porta', 0)), DADOS = path.resolve(arg('dados', '')), SAIDA = path.resolve(arg('saida', '')), PRINT = arg('print', '');
if (!PORTA || !arg('dados') || !arg('saida')) { console.error('Faltou --porta, --dados ou --saida.'); process.exit(2); }
const NAV = navegador();
if (!NAV) { console.error('Sem Edge nem Chrome.'); process.exit(2); }
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// PNG de 40 x 20 pontos e PDF mínimo.
function png() {
  const crc = (b) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let x = 0xffffffff; for (const v of b) x = t[(x ^ v) & 0xff] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
  const bloco = (tipo, dados) => { const l = Buffer.alloc(4); l.writeUInt32BE(dados.length); const td = Buffer.concat([Buffer.from(tipo), dados]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const w = 40, h = 20, ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const linhas = Buffer.alloc((w * 3 + 1) * h, 0x80); for (let y = 0; y < h; y++) linhas[y * (w * 3 + 1)] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), bloco('IHDR', ihdr), bloco('IDAT', zlib.deflateSync(linhas)), bloco('IEND', Buffer.alloc(0))]);
}
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');

const casa = path.join(DADOS, 'casa-janela-app'), perfil = path.join(DADOS, 'perfil'), tmp = path.join(DADOS, 'tmp');
const arqs = path.join(casa, 'arquivos'), perfilNav = path.join(DADOS, 'navegador-app');
for (const d of [path.join(casa, 'Documents'), arqs, tmp, SAIDA]) mkdirSync(d, { recursive: true });
rmSync(perfilNav, { recursive: true, force: true });
writeFileSync(path.join(arqs, 'Fato relevante.pdf'), PDF); writeFileSync(path.join(arqs, 'Lâmina do fundo.pdf'), PDF);
const chamadas = path.join(casa, 'chamadas.jsonl');
const ARQ_MOTOR = path.join(perfil, 'motor.json');
rmSync(ARQ_MOTOR, { force: true });

const motor = spawn(process.execPath, [path.join(RAIZ, 'janela', 'motor.mjs')], {
  cwd: path.join(RAIZ, 'janela'), stdio: 'ignore', windowsHide: true,
  env: { ...process.env, MESA_JANELA_PORTA: String(PORTA), MESA_PERFIL_DIR: perfil, TEMP: tmp, TMP: tmp, USERPROFILE: casa, HOME: casa, CLAUDE_BIN: path.join(AQUI, 'falso-claude', 'claude.cmd'), FALSO_CLAUDE_SAIDA: chamadas },
});
let edge = null, ws = null, seq = 0;
const pend = new Map(), eventos = [];
const matar = (p) => { if (p) { try { spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch { } } };
const registro = { porta: PORTA, navegador: path.basename(NAV), janela: '--app', passos: [] };
const passo = (nome, ok, detalhe = '') => { registro.passos.push({ nome, ok, detalhe }); console.log(`${ok ? 'OK ' : 'FALHOU'} ${nome}${detalhe ? ' · ' + detalhe : ''}`); };

try {
  let segredo = '';
  for (let i = 0; i < 80 && !segredo; i++) { try { const j = JSON.parse(readFileSync(ARQ_MOTOR, 'utf8')); if (j.porta === PORTA && j.pid === motor.pid) segredo = j.segredo; } catch { } if (!segredo) await espera(200); }
  if (!segredo) throw new Error('o motor não subiu');
  const { b } = await (await fetch(`http://127.0.0.1:${PORTA}/api/bilhete`, { method: 'POST', headers: { 'x-mesa-segredo': segredo } })).json();
  segredo = '';
  edge = spawn(NAV, [`--app=http://127.0.0.1:${PORTA}/?b=${b}`, `--user-data-dir=${perfilNav}`, '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check', '--window-size=1100,860'], { stdio: 'ignore' });
  let portaDev = 0;
  for (let i = 0; i < 100 && !portaDev; i++) { try { portaDev = Number(readFileSync(path.join(perfilNav, 'DevToolsActivePort'), 'utf8').split('\n')[0]); } catch { } if (!portaDev) await espera(200); }
  if (!portaDev) throw new Error('a janela não abriu a porta de depuração');
  let alvo = null;
  for (let i = 0; i < 50 && !alvo; i++) { try { alvo = (await (await fetch(`http://127.0.0.1:${portaDev}/json`)).json()).find((t) => t.type === 'page' && String(t.url).startsWith(`http://127.0.0.1:${PORTA}`)); } catch { } if (!alvo) await espera(200); }
  if (!alvo) throw new Error('a janela da Mesa não apareceu');
  ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  ws.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id && pend.has(j.id)) { const p = pend.get(j.id); pend.delete(j.id); j.error ? p.no(new Error(j.error.message)) : p.ok(j.result); } else if (j.method) eventos.push(j); };
  const cdp = (method, params = {}) => new Promise((ok, no) => { const id = ++seq; pend.set(id, { ok, no }); ws.send(JSON.stringify({ id, method, params })); });
  const avaliar = async (expr) => { const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };
  const ate = async (expr, ms = 15000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(expr)) return true; await espera(150); } return false; };
  const chips = () => avaliar('[...document.querySelectorAll("#cvAnexos .chip")].map((c) => c.textContent)');
  const centro = (sel) => avaliar(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const tirarTodos = async () => { while ((await chips()).length) { await avaliar('document.querySelector("#cvAnexos .chip button").click(), true'); await espera(250); } };
  const pronto = (n) => ate(`document.querySelectorAll("#cvAnexos .chip").length === ${n} && !document.querySelector("#cvAnexos .chip.enviando")`);
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('DOM.enable');
  passo('a janela --app abriu a Mesa', await ate('!!document.querySelector("#cvAnexar") && !!document.querySelector("#cvTxt")', 30000));
  registro.janelaVisivel = await avaliar('document.visibilityState');

  // 1. Clique no botão Anexar: o navegador abre a janela de arquivos do sistema; o protocolo a intercepta e escolhe o PDF.
  await cdp('Page.setInterceptFileChooserDialog', { enabled: true });
  const c1 = await centro('#cvAnexar');
  for (const type of ['mousePressed', 'mouseReleased']) await cdp('Input.dispatchMouseEvent', { type, x: c1.x, y: c1.y, button: 'left', clickCount: 1 });
  let escolha = null;
  for (let i = 0; i < 50 && !escolha; i++) { escolha = eventos.find((e) => e.method === 'Page.fileChooserOpened'); if (!escolha) await espera(100); }
  passo('clicar em Anexar abre a escolha de arquivos (vários de uma vez)', !!escolha, escolha ? `modo ${escolha.params.mode}` : 'não abriu');
  if (escolha) {
    await cdp('DOM.setFileInputFiles', { files: [path.join(arqs, 'Fato relevante.pdf')], backendNodeId: escolha.params.backendNodeId });
    const ok = await pronto(1);
    passo('o PDF escolhido vira cartão', ok, (await chips()).join(' | '));
  }
  await cdp('Page.setInterceptFileChooserDialog', { enabled: false });
  await tirarTodos();

  // 2. Arrastar e soltar com o mouse do navegador (não é evento de página: é o arrasto que o navegador entrega).
  const c2 = await centro('#cvTxt');
  const dados = { items: [], files: [path.join(arqs, 'Lâmina do fundo.pdf')], dragOperationsMask: 1 };
  for (const type of ['dragEnter', 'dragOver', 'drop']) await cdp('Input.dispatchDragEvent', { type, x: c2.x, y: c2.y, data: dados });
  const okSoltar = await pronto(1);
  passo('soltar um PDF na caixa de mensagem vira cartão', okSoltar, (await chips()).join(' | '));
  if (PRINT) { await espera(300); const { data } = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(PRINT, Buffer.from(data, 'base64')); registro.print = PRINT; }
  await tirarTodos();

  // 3. Colar: print (só imagem) vira anexo; células do Excel (texto, HTML e imagem) colam o texto.
  const dt = (o) => `(() => { const d = new DataTransfer();${o.texto ? ` d.setData("text/plain", ${JSON.stringify(o.texto)});` : ''}${o.html ? ` d.setData("text/html", ${JSON.stringify(o.html)});` : ''} for (const a of ${JSON.stringify(o.arquivos || [])}) d.items.add(new File([Uint8Array.from(atob(a.b64), (c) => c.charCodeAt(0))], a.nome, { type: a.tipo })); return d; })()`;
  const colar = (o) => avaliar(`(() => { const t = document.querySelector("#cvTxt"); t.focus(); const ev = new ClipboardEvent("paste", { clipboardData: ${dt(o)}, bubbles: true, cancelable: true }); t.dispatchEvent(ev); return ev.defaultPrevented; })()`);
  const imagem = { nome: 'image.png', tipo: 'image/png', b64: png().toString('base64') };
  const impedido = await colar({ arquivos: [imagem] });
  passo('colar um print vira cartão', impedido && await pronto(1), (await chips()).join(' | '));
  await tirarTodos();
  const impedidoExcel = await colar({ texto: 'PETR4\t38,50', html: '<table><tr><td>PETR4</td><td>38,50</td></tr></table>', arquivos: [imagem] });
  await espera(800);
  passo('colar células do Excel não vira anexo (o texto é colado)', !impedidoExcel && (await chips()).length === 0);

  // 4. Enviar com um anexo: o Claude falso recebe o aviso dos anexos e a regra de arquivos.
  await cdp('DOM.setFileInputFiles', { files: [path.join(arqs, 'Fato relevante.pdf')], nodeId: (await cdp('DOM.querySelector', { nodeId: (await cdp('DOM.getDocument', { depth: 0 })).root.nodeId, selector: '#cvArquivo' })).nodeId });
  await pronto(1);
  const antes = existsSync(chamadas) ? readFileSync(chamadas, 'utf8').split('\n').filter(Boolean).length : 0;
  await avaliar('(() => { const t = document.querySelector("#cvTxt"); t.value = "Resuma o fato relevante anexado."; t.dispatchEvent(new Event("input")); return true; })()');
  const c3 = await centro('#cvEnv');
  for (const type of ['mousePressed', 'mouseReleased']) await cdp('Input.dispatchMouseEvent', { type, x: c3.x, y: c3.y, button: 'left', clickCount: 1 });
  let ch = null;
  for (let i = 0; i < 100 && !ch; i++) { const l = existsSync(chamadas) ? readFileSync(chamadas, 'utf8').split('\n').filter(Boolean) : []; if (l.length > antes) ch = JSON.parse(l.at(-1)); else await espera(150); }
  passo('enviar pelo botão leva o anexo e a regra de arquivos ao Claude', !!ch && ch.entrada.includes('[Anexos desta mensagem]') && ch.entrada.includes('Fato relevante.pdf') && ch.entrada.includes('ARQUIVOS:'));
  passo('depois de enviado, o cartão sai', await ate('document.querySelectorAll("#cvAnexos .chip").length === 0'));
  const manter = Number(arg('manter', 0)); if (manter) await espera(manter * 1000);
} catch (e) {
  passo('execução', false, String(e?.message || e));
} finally {
  try { ws?.close(); } catch { }
  matar(edge); matar(motor);
  await espera(1200);
  const pasta = path.join(casa, 'Documents', 'Mesa do Assessor', 'Anexos', hoje());
  registro.copiasNaCasaTemporaria = existsSync(pasta) ? readdirSync(pasta) : [];
  rmSync(perfilNav, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 });
  rmSync(casa, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 });
  registro.limpou = !existsSync(perfilNav) && !existsSync(casa);
  writeFileSync(path.join(SAIDA, 'fix5-janela-app.json'), JSON.stringify(registro, null, 2));
  const falhas = registro.passos.filter((p) => !p.ok).length;
  console.log(`${registro.passos.length - falhas} de ${registro.passos.length} passos ok · limpeza ${registro.limpou ? 'feita' : 'incompleta'}`);
  process.exit(falhas ? 1 : 0);
}
