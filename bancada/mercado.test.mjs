// Passo 1 do plano de melhorias (Mercado hoje, só o texto): o que os pedidos de Juros, Fato relevante,
// Leitura de gráfico e Estudo passam a pedir, nas duas telas. Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { carregar, corteDaTela, corteDoMotor } from './catalogo.mjs';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TELAS = [['janela', path.join(RAIZ, 'janela', 'mesa-janela.html')], ['painel', path.join(RAIZ, 'servidor', 'painel-v2.html')]]
  .map(([nome, arq]) => ({ nome, arq, cat: carregar(arq) }));
const USOS = ['Conversa de WhatsApp', 'Entender a fundo', 'Material para o cliente'];
const MATERIAL = { uso: ['Material para o cliente'] };
const TETO = 5000; // régua do plano, item 9: pedido montado com os campos ainda vazios

// Itens da lista "O que preciso receber" de um pedido montado.
const itens = (texto) => {
  const linhas = texto.split('\n'), r = [];
  for (let k = linhas.indexOf('O que preciso receber:') + 1; k > 0 && k < linhas.length && linhas[k].startsWith('- '); k++) r.push(linhas[k].slice(2));
  return r;
};
const campos = (cat, id) => cat.montar(id, MATERIAL, []).campos.map((f) => [f.rotulo, f.opcoes ?? null, f.padrao ?? null]);
const maiorPedido = (cat, id, respostas = {}) => Math.max(...USOS.map((uso) => cat.montar(id, { ...respostas, uso: [uso] }, []).texto.length));

// Cada pedido novo: quantos itens tem e os blocos que não podem faltar (seção 5 do plano).
const PEDIDOS = {
  macro: { nome: 'juros', itens: 11, blocos: ['Painel em UMA tabela', 'Juro real', 'Copom', 'Focus', 'Agenda', 'O que muda na conversa', 'Cliente:', 'Monitorar'] },
  fato: { nome: 'fato relevante', itens: 11, blocos: ['Ficha do documento', 'O que foi divulgado', 'Etapas', 'Tamanho', 'O que muda', 'casas de research', 'Sequência', 'Cliente:', 'Monitorar'] },
  grafico: { nome: 'gráfico', itens: 10, blocos: ['Base em 1 linha', 'Medidas', 'Estrutura', 'Níveis', 'Indicadores que pedi', 'O que distorce', 'Condições', 'Cliente:'] },
  estudo: { nome: 'estudo', itens: 12, blocos: ['Ficha', 'Quatro números', 'Histórico', 'O que explica', 'Fortes e pontos de atenção', 'Casas de research', 'situação de cliente', 'formato escolhido', 'Mensagem curta', 'mais de um ativo'], respostas: { formato: ['Resumo de uma página'] } },
};

