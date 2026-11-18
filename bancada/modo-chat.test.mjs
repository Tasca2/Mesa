// Revisão final: o modo chat (/mesa chat) segue o catálogo de Mercado das telas; o post do mercado saiu do menu.
// Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (...p) => readFileSync(path.join(RAIZ, ...p), 'utf8');

test('modo chat: Mercado com as perguntas do catálogo, sem o post do mercado, com as ferramentas novas', () => {
  const a = ler('skill-mesa', 'SKILL.md'), b = ler('skill-mesa-app', 'SKILL.md');
  for (const linha of [
    '| Mercado | Juros, inflação e câmbio | Painel do dia: juros, inflação, dólar, expectativas e agenda | `macro-brasil` | Uso · Situações · Recorte · Base de comparação |',
    '| Mercado | Fato relevante | Resumo do comunicado e o que muda na tese | `resumo-de-fato-relevante` | Uso |',
    '| Mercado | Leitura de gráfico | Descrição de preço e indicadores, sem previsão | `leitura-grafica` | Uso |',
    '- **Uso** (juros, fato relevante, gráfico) — Para que você vai usar esta leitura? Conversa de WhatsApp · Entender a fundo · Material para o cliente.',
    '- **Recorte** (juros) — Qual parte do painel? Painel completo · Juros e Copom · Inflação · Dólar e câmbio.',
    '- **Base de comparação** (juros) — Contra qual data? Mês passado · Semana passada · Início do ano.',
    '`analise_ativo`, `painel_macro`, `documentos_cvm` e `taxas_tesouro` (uma busca só)',
  ]) assert.ok(a.includes(linha), `falta no modo chat: ${linha}`);
  assert.ok(!a.includes('**Tema** — Qual assunto do dia'), 'a pergunta do post do mercado ficou');
  assert.ok(!a.includes('Selic, IPCA e dólar do Banco Central'), 'ficou a linha antiga de Juros');
  assert.ok(!/post do dia|post do mercado/.test(b), 'o modo chat do app ainda cita o post do mercado');
});

test('estudo-de-ativo: na Mesa, o pedido prevalece sobre o modelo de saída da skill', () => {
  assert.ok(ler('servidor', 'skills', 'estudo-de-ativo', 'SKILL.md').includes('Na Mesa, o pedido e esta seção prevalecem sobre o Modelo de saída acima.'));
});
