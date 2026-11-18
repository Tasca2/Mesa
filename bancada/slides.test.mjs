// Passo 4 do plano de melhorias (seção 7.4): os slides da ferramenta mesa_apresentacao.
// Confere o HTML das páginas, sem abrir navegador. Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { montarPaginas, NOMES_LAYOUT, css, problemasDosSlides } = await import(pathToFileURL(path.join(RAIZ, 'servidor', 'layouts.mjs')).href);

const MARCA = { nome: 'Assessor Teste', escritorio: 'Escritório Teste', rodape: 'Material informativo. Assessor Teste, Escritório Teste.' };
const pagina = (s, marca = MARCA) => montarPaginas([s], marca).html;
const itens = (n) => Array.from({ length: n }, (_, k) => ({ titulo: `Assunto ${k + 1}`, texto: 'Descrição curta do assunto' }));
const tamanho = (html, re) => Number((html.match(re) || [])[1]);

test('três layouts novos: rosca, linha e comparativo', () => {
  for (const nome of ['rosca', 'linha', 'comparativo']) assert.ok(NOMES_LAYOUT.includes(nome), `falta o layout ${nome}`);
});

test('rosca: uma fatia por item e a legenda com os números enviados', () => {
  const h = pagina({ layout: 'rosca', titulo: 'Onde está a carteira hoje', itens: [{ rotulo: 'Renda fixa pós', valor: '70%' }, { rotulo: 'Multimercado', valor: '10%' }, { rotulo: 'Ações', valor: '15%' }, { rotulo: 'Exterior', valor: '5%' }] });
  assert.equal((h.match(/<path class="fatia"/g) || []).length, 4);
  for (const v of ['70%', '10%', '15%', '5%']) assert.match(h, new RegExp(`class="lv">${v}<`));
});

test('linha: base 100 feita pelo código, a partir de níveis ou de retornos do período', () => {
  const niveis = pagina({ layout: 'linha', titulo: 'Histórico', rotulos: ['jan', 'fev', 'mar'], series: [{ nome: 'Carteira', valores: [50, 55, 60.5] }] });
  assert.match(niveis, /class="fim"[^>]*>121,0</);
  const ret = pagina({ layout: 'linha', titulo: 'Histórico', retornos: true, rotulos: ['jan', 'fev'], series: [{ nome: 'Carteira', valores: [10, -10] }, { nome: 'CDI', valores: [1, 1] }, { nome: 'Índice', valores: [2, 2] }] });
  assert.match(ret, /class="fim"[^>]*>99,0</);
  assert.match(ret, /class="fim"[^>]*>102,0</);
  assert.match(ret, /class="fim"[^>]*>104,0</);
  assert.equal((ret.match(/<polyline class="serie"/g) || []).length, 3, 'até 3 séries');
});

test('comparativo: A × B com a diferença calculada no meio', () => {
  const h = pagina({ layout: 'comparativo', titulo: 'Atual e proposta', legenda: ['Atual', 'Proposta'], itens: [{ rotulo: 'Renda fixa pós', valor: '70%', valor2: '40%' }, { rotulo: 'Ações', valor: '15%', valor2: '20%' }, { rotulo: 'Liquidez', valor: 'D+0', valor2: 'D+30', texto: 'prazo maior' }] });
  assert.match(h, /class="dif[^"]*">−30 p\.p\.</);
  assert.match(h, /class="dif[^"]*">\+5 p\.p\.</);
  assert.match(h, /class="dif[^"]*">prazo maior</);
  assert.match(h, />Atual<[\s\S]*>Proposta</);
});

test('nome do cliente na capa e no rodapé', () => {
  const marca = { ...MARCA, cliente: 'Cliente Teste' };
  const { html } = montarPaginas([{ layout: 'capa', titulo: 'Segunda reunião' }, { layout: 'frase', titulo: 'Objetivo' }], marca);
  const [capa, outra] = html.split('</section>');
  assert.match(capa, /Preparado para[\s\S]*Cliente Teste/);
  assert.match(outra, /<div class="pe"><div class="a">Cliente Teste · Material informativo/);
});