for (const { nome, cat } of TELAS) {
  for (const [id, p] of Object.entries(PEDIDOS)) {
    test(`${nome} · ${p.nome}: o pedido tem ${p.itens} itens, da frase em negrito ao Conferir, e cabe em ${TETO} caracteres`, () => {
      const l = itens(cat.montar(id, { ...p.respostas, ...MATERIAL }, []).texto);
      assert.equal(l.length, p.itens);
      assert.match(l[0], /^Em uma frase \(negrito\)/);
      assert.match(l.at(-1), /^Conferir, sempre a última coisa da resposta/);
      for (const bloco of p.blocos) assert.ok(l.some((x) => x.toLowerCase().includes(bloco.toLowerCase())), `falta o item "${bloco}"`);
      const n = maiorPedido(cat, id, p.respostas);
      assert.ok(n <= TETO, `o pedido montado tem ${n} caracteres`);
    });
  }

  test(`${nome} · juros: a pergunta das situações de cliente aceita várias e entra no pedido`, () => {
    const m = cat.montar('macro', { ...MATERIAL, situacoes: ['Reserva em pós-fixado', 'Dólar ou exterior'] }, []);
    const p = m.perguntas.find((x) => x.id === 'situacoes');
    assert.ok(p, 'a tarefa não tem a pergunta de situações');
    assert.equal(p.multi, true);
    assert.deepEqual(p.opcoes, ['Reserva em pós-fixado', 'Prefixado ou IPCA+', 'Dólar ou exterior', 'Aluguel ou contrato reajustado por índice', 'Vai financiar imóvel']);
    assert.match(m.texto, /^- Situações: Reserva em pós-fixado, Dólar ou exterior$/m);
  });

  test(`${nome} · juros: os campos Recorte e Comparar com já vêm com o padrão`, () => {
    assert.deepEqual(campos(cat, 'macro'), [
      ['Recorte', ['Painel completo', 'Juros e Copom', 'Inflação', 'Dólar e câmbio'], 'Painel completo'],
      ['Comparar com', ['Mês passado', 'Semana passada', 'Início do ano'], 'Mês passado'],
    ]);
  });

  test(`${nome} · juros: a linha do menu diz o que o painel entrega`, () => {
    assert.equal(cat.montar('macro', MATERIAL, []).linha, 'Painel do dia: juros, inflação, dólar, expectativas e agenda.');
  });

  test(`${nome} · fato relevante: campos de empresa, texto, tese e posição do cliente`, () => {
    assert.deepEqual(campos(cat, 'fato'), [
      ['Empresa (nome ou ticker)', null, null],
      ['Texto integral do comunicado ou link da página oficial', null, null],
      ['Minha tese ou motivo de acompanhar a empresa', null, null],
      ['O cliente tem o papel?', ['Tem, posição relevante', 'Tem, posição pequena', 'Não tem, está olhando', 'Não sei'], null],
    ]);
  });

  test(`${nome} · gráfico: ativo, período, escala e comparação em campos separados`, () => {
    assert.deepEqual(campos(cat, 'grafico'), [
      ['Ativo (ticker)', null, null],
      ['Período', ['3 meses', '6 meses', '12 meses', '3 anos', '5 anos'], '12 meses'],
      ['Escala', ['Diário', 'Semanal', 'Mensal'], null],
      ['Comparar com', ['IBOV', 'IFIX', 'CDI', 'Dólar'], null],
      ['Indicadores que quero ver', ['Médias móveis', 'IFR', 'Volume', 'Bandas de Bollinger'], null],
      ['Imagem do gráfico, série ou descrição', null, null],
    ]);
  });

  test(`${nome} · estudo: não pergunta o uso, e uma resposta de uso que tenha ficado não troca a entrega`, () => {
    const semUso = cat.montar('estudo', { formato: ['Resumo de uma página'] }, []);
    assert.deepEqual(semUso.perguntas.map((p) => p.id), ['formato']);
    const comUsoAntigo = cat.montar('estudo', { formato: ['Resumo de uma página'], uso: ['Conversa de WhatsApp'] }, []);
    assert.deepEqual(itens(comUsoAntigo.texto), itens(semUso.texto));
  });

  // A regra geral da Mesa põe o Conferir como última seção do PDF. No Estudo o arquivo vai para o cliente.
  test(`${nome} · estudo: o arquivo que vai para o cliente não leva a lista do Conferir`, () => {
    const formato = itens(cat.montar("estudo", { formato: ["Resumo de uma página"] }, []).texto).find((x) => x.includes("formato escolhido"));
    assert.match(formato, /O arquivo é do cliente: o Conferir e o Próximo passo ficam só na conversa, fora do arquivo/);
  });

  // Em ação, o retorno do resumo e a série mensal da mesma ferramenta nem sempre batem (conferido em 18/11/2026:
  // PETR4 52,72% no resumo contra 95,33% na composição dos 12 meses; em índice batem).
  test(`${nome} · estudo: manda conferir o retorno de 12 meses contra a composição dos meses`, () => {
    const pedido = cat.montar('estudo', { formato: ['Resumo de uma página'] }, []).texto;
    assert.ok(pedido.includes('Confira o retorno de 12 meses do resumo contra a composição dos 12 retornos mensais (historicoMensal): se não bater, mostre os dois e marque [CONFERIR]'), 'o pedido não manda conferir o retorno');
  });

  // A regra geral da Mesa põe o Conferir como última seção de todo PDF: em material para o cliente a lista interna ia junto.
  test(`${nome} · juros, fato e gráfico: em arquivo para o cliente, o Conferir e a orientação para o assessor ficam de fora`, () => {
    const regra = 'Em arquivo para o cliente ficam de fora o Conferir, o Próximo passo e o que é orientação para mim (vale no lugar da regra geral do PDF)';
    for (const id of ['macro', 'fato', 'grafico']) assert.ok(itens(cat.montar(id, MATERIAL, []).texto).at(-1).includes(regra), `${id}: falta a regra do arquivo`);
  });

  test(`${nome} · estudo: campo Comparar com, com os quatro índices`, () => {
    assert.deepEqual(campos(cat, 'estudo').at(-1), ['Comparar com', ['IBOV', 'IFIX', 'CDI', 'IPCA'], null]);
  });

  test(`${nome} · Conversa de WhatsApp: juros, fato e gráfico dizem o que não pode faltar na mensagem`, () => {
    const linha = {
      macro: 'Na mensagem não pode faltar: o número de hoje, quanto mudou desde a referência e o que isso mexe para a situação do cliente',
      fato: 'Na mensagem não pode faltar: o que a empresa comunicou, o número principal e o que ainda depende de aprovação',
      grafico: 'Na mensagem não pode faltar: onde o preço está na faixa do período e o nível que o mercado respeitou, com as datas',
    };
    for (const [id, esperado] of Object.entries(linha)) assert.ok(itens(cat.montar(id, { uso: ['Conversa de WhatsApp'] }, []).texto).includes(esperado), `${id}: falta a linha da mensagem`);
    // as tarefas em que o passo 1 não mexe continuam como estão
    assert.ok(!cat.montar('acao', { uso: ['Conversa de WhatsApp'] }, []).texto.includes('Na mensagem não pode faltar'));
  });
}

