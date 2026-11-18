// Passo 4 do plano de melhorias (PDF): a folha A4 da ferramenta mesa_documento.
// Confere o HTML que vira PDF, sem abrir navegador. Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { montarDocumento, mdParaHtml } = await import(new URL(`file:///${path.join(RAIZ, 'servidor', 'gerador.mjs').replace(/\\/g, '/')}`).href);

const MARCA = { nome: 'Assessor Teste', escritorio: 'Escritório Teste' };
const AVISO_RODAPE = 'Não é recomendação de compra, venda ou alocação de ativos, nem promessa de retorno';

// Composição de amostra (a mesma das amostras da 1.13): carteira atual × modelo do escritório, em %.
const COMPOSICAO = {
  tipo: 'barras-duplas', unidade: '%', total: true, categoria: 'Classe',
  rotulos: ['Renda fixa pós', 'Renda fixa inflação', 'Multimercado', 'Ações', 'Exterior'],
  series: [{ nome: 'Atual', valores: [70, 0, 10, 15, 5] }, { nome: 'Modelo', valores: [40, 15, 15, 20, 10] }],
  fonte: 'Escritório Teste, data-base 31/10/2026',
};

// Pares (série, item) -> texto, do gráfico e da tabela que sai junto com ele.
const pares = (html, marca) => {
  const m = new Map();
  for (const [, s, i, t] of html.matchAll(new RegExp(`<${marca}[^>]*data-s="(\\d+)" data-i="(\\d+)"[^>]*>([^<]+)<`, 'g'))) m.set(`${s}/${i}`, t);
  return m;
};
const doGrafico = (html) => pares(html.slice(html.indexOf('<figure'), html.indexOf('</figure>')), 'text');
const daTabela = (html) => pares(html.slice(html.indexOf('</figure>')), 'td');

test('lista numerada sai numerada, e lista com traço sai com marcador', () => {
  const h = mdParaHtml('1. O que você precisa ter disponível?\n2. Como reagiria a uma queda?\n3. Há objetivo com data?');
  assert.match(h, /^<ol><li>O que você precisa ter disponível\?<\/li><li>Como reagiria a uma queda\?<\/li><li>Há objetivo com data\?<\/li><\/ol>$/);
  assert.doesNotMatch(h, /<ul>/);
  assert.match(mdParaHtml('- um\n- dois'), /^<ul><li>um<\/li><li>dois<\/li><\/ul>$/);
  assert.match(mdParaHtml('3. terceiro\n4. quarto'), /^<ol start="3">/);
  assert.match(mdParaHtml('1. a\n- b'), /^<ol><li>a<\/li><\/ol><ul><li>b<\/li><\/ul>$/);
});

test('tabela: cabeçalho que se repete, números à direita, linha de total e setas coloridas', () => {
  const h = mdParaHtml('| Classe | Atual | Modelo | Diferença |\n|---|---|---|---|\n| Renda fixa pós | 70% | 40% | ▼ 30 p.p. |\n| Ações | 15% | 20% | ▲ 5 p.p. |\n| **Total** | 100% | 100% | – |');
  assert.match(h, /<thead><tr><th>Classe<\/th><th class="n">Atual<\/th><th class="n">Modelo<\/th><th class="n">Diferença<\/th><\/tr><\/thead><tbody>/);
  assert.match(h, /<td>Renda fixa pós<\/td><td class="n">70%<\/td>/);
  assert.match(h, /<td class="n down">▼ 30 p.p.<\/td>/);
  assert.match(h, /<td class="n up">▲ 5 p.p.<\/td>/);
  assert.match(h, /<tr class="total"><td><b>Total<\/b><\/td>/);
  assert.match(h, /<table class="curta">/, 'tabela curta não quebra no meio');
  const longa = mdParaHtml(['| Mês | Valor |', '|---|---|', ...Array.from({ length: 20 }, (_, k) => `| ${k + 1} | ${k},5 |`)].join('\n'));
  assert.match(longa, /<table>/, 'tabela longa pode quebrar, com o cabeçalho repetido');
});

test('gráfico de barras duplas: cada número do gráfico é o mesmo da tabela, com diferença e total feitos pelo código', () => {
  const html = montarDocumento({ titulo: 'Comparador de carteira', secoes: [{ titulo: 'Composição por classe', grafico: COMPOSICAO }] }, MARCA);
  const g = doGrafico(html), t = daTabela(html);
  assert.equal(g.size, 10);
  assert.deepEqual([...g].sort(), [...t].sort());
  assert.equal(g.get('0/0'), '70%');
  assert.equal(g.get('1/4'), '10%');
  assert.match(html, /<td class="n down"[^>]*>▼ 30 p\.p\.<\/td>/);
  assert.match(html, /<tr class="total"><td>Total<\/td><td class="n">100%<\/td><td class="n">100%<\/td>/);
  assert.match(html, /Fonte: Escritório Teste, data-base 31\/10\/2026/);
});

