import { existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const PORTA = Number(process.env.MESA_JANELA_PORTA || 47821);

export function acharClaude() {
  if (process.env.CLAUDE_BIN && existsSync(process.env.CLAUDE_BIN)) return process.env.CLAUDE_BIN;
  const win = process.platform === 'win32';
  const nomes = win ? ['claude.exe', 'claude.cmd'] : ['claude'];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const n of nomes) { const p = path.join(dir, n); if (existsSync(p)) return p; }
  }
  const casa = os.homedir();
  const candidatos = win
    ? [path.join(casa, '.local', 'bin', 'claude.exe'), path.join(process.env.APPDATA || '', 'npm', 'claude.cmd'), path.join(process.env.LOCALAPPDATA || '', 'Programs', 'claude', 'claude.exe')]
    : [path.join(casa, '.local', 'bin', 'claude'), path.join(casa, '.claude', 'local', 'claude'), '/usr/local/bin/claude', '/opt/homebrew/bin/claude'];
  const base = win ? path.join(process.env.APPDATA || '', 'Claude', 'claude-code') : path.join(casa, 'Library', 'Application Support', 'Claude', 'claude-code');
  try { for (const v of readdirSync(base).sort().reverse()) candidatos.push(path.join(base, v, win ? 'claude.exe' : 'claude')); } catch {   }
  return candidatos.find((p) => p && existsSync(p)) || null;
}

export const precisaShell = (bin) => /\.(cmd|bat)$/i.test(String(bin || ''));

export const PASTA_DADOS = process.env.MESA_PERFIL_DIR ?? path.join(os.homedir(), '.mesa-do-assessor');
export const ARQUIVO_MOTOR = path.join(PASTA_DADOS, 'motor.json');

export const SITES_PERMITIDOS = [
  'api.bcb.gov.br', 'dadosabertos.bcb.gov.br', 'www3.bcb.gov.br', 'www.bcb.gov.br', 'bcb.gov.br',
  'www.gov.br', 'www4.planalto.gov.br', 'www.planalto.gov.br',
  'dados.cvm.gov.br', 'www.rad.cvm.gov.br', 'conteudo.cvm.gov.br', 'www.cvm.gov.br',
  'www.b3.com.br', 'sistemaswebb3-listados.b3.com.br',
  'servicodados.ibge.gov.br', 'sidra.ibge.gov.br', 'www.ibge.gov.br',
  'www.tesourotransparente.gov.br', 'www.tesourodireto.com.br', 'tesourodireto.com.br',
  'www.fgc.org.br', 'fgc.org.br', 'www.anbima.com.br', 'data.anbima.com.br',
];
export const FERRAMENTAS_WEB = ['WebSearch', ...SITES_PERMITIDOS.map((d) => `WebFetch(domain:${d})`)];
