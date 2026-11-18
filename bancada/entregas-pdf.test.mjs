// Revisão do passo 4 (plano 7.5, "Qual entrega usa o quê"): o Estudo de ativo pede os blocos
// novos da folha A4 e dos slides, nas duas telas, e as skills dizem como montar. Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { carregar } from './catalogo.mjs';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TELAS = [['janela', path.join(RAIZ, 'janela', 'mesa-janela.html')], ['painel', path.join(RAIZ, 'servidor', 'painel-v2.html')]]
  .map(([nome, arq]) => ({ nome, cat: carregar(arq) }));
const { NOMES_LAYOUT } = await import(pathToFileURL(path.join(RAIZ, 'servidor', 'layouts.mjs')).href);

// Itens da lista "O que preciso receber" de um pedido montado.
const itens = (texto) => {
  const linhas = texto.split('\n'), r = [];
  for (let k = linhas.indexOf('O que preciso receber:') + 1; k > 0 && k < linhas.length && linhas[k].startsWith('- '); k++) r.push(linhas[k].slice(2));
  return r;
};
const ler = (...p) => readFileSync(path.join(RAIZ, 'servidor', ...p), 'utf8');

for (const { nome, cat } of TELAS) {
  test(`${nome} · estudo: cada formato diz quais blocos usar (destaques, linha em base 100, capa, layouts novos)`, () => {
    for (const formato of ['Resumo de uma página', 'Estudo em PDF', 'Apresentação (slides)']) {
      const l = itens(cat.montar('estudo', { formato: [formato] }, []).texto);
      const f = l.find((x) => x.startsWith('O material no formato escolhido'));
      assert.match(f, /gerado com a ferramenta \(tipo estudo\)/);
      assert.match(f, /Resumo de uma página: mesa_documento com os quatro números em destaques, o gráfico de linha em base 100, a tabela do histórico e fortes e atenção/);
      assert.match(f, /Estudo em PDF: o mesmo, com capa e as seções na ordem acima/);
      const layouts = f.match(/mesa_apresentacao com até 8 páginas \(([^)]+)\)/)[1].split(/, | e /);
      assert.deepEqual(layouts, ['capa', 'numeros', 'linha', 'tabela', 'lista', 'comparativo', 'frase', 'fechamento']);
      for (const x of layouts) assert.ok(NOMES_LAYOUT.includes(x), `layout que não existe: ${x}`);
      assert.match(f, /O arquivo é do cliente: o Conferir e o Próximo passo ficam só na conversa, fora do arquivo/);
      const h = l.find((x) => x.startsWith('Histórico em UMA tabela'));
      assert.match(h, /mais a série mensal \(até 24 meses\) para o gráfico$/);
    }
  });

}

test('skill estudo-de-ativo: tipo estudo, destaques, linha em base 100 com a série da ferramenta e os layouts novos', () => {
  const mesa = ler('skills', 'estudo-de-ativo', 'SKILL.md').split(/^## Na Mesa do Assessor \(acrescentado\)$/m)[1];
  assert.doesNotMatch(mesa, /ainda não desenha gráfico de linha/);
  assert.match(mesa, /`tipo: "estudo"`/);
  assert.match(mesa, /`destaques`/);
  assert.match(mesa, /`grafico` `linha` com `retornos: true`/);
  assert.match(mesa, /`tabela: false`/);
  assert.match(mesa, /`capa: true`/);
  assert.match(mesa, /capa, numeros, linha, tabela, lista, comparativo, frase e fechamento/);
  assert.match(mesa, /Sem a série mensal, o histórico vai só na tabela/);
});
