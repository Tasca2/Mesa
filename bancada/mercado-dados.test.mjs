// Passo 2 do plano de melhorias (Mercado, os dados): as ferramentas painel_macro e documentos_cvm no servidor, os pedidos
// que mandam usá-las primeiro (as séries oficiais ficam de reserva), os sites liberados na janela e os cortes de texto
// que agora avisam. Sem rede: o que depende de internet está em dados-publicos-rede.test.mjs. Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { carregar, ferramentasDoServidor, corteDaTela } from './catalogo.mjs';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARQ_JANELA = path.join(RAIZ, 'janela', 'mesa-janela.html');
const ARQ_PAINEL = path.join(RAIZ, 'servidor', 'painel-v2.html');
const TELAS = [['janela', ARQ_JANELA], ['painel', ARQ_PAINEL]].map(([nome, arq]) => ({ nome, arq, cat: carregar(arq) }));
const USOS = ['Conversa de WhatsApp', 'Entender a fundo', 'Material para o cliente'];
const pedido = (cat, id, uso = 'Material para o cliente') => cat.montar(id, { uso: [uso], ...(id === 'estudo' ? { formato: ['Resumo de uma página'] } : {}) }, []).texto;
const fonteDe = (texto) => (texto.match(/^Fonte dos dados: (.*)$/m) || [])[1] ?? '';
const antes = (texto, a, b) => texto.indexOf(a) >= 0 && texto.indexOf(b) >= 0 && texto.indexOf(a) < texto.indexOf(b);

test('o servidor da Mesa registra painel_macro e documentos_cvm', () => {
  const nomes = ferramentasDoServidor(path.join(RAIZ, 'servidor', 'server.mjs'));
  for (const n of ['painel_macro', 'documentos_cvm']) assert.ok(nomes.includes(n), `${n} não está registrada`);
});

test('a janela libera a leitura de olinda.bcb.gov.br (Focus e PTAX) e de apisidra.ibge.gov.br', async () => {
  const comum = await import(pathToFileURL(path.join(RAIZ, 'janela', 'comum.mjs')).href);
  for (const d of ['olinda.bcb.gov.br', 'apisidra.ibge.gov.br']) {
    assert.ok(comum.SITES_PERMITIDOS.includes(d), `${d} fora da lista`);
    assert.ok(comum.FERRAMENTAS_WEB.includes(`WebFetch(domain:${d})`), `${d} fora das ferramentas da janela`);
  }
});

for (const { nome, cat } of TELAS) {
  test(`${nome} · juros: a fonte manda chamar painel_macro primeiro; as séries oficiais ficam de reserva`, () => {
    for (const uso of USOS) {
      const f = fonteDe(pedido(cat, 'macro', uso));
      assert.match(f, /^Chame painel_macro com o recorte e a referência que escolhi/);
      for (const bloco of ['indicadores', 'juroReal', 'copom', 'focus', 'agenda', 'lacunas']) assert.ok(f.includes(bloco), `falta o bloco ${bloco}`);
      assert.ok(f.includes('Não refaça as contas'), 'falta a ordem de não refazer as contas');
      assert.ok(f.includes('Onde pesquisar, nesta ordem: painel_macro; de reserva, as séries do SGS por código'), 'a reserva não vem depois da ferramenta');
      assert.ok(f.includes('Com recorte menor que o painel completo, entregue só as linhas e as tabelas do recorte'), 'perdeu a regra do recorte do passo 1');
      assert.ok(f.includes('A data da próxima reunião do Copom só entra com fonte oficial; sem ela, escreva a confirmar'), 'falta a regra da próxima reunião');
      assert.ok(!/busque na web a mediana/i.test(f), 'ainda manda buscar o Focus na web');
    }
  });

  test(`${nome} · fato relevante: a fonte usa documentos_cvm, avisa da base semanal e mantém a regra do texto que não abre`, () => {
    const f = fonteDe(pedido(cat, 'fato'));
    assert.ok(f.startsWith('Se colei o texto ou anexei o PDF, esse é o documento. Se informei só a empresa, chame documentos_cvm'), f.slice(0, 120));
    assert.ok(f.includes('as categorias Fato Relevante e Comunicado ao Mercado'));
    assert.ok(f.includes('baixe pelo protocolo o documento escolhido para ler o texto integral'));
    assert.ok(f.includes('A base da CVM é atualizada uma vez por semana: se o comunicado for de hoje e não estiver na lista, diga isso e me peça o texto, o link ou o PDF'));
    assert.ok(f.includes('Se o texto integral não abrir, não resuma por notícia'), 'perdeu a regra do passo 1');
    assert.ok(antes(f, 'documentos_cvm', 'rad.cvm.gov.br'), 'o Rad da CVM aparece antes da ferramenta');
  });

  test(`${nome} · gráfico: diz o que a série mensal não mede e manda os eventos do período para documentos_cvm`, () => {
    const f = fonteDe(pedido(cat, 'grafico'));
    assert.ok(f.includes('Com retornos mensais (sem preço em reais, máxima, mínima nem volume), monte a base 100 e calcule só o que a série mensal permite'));
    assert.ok(f.includes('Média móvel de dias, IFR de 14 dias, Bandas de Bollinger, volume e níveis em reais pedem série diária: ficam pendentes'));
    assert.ok(f.includes('Proventos e eventos do período: documentos_cvm e RI da empresa'));
    assert.ok(!f.includes('medidas_grafico'), 'cita uma ferramenta que não existe');
  });

  test(`${nome} · estudo: fatos do período por documentos_cvm, juros e inflação por painel_macro`, () => {
    const f = fonteDe(pedido(cat, 'estudo'));
    assert.ok(f.includes('Fatos do período: documentos_cvm. Juros e inflação do período: painel_macro.'));
    assert.ok(f.includes('Número sem fonte não entra no material.'));
    assert.ok(antes(f, 'documentos_cvm', 'rad.cvm.gov.br') && antes(f, 'painel_macro', 'Banco Central e IBGE'), 'a reserva aparece antes da ferramenta');
  });
}

