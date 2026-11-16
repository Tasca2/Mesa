import { existsSync, mkdirSync, writeFileSync, readFileSync, chmodSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const valor = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const PASTA_DADOS = path.join(os.homedir(), '.mesa-do-assessor');
const MARCA = path.join(PASTA_DADOS, 'atalho.json');

function areaDeTrabalho() {
  if (valor('--destino')) return path.resolve(valor('--destino'));
  if (process.platform === 'win32') {
    try { return execFileSync('powershell.exe', ['-NoProfile', '-Command', "[Environment]::GetFolderPath('Desktop')"], { encoding: 'utf8', windowsHide: true }).trim(); } catch {   }
  }
  return path.join(os.homedir(), 'Desktop');
}
const alvo = (pasta) => path.join(pasta, process.platform === 'win32' ? 'Mesa do Assessor.lnk' : process.platform === 'darwin' ? 'Mesa do Assessor.app' : 'Mesa do Assessor.desktop');
const lerMarca = () => { try { return JSON.parse(readFileSync(MARCA, 'utf8')); } catch { return {}; } };

function criar(pasta) {
  mkdirSync(pasta, { recursive: true });
  const abrir = path.join(AQUI, 'abrir.mjs');
  if (process.platform === 'win32') {
    execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(AQUI, 'criar-atalho.ps1'), '-Destino', pasta], { windowsHide: true });
  } else if (process.platform === 'darwin') {
    const app = alvo(pasta), exe = path.join(app, 'Contents', 'MacOS', 'MesaDoAssessor');
    mkdirSync(path.dirname(exe), { recursive: true });
    writeFileSync(path.join(app, 'Contents', 'Info.plist'),
      '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>\n' +
      '<key>CFBundleName</key><string>Mesa do Assessor</string><key>CFBundleDisplayName</key><string>Mesa do Assessor</string>\n' +
      '<key>CFBundleExecutable</key><string>MesaDoAssessor</string><key>CFBundleIdentifier</key><string>br.captamais.mesadoassessor</string>\n' +
      '<key>CFBundlePackageType</key><string>APPL</string><key>CFBundleVersion</key><string>1.0.0</string><key>LSUIElement</key><true/>\n</dict></plist>\n');
    const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
    writeFileSync(exe,
      `#!/bin/bash\nexport PATH="${path.dirname(process.execPath)}:/usr/local/bin:/opt/homebrew/bin:$PATH"\n` +
      `r=$(${q(process.execPath)} ${q(abrir)} 2>&1)\n` +
      `case "$r" in *'"claude":false'*) osascript -e 'display dialog "A Mesa abriu, mas precisa do Claude Code instalado e com login feito para rodar os pedidos (claude.com/code)." buttons {"OK"} with title "Mesa do Assessor"' >/dev/null 2>&1;; esac\n` +
      `case "$r" in *'"ok":true'*) ;; *) osascript -e 'display dialog "Não consegui abrir a Mesa. Confira se o Node.js está instalado (nodejs.org)." buttons {"OK"} with title "Mesa do Assessor"' >/dev/null 2>&1;; esac\n`);
    chmodSync(exe, 0o755);
  } else {
    const d = alvo(pasta);
    writeFileSync(d, `[Desktop Entry]\nType=Application\nName=Mesa do Assessor\nExec=${process.execPath} ${abrir}\nTerminal=false\n`);
    chmodSync(d, 0o755);
  }
}

if (flag('--criar')) {
  try { criar(areaDeTrabalho()); console.log('criado'); } catch (e) { console.log('erro: ' + String(e?.message || e).slice(0, 200)); process.exit(1); }
} else if (flag('--nunca')) {
  mkdirSync(PASTA_DADOS, { recursive: true }); writeFileSync(MARCA, JSON.stringify({ ...lerMarca(), nunca: true })); console.log('nunca');
} else {
  console.log(existsSync(alvo(areaDeTrabalho())) ? 'existe' : lerMarca().nunca ? 'nunca' : 'nao');
}
