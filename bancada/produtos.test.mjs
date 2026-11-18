// Passo 7 do plano de melhorias (Produtos): área nova com "Raio-X de produto" e "Comparar produtos" (a antiga
// "Renda fixa", que sai de Mercado com a mesma id), nas duas telas, no servidor, no modo chat e nas skills.
// Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { carregar } from './catalogo.mjs';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TELAS = [['janela', path.join(RAIZ, 'janela', 'mesa-janela.html')], ['painel', path.join(RAIZ, 'servidor', 'painel-v2.html')]]
  .map(([nome, arq]) => ({ nome, arq, cat: carregar(arq) }));
const USOS = ['Conversa de WhatsApp', 'Entender a fundo', 'Material para o cliente'];
const PRODUTOS = ['CDB, LCI ou LCA', 'Crédito privado (CRI, CRA, debênture)', 'Fundo ou previdência', 'COE ou estruturado', 'Oferta pública', 'Outro'];
const TETO = 5000; // régua do plano: pedido montado com os campos ainda vazios
const SEM_CONFERIR = 'Em arquivo para o cliente ficam de fora o Conferir, o Próximo passo e o que é orientação para mim (vale no lugar da regra geral do PDF)';
// A skill do livro (fonte da cópia); MESA_LIVRO troca o caminho.
const LIVRO = process.env.MESA_LIVRO || 'D:/Brain/01 - Produtos/01 - IA Mercado Financeiro/01 - Manual/anexos/skills/leitura-de-lamina/SKILL.md';
const ler = (...p) => readFileSync(path.join(RAIZ, ...p), 'utf8');

const itens = (texto) => {
  const linhas = texto.split('\n'), r = [];
  for (let k = linhas.indexOf('O que preciso receber:') + 1; k > 0 && k < linhas.length && linhas[k].startsWith('- '); k++) r.push(linhas[k].slice(2));
  return r;
};
const fonte = (texto) => texto.split('\n').find((l) => l.startsWith('Fonte dos dados: ')) ?? '';

// validarTarefa e achaTarefa ficam no bloco do catálogo: roda o bloco e chama as duas.
function funcoesDoBloco(arq) {
  const linhas = readFileSync(arq, 'utf8').split('\n');
  const ini = linhas.findIndex((l) => /^ {2}const AREAS = /.test(l));
  const fim = linhas.findIndex((l, i) => i > ini && l.startsWith('  const $ = (s) => document.querySelector(s);'));
  const est = linhas.slice(fim).find((l) => l.startsWith('  const estado = ')) ?? '';
  const ctx = vm.createContext({ window: {}, console });
  new vm.Script([linhas.slice(ini, fim).join('\n'), est, ';globalThis.__p = { validar: (sp) => JSON.stringify(validarTarefa(sp)), acha: (r) => achaTarefa(r) };'].join('\n')).runInContext(ctx, { timeout: 5000 });
  return { validar: (sp) => JSON.parse(ctx.__p.validar(sp)), acha: (r) => ctx.__p.acha(r) };
}