const skill = (nome) => readFileSync(path.join(RAIZ, 'servidor', 'skills', nome, 'SKILL.md'), 'utf8');
const secaoDaMesa = (nome) => skill(nome).split(/^## Na Mesa do Assessor \(acrescentado\)$/m)[1] ?? '';

test('skills: a seção da Mesa manda usar as ferramentas novas e não ensina mais endereço cru', () => {
  const macro = secaoDaMesa('macro-brasil'), fato = secaoDaMesa('resumo-de-fato-relevante'), estudo = secaoDaMesa('estudo-de-ativo');
  assert.match(macro, /Chame `painel_macro` antes de qualquer busca/);
  assert.ok(!macro.includes('dados/ultimos'), 'a skill de juros ainda ensina o endereço cru do SGS');
  assert.ok(!macro.includes('ainda não abre na Mesa'), 'a skill de juros ainda diz que o Focus não abre');
  assert.match(fato, /chame `documentos_cvm` com o nome ou o CNPJ da companhia/);
  assert.match(fato, /A base da CVM é semanal/);
  assert.match(estudo, /Fatos do período: `documentos_cvm`\. Juros e inflação do período: `painel_macro`\./);
});

test('melhorar o pedido pela conversa: o corte passa ao do envio (40.000) e o que for cortado volta avisado', () => {
  const motor = readFileSync(path.join(RAIZ, 'janela', 'motor.mjs'), 'utf8');
  const rota = (motor.match(/case '\/api\/melhorar': \{[\s\S]*?\n {6}\}/) || [])[0] ?? '';
  assert.ok(rota, 'não achei a rota /api/melhorar');
  assert.match(rota, /\.slice\(0, 40000\)/);
  assert.ok(!rota.includes('12000'), 'ainda corta em 12.000');
  assert.match(rota, /cortado: avisos\.length > 0/);
  assert.match(rota, /aviso: avisos\.join/);
  const janela = readFileSync(ARQ_JANELA, 'utf8');
  assert.match(janela, /if \(r\.aviso\) \{ const st = document\.querySelector\("\.estado"\)/, 'a janela não mostra o aviso do /api/melhorar');
});

// Monta a função enviarPedido da tela num contexto falso: o "Claude" só registra o texto que recebeu.
function preparaEnvio(arq) {
  const s = readFileSync(arq, 'utf8').replace(/\r\n/g, '\n');
  const linha = (re) => { const m = s.match(re); assert.ok(m, `não achei ${re} em ${arq}`); return m[0]; };
  const ini = s.indexOf('  async function enviarPedido(t, ps) {'), fim = s.indexOf('\n  }\n', ini);
  assert.ok(ini > 0 && fim > ini, 'não achei enviarPedido');
  const fonte = ['let enviando = false, conectado = true, videoEscolhido = "";', linha(/^ {2}const CORTE_PEDIDO = \d+;$/m), linha(/^ {2}let medirPedido = null, corteAvisado = "";$/m),
    linha(/^ {2}const milhar = .*$/m), linha(/^ {2}const avisoDeCorte = .*$/m), s.slice(ini, fim + 4), 'globalThis.__enviar = enviarPedido;'].join('\n');
  const enviados = [], st = { className: '', textContent: '' };
  const ctx = vm.createContext({
    textoAtual: '', window: {}, tarefasUsuario: [], AREAS: [], estado: { area: null, respostas: {} },
    $: () => st, promptAtual: () => ({ texto: ctx.textoAtual }), instrucao: () => '', acompanhar: () => {}, aplicarHost: () => {}, ehEdicaoVideo: () => false,
    app: { callServerTool: async () => ({}), updateModelContext: async () => {}, sendMessage: async (m) => { enviados.push(m.content[0].text); return {}; }, getHostContext: () => ({ displayMode: 'fullscreen' }), requestDisplayMode: async () => {} },
  });
  new vm.Script(fonte, { filename: arq }).runInContext(ctx);
  return { enviar: () => ctx.__enviar({ id: 'macro', nome: 'Juros' }, []), ctx, enviados, st };
}

for (const [nome, arq, corte, dica] of [['janela', ARQ_JANELA, 40000, /mande o restante depois, na conversa/], ['painel', ARQ_PAINEL, 8000, /clique em Copiar prompt e cole na conversa do Claude/]]) {
  test(`${nome}: pedido acima de ${corte} caracteres não sai cortado no primeiro clique; o aviso diz o tamanho e o segundo clique envia`, async () => {
    assert.equal(corteDaTela(arq), corte);
    const { enviar, ctx, enviados, st } = preparaEnvio(arq);
    ctx.textoAtual = 'a'.repeat(corte + 1234);
    await enviar();
    assert.equal(enviados.length, 0, 'enviou sem avisar');
    assert.equal(st.className, 'estado erro');
    const n = (x) => x.toLocaleString('pt-BR');
    for (const pedaço of [n(corte + 1234), n(corte), n(1234), 'clique de novo']) assert.ok(st.textContent.includes(pedaço), `o aviso não traz "${pedaço}": ${st.textContent}`);
    assert.match(st.textContent, dica);
    await enviar();
    assert.equal(enviados.length, 1, 'o segundo clique não enviou');
    assert.equal(enviados[0].length, corte);
    ctx.textoAtual = 'b'.repeat(corte);
    await enviar();
    assert.equal(enviados.length, 2, 'pedido dentro do corte não foi direto');
    assert.equal(enviados[1].length, corte);
  });

  test(`${nome}: a tela avisa enquanto o pedido passa do corte, antes de enviar`, () => {
    const s = readFileSync(arq, 'utf8').replace(/\r\n/g, '\n');
    const bloco = (s.match(/ {4}const tamanho = el\("p", "ajuda"\);[^\n]*\n {4}const medir = [^\n]*\n {4}medirPedido = medir;/) || [])[0];
    assert.ok(bloco, 'não achei o aviso ao vivo');
    assert.ok(s.includes('    meio.append(det, acoes, tamanho); medir();'), 'o aviso não entra na tela');
    assert.match(s, /function agendarRascunho\(\) \{\n {4}medirPedido\?\.\(\);/, 'o aviso não é refeito quando o texto muda');
    const linha = (re) => s.match(re)[0];
    const ctx = vm.createContext({ el: () => ({ hidden: false, style: {}, textContent: '', setAttribute() {} }), area: { value: 'c'.repeat(corte + 10) } });
    new vm.Script([linha(/^ {2}const CORTE_PEDIDO = \d+;$/m), 'let medirPedido = null;', linha(/^ {2}const milhar = .*$/m), linha(/^ {2}const avisoDeCorte = .*$/m), bloco, 'medir(); globalThis.__r = tamanho;'].join('\n')).runInContext(ctx);
    assert.equal(ctx.__r.hidden, false);
    assert.ok(ctx.__r.textContent.includes((corte + 10).toLocaleString('pt-BR')));
    ctx.area.value = 'c'.repeat(corte);
    new vm.Script('medirPedido(); globalThis.__r2 = tamanho.hidden;').runInContext(ctx);
    assert.equal(ctx.__r2, true, 'o aviso não some quando o pedido volta a caber');
  });
}

test('a bancada lê o corte da tela nas duas formas: a constante nova e o número escrito no corte (versões anteriores)', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'mesa-corte-'));
  try {
    const velho = path.join(dir, 'velho.html'), novo = path.join(dir, 'novo.html');
    writeFileSync(velho, 'const st = $(".estado"); const texto = (promptAtual(t, ps).texto || "").trim().slice(0, 8000);');
    writeFileSync(novo, '  const CORTE_PEDIDO = 40000;\n');
    assert.equal(corteDaTela(velho), 8000);
    assert.equal(corteDaTela(novo), 40000);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
