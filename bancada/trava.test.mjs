// Passo 4 do plano de melhorias (seção 7.4 e item 8 da seção 5.1): a trava de palavras dos slides.
// Na 1.13 ela barrava fonte e termo de mercado; material de mercado passa a usar uma lista menor,
// que só barra promessa e superlativo. Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { revisarApresentacao } = await import(pathToFileURL(path.join(RAIZ, 'servidor', 'gerador.mjs')).href);

// As 4 páginas de mercado que a seção 5.1 do plano diz que a 1.13 barrava.
const PAGINAS_MERCADO = [
  { layout: 'numeros', titulo: 'Selic em 13,75% ao ano desde 17/09/2026', itens: [{ valor: '13,75%', rotulo: 'Meta Selic', fonte: 'Banco Central, SGS 432' }], fonte: 'Banco Central, SGS 432' },
  { layout: 'frase', titulo: 'Fato relevante na CVM', subtitulo: 'Comunicado de 10/11/2026, protocolo 1587552' },
  { layout: 'barras', titulo: 'Rentabilidade em 12 meses', itens: [{ rotulo: 'Ativo', valor: 19 }, { rotulo: 'Índice', valor: 12 }], fonte: 'CaptaMais, data-base out/2026' },
  { layout: 'numeros', titulo: 'Retorno de 12,4% em 12 meses', itens: [{ valor: '12,4%', rotulo: 'Índice em 12 meses' }], fonte: 'CaptaMais, data-base out/2026' },
];
const paginas = (achados) => [...new Set(achados.map((a) => Number(a.match(/^página (\d+)/)[1])))].sort();

// A trava da 1.13, tirada do histórico do git (commit fc6df81), para mostrar o "antes" com o mesmo código.
function travaDa113() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'mesa-113-'));
  try {
    for (const f of ['gerador.mjs', 'layouts.mjs']) writeFileSync(path.join(tmp, f), execFileSync('git', ['-C', RAIZ, 'show', `fc6df81:servidor/${f}`]));
    return { tmp, url: pathToFileURL(path.join(tmp, 'gerador.mjs')).href };
  } catch (e) { rmSync(tmp, { recursive: true, force: true }); return null; }
}

test('antes: a trava da 1.13 barra as 4 páginas de mercado', async (t) => {
  const v = travaDa113();
  if (!v) return t.skip('histórico do git indisponível');
  try {
    const { revisarApresentacao: antiga } = await import(v.url);
    assert.deepEqual(paginas(antiga(PAGINAS_MERCADO)), [1, 2, 3, 4]);
  } finally { rmSync(v.tmp, { recursive: true, force: true }); }
});

test('depois: material de mercado (estudo ou mercado) passa nas 4 páginas', () => {
  assert.deepEqual(revisarApresentacao(PAGINAS_MERCADO, [], 'mercado'), []);
  assert.deepEqual(revisarApresentacao(PAGINAS_MERCADO, [], 'estudo'), []);
});

test('a linha de fonte sai da checagem também no material de reunião', () => {
  const achados = revisarApresentacao(PAGINAS_MERCADO);
  assert.ok(!paginas(achados).includes(1), `a fonte "Banco Central, SGS 432" ainda barra: ${achados.join(' | ')}`);
  assert.deepEqual(paginas(achados), [2, 3, 4], 'na reunião, regulação e retorno continuam barrados fora da fonte');
});

test('promessa e superlativo continuam barrados no material de mercado', () => {
  const PROMESSAS = ['Investimento sem risco para a sua reserva', 'Garantia de retorno acima do CDI em 12 meses', 'Retorno garantido de 1% ao mês',
    'A melhor ação da bolsa em 2026', 'Oportunidade única: renda de 12 meses', 'Esta ação vai subir até dezembro'];
  for (const titulo of PROMESSAS) {
    assert.equal(revisarApresentacao([{ layout: 'frase', titulo }], [], 'mercado').length, 1, `passou: "${titulo}"`);
  }
});

test('garantia do FGC passa; rentabilidade sem período em lugar nenhum da página é barrada', () => {
  assert.deepEqual(revisarApresentacao([{ layout: 'frase', titulo: 'CDB tem garantia do FGC até R$ 250 mil por CPF e instituição' }], [], 'mercado'), []);
  assert.equal(revisarApresentacao([{ layout: 'frase', titulo: 'Rentabilidade de 12,4%' }], [], 'mercado').length, 1);
  assert.deepEqual(revisarApresentacao([{ layout: 'frase', titulo: 'Rentabilidade de 12,4%', fonte: 'CaptaMais, 12 meses até out/2026' }], [], 'mercado'), []);
});