for (const { nome, arq, cat } of TELAS) {
  test(`${nome} · menu: quatro áreas, Produtos entre Mercado e Marketing; Mercado sem a renda fixa`, () => {
    const { AREAS, T } = cat.retrato();
    assert.deepEqual(AREAS.map((a) => a.id), ['rotinas', 'mercado', 'produtos', 'instagram']);
    const p = AREAS[2];
    assert.equal(p.nome, 'Produtos');
    assert.ok(p.desc && p.glifo, 'a área precisa de descrição e ícone');
    assert.deepEqual(p.grupos.map((g) => [g.nome, g.tarefas]), [['Analisar', ['raio-x', 'rf']]]);
    assert.deepEqual(AREAS[1].grupos.map((g) => [g.nome, g.tarefas]), [['Panorama', ['macro', 'fato', 'grafico']], ['Ativos', ['estudo', 'acao', 'setor', 'fii']]]);
    assert.equal(T['raio-x'].nome, 'Raio-X de produto');
    assert.equal(T.rf.nome, 'Comparar produtos');
    const ids = cat.tarefasDoMenu().map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length, 'tarefa repetida no menu');
    // o ícone da área existe no desenho da tela inicial, e a tela inicial abre uma coluna por área
    const html = readFileSync(arq, 'utf8');
    const glifos = html.slice(html.indexOf('  const GLIFOS = {'), html.indexOf('  };', html.indexOf('  const GLIFOS = {')));
    for (const a of AREAS) assert.match(glifos, new RegExp(`\\b${a.glifo}: `), `falta o ícone ${a.glifo}`);
    assert.match(html, /const portas = el\("div", "portas grade"\); portas\.style\.setProperty\("--cols", AREAS\.length\);/);
  });

  test(`${nome} · Raio-X: pergunta "Que produto é?" com as seis opções e a pergunta de uso`, () => {
    const m = cat.montar('raio-x', {}, []);
    assert.equal(m.area, 'produtos');
    assert.deepEqual(m.perguntas.map((p) => [p.id, p.titulo, p.opcoes]), [['produto', 'Que produto é?', PRODUTOS], ['uso', 'Para que você vai usar esta leitura?', USOS]]);
    assert.ok(m.texto.startsWith('[Mesa] Produtos › Raio-X de produto'));
  });

  test(`${nome} · Raio-X: 12 itens, da frase em negrito ao Conferir, com os blocos da seção 9.3, e o arquivo do cliente sem Conferir`, () => {
    const l = itens(cat.montar('raio-x', { produto: ['Fundo ou previdência'], uso: ['Material para o cliente'] }, []).texto);
    assert.equal(l.length, 12);
    assert.match(l[0], /^Em uma frase \(negrito\): o que é o produto, quem emite ou gere, quanto paga e por quanto tempo/);
    const blocos = ['Ficha em UMA tabela (Condição | O que diz o material | Onde está)', 'Como paga em UMA tabela (Cenário | Condição | O que o cliente recebe)',
      'Na mesma base em UMA tabela (Produto | Taxa do material | Bruto ao ano | Líquido de imposto no prazo | Equivale a % do CDI | Título público de prazo parecido)',
      'Quem está por trás em UMA tabela de até 5 linhas (Indicador | Valor | Data | Fonte)', 'Encaixe em UMA tabela (Situação do cliente | Encaixe ▲ ● ▼ | Motivo)',
      'Atenção em UMA tabela (Sinal | Status | Dado)', 'Custos e remuneração em 2 linhas', 'Como apresentar:', 'Peças:', 'Monitorar em UMA tabela de até 4 linhas'];
    blocos.forEach((b, i) => assert.ok(l[i + 1].startsWith(b), `item ${i + 2}: esperava «${b}», veio «${l[i + 1].slice(0, 80)}»`));
    assert.match(l[11], /^Conferir, sempre a última coisa da resposta, em texto simples e sem título, negrito ou tabela: até 5 itens/);
    assert.ok(l[11].includes(SEM_CONFERIR));
    assert.match(l[9], /mesa_documento/);
  });

  test(`${nome} · Raio-X: a fonte manda usar o material, as ferramentas da Mesa e a fonte primária, sem preencher de memória`, () => {
    const f = fonte(cat.montar('raio-x', { uso: ['Entender a fundo'] }, []).texto);
    for (const x of ['cite a página ou o trecho', 'analise_ativo', 'documentos_cvm', 'painel_macro', 'taxas_tesouro', 'sem dado', 'Onde pesquisar, nesta ordem:', 'fgc.org.br', 'planalto.gov.br'])
      assert.ok(f.includes(x), `a fonte não cita ${x}`);
  });

  test(`${nome} · Raio-X: campos de produto, material (anexo ou colado), situações, argumento da casa e remuneração`, () => {
    const c = cat.montar('raio-x', {}, []).campos;
    assert.deepEqual(c.map((f) => !!f.opcional), [false, true, false, true, true]);
    assert.match(c[0].rotulo, /ticker, código ou CNPJ/);
    assert.match(c[1].rotulo, /^Material do produto/);
    assert.match(c[1].dica, /anexe o PDF/);
    assert.match(c[2].rotulo, /^Situações de cliente/);
    assert.ok(c[2].padrao, 'as situações vêm com um padrão');
    assert.match(c[3].rotulo, /argumento/i);
    assert.match(c[4].rotulo, /remuneração/i);
  });

  test(`${nome} · Raio-X e Comparar produtos: cabem em ${TETO} caracteres em todos os usos, e o WhatsApp diz o que não pode faltar`, () => {
    for (const id of ['raio-x', 'rf']) for (const uso of USOS) for (const produto of [[], ['Oferta pública']]) {
      const n = cat.montar(id, { uso: [uso], produto }, []).texto.length;
      assert.ok(n < TETO, `${id} (${uso}): ${n}`);
    }
    assert.ok(itens(cat.montar('raio-x', { uso: ['Conversa de WhatsApp'] }, []).texto).some((x) => x.startsWith('Na mensagem não pode faltar: o que é o produto, quanto paga e por quanto tempo, a liquidez e se tem ou não FGC')));
    assert.ok(itens(cat.montar('rf', { uso: ['Conversa de WhatsApp'] }, []).texto).some((x) => x.startsWith('Na mensagem não pode faltar: a diferença entre os produtos no mesmo prazo')));
  });

  test(`${nome} · Comparar produtos: é a antiga Renda fixa, na mesma id, achada pelo nome antigo; fonte nova, lâmina anexada e gráfico de barras`, () => {
    const { T, PEDIDO } = cat.retrato();
    assert.match(T.rf.linha, /renda fixa/i); // a busca (Ctrl+K) procura no nome e na linha
    const f = funcoesDoBloco(arq);
    assert.equal(f.acha('Renda fixa'), 'rf');
    assert.equal(f.acha('rf'), 'rf');
    assert.equal(f.acha('Comparar produtos'), 'rf');
    assert.equal(f.acha(''), null);
    const m = cat.montar('rf', { uso: ['Material para o cliente'] }, []);
    assert.ok(m.texto.startsWith('[Mesa] Produtos › Comparar produtos'));
    const fo = fonte(m.texto);
    assert.ok(fo.includes('taxas_tesouro') && fo.includes('painel_macro'), 'a fonte não usa as ferramentas novas');
    assert.ok(!/Tesouro Direto e ANBIMA/.test(fo) && !/script de cálculos/.test(m.texto), 'ficou a fonte antiga');
    const l = itens(m.texto);
    assert.match(l[0], /^Em uma frase \(negrito\)/);
    assert.ok(l.at(-1).includes(SEM_CONFERIR));
    assert.ok(l.some((x) => /mesa_documento/.test(x) && /barras/.test(x)), 'falta o gráfico de barras na folha');
    assert.match(m.campos[0].dica, /anexe a lâmina/i);
    assert.ok(PEDIDO.rf.obj.includes('produtos'));
  });

  test(`${nome} · validarTarefa aceita a área produtos e a mensagem lista as quatro`, () => {
    const f = funcoesDoBloco(arq);
    assert.equal(f.validar({ area: 'xyz', nome: 'Teste' }).erro, 'Escolha a área: rotinas, mercado, produtos ou instagram.');
    const ok = f.validar({ area: 'produtos', nome: 'Prateleira da semana', linha: 'Uma linha por produto', objetivo: 'Ler a lista de produtos do escritório.', entrega: ['Uma linha por produto'] });
    assert.ok(!ok.erro, JSON.stringify(ok));
  });
}

