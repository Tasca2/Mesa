// Passo 5 do plano de melhorias: a bancada (bancada/rodar.mjs) anexa arquivos ao pedido com --anexo,
// pela mesma rota do botão Anexar arquivo. Roda com o Claude falso e uma "casa" temporária.
// Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PULAR = process.platform !== 'win32' && 'o Claude falso é um .cmd do Windows';
const portaLivre = () => new Promise((ok, no) => { const s = net.createServer(); s.on('error', no); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });

test('rodar.mjs --anexo (repetível) manda os arquivos com o pedido e registra onde a cópia ficou', { skip: PULAR, timeout: 90000 }, async () => {
  const raiz = mkdtempSync(path.join(os.tmpdir(), 'mesa-rodar-'));
  try {
    const casa = path.join(raiz, 'casa'); mkdirSync(path.join(casa, 'Documents'), { recursive: true });
    const saida = path.join(raiz, 'saida'), chamadas = path.join(raiz, 'chamadas.jsonl');
    writeFileSync(path.join(raiz, 'caso.json'), JSON.stringify({ nome: 'teste-anexo', tarefa: 'fato', respostas: { uso: ['Entender a fundo'] }, campos: { Empresa: 'Empresa Teste' } }));
    writeFileSync(path.join(raiz, 'comunicado.pdf'), '%PDF-1.4\n%%EOF\n');
    writeFileSync(path.join(raiz, 'grafico.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]));
    const p = spawn(process.execPath, [path.join(AQUI, 'rodar.mjs'), '--caso', path.join(raiz, 'caso.json'), '--saida', saida, '--dados', path.join(raiz, 'dados'),
      '--porta', String(await portaLivre()), '--claude', path.join(AQUI, 'falso-claude', 'claude.cmd'), '--rotulo', 't',
      '--anexo', path.join(raiz, 'comunicado.pdf'), '--anexo', path.join(raiz, 'grafico.png')], {
      stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env, USERPROFILE: casa, HOME: casa, FALSO_CLAUDE_SAIDA: chamadas },
    });
    let log = ''; p.stdout.on('data', (d) => { log += d; }); p.stderr.on('data', (d) => { log += d; });
    const cod = await new Promise((ok) => p.on('close', ok));
    assert.equal(cod, 0, log);
    const reg = JSON.parse(readFileSync(path.join(saida, 't-teste-anexo.json'), 'utf8'));
    assert.deepEqual(reg.anexos.map((a) => a.original), ['comunicado.pdf', 'grafico.png']);
    const pasta = path.join(casa, 'Documents', 'Mesa do Assessor', 'Anexos');
    for (const a of reg.anexos) assert.ok(a.caminho.startsWith(pasta + path.sep) && existsSync(a.caminho), a.caminho);
    const pedido = JSON.parse(readFileSync(chamadas, 'utf8').split('\n').filter(Boolean).at(-1)).entrada;
    for (const a of reg.anexos) assert.ok(pedido.includes(a.caminho), 'o pedido não diz onde está ' + a.original);
    assert.match(readFileSync(path.join(saida, 't-teste-anexo.md'), 'utf8'), /Anexos enviados com o pedido .*comunicado\.pdf.*grafico\.png/);
  } finally { rmSync(raiz, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); }
});