test('termos confirmados pelo assessor continuam liberando a trava', () => {
  assert.equal(revisarApresentacao([{ layout: 'frase', titulo: 'Atendimento sem custo de entrada' }]).length, 1);
  assert.deepEqual(revisarApresentacao([{ layout: 'frase', titulo: 'Atendimento sem custo de entrada' }], ['sem custo']), []);
});

// Correções depois da revisão do passo 4 (18/11): o superlativo com pontuação ou no fim da frase, e a trava nos textos que faltavam.
const barrados = (titulo, tipo) => revisarApresentacao([{ layout: 'frase', titulo }], [], tipo);

test('reunião: superlativo barrado também antes de pontuação ou no fim do texto', () => {
  for (const titulo of ['Para a sua família, o melhor.', 'Escolha o melhor', 'Os melhores!', 'O melhor, sempre', 'Uma carteira que é a melhor']) {
    assert.equal(barrados(titulo).length, 1, `passou: "${titulo}"`);
  }
  for (const titulo of ['A melhora da margem veio do preço', 'Para entender melhor o seu objetivo', 'O trimestre foi melhor que o anterior']) {
    assert.deepEqual(barrados(titulo), [], `barrou sem superlativo: "${titulo}"`);
  }
});

test('mercado: "a melhor do ano" e "a melhor da bolsa" também são superlativo; resultado da própria empresa passa', () => {
  for (const tipo of ['mercado', 'estudo']) {
    for (const titulo of ['WEGE3 foi a melhor do ano.', 'A melhor da bolsa em 12 meses', 'Entre as melhores do Ibovespa em 2026', 'Para você, o melhor.', 'A melhor relação entre risco e preço']) {
      assert.equal(barrados(titulo, tipo).length, 1, `${tipo}: passou "${titulo}"`);
    }
    for (const titulo of ['A melhora da margem veio do preço', 'O lucro do 3T26 foi melhor que o do 3T25', 'O melhor resultado trimestral da empresa desde 2019']) {
      assert.deepEqual(barrados(titulo, tipo), [], `${tipo}: barrou "${titulo}"`);
    }
  }
});

test('promessa e superlativo barram também na linha de fonte, na fonte do item e nos rótulos do gráfico', () => {
  const PAGINAS = [
    { layout: 'frase', titulo: 'Histórico', fonte: 'Retorno garantido de 1% ao mês' },
    { layout: 'numeros', titulo: 'Selic em 13,75% desde 17/09/2026', itens: [{ valor: '13,75%', rotulo: 'Meta Selic', fonte: 'Sem risco nenhum' }] },
    { layout: 'linha', titulo: 'Carteira em 12 meses', rotulos: ['jan', 'Sem risco'], series: [{ nome: 'Carteira', valores: [100, 101] }] },
    { layout: 'barras', titulo: 'Composição', itens: [{ rotulo: 'Renda fixa', valor: 70 }], fonte: 'O melhor do mercado' },
  ];
  for (const tipo of [undefined, 'mercado']) {
    assert.deepEqual(paginas(revisarApresentacao(PAGINAS, [], tipo)), [1, 2, 3, 4], `tipo ${tipo || 'reuniao'}`);
  }
  // A fonte continua fora das regras de regulação e de retorno.
  assert.deepEqual(revisarApresentacao([{ layout: 'frase', titulo: 'Selic em 13,75% desde 17/09/2026', fonte: 'Banco Central, SGS 432; retorno de 12 meses do CDI' }]), []);
});

test('rodapé e título da apresentação também passam pela trava de promessa', () => {
  assert.equal(revisarApresentacao([{ layout: 'frase', titulo: 'Objetivo' }], [], undefined, { rodape: 'Assessor Teste: o melhor do mercado' }).length, 1);
  assert.equal(revisarApresentacao([{ layout: 'frase', titulo: 'Objetivo' }], [], undefined, { titulo: 'Carteira sem risco' }).length, 1);
  assert.deepEqual(revisarApresentacao([{ layout: 'frase', titulo: 'Objetivo' }], [], undefined, { rodape: 'Assessor Teste, assessor de investimentos vinculado ao Escritório Teste. Regulado pela CVM.' }), []);
});