const skill = (nome) => readFileSync(path.join(RAIZ, 'servidor', 'skills', nome, 'SKILL.md'), 'utf8');
const secaoDaMesa = (nome) => (skill(nome).split(/^## Na Mesa do Assessor \(acrescentado\)$/m)[1] ?? '');

test('as skills de juros, fato relevante e estudo têm a seção "Na Mesa do Assessor"', () => {
  for (const s of ['macro-brasil', 'resumo-de-fato-relevante', 'estudo-de-ativo']) assert.ok(secaoDaMesa(s).trim(), `${s}: sem a seção`);
});

test('a skill de juros avisa que, na Mesa, vale a tabela do pedido e não a regra "sem tabela"', () => {
  assert.match(secaoDaMesa('macro-brasil'), /tabela/i);
});

// No passo 1 o Focus vinha da imprensa (data da publicação). Desde o passo 2 vem do serviço oficial pelo painel_macro,
// com a data da estatística, que é a data do relatório.
test('a skill de juros manda escrever "o mercado espera" com a data do relatório que o painel_macro devolve', () => {
  const s = secaoDaMesa('macro-brasil');
  assert.match(s, /o mercado espera/);
  assert.match(s, /focus\.data/);
});

test('a skill de gráfico não cita mais o campo único "Ativo, período e escala", que deixou de existir', () => {
  assert.ok(!skill('leitura-grafica').includes('Ativo, período e escala'));
});

// A janela corta o pedido antes de enviar e o motor corta de novo ao receber. O painel do Claude Desktop
// tem o seu próprio corte (8.000), que este passo não mexe: fica como pergunta para quem mantém o painel.
test('um comunicado de 20.000 caracteres colado no campo chega inteiro ao Claude pela janela', () => {
  const { cat, arq } = TELAS[0];
  const posicao = cat.montar('fato', MATERIAL, []).campos.findIndex((f) => /comunicado/i.test(f.rotulo));
  const valores = []; valores[posicao] = 'x'.repeat(20000);
  const tamanho = cat.montar('fato', MATERIAL, valores).texto.length;
  assert.ok(corteDaTela(arq) >= tamanho, `a janela corta em ${corteDaTela(arq)} e o pedido tem ${tamanho}`);
  const motor = corteDoMotor(path.join(RAIZ, 'janela', 'motor.mjs'));
  assert.ok(motor >= tamanho, `o motor corta em ${motor} e o pedido tem ${tamanho}`);
});
