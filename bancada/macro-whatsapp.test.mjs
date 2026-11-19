// Juros, inflação e câmbio na opção "Conversa de WhatsApp" (revisão de 18/11/2026). O plano (seção 5.7) põe a regra na
// skill macro-brasil, item 5 da seção da Mesa: fonte e data ficam fora da mensagem, nas duas linhas finais. Na bancada do
// passo 2 as mensagens ainda saíram com datas e "(Focus do BC, 13/11)". A skill passa a dizer isso sem margem e o pedido
// de juros deixa de puxar para o outro lado. Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { carregar } from './catalogo.mjs';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TELAS = [['janela', path.join(RAIZ, 'janela', 'mesa-janela.html')], ['painel', path.join(RAIZ, 'servidor', 'painel-v2.html')]]
  .map(([nome, arq]) => ({ nome, cat: carregar(arq) }));
const itens = (texto) => {
  const linhas = texto.split('\n'), r = [];
  for (let k = linhas.indexOf('O que preciso receber:') + 1; k > 0 && k < linhas.length && linhas[k].startsWith('- '); k++) r.push(linhas[k].slice(2));
  return r;
};
const WHATS = { uso: ['Conversa de WhatsApp'] };
const LINHA_DO_PLANO = 'Na mensagem não pode faltar: o número de hoje, quanto mudou desde a referência e o que isso mexe para a situação do cliente';

for (const { nome, cat } of TELAS) {
  test(`${nome} · juros no WhatsApp: as mensagens saem sem data e sem fonte, que ficam só nas 2 linhas finais`, () => {
    const l = itens(cat.montar('macro', WHATS, []).texto);
    assert.ok(l.includes(LINHA_DO_PLANO), 'a linha do plano mudou');
    const linha = l[l.indexOf(LINHA_DO_PLANO) + 1] ?? '';
    assert.match(linha, /nenhuma data e nenhuma fonte/);
    assert.match(linha, /«Focus»/);
    assert.match(linha, /«o mercado espera»/);
    assert.match(linha, /só nas 2 linhas finais/);
  });

  test(`${nome} · a regra vale só para juros no WhatsApp: as outras opções de uso e o gráfico (que pede as datas) não mudam`, () => {
    for (const uso of ['Entender a fundo', 'Material para o cliente']) assert.ok(!cat.montar('macro', { uso: [uso] }, []).texto.includes('nenhuma data'), uso);
    const g = cat.montar('grafico', WHATS, []).texto;
    assert.ok(!g.includes('nenhuma data'));
    assert.match(g, /com as datas/);
  });
}

const secao = readFileSync(path.join(RAIZ, 'servidor', 'skills', 'macro-brasil', 'SKILL.md'), 'utf8').split(/^## Na Mesa do Assessor \(acrescentado\)$/m)[1] ?? '';
const item = (n) => (secao.match(new RegExp(`^${n}\. .*$`, 'm')) || [''])[0];

test('skill de juros: na Conversa de WhatsApp, nenhuma data nem fonte dentro das mensagens, inclusive a do Focus', () => {
  assert.match(item(5), /^5\. Em Conversa de WhatsApp, fonte e data ficam fora da mensagem, nas duas linhas finais para o assessor\./, 'a frase do plano mudou');
  assert.match(item(5), /nenhuma data/);
  assert.match(item(5), /"Focus"/);
  assert.match(item(5), /"o mercado espera"/);
  assert.match(item(3), /o mercado espera/);
  assert.match(item(3), /item 5/, 'o item do Focus não diz que, no WhatsApp, a data vai para as linhas finais');
});