test('rosca e linha também saem com a tabela dos mesmos números', () => {
  const rosca = montarDocumento({ titulo: 'Diagnóstico', secoes: [{ titulo: 'Patrimônio', grafico: { tipo: 'rosca', unidade: 'R$', rotulos: ['Imóvel', 'Aplicações', 'Previdência'], series: [{ nome: 'Valor', valores: [600000, 250000.5, 49999.5] }] } }] }, MARCA);
  assert.deepEqual([...doGrafico(rosca)].sort(), [...daTabela(rosca)].sort());
  assert.equal(doGrafico(rosca).get('0/1'), 'R$ 250.000,50');
  assert.match(rosca, /<tr class="total"><td>Total<\/td><td class="n">R\$ 900.000,00<\/td>/, 'a rosca soma o total sozinha');
  const linha = montarDocumento({ titulo: 'Estudo', secoes: [{ titulo: 'Histórico', grafico: { tipo: 'linha', retornos: true, rotulos: ['jan', 'fev', 'mar'], series: [{ nome: 'Ativo', valores: [10, -10, 5] }, { nome: 'Índice', valores: [1, 1, 1] }] } }] }, MARCA);
  const gl = doGrafico(linha), tl = daTabela(linha);
  assert.ok(gl.size >= 2);
  for (const [k, v] of gl) assert.equal(tl.get(k), v, `ponto ${k} do gráfico difere da tabela`);
  assert.equal(tl.get('0/3'), '103,95', 'base 100 composta pelo código: 100 × 1,10 × 0,90 × 1,05');
  assert.equal(tl.get('0/0'), '100,00');
});

test('gráfico com número faltando não vira PDF errado: devolve o motivo', () => {
  assert.throws(() => montarDocumento({ titulo: 'X', secoes: [{ titulo: 'Y', grafico: { tipo: 'barras', rotulos: ['a', 'b'], series: [{ nome: 'S', valores: [1] }] } }] }, MARCA), /um valor para cada rótulo/);
});

test('cabeçalho diz para quem é e a data-base; capa só quando pedida', () => {
  const html = montarDocumento({ titulo: 'Comparador de carteira', cliente: 'M.', dataBase: '31/10/2026', secoes: [{ texto: '**Frase.**' }] }, MARCA);
  assert.match(html, /<div class="eyebrow">Preparado para M\. · Data-base 31\/10\/2026<\/div>/);
  assert.doesNotMatch(html, /Material de apoio ao atendimento/);
  assert.doesNotMatch(html, /class="capa"/);
  const comCapa = montarDocumento({ titulo: 'Proposta de assessoria', capa: true, cliente: 'Família T.', tipo: 'proposta', secoes: [{ texto: 'Texto.' }] }, MARCA);
  assert.match(comCapa, /<section class="capa">[\s\S]*Proposta de assessoria[\s\S]*Família T\.[\s\S]*Assessor Teste[\s\S]*<\/section>/);
  assert.ok(comCapa.indexOf('class="capa"') < comCapa.indexOf('<header'), 'a capa vem antes do conteúdo');
});

test('números em destaque: até 4 cartões no topo, depois da frase-resumo', () => {
  const destaques = Array.from({ length: 5 }, (_, k) => ({ rotulo: `R${k}`, valor: `${k}% → ${k + 1}%`, nota: 'nota' }));
  const html = montarDocumento({ titulo: 'T', destaques, secoes: [{ titulo: 'Resumo', texto: '**A maior diferença está na concentração.**\n\nOutra frase.' }, { titulo: 'Composição', texto: 'x' }] }, MARCA);
  assert.equal((html.match(/<div class="card">/g) || []).length, 4);
  assert.ok(html.indexOf('class="resumo"') < html.indexOf('class="destaques'), 'cartões depois da frase-resumo');
  assert.ok(html.indexOf('class="destaques') < html.indexOf('Outra frase.'));
});

