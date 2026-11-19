// Claude falso para os testes do motor da janela (bancada). Não faz parte do produto.
// Grava, numa linha de JSON, os argumentos, a pasta de trabalho e o pedido recebido pela entrada padrão,
// e responde no formato do Claude Code em modo -p com --output-format json.
import { appendFileSync } from 'node:fs';
let entrada = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { entrada += d; });
process.stdin.on('end', () => {
  appendFileSync(process.env.FALSO_CLAUDE_SAIDA, JSON.stringify({ args: process.argv.slice(2), cwd: process.cwd(), entrada }) + '\n');
  process.stdout.write(JSON.stringify({ type: 'result', is_error: false, result: 'Resposta do Claude falso.', session_id: 'sessao-falsa' }) + '\n');
});
