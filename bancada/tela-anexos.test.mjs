// Passo 5 do plano de melhorias (Anexar arquivo): a tela de verdade, num Edge ou Chrome sem janela.
// Sobe o motor do ramo numa "casa" temporária, com o Claude falso, abre a tela pelo bilhete de entrada e
// escolhe os arquivos no campo de anexo pelo protocolo de depuração do navegador (o mesmo efeito de
// escolher na janela de arquivos). Confere os cartões dos anexos, o envio, o tirar e a recusa.
// Rodar: node --test bancada/*.test.mjs   (TELA_PRINT=<arquivo.png> grava a tela com os anexos)
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { navegador } from '../servidor/gerador.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = process.env.MESA_RAIZ || path.resolve(AQUI, '..');
const NAV = navegador();
const PULAR = process.platform !== 'win32' ? 'o Claude falso é um .cmd do Windows' : !NAV ? 'sem Edge nem Chrome neste computador' : false;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const portaLivre = () => new Promise((ok, no) => { const s = net.createServer(); s.on('error', no); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// PNG de 40 x 20 pontos e PDF mínimo, feitos aqui mesmo.
function png() {
  const crc = (b) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let x = 0xffffffff; for (const v of b) x = t[(x ^ v) & 0xff] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
  const bloco = (tipo, dados) => { const l = Buffer.alloc(4); l.writeUInt32BE(dados.length); const td = Buffer.concat([Buffer.from(tipo), dados]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const w = 40, h = 20, ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const linhas = Buffer.alloc((w * 3 + 1) * h, 0x80); for (let y = 0; y < h; y++) linhas[y * (w * 3 + 1)] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), bloco('IHDR', ihdr), bloco('IDAT', zlib.deflateSync(linhas)), bloco('IEND', Buffer.alloc(0))]);
}
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');

let raiz, casa, chamadas, motor, edge, ws, seq = 0;
const pend = new Map(), eventos = [];
const cdp = (method, params = {}) => new Promise((ok, no) => { const id = ++seq; pend.set(id, { ok, no }); ws.send(JSON.stringify({ id, method, params })); });
const avaliar = async (expr) => { const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
const ate = async (expr, ms = 15000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(expr)) return true; await espera(150); } throw new Error('não aconteceu: ' + expr); };
const escolherArquivos = async (arquivos) => { const { root } = await cdp('DOM.getDocument', { depth: 0 }); const { nodeId } = await cdp('DOM.querySelector', { nodeId: root.nodeId, selector: '#cvArquivo' }); await cdp('DOM.setFileInputFiles', { nodeId, files: arquivos }); };
const chips = () => avaliar('[...document.querySelectorAll("#cvAnexos .chip")].map((c) => c.textContent)');
const lerChamadas = () => (existsSync(chamadas) ? readFileSync(chamadas, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

before(async () => {
  if (PULAR) return;
  raiz = mkdtempSync(path.join(os.tmpdir(), 'mesa-tela-'));
  casa = path.join(raiz, 'casa'); mkdirSync(path.join(casa, 'Documents'), { recursive: true });
  const tmp = path.join(raiz, 'tmp'), perfil = path.join(raiz, 'perfil'), arqs = path.join(raiz, 'arquivos');
  for (const d of [tmp, arqs]) mkdirSync(d, { recursive: true });
  writeFileSync(path.join(arqs, 'Lâmina do fundo.pdf'), PDF); writeFileSync(path.join(arqs, 'gráfico.png'), png()); writeFileSync(path.join(arqs, 'notas.txt'), 'texto');
  chamadas = path.join(raiz, 'chamadas.jsonl');
  const porta = await portaLivre();
  motor = spawn(process.execPath, [path.join(RAIZ, 'janela', 'motor.mjs')], {
    cwd: path.join(RAIZ, 'janela'), stdio: 'ignore', windowsHide: true,
    env: { ...process.env, MESA_JANELA_PORTA: String(porta), MESA_PERFIL_DIR: perfil, TEMP: tmp, TMP: tmp, USERPROFILE: casa, HOME: casa, CLAUDE_BIN: path.join(AQUI, 'falso-claude', 'claude.cmd'), FALSO_CLAUDE_SAIDA: chamadas },
  });
  let segredo = '';
  for (let i = 0; i < 80 && !segredo; i++) { try { const j = JSON.parse(readFileSync(path.join(perfil, 'motor.json'), 'utf8')); if (j.porta === porta) segredo = j.segredo; } catch { } if (!segredo) await espera(150); }
  if (!segredo) throw new Error('o motor não subiu');
  const { b } = await (await fetch(`http://127.0.0.1:${porta}/api/bilhete`, { method: 'POST', headers: { 'x-mesa-segredo': segredo } })).json();
  const perfilNav = path.join(raiz, 'navegador');
  edge = spawn(NAV, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${perfilNav}`, '--window-size=1280,860', 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let portaDev = 0;
  for (let i = 0; i < 100 && !portaDev; i++) { try { portaDev = Number(readFileSync(path.join(perfilNav, 'DevToolsActivePort'), 'utf8').split('\n')[0]); } catch { } if (!portaDev) await espera(150); }
  const alvo = (await (await fetch(`http://127.0.0.1:${portaDev}/json`)).json()).find((t) => t.type === 'page');
  ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  ws.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id && pend.has(j.id)) { const p = pend.get(j.id); pend.delete(j.id); j.error ? p.no(new Error(j.error.message)) : p.ok(j.result); } else if (j.method) eventos.push(j); };
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('DOM.enable');
  await cdp('Page.navigate', { url: `http://127.0.0.1:${porta}/?b=${b}` });
  await ate('!!document.querySelector("#cvArquivo") && !!document.querySelector("#cvAnexar")');
  globalThis.__arqs = arqs;
});

after(async () => {
  try { ws?.close(); } catch { }
  for (const p of [edge, motor]) if (p) { try { spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch { } }
  await espera(600);
  if (raiz) rmSync(raiz, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
});

test('a caixa de mensagem tem o botão Anexar arquivo e o campo aceita PDF e imagens, vários de uma vez', { skip: PULAR }, async () => {
  const info = await avaliar('(() => { const b = document.querySelector("#cvAnexar"), i = document.querySelector("#cvArquivo"); return { rotulo: b.getAttribute("aria-label"), visivel: b.offsetParent !== null, multiplo: i.multiple, aceita: i.accept, naCaixa: !!b.closest("#cvCaixa") }; })()');
  assert.equal(info.rotulo, 'Anexar arquivo (PDF ou imagem)');
  assert.equal(info.visivel, true);
  assert.equal(info.naCaixa, true);
  assert.equal(info.multiplo, true);
  for (const t of ['.pdf', '.png', '.jpg', '.jpeg', '.webp']) assert.ok(info.aceita.includes(t), info.aceita);
  assert.ok(await avaliar('(() => { document.querySelector("#cvMais").click(); const t = [...document.querySelectorAll("#cvMenu button")].map((b) => b.textContent); document.querySelector("#cvMais").click(); return t.includes("Anexar arquivo (PDF ou imagem)…"); })()'));
});

test('escolher dois arquivos mostra um cartão para cada, com nome e tamanho, e a cópia fica em Anexos', { skip: PULAR }, async () => {
  const arqs = globalThis.__arqs;
  await escolherArquivos([path.join(arqs, 'Lâmina do fundo.pdf'), path.join(arqs, 'gráfico.png')]);
  await ate('document.querySelectorAll("#cvAnexos .chip").length === 2 && !document.querySelector("#cvAnexos .chip.enviando")');
  const c = await chips();
  assert.match(c[0], /^PDFLâmina do fundo\.pdf\d+ KB×$/);
  assert.match(c[1], /^IMAGEMgráfico\.png\d+ KB×$/);
  assert.equal(await avaliar('document.querySelector("#cvEnv").disabled'), false, 'com anexo pronto, dá para enviar mesmo sem texto');
  const salvos = readdirSync(path.join(casa, 'Documents', 'Mesa do Assessor', 'Anexos', hoje()));
  assert.ok(salvos.some((n) => /^\d{6}-Lamina-do-fundo\.pdf$/.test(n)) && salvos.some((n) => /^\d{6}-grafico\.png$/.test(n)), salvos.join(', '));
  if (process.env.TELA_PRINT) { const { data } = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(process.env.TELA_PRINT, Buffer.from(data, 'base64')); }
});

test('enviar leva os anexos ao Claude e limpa os cartões', { skip: PULAR }, async () => {
  const antes = lerChamadas().length;
  await avaliar('(() => { const t = document.querySelector("#cvTxt"); t.value = "Resuma a lâmina e leia o gráfico."; t.dispatchEvent(new Event("input")); document.querySelector("#cvEnv").click(); return true; })()');
  for (let i = 0; i < 100 && lerChamadas().length === antes; i++) await espera(150);
  const ch = lerChamadas().at(-1);
  assert.ok(ch && lerChamadas().length > antes, 'o Claude falso não foi chamado');
  assert.ok(ch.entrada.includes('[Anexos desta mensagem]'));
  assert.ok(ch.entrada.includes('Lâmina do fundo.pdf') && ch.entrada.includes('gráfico.png'));
  assert.ok(ch.entrada.includes('Mensagem do assessor: Resuma a lâmina e leia o gráfico.'));
  await ate('document.querySelectorAll("#cvAnexos .chip").length === 0 && document.querySelector("#cvAnexos").hidden');
});

test('tirar um anexo antes de enviar apaga a cópia; arquivo de outro tipo é recusado com aviso', { skip: PULAR }, async () => {
  const arqs = globalThis.__arqs, pasta = path.join(casa, 'Documents', 'Mesa do Assessor', 'Anexos', hoje());
  const antes = readdirSync(pasta).length;
  await escolherArquivos([path.join(arqs, 'gráfico.png')]);
  await ate('document.querySelectorAll("#cvAnexos .chip").length === 1 && !document.querySelector("#cvAnexos .chip.enviando")');
  assert.equal(readdirSync(pasta).length, antes + 1);
  await avaliar('document.querySelector("#cvAnexos .chip button").click(), true');
  await ate('document.querySelectorAll("#cvAnexos .chip").length === 0');
  for (let i = 0; i < 40 && readdirSync(pasta).length !== antes; i++) await espera(100);
  assert.equal(readdirSync(pasta).length, antes, 'a cópia do anexo tirado ficou na pasta');
  await escolherArquivos([path.join(arqs, 'notas.txt')]);
  await ate('(document.querySelector("#cvAnexoAviso") || {}).textContent?.includes("anexe PDF ou imagem")');
  assert.equal((await chips()).length, 0);
});