test('servidor: o texto das áreas tem Produtos e o abrir_painel abre direto na área produtos', () => {
  const s = ler('servidor', 'server.mjs');
  assert.match(s, /'Produtos \(raio-X de produto, comparar produtos[^']*\); ' \+/);
  const mercado = s.match(/'Mercado hoje \([^']*'/)[0];
  assert.ok(!/renda fixa/.test(mercado), 'Mercado ainda cita renda fixa');
  assert.match(s, /area: z\.enum\(\['rotinas', 'mercado', 'produtos', 'instagram'\]\)/);
});

test('modo chat: Produtos com as duas tarefas, e Mercado sem a renda fixa, nas duas skills', () => {
  const a = ler('skill-mesa', 'SKILL.md'), b = ler('skill-mesa-app', 'SKILL.md');
  assert.match(a, /\| Produtos \| Raio-X de produto \| [^|]+\| `produto-raio-x` e `leitura-de-lamina` \| Produto · Resultado \|/);
  assert.match(a, /\| Produtos \| Comparar produtos \| [^|]+\| `comparacao-renda-fixa` \| Resultado \|/);
  assert.ok(!/\| Mercado \| Renda fixa \|/.test(a));
  assert.match(a, /\*\*Área\*\*: Rotinas do dia · Mercado hoje · Produtos · /);
  assert.match(b, /\| Raio-X de produto \| `produto-raio-x` e `leitura-de-lamina` \|/);
  assert.match(b, /\| Comparar produtos \(antiga Renda fixa\) \| `comparacao-renda-fixa` \|/);
  assert.match(b, /Rotinas do dia · Mercado hoje · Produtos · Marketing Profissional/);
});

test('skills: produto-raio-x é nova, com os fatos e as fontes; leitura-de-lamina é cópia do livro com a seção da Mesa', () => {
  const r = ler('servidor', 'skills', 'produto-raio-x', 'SKILL.md');
  assert.match(r, /^---\nname: produto-raio-x\n/);
  for (const x of ['R$ 250 mil', 'R$ 1 milhão', 'Decreto nº 6.306', 'Lei nº 11.033', '22,5%', '15%', 'Lei nº 12.431', 'Medida Provisória nº 1.303', 'Lei nº 14.754', 'fgc.org.br', 'planalto.gov.br', 'taxas_tesouro', 'painel_macro'])
    assert.ok(r.includes(x), `produto-raio-x não traz ${x}`);
  const livro = existsSync(LIVRO) ? readFileSync(LIVRO, 'utf8').replace(/\r\n/g, '\n') : null; // sem o livro nesta máquina, confere só a seção da Mesa
  const mesa = ler('servidor', 'skills', 'leitura-de-lamina', 'SKILL.md').replace(/\r\n/g, '\n');
  const [antes, depois] = mesa.split(/^## Na Mesa do Assessor \(acrescentado\)$/m);
  assert.ok(depois, 'falta a seção da Mesa');
  if (livro) assert.equal(antes.trimEnd(), livro.trimEnd(), 'o texto do livro mudou na cópia');
  assert.ok(!existsSync(path.join(RAIZ, 'servidor', 'skills', 'leitura-de-lamina', 'evals')), 'os casos de avaliação do livro não vão para a Mesa');
  assert.match(depois, /analise_ativo/);
});
