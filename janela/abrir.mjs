import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { navegador } from '../servidor/gerador.mjs';
import { readFileSync } from 'node:fs';
import { acharClaude, PORTA, ARQUIVO_MOTOR, PASTA_DADOS } from './comum.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const url = `http://127.0.0.1:${PORTA}/`;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const aberta = () => new Promise((ok) => {
  const s = net.connect(PORTA, '127.0.0.1');
  const fim = (v) => { s.destroy(); ok(v); };
  s.once('connect', () => fim(true)); s.once('error', () => fim(false)); setTimeout(() => fim(false), 800);
});

if (!(await aberta())) {
  const motor = spawn(process.execPath, [path.join(AQUI, 'motor.mjs')], { cwd: AQUI, detached: true, stdio: 'ignore', windowsHide: true });
  motor.unref();
  for (let i = 0; i < 40 && !(await aberta()); i++) await espera(250);
}
let ligado = await aberta();
let segredo = '';
for (let i = 0; i < 24 && ligado && !segredo; i++) {
  try {
    const j = JSON.parse(readFileSync(ARQUIVO_MOTOR, 'utf8'));
    if (j.porta === PORTA && (await fetch(url, { headers: { 'x-mesa-segredo': j.segredo }, signal: AbortSignal.timeout(1500) })).status === 200) segredo = j.segredo;
  } catch {   }
  if (!segredo) await espera(250);
}
let bilhete = '';
if (segredo) { try { bilhete = (await (await fetch(`${url}api/bilhete`, { method: 'POST', headers: { 'x-mesa-segredo': segredo }, signal: AbortSignal.timeout(3000) })).json()).b || ''; } catch { } }
if (!bilhete) ligado = false;
const urlAbrir = `${url}?b=${bilhete}`;
const nav = navegador();
let janela = 'nenhuma';
if (ligado) {
  if (nav) {
    spawn(nav, [`--app=${urlAbrir}`, '--window-size=1280,860', `--user-data-dir=${path.join(PASTA_DADOS, 'navegador')}`, '--disable-extensions', '--no-first-run', '--no-default-browser-check'], { detached: true, stdio: 'ignore' }).unref();
    janela = 'app';
  } else {
    const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', urlAbrir]] : process.platform === 'darwin' ? ['open', [urlAbrir]] : ['xdg-open', [urlAbrir]];
    spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    janela = 'navegador-padrao';
  }
}
console.log(JSON.stringify({ ok: ligado, url, janela, claude: !!acharClaude(), navegador: !!nav }));
setTimeout(() => process.exit(ligado ? 0 : 1), 300);