test('aviso compacto logo depois da última seção, com texto do tipo de material e sem repetir o rodapé', () => {
  const html = montarDocumento({ titulo: 'Comparador', tipo: 'carteira', rodape: 'Assessor Teste, assessor de investimentos vinculado ao Escritório Teste.', secoes: [{ titulo: 'A', texto: 'a' }, { titulo: 'B', texto: 'b' }] }, MARCA);
  const aviso = html.slice(html.indexOf('<div class="aviso">'));
  assert.ok(html.indexOf('<div class="aviso">') > html.lastIndexOf('<h2>'), 'o aviso vem depois da última seção');
  assert.match(aviso, /carteiras comparadas/);
  assert.doesNotMatch(aviso, /research|Preços-alvo/, 'comparador de carteira não fala de casa de research');
  assert.ok(!aviso.includes(AVISO_RODAPE), 'o aviso não repete a frase do rodapé');
  assert.match(aviso, /Assessor Teste, assessor de investimentos vinculado ao Escritório Teste\./);
  const estudo = montarDocumento({ titulo: 'Estudo', tipo: 'estudo', secoes: [{ texto: 'x' }] }, MARCA);
  assert.match(estudo.slice(estudo.indexOf('<div class="aviso">')), /casas de research/);
});

test('rodapé de toda página com o aviso curto e o número "N de M"', () => {
  const html = montarDocumento({ titulo: 'T', secoes: [{ texto: 'x' }] }, MARCA);
  assert.match(html, /@bottom-right\{[^}]*counter\(page\) " de " counter\(pages\)/);
  assert.match(html, new RegExp(`@bottom-left\\{content:"[^"]*${AVISO_RODAPE}`));
});