test('a letra cresce quando há menos itens', () => {
  const h3 = (n, layout) => tamanho(pagina({ layout, titulo: 'Roteiro', itens: itens(n) }), /<h3 style="font-size:(\d+)px/);
  assert.ok(h3(3, 'agenda') > h3(8, 'agenda'), `agenda: 3 itens ${h3(3, 'agenda')} px, 8 itens ${h3(8, 'agenda')} px`);
  assert.ok(h3(2, 'lista') > h3(6, 'lista'));
  assert.ok(h3(2, 'pilares') > h3(4, 'pilares'));
  assert.ok(h3(2, 'etapas') > h3(4, 'etapas'));
  const td = (n) => tamanho(pagina({ layout: 'tabela', titulo: 'Plano', cabecalho: ['Quando', 'O quê'], linhas: Array.from({ length: n }, () => ['Semana 1', 'Envio']) }), /<td style="font-size:(\d+)px/);
  assert.ok(td(4) > td(8));
});

test('o conteúdo ocupa a altura da página: nada de corpo colado no topo', () => {
  const todas = ['agenda', 'lista', 'pilares', 'etapas', 'tabela', 'barras', 'diagrama'].map((layout) => pagina({ layout, titulo: 'T', itens: itens(4), cabecalho: ['a', 'b'], linhas: [['1', '2']] })).join('');
  assert.doesNotMatch(todas, /justify-content:flex-start/);
  assert.doesNotMatch(css({ fundo: '#000', painel: '#111', tinta: '#fff', suave: '#999', cor: '#C9A24B', linha: '#333' }, { titulo: 'serif', peso: 400, espaco: '0' }, '#C9A24B'), /\.corpo\{[^}]*justify-content:flex-start/);
});

test('nenhum texto de conteúdo abaixo de 28 px; linha de fonte com 22 px', () => {
  const ROTULOS = new Set(['.pe', '.pe .a', '.pe .n', '.et', 'th', '.fato .r', '.et-l .k', '.dir .k', '.capa .marca-t', '.capa .base .r', '.templo .front span', '.fonte', '.nums .f', '.lg .r', '.eixo', '.cmp .h']);
  for (const [estilo, est] of [['serifada', { titulo: 'serif', peso: 400, espaco: '0', pv: true }], ['minimo', { titulo: 'serif', peso: 400, espaco: '0' }]]) {
    const folha = css({ fundo: '#000', painel: '#111', tinta: '#fff', suave: '#999', cor: '#C9A24B', linha: '#333' }, est, '#C9A24B');
    const pequenos = [];
    for (const [, sel, corpo] of folha.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      for (const [, px] of corpo.matchAll(/font-size:(\d+)px/g)) {
        const seletores = sel.split(',').map((x) => x.trim().replace(/^\/\*.*?\*\/\s*/, ''));
        if (Number(px) < 28 && !seletores.every((x) => ROTULOS.has(x))) pequenos.push(`${sel.trim()} ${px}px`);
      }
    }
    assert.deepEqual(pequenos, [], `${estilo}: texto de conteúdo abaixo de 28 px`);
    assert.match(folha, /\.fonte\{[^}]*font-size:22px/);
  }
  const sub = pagina({ layout: 'frase', titulo: 'T', subtitulo: 'x'.repeat(290) });
  assert.ok(tamanho(sub, /class="sub" style="font-size:(\d+)px/) >= 28, 'subtítulo longo não encolhe abaixo de 28 px');
});

test('o bloco principal estica até o fim da área de conteúdo', () => {
  const casos = [
    { layout: 'agenda', itens: itens(4) }, { layout: 'lista', itens: itens(4) }, { layout: 'pilares', itens: itens(3) }, { layout: 'etapas', itens: itens(3) },
    { layout: 'numeros', itens: [{ valor: '70%', rotulo: 'a' }, { valor: '30%', rotulo: 'b' }] }, { layout: 'tabela', cabecalho: ['a', 'b'], linhas: [['1', '2'], ['3', '4']] },
    { layout: 'barras', itens: [{ rotulo: 'a', valor: '70%' }, { rotulo: 'b', valor: '30%' }] }, { layout: 'comparativo', itens: [{ rotulo: 'a', valor: '70%', valor2: '40%' }] },
    { layout: 'diagrama', itens: itens(3) },
  ];
  for (const s of casos) {
    const h = pagina({ titulo: 'T', ...s });
    assert.match(h, /<section class="s enche">/, `${s.layout}: página sem a classe que estica o conteúdo`);
    assert.match(h, /class="[^"]*\balto\b/, `${s.layout}: bloco principal sem a classe alto`);
  }
  assert.match(css({ fundo: '#000', painel: '#111', tinta: '#fff', suave: '#999', cor: '#C9A24B', linha: '#333' }, { titulo: 'serif', peso: 400, espaco: '0', pv: true }, '#C9A24B'), /\.alto\{flex:1/);
});

test('a frase-ponte fecha a área de conteúdo e não encosta no rodapé', () => {
  const h = pagina({ layout: 'lista', titulo: 'T', itens: itens(4), ponte: 'Agora, os próximos passos.' }, { ...MARCA, cliente: 'Cliente Teste' });
  assert.match(h, /<div class="ponte">Agora, os próximos passos\.<\/div><\/div><div class="pe">/);
});

test('número grande em cor sólida (texto com gradiente recortado deixa fio no PDF)', () => {
  const folha = css({ fundo: '#000', painel: '#111', tinta: '#fff', suave: '#999', cor: '#C9A24B', linha: '#333' }, { titulo: 'serif', peso: 400, espaco: '0', pv: true }, '#C9A24B');
  assert.doesNotMatch(folha, /background-clip:text/);
});

// Correções depois da revisão do passo 4 (18/11): barras com o valor enviado, não o número limitado e arredondado.
test('barras: escreve o valor enviado, com sinal e casas; só a barra fica dentro da trilha', () => {
  const h = pagina({ layout: 'barras', titulo: 'Retorno em 24 meses até out/2026', itens: [{ rotulo: 'WEGE3', valor: '-5,71%' }, { rotulo: 'IBOV', valor: 29.46 }, { rotulo: 'Outro', valor: '112%' }] });
  assert.match(h, /class="p"[^>]*>−5,71%</, 'o negativo sai com sinal, não como 0,0%');
  assert.match(h, /class="p"[^>]*>29,46%</, 'as casas enviadas ficam');
  assert.match(h, /class="p"[^>]*>112,00%</, 'acima de 100 sai o valor enviado');
  const barras = [...h.matchAll(/<b class="([^"]*)" style="left:([\d.]+)%;width:([\d.]+)%/g)].map(([, c, l, w]) => ({ c, l: Number(l), w: Number(w) }));
  assert.equal(barras.length, 3);
  for (const b of barras) assert.ok(b.l >= 0 && b.w >= 0 && b.l + b.w <= 100.0001, `barra fora da trilha: ${JSON.stringify(b)}`);
  assert.match(barras[0].c, /\bneg\b/, 'o negativo é desenhado diferente');
  assert.doesNotMatch(barras[1].c, /\bneg\b/);
  assert.ok(barras[0].l + barras[0].w <= barras[1].l + 0.0001, 'o negativo vai para a esquerda do zero');
  assert.match(h, /class="zero"/, 'linha do zero quando há negativo');
  assert.ok(barras[2].w > barras[1].w, 'a barra de 112% é maior que a de 29,46%');
});

test('barras: valor que não é número, rótulo vazio, unidade que não é % e valor2 faltando viram erro antes do PDF', () => {
  const p = (itens, extra = {}) => problemasDosSlides([{ layout: 'barras', titulo: 'T', itens, ...extra }]);
  assert.deepEqual(p([{ rotulo: 'a', valor: '70%' }, { rotulo: 'b', valor: -5.71 }]), []);
  assert.match(p([{ rotulo: 'a', valor: 'n/d' }]).join(' '), /"a".*número/);
  assert.match(p([{ rotulo: '', valor: 10 }]).join(' '), /rótulo/);
  assert.match(p([{ rotulo: 'a', valor: 'R$ 1.000' }]).join(' '), /%/);
  assert.match(p([{ rotulo: 'a', valor: 10, valor2: 20 }, { rotulo: 'b', valor: 30 }]).join(' '), /"b".*segundo valor/);
  assert.match(p([]).join(' '), /pelo menos 1 item/);
});