test('chamada antiga, sem os campos novos, continua funcionando como hoje', () => {
  const html = montarDocumento({ titulo: 'Relatório mensal', subtitulo: 'Outubro de 2026', rodape: 'Assessor Teste, Escritório Teste',
    secoes: [{ titulo: 'Resumo', texto: '**O patrimônio subiu no mês.**\n\n- item' }, { titulo: 'Conferir', texto: '- data-base' }] }, MARCA);
  assert.match(html, /<div class="eyebrow">Material de apoio ao atendimento · \d{2}\/\d{2}\/\d{4}<\/div>/);
  assert.match(html, /<p class="resumo"><b>O patrimônio subiu no mês\.<\/b><\/p>/);
  assert.match(html, /<section class="conferir">/);
  assert.match(html, /Assessor Teste, Escritório Teste/);
  assert.doesNotMatch(html, /class="destaques|<figure|class="capa"/);
  assert.match(html.slice(html.indexOf('<div class="aviso">')), /Confira os dados nas fontes citadas/);
});

test('sem tipo, o aviso só fala de casas de research quando o texto cita preço-alvo ou research', () => {
  const sem = montarDocumento({ titulo: 'T', secoes: [{ texto: 'Liquidez diária de 60%.' }] }, MARCA);
  assert.doesNotMatch(sem.slice(sem.indexOf('<div class="aviso">')), /research/);
  const com = montarDocumento({ titulo: 'T', secoes: [{ texto: 'Mediana do preço-alvo de R$ 60,00 em 10 casas.' }] }, MARCA);
  assert.match(com.slice(com.indexOf('<div class="aviso">')), /casas de research/);
});

test('os três temas mudam as cores da folha, e a folha sem tema continua azul-marinho', () => {
  const cor = (tema) => montarDocumento({ titulo: 'T', tema, secoes: [{ texto: 'x' }] }, MARCA).match(/--forte:(#[0-9a-f]{6})/i)[1];
  assert.equal(cor(undefined), '#12202b');
  assert.equal(cor('marinho'), '#12202b');
  assert.notEqual(cor('escuro'), cor('claro'));
  assert.notEqual(cor('escuro'), cor('marinho'));
});

// Correções depois da revisão do passo 4 (18/11): a folha A4 passa pela trava de promessa, risco zero e superlativo,
// em todo texto que vai ao cliente; fonte, órgão, FGC e rentabilidade com período continuam passando.
const TRAVA = /afirmam algo que o assessor pode não ter dito/;
test('A4: promessa, risco zero e superlativo em qualquer texto que vai ao cliente impedem o PDF', () => {
  const base = { titulo: 'Comparador de carteira', secoes: [{ titulo: 'Resumo', texto: 'Texto.' }] };
  const CASOS = [
    { ...base, titulo: 'A melhor carteira para você' },
    { ...base, subtitulo: 'Retorno garantido' },
    { ...base, cliente: 'Cliente sem risco' },
    { ...base, destaques: [{ rotulo: 'Renda fixa', valor: '70%', nota: 'sem risco' }] },
    { ...base, secoes: [{ titulo: 'Resumo', texto: 'Linha um.\n- Esta carteira vai render mais' }] },
    { ...base, secoes: [{ titulo: 'Oportunidade única', texto: 'x' }] },
    { ...base, secoes: [{ titulo: 'Composição', grafico: { ...COMPOSICAO, titulo: 'A melhor escolha' } }] },
    { ...base, secoes: [{ titulo: 'Composição', grafico: { ...COMPOSICAO, rotulos: ['Sem risco', ...COMPOSICAO.rotulos.slice(1)] } }] },
    { ...base, secoes: [{ titulo: 'Composição', grafico: { ...COMPOSICAO, fonte: 'Retorno garantido pelo escritório' } }] },
    { ...base, secoes: [{ titulo: 'Composição', grafico: { ...COMPOSICAO, series: [{ ...COMPOSICAO.series[0], nome: 'A melhor' }, COMPOSICAO.series[1]] } }] },
    { ...base, rodape: 'Assessor Teste, o melhor do mercado' },
  ];
  for (const a of CASOS) assert.throws(() => montarDocumento(a, MARCA), TRAVA, `passou: ${JSON.stringify(a).slice(0, 160)}`);
});

test('A4: fonte, órgão, FGC e rentabilidade com período passam; [CONFERIR] e termos confirmados liberam', () => {
  const ok = { titulo: 'Relatório mensal', tipo: 'relatorio', rodape: 'Assessor Teste, assessor de investimentos vinculado ao Escritório Teste. Regulado pela CVM.',
    secoes: [{ titulo: 'Resumo', texto: '**A carteira rendeu 1,02% em outubro de 2026, contra 1,15% do CDI (Banco Central, SGS 4391).**\n\n- CDB com garantia do FGC até R$ 250 mil por CPF e instituição\n- Fonte: CVM, dados abertos, 10/11/2026' },
      { titulo: 'Composição', grafico: COMPOSICAO }] };
  assert.doesNotThrow(() => montarDocumento(ok, MARCA));
  assert.doesNotThrow(() => montarDocumento({ titulo: 'T', secoes: [{ texto: 'Resgate sem risco de mercado [CONFERIR: frase do assessor]' }] }, MARCA));
  assert.throws(() => montarDocumento({ titulo: 'T', secoes: [{ texto: 'Tesouro Selic sem risco de crédito privado' }] }, MARCA), TRAVA);
  assert.doesNotThrow(() => montarDocumento({ titulo: 'T', termosConfirmados: ['sem risco'], secoes: [{ texto: 'Tesouro Selic sem risco de crédito privado' }] }, MARCA));
});

test('A4 de estudo e de mercado: rentabilidade ou retorno pedem o período na mesma seção', () => {
  assert.throws(() => montarDocumento({ titulo: 'Estudo', tipo: 'estudo', secoes: [{ titulo: 'Histórico', texto: 'Rentabilidade de 12,4%.' }] }, MARCA), /retorno sem período/);
  assert.doesNotThrow(() => montarDocumento({ titulo: 'Estudo', tipo: 'estudo', secoes: [{ titulo: 'Histórico', texto: 'Rentabilidade de 12,4% em 12 meses até out/2026.' }] }, MARCA));
  assert.doesNotThrow(() => montarDocumento({ titulo: 'Estudo', tipo: 'mercado', secoes: [{ titulo: 'Histórico', texto: 'Retorno de 12,4%.', grafico: { ...COMPOSICAO, fonte: 'CaptaMais, 12 meses até out/2026' } }] }, MARCA), 'o período pode estar na fonte do gráfico da seção');
  assert.doesNotThrow(() => montarDocumento({ titulo: 'Relatório', tipo: 'relatorio', secoes: [{ texto: 'Rendimento de R$ 2.000 por mês.' }] }, MARCA), 'fora de estudo e mercado, o período não é exigido');
});

test('A4: rosca em % que não soma 100 não vira PDF; em R$ qualquer soma vale', () => {
  const rosca = (valores, unidade = '%') => montarDocumento({ titulo: 'T', secoes: [{ titulo: 'Composição', grafico: { tipo: 'rosca', unidade, rotulos: valores.map((_, k) => `Classe ${k + 1}`), series: [{ nome: 'Atual', valores }] } }] }, MARCA);
  assert.throws(() => rosca([45, 45]), /soma 90%.*100%/);
  assert.throws(() => rosca([60, 50]), /soma 110%/);
  assert.doesNotThrow(() => rosca([33.3, 33.3, 33.3]), 'arredondamento de até 1 p.p. passa');
  assert.doesNotThrow(() => rosca([45, 45], 'R$'));
});

// Revisão de carteira (plano 7.5): rosca da política × atual e tabela de desvio com as bandas.
// Números de um cliente de teste (Cliente Teste), não de uma carteira real.
const REVISAO = {
  tipo: 'rosca', unidade: '%', categoria: 'Classe',
  rotulos: ['Renda fixa', 'Ações', 'Fundos imobiliários', 'Exterior'],
  series: [{ nome: 'Política', valores: [50, 25, 15, 10] }, { nome: 'Atual', valores: [62, 20, 12, 6] }],
  bandas: [10, 5, 5, 2.5],
  fonte: 'posição do Cliente Teste em 31/10/2026 e a política de investimento dele',
};
const linhasDaTabela = (html) => [...html.slice(html.indexOf('<tbody>')).matchAll(/<tr>(.*?)<\/tr>/g)]
  .map(([, r]) => [...r.matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(([, c]) => c));

test('rosca da política × atual: duas roscas, cada número do desenho igual ao da tabela, diferença em p.p.', () => {
  const html = montarDocumento({ titulo: 'Revisão de carteira', tipo: 'carteira', secoes: [{ titulo: 'Desvio', grafico: { ...REVISAO, bandas: undefined } }] }, MARCA);
  const svg = html.slice(html.indexOf('<figure'), html.indexOf('</figure>'));
  assert.equal((svg.match(/class="fatia"/g) || []).length, 8, 'quatro fatias em cada rosca');
  assert.match(svg, />Política</); assert.match(svg, />Atual</);
  const g = doGrafico(html), t = daTabela(html);
  assert.equal(g.size, 8);
  for (const [k, v] of g) assert.equal(t.get(k), v, `gráfico e tabela diferentes em ${k}`);
  assert.deepEqual([...html.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1]), ['Classe', 'Política', 'Atual', 'Diferença']);
  assert.deepEqual(linhasDaTabela(html)[0], ['Renda fixa', '50%', '62%', '▲ 12 p.p.']);
  assert.match(html, /<tr class="total"><td>Total<\/td><td class="n">100%<\/td><td class="n">100%<\/td>/);
});

test('bandas: a tabela ganha Banda e Situação, feitas pelo código (fora quando o desvio passa da banda)', () => {
  const html = montarDocumento({ titulo: 'Revisão de carteira', tipo: 'carteira', secoes: [{ titulo: 'Desvio', grafico: REVISAO }] }, MARCA);
  assert.deepEqual([...html.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1]), ['Classe', 'Política', 'Atual', 'Diferença', 'Banda', 'Situação']);
  assert.deepEqual(linhasDaTabela(html), [
    ['Renda fixa', '50%', '62%', '▲ 12 p.p.', '±10 p.p.', 'Fora'],
    ['Ações', '25%', '20%', '▼ 5 p.p.', '±5 p.p.', 'Dentro'],
    ['Fundos imobiliários', '15%', '12%', '▼ 3 p.p.', '±5 p.p.', 'Dentro'],
    ['Exterior', '10%', '6%', '▼ 4 p.p.', '±2,5 p.p.', 'Fora'],
  ]);
  // barras-duplas também aceitam bandas (alvo e atual em barras)
  const barras = montarDocumento({ titulo: 'R', secoes: [{ grafico: { ...REVISAO, tipo: 'barras-duplas' } }] }, MARCA);
  assert.deepEqual(linhasDaTabela(barras)[3], ['Exterior', '10%', '6%', '▼ 4 p.p.', '±2,5 p.p.', 'Fora']);
});

test('rosca com duas séries só em %, e bandas só com duas séries, uma por rótulo', () => {
  const emReais = { ...REVISAO, unidade: 'R$', bandas: undefined, series: [{ nome: 'Política', valores: [500, 250, 150, 100] }, { nome: 'Atual', valores: [620, 200, 120, 60] }] };
  assert.throws(() => montarDocumento({ titulo: 'R', secoes: [{ grafico: emReais }] }, MARCA), /duas séries.*em %/);
  assert.throws(() => montarDocumento({ titulo: 'R', secoes: [{ grafico: { ...REVISAO, bandas: [10, 5] } }] }, MARCA), /uma banda para cada rótulo/);
  assert.throws(() => montarDocumento({ titulo: 'R', secoes: [{ grafico: { ...REVISAO, bandas: [10, 5, -1, 2] } }] }, MARCA), /uma banda para cada rótulo/);
  assert.throws(() => montarDocumento({ titulo: 'R', secoes: [{ grafico: { ...REVISAO, series: [REVISAO.series[1]] } }] }, MARCA), /bandas só valem com duas séries/);
  assert.throws(() => montarDocumento({ titulo: 'R', secoes: [{ grafico: { ...REVISAO, series: [REVISAO.series[0], { nome: 'Atual', valores: [62, 20, 12, 1] }] } }] }, MARCA), /soma 95%/);
});
