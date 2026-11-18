// Passo 3 do plano de melhorias (Rotinas): cada momento do atendimento tem uma tarefa dona, nas duas telas.
// Sai "Roteiro de reunião" e o "Post do mercado de hoje" que estava esquecido no código; 7 tarefas mudam de
// nome, de linha, de pergunta ou de item. O histórico e os ajustes antigos que citam uma tarefa que saiu
// continuam funcionando. Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { carregar } from './catalogo.mjs';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVIDOR = path.join(RAIZ, 'servidor');
const TELAS = [['janela', path.join(RAIZ, 'janela', 'mesa-janela.html')], ['painel', path.join(SERVIDOR, 'painel-v2.html')]]
  .map(([nome, arq]) => ({ nome, arq, cat: carregar(arq) }));
const SAIRAM = { 'roteiro-reuniao': 'Roteiro de reunião', 'post-mercado': 'Post do mercado de hoje' };

// Seção 6.4 do plano: os grupos e as 20 tarefas de Rotinas, nesta ordem.
const MENU_ROTINAS = [
  ['Antes da reunião', ['Cliente novo', 'Primeira reunião', 'Segunda reunião', 'Pré-reunião (cliente atual)']],
  ['Depois da reunião', ['Pós-reunião']],
  ['Carteira', ['Revisão de carteira', 'Comparador de carteira']],
  ['Cliente', ['Diagnóstico financeiro', 'Relatório mensal ao cliente', 'Proposta de assessoria (documento)', 'Follow-up da proposta']],
  ['Relacionamento', ['Ritmo e indicação', 'Explicar ao cliente', 'Conversa sobre sucessão']],
  ['Prospecção', ['Primeira mensagem', 'Ligação de primeiro contato', 'Sequência para lead novo', 'Pitch e e-mail', 'Objeção do cliente', 'Retomar lead parado']],
];

// Itens da lista "O que preciso receber" de um pedido montado.
const itens = (texto) => {
  const linhas = texto.split('\n'), r = [];
  for (let k = linhas.indexOf('O que preciso receber:') + 1; k > 0 && k < linhas.length && linhas[k].startsWith('- '); k++) r.push(linhas[k].slice(2));
  return r;
};
const ids = (m) => m.perguntas.map((p) => p.id);

// ---------------------------------------------------------------------------------------------------------
// A tela de verdade sem navegador: o catálogo inteiro e as funções que reabrem o histórico, a tela inicial e
// os ajustes, rodando sobre um documento de mentira que só guarda os nós que a tela cria.
const TOPO = /^ {2}\S/, FECHO = /^ {2}[\]})]/;
function trecho(linhas, inicio) { // mesma regra de bancada/catalogo.mjs: uma declaração de topo da tela
  const i = linhas.findIndex((l) => l.startsWith('  ' + inicio));
  if (i < 0) return '';
  let j = i + 1;
  for (; j < linhas.length; j++) {
    const l = linhas[j];
    if (!l.trim()) {
      let k = j + 1; while (k < linhas.length && !linhas[k].trim()) k++;
      if (k >= linhas.length || (TOPO.test(linhas[k]) && !FECHO.test(linhas[k]))) break;
      continue;
    }
    if (FECHO.test(l)) { j++; break; }
    if (TOPO.test(l)) break;
  }
  return linhas.slice(i, j).join('\n');
}
const todos = (n) => [n, ...n.filhos.flatMap(todos)];
const visiveis = (n) => (n.hidden ? [] : [n, ...n.filhos.flatMap(visiveis)]);
const casa = (n, s) => (s[0] === '.' ? n.classList.contains(s.slice(1)) : s[0] === '#' ? n.id === s.slice(1) : n.tag === s);
class No {
  constructor(tag) {
    this.tag = tag; this.filhos = []; this.pai = null; this.className = ''; this.html = ''; this.id = ''; this.dataset = {}; this.hidden = false;
    this.style = { cssText: '', setProperty() {} };
    const cls = () => new Set(this.className.split(/\s+/).filter(Boolean));
    const por = (s) => { this.className = [...s].join(' '); };
    this.classList = {
      add: (...c) => { const s = cls(); c.forEach((x) => s.add(x)); por(s); },
      remove: (...c) => { const s = cls(); c.forEach((x) => s.delete(x)); por(s); },
      toggle: (c, f) => { const s = cls(), on = f ?? !s.has(c); if (on) s.add(c); else s.delete(c); por(s); return on; },
      contains: (c) => cls().has(c),
    };
  }
  set innerHTML(h) { this.html = String(h); this.filhos = []; }
  get innerHTML() { return this.html; }
  set textContent(t) { this.html = String(t); this.filhos = []; }
  get textContent() { return todos(this).map((n) => n.html.replace(/<[^>]*>/g, '')).filter(Boolean).join(' '); }
  append(...n) { for (const x of n) { const f = typeof x === 'string' ? Object.assign(new No('#texto'), { html: x }) : x; f.pai = this; this.filhos.push(f); } }
  prepend(...n) { for (const x of n) x.pai = this; this.filhos.unshift(...n); }
  replaceChildren(...n) { this.filhos = []; this.html = ''; this.append(...n); }
  get childElementCount() { return this.filhos.length; }
  querySelectorAll(s) { return todos(this).slice(1).filter((n) => casa(n, s)); }
  querySelector(s) { return this.querySelectorAll(s)[0] ?? null; }
  remove() { if (this.pai) this.pai.filhos = this.pai.filhos.filter((x) => x !== this); this.pai = null; }
  setAttribute() {} addEventListener() {} focus() {} blur() {} select() {} setSelectionRange() {}
  getBoundingClientRect() { return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }; }
}

// Também a tela do pedido (telaFim) de verdade, com o que ela usa: pedido montado, modelo salvo e rascunho.
const DA_TELA = ['const $ = ', 'const el = ', 'const esc = ', 'const estado = ', 'let ultimaChaveTela', 'const GLIFOS', 'function porta', 'function trilho',
  'let videoEscolhido', 'function ir(', 'function render()', 'let editandoPerfil', 'const ATUACOES', 'const CANAIS', 'function linhasVoz', 'function telaInicio',
  'function dossie', 'function telaFim', 'function telaAcompanhar', 'let andamento = null', 'const skillsDe', 'const ehEdicaoVideo', 'const pedidoEdicaoVideo',
  'function montarPedido', 'const quando = ', 'function abrirDoHistorico', 'function telaHistorico', 'let promptEdit', 'let rascunhoTimer', 'const CORTE_PEDIDO',
  'let medirPedido', 'const milhar', 'const avisoDeCorte', 'function agendarRascunho', 'function descartarRascunho', 'function restaurarRascunho',
  'const aplicarModelo', 'const promptAtual', 'const registrar', 'async function copiarTexto', 'async function botaoCopiar', 'let app = null'];
const PRELUDIO = 'const __avisos = [], __chamadas = []; function avisar(t) { __avisos.push(String(t)); } function telaLista() {} function telaGuia() {} ' +
  'function faixaCaptaMais() { return el("div"); } function linhaPerfil() { return el("div"); } function cartaoPerfil() { return el("div"); } function cartaoEditarPerfil() { return el("div"); }';
const EPILOGO = `
;globalThis.__tela = {
  abrirDoHistorico: (r) => abrirDoHistorico(r),
  render: () => render(),
  estado: () => JSON.stringify(estado),
  contexto: () => JSON.stringify(window.__mesaContexto()),
  validarTarefa: (sp) => JSON.stringify(validarTarefa(sp)),
  carregarTarefasUsuario: (b) => carregarTarefasUsuario(b),
  minhas: () => JSON.stringify((AREAS.find((a) => a.id === "rotinas").grupos.find((g) => g.nome === "Minhas tarefas")?.tarefas ?? []).map((id) => T[id].nome)),
  tem: (id) => id in T,
  editar: async (sp) => JSON.stringify(await window.__mesaTarefas.editar(sp)),
  carregarAjustes: (b) => carregarAjustes(b),
  ajustes: () => JSON.stringify(ajustes),
  restaurarRascunho: (r) => { perfil = { rascunho: JSON.stringify(r) }; return restaurarRascunho(false); },
  chaves: () => JSON.stringify({ ONDE_PESQUISAR: Object.keys(ONDE_PESQUISAR), NA_MENSAGEM: Object.keys(NA_MENSAGEM) }),
  inicio: (p) => { perfil = p; conectado = true; const v = el("div"); telaInicio(v); return v; },
  // Mesa ligada a um servidor de mentira que guarda o perfil como o mesa_perfil de verdade (modelo, ajustes, rascunho).
  ligar: (p) => { perfil = p; conectado = true; app = { callServerTool: async (c) => {
    __chamadas.push(JSON.parse(JSON.stringify(c))); const a = c.arguments || {};
    if (a.modelo) { perfil.modelos = perfil.modelos || {}; if (a.modelo.texto === null) delete perfil.modelos[a.modelo.tarefa]; else perfil.modelos[a.modelo.tarefa] = a.modelo.texto; }
    if (a.ajustes !== undefined) perfil.ajustes = a.ajustes;
    if (a.rascunho !== undefined) perfil.rascunho = a.rascunho;
    return { structuredContent: { perfil } }; } }; },
  abrir: (tarefa, respostas, campos) => { const a = AREAS.find((x) => x.grupos.some((g) => g.tarefas.includes(tarefa))); ir("fim", { area: a.id, tarefa, passo: 0, respostas: respostas || {}, campos: campos || {} }); },
  zerarPedido: () => { promptEdit = { base: "", texto: "" }; },
  restaurar: (p, auto) => { perfil = p; return restaurarRascunho(auto); },
  restaurarAjuste: async (ref) => JSON.stringify(await window.__mesaTarefas.restaurar(ref)),
  perfil: () => JSON.stringify(perfil),
  pedidoAtual: () => JSON.stringify(promptEdit),
  avisos: () => JSON.stringify(__avisos),
  chamadas: () => JSON.stringify(__chamadas),
  compat: () => JSON.stringify({ NOMES_ANTIGOS, SAIRAM_DO_MENU, TEXTO_ANTIGO }),
  formatos: () => JSON.stringify({ desde113: CAMPOS_MUDARAM_DESDE_113, tarefas: Object.fromEntries(Object.keys(T).map((id) => [id, formatoDe(id)])) }),
};`;

function telaDe(arquivo, { status, imediato } = {}) {
  const linhas = readFileSync(arquivo, 'utf8').split('\n');
  const ini = linhas.findIndex((l) => /^ {2}const AREAS = /.test(l));
  const fim = linhas.findIndex((l, i) => i > ini && l.startsWith('  const $ = (s) => document.querySelector(s);'));
  const depois = linhas.slice(fim);
  const fonte = [PRELUDIO, linhas.slice(ini, fim).join('\n'), ...DA_TELA.map((d) => trecho(depois, d)), EPILOGO].join('\n');
  const alertas = [], fixar = { n: 0 };
  const nos = { '#tela': new No('main'), '#voltar': new No('button'), '#trilho': new No('nav') };
  const documento = { body: new No('body'), createElement: (tag) => new No(tag), createTextNode: (x) => Object.assign(new No('#texto'), { html: String(x) }),
    querySelector: (s) => nos[s] ?? nos['#tela'].querySelector(s), getElementById: (id) => nos['#' + id] ?? null, addEventListener() {} };
  const janela = { __mesaHistorico: { fixar: () => { fixar.n++; } }, ...(status ? { __mesaStatus: () => ({ estado: status }) } : {}) };
  // imediato: o rascunho é gravado na hora, sem esperar os 800 ms da tela
  const ctx = vm.createContext({ window: janela, document: documento, alert: (m) => alertas.push(String(m)), console, setInterval, clearInterval,
    setTimeout: imediato ? (fn) => { fn(); return 0; } : setTimeout, clearTimeout });
  new vm.Script(fonte, { filename: arquivo }).runInContext(ctx, { timeout: 5000 });
  const t = ctx.__tela;
  const naTela = () => visiveis(nos['#tela']);
  const botao = (rotulo) => naTela().find((n) => n.tag === 'button' && n.html === rotulo);
  return {
    ligar: (p) => t.ligar(p), abrir: (id, r, c) => t.abrir(id, r, c), zerarPedido: () => t.zerarPedido(),
    restaurar: (p, auto) => t.restaurar(p, auto), restaurarAjuste: async (ref) => JSON.parse(await t.restaurarAjuste(ref)),
    perfil: () => JSON.parse(t.perfil()), pedidoAtual: () => JSON.parse(t.pedidoAtual()), avisos: () => JSON.parse(t.avisos()),
    chamadas: () => JSON.parse(t.chamadas()), compat: () => JSON.parse(t.compat()), formatos: () => JSON.parse(t.formatos()),
    // a caixa do pedido, o que está à vista (sem o que está escondido) e os botões e campos da tela
    pedido: () => naTela().find((n) => n.tag === 'textarea' && n.className === 'prompt')?.value,
    visivel: () => naTela().map((n) => n.html.replace(/<[^>]*>/g, '')).filter(Boolean).join(' '),
    temBotao: (rotulo) => !!botao(rotulo),
    clicar: async (rotulo) => { const b = botao(rotulo); assert.ok(b, `não achei o botão «${rotulo}» na tela`); await b.onclick(); },
    digitar: (texto) => { const a = naTela().find((n) => n.tag === 'textarea' && n.className === 'prompt'); a.value = texto; a.oninput(); },
    preencher: (i, valor) => { const c = naTela().find((n) => n.id === 'cp' + i); c.value = valor; c.oninput(); },
    abrirDoHistorico: (r) => t.abrirDoHistorico(r), render: () => t.render(),
    estado: () => JSON.parse(t.estado()), contexto: () => JSON.parse(t.contexto()),
    validarTarefa: (sp) => JSON.parse(t.validarTarefa(sp)), carregarTarefasUsuario: (b) => t.carregarTarefasUsuario(b),
    minhas: () => JSON.parse(t.minhas()), tem: (id) => t.tem(id), editar: async (sp) => JSON.parse(await t.editar(sp)),
    carregarAjustes: (b) => t.carregarAjustes(b), ajustes: () => JSON.parse(t.ajustes()), restaurarRascunho: (r) => t.restaurarRascunho(r),
    chaves: () => JSON.parse(t.chaves()),
    sugestoes: (p) => todos(t.inicio(p)).filter((n) => n.tag === 'button' && n.className === 'fantasma').map((n) => n.html),
    alertas: () => [...alertas], fixou: () => fixar.n,
    tela: () => ({ temConversa: !!nos['#tela'].querySelector('.dossie'), texto: nos['#tela'].textContent, trilho: nos['#trilho'].textContent }),
  };
}
const HISTORICO_ROTEIRO = { ok: true, tarefa: 'roteiro-reuniao', area: 'rotinas', nome: 'Roteiro de reunião', em: Date.parse('2026-11-10T14:00:00-03:00') };
const ONDE_ESTA_O_ROTEIRO = 'A tarefa «Roteiro de reunião» saiu do menu da Mesa. O que ela fazia está em Primeira reunião, Segunda reunião e Pré-reunião (cliente atual).';

// ---------------------------------------------------------------------------------------------------------
for (const { nome, arq, cat } of TELAS) {
  test(`${nome} · menu de Rotinas: os 6 grupos e as 20 tarefas da seção 6.4, nesta ordem`, () => {
    const { T } = cat.retrato();
    const grupos = [];
    for (const x of cat.tarefasDoMenu().filter((y) => y.area === 'rotinas')) {
      let g = grupos.find(([n]) => n === x.grupo);
      if (!g) grupos.push(g = [x.grupo, []]);
      g[1].push(T[x.id].nome);
    }
    assert.deepEqual(grupos, MENU_ROTINAS);
    assert.equal(grupos.flatMap(([, l]) => l).length, 20);
  });

  test(`${nome} · Roteiro de reunião e Post do mercado de hoje saíram do menu e do catálogo`, () => {
    const c = cat.retrato(), chaves = telaDe(arq).chaves();
    const noMenu = cat.tarefasDoMenu().map((x) => x.id), nomes = Object.values(c.T).map((t) => t.nome);
    for (const [id, nomeAntigo] of Object.entries(SAIRAM)) {
      assert.ok(!noMenu.includes(id), `${id} ainda está no menu`);
      for (const k of ['T', 'PEDIDO', 'CAMPOS']) assert.ok(!(id in c[k]), `${id} ainda está em ${k}`);
      for (const k of ['ONDE_PESQUISAR', 'NA_MENSAGEM']) assert.ok(!chaves[k].includes(id), `${id} ainda está em ${k}`);
      assert.ok(!c.PDF_OK.includes(id), `${id} ainda está em PDF_OK`);
      assert.ok(!nomes.includes(nomeAntigo), `ainda há uma tarefa chamada ${nomeAntigo}`);
    }
  });

  test(`${nome} · Juros, inflação e câmbio tem o item do post do dia, que faz o papel do Post do mercado de hoje`, () => {
    for (const uso of ['Material para o cliente', 'Entender a fundo']) {
      const l = itens(cat.montar('macro', { uso: [uso] }, []).texto);
      assert.ok(l.some((x) => x.includes('o post do dia a partir do dado principal, com mesa_carrossel')), `${uso}: falta o item do post do dia`);
    }
  });

  test(`${nome} · Cliente novo: o item 5 vira uma linha que aponta para Primeira reunião`, () => {
    const l = itens(cat.montar('cliente-novo', {}, []).texto);
    assert.equal(l.length, 5);
    assert.equal(l[4], 'Se ainda não houve a primeira conversa: diga em uma linha que a tarefa Primeira reunião monta o roteiro e a apresentação com esta ficha');
    assert.ok(!l.some((x) => /roteiro da primeira reunião/i.test(x)));
  });

  test(`${nome} · Revisão de carteira: sem a pergunta "Comparar a carteira com quê?"; a referência é a política do cliente`, () => {
    const m = cat.montar('carteira', { resultado: ['Texto no chat'] }, []);
    assert.deepEqual(ids(m), ['resultado']);
    assert.equal(m.campos[1].rotulo, 'Política de investimento do cliente, com as bandas de tolerância');
    assert.match(m.texto, /^Objetivo: Ver onde a carteira se afasta da política de investimento do cliente/m);
    assert.doesNotMatch(m.texto, /carteira modelo|referência escolhida|Comparar com/i);
    // uma resposta antiga, guardada num rascunho, não muda mais o pedido
    assert.equal(cat.montar('carteira', { resultado: ['Texto no chat'], base: ['Carteira modelo do escritório'] }, []).texto, m.texto);
  });

  test(`${nome} · Primeira mensagem: nome novo e só os canais WhatsApp e E-mail`, () => {
    const m = cat.montar('abordagem', {}, []);
    assert.equal(m.nome, 'Primeira mensagem');
    assert.deepEqual(m.perguntas.find((p) => p.id === 'canal').opcoes, ['WhatsApp', 'E-mail']);
    assert.match(m.texto, /^\[Mesa\] Rotinas do dia › Primeira mensagem$/m);
    assert.match(m.texto, /^Objetivo: Preparar a primeira mensagem para um contato novo/m);
  });

  for (const [id, novo, ficam] of [['ligacao', 'Ligação de primeiro contato', ['tempo', 'perfil']], ['sequencia', 'Sequência para lead novo', ['perfil']]]) {
    test(`${nome} · ${novo}: nome novo, sem a pergunta de etapa, e o pedido diz que é lead novo`, () => {
      const m = cat.montar(id, {}, []);
      assert.equal(m.nome, novo);
      assert.deepEqual(ids(m), ficam);
      assert.doesNotMatch(m.texto, /etapa|Retomada|Depois da reunião|Depois da proposta/i);
      assert.match(m.texto, /^Objetivo: .*lead novo/m);
      assert.equal(cat.montar(id, { etapa: ['Retomada'] }, []).texto, m.texto);
    });
  }

  test(`${nome} · Sequência para lead novo: o exemplo do campo é de quem ainda não conversou`, () => {
    assert.match(cat.retrato().CAMPOS.sequencia[0].dica, /ainda não conversamos/);
  });

  test(`${nome} · Follow-up da proposta: ganha a ligação de 60 segundos no lugar do segundo toque`, () => {
    assert.deepEqual(itens(cat.montar('followup', {}, []).texto), [
      'Três toques de follow-up (dia 2, dia 5 e dia 10), cada um em peça de WhatsApp separada',
      'Roteiro de ligação de 60 segundos para usar no lugar do segundo toque, em peça separada',
      'E-mail de fechamento de ciclo, em peça separada',
      'Quando parar e o que registrar no CRM',
    ]);
  });

  test(`${nome} · Segunda reunião: linha nova`, () => {
    const t = cat.retrato().T['segunda-reuniao'];
    assert.deepEqual([t.nome, t.linha], ['Segunda reunião', 'Devolutiva e material da reunião de decisão.']);
  });

  test(`${nome} · Proposta de assessoria (documento): nome e linha novos`, () => {
    const t = cat.retrato().T.proposta;
    assert.deepEqual([t.nome, t.linha], ['Proposta de assessoria (documento)', 'O documento escrito do serviço, para enviar depois da reunião.']);
  });

  test(`${nome} · Pré-reunião (cliente atual): nome e linha novos`, () => {
    const t = cat.retrato().T['pre-reuniao'];
    assert.deepEqual([t.nome, t.linha], ['Pré-reunião (cliente atual)', 'Para reunião com quem já é cliente: roteiro, pontos de atenção e perguntas.']);
  });

  // Histórico: a janela guarda cada conversa com o id da tarefa (janela/motor.mjs, arquivar) e, ao reabrir, a tela
  // precisa achar a tarefa. Sem ela, a 1.13 avisava e ia para o início, onde a conversa não aparece.
  test(`${nome} · histórico: a conversa salva de Roteiro de reunião abre com o texto ao lado e diz onde a tarefa foi parar`, () => {
    const t = telaDe(arq, { status: 'pronto' });
    t.abrirDoHistorico(HISTORICO_ROTEIRO);
    assert.deepEqual(t.alertas(), []);
    assert.equal(t.fixou(), 1);
    const e = t.estado();
    assert.deepEqual([e.tela, e.area, e.tarefa, e.historico?.nome], ['acompanhar', 'rotinas', 'roteiro-reuniao', 'Roteiro de reunião']);
    const tela = t.tela();
    assert.ok(tela.temConversa, 'sem a coluna onde a conversa se encaixa, o texto salvo não aparece');
    for (const x of ['Do histórico', 'Roteiro de reunião', 'O resultado desta rotina está na conversa ao lado', ONDE_ESTA_O_ROTEIRO]) assert.ok(tela.texto.includes(x), `falta «${x}»`);
    assert.match(tela.trilho, /Rotinas do dia.*Roteiro de reunião/);
  });

  test(`${nome} · histórico: sem o aviso de andamento (painel) e com o Claude trabalhando, a tela continua a do histórico`, () => {
    for (const status of [undefined, 'pensando']) {
      const t = telaDe(arq, { status });
      t.abrirDoHistorico(HISTORICO_ROTEIRO);
      t.render();
      assert.ok(t.tela().texto.includes(ONDE_ESTA_O_ROTEIRO), `status ${status}: a tela do histórico não ficou`);
      assert.equal(t.contexto().tarefa, 'Roteiro de reunião', 'o nome salvo some do contexto e da conversa guardada de novo');
    }
  });

  test(`${nome} · histórico: tarefa que continua no menu abre como antes`, () => {
    const t = telaDe(arq, { status: 'pronto' });
    t.abrirDoHistorico({ ok: true, tarefa: 'primeira-reuniao', area: 'rotinas', nome: 'Primeira reunião', em: HISTORICO_ROTEIRO.em });
    const tela = t.tela();
    assert.ok(tela.temConversa);
    assert.ok(tela.texto.includes('Primeira reunião') && tela.texto.includes('Do histórico'));
    assert.ok(!tela.texto.includes('saiu do menu'));
    assert.deepEqual(t.alertas(), []);
  });

  test(`${nome} · tarefa própria criada com o id ou o nome de uma tarefa que saiu ganha id próprio e vai para Minhas tarefas`, () => {
    const t = telaDe(arq);
    const r = t.validarTarefa({ id: 'roteiro-reuniao', area: 'rotinas', nome: 'Roteiro de reunião', linha: 'Minha versão.', entrega: ['Roteiro minuto a minuto'] });
    assert.match(r.ok?.id ?? '', /^u-roteiro-de-reuniao-/);
    t.carregarTarefasUsuario(JSON.stringify([{ ...r.ok, id: 'roteiro-reuniao' }]));
    assert.equal(t.tem('roteiro-reuniao'), false);
    assert.deepEqual(t.minhas(), ['Roteiro de reunião']);
  });

  test(`${nome} · ajuste pedido no chat para uma tarefa que saiu responde para onde ela foi, sem quebrar`, async () => {
    const t = telaDe(arq);
    for (const ref of ['roteiro-reuniao', 'Roteiro de reunião']) {
      const r = await t.editar({ tarefa: ref, regras: ['Sempre em 30 minutos'] });
      assert.deepEqual(r, { ok: false, motivo: ONDE_ESTA_O_ROTEIRO });
    }
    const p = await t.editar({ tarefa: 'Post do mercado de hoje', regras: ['Só juros'] });
    assert.deepEqual(p, { ok: false, motivo: 'A tarefa «Post do mercado de hoje» saiu do menu da Mesa. O que ela fazia está em Juros, inflação e câmbio.' });
    assert.match((await t.editar({ tarefa: 'Tarefa que nunca existiu', regras: ['x'] })).motivo, /^Não achei essa tarefa/);
  });

  test(`${nome} · ajuste sem nome de tarefa, com a conversa de Roteiro de reunião aberta do histórico, diz para onde ela foi`, async () => {
    const t = telaDe(arq, { status: 'pronto' });
    t.abrirDoHistorico(HISTORICO_ROTEIRO);
    assert.deepEqual(await t.editar({ tarefa: '', regras: ['Sempre em 30 minutos'] }), { ok: false, motivo: ONDE_ESTA_O_ROTEIRO });
  });

  test(`${nome} · regras pessoais e rascunho guardados de uma tarefa que saiu não quebram a Mesa`, () => {
    const t = telaDe(arq);
    t.carregarAjustes(JSON.stringify({ tarefas: { 'roteiro-reuniao': { regras: ['Sempre em 30 minutos'] }, 'pre-reuniao': { regras: ['Levar o extrato'] } } }));
    assert.deepEqual(Object.keys(t.ajustes().tarefas), ['pre-reuniao']);
    const rascunho = { v: 1, em: Date.now(), estado: { tela: 'guia', area: 'rotinas', tarefa: 'roteiro-reuniao', passo: 0, respostas: {}, campos: {} } };
    assert.equal(t.restaurarRascunho(rascunho), false);
  });
}

test('as tarefas que saíram são as mesmas nas duas telas, com a mesma indicação de para onde foram', async () => {
  const [a, b] = TELAS.map(({ arq }) => telaDe(arq));
  for (const ref of Object.keys(SAIRAM)) {
    const ra = await a.editar({ tarefa: ref, regras: ['x'] });
    assert.deepEqual(ra, await b.editar({ tarefa: ref, regras: ['x'] }));
    // iguais e certas: as duas telas dizendo "Não achei" também seriam iguais
    assert.match(ra.motivo ?? '', new RegExp(`^A tarefa «${SAIRAM[ref]}» saiu do menu da Mesa\\. O que ela fazia está em .+\\.$`));
  }
});

test('janela · tela inicial: a sugestão de primeira vez usa o nome atual da tarefa de ligação', () => {
  assert.deepEqual(telaDe(TELAS[0].arq).sugestoes({ atuacao: 'Assessor de investimento', historico: [] }), ['Retomar lead parado', 'Objeção do cliente', 'Ligação de primeiro contato']);
});

// O texto que o Claude recebe ao abrir o painel (servidor/server.mjs, AREAS).
const areasDoServidor = () => {
  const m = readFileSync(path.join(SERVIDOR, 'server.mjs'), 'utf8').match(/const AREAS = ((?:\s*'(?:[^'\\]|\\.)*'\s*\+?)+);/);
  return vm.runInNewContext(m[1]);
};

test('o texto das áreas que o Claude recebe lista as 20 tarefas de Rotinas com os nomes novos', () => {
  const texto = areasDoServidor().toLowerCase(), rotinas = texto.split('; mercado hoje')[0];
  for (const n of MENU_ROTINAS.flatMap(([, l]) => l)) assert.ok(rotinas.includes(n.toLowerCase()), `falta ${n}`);
  for (const velho of ['roteiro de reunião', 'primeira abordagem', 'roteiro de ligação', 'sequência de whatsapp', 'post do mercado']) assert.ok(!texto.includes(velho), `ainda cita ${velho}`);
});

test('abrir_painel chamado com uma tarefa que saiu do menu abre o painel na área pedida, sem erro', async () => {
  const pasta = mkdtempSync(path.join(os.tmpdir(), 'mesa-passo3-'));
  const req = createRequire(path.join(SERVIDOR, 'package.json'));
  const imp = (p) => import(pathToFileURL(req.resolve(p)).href);
  const { Client } = await imp('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await imp('@modelcontextprotocol/sdk/client/stdio.js');
  const c = new Client({ name: 'bancada-passo-3', version: '1.0.0' }, { capabilities: {} });
  await c.connect(new StdioClientTransport({
    command: process.execPath, args: [path.join(SERVIDOR, 'server.mjs')], stderr: 'ignore',
    env: { ...process.env, METODO_SKILLS: path.join(SERVIDOR, 'skills'), ROTINAS_SKILLS: path.join(SERVIDOR, 'rotinas'), MESA_BASE: path.join(SERVIDOR, 'base-assessor.md'),
      MESA_PERFIL_DIR: path.join(pasta, 'perfil'), MESA_ANDAMENTO: path.join(pasta, 'andamento.json'), MESA_TAREFA: path.join(pasta, 'tarefa.json'), MESA_COFRE: path.join(pasta, 'cofre'), CAPTAMAIS_MARKET_KEY: '' },
  }));
  try {
    const r = await c.callTool({ name: 'abrir_painel', arguments: { area: 'rotinas', tarefa: 'roteiro-reuniao' } });
    assert.ok(!r.isError, JSON.stringify(r.content));
    assert.equal(r.structuredContent?.areaInicial, 'rotinas');
    assert.ok(r.content[0].text.includes(areasDoServidor()), 'o painel não devolveu o texto das áreas');
    assert.ok(r.content[0].text.toLowerCase().includes('ligação de primeiro contato'));
  } finally {
    await c.close();
    rmSync(pasta, { recursive: true, force: true });
  }
});

// Skills e rotinas que diziam o contrário do catálogo novo.
const skill = (pasta, nome) => readFileSync(path.join(SERVIDOR, pasta, nome, 'SKILL.md'), 'utf8');
const secao = (texto, titulo) => (texto.split(new RegExp(`^## ${titulo}.*$`, 'm'))[1] ?? '').split(/^## /m)[0];

test('skill da Primeira mensagem: na Mesa a peça é só mensagem; a ligação é a tarefa Ligação de primeiro contato', () => {
  const s = skill('skills', 'prospeccao-abordagem'), mesa = secao(s, 'Modelo de saída na Mesa');
  assert.ok(mesa.trim(), 'sem a seção "Modelo de saída na Mesa"');
  assert.doesNotMatch(mesa, /`roteiro-ligacao`/);
  assert.match(mesa, /Ligação de primeiro contato/);
  assert.match(s, /Sequência para lead novo/);
});

test('skill de roteiros: na Mesa, ligação e sequência são para lead novo e cada outro momento tem a sua tarefa', () => {
  const s = secao(skill('skills', 'roteiro-comercial'), 'Na Mesa do Assessor \\(acrescentado\\)');
  for (const x of ['Ligação de primeiro contato', 'Sequência para lead novo', 'lead novo', 'Retomar lead parado', 'Pós-reunião', 'Follow-up da proposta', 'Primeira reunião', 'Segunda reunião', 'Pré-reunião (cliente atual)']) assert.ok(s.includes(x), `falta ${x}`);
});

test('rotina de cliente novo: não monta mais o roteiro da primeira reunião e aponta a tarefa Primeira reunião', () => {
  const s = skill('rotinas', 'prospect-intake');
  assert.doesNotMatch(s, /`roteiro-reuniao`|monte o roteiro da primeira reunião|e o roteiro da primeira reunião/i);
  assert.match(s, /tarefa Primeira reunião monta o roteiro e a apresentação/);
});

test('rotina de revisão de carteira: a referência é sempre a política do cliente; a carteira modelo é o Comparador', () => {
  const s = skill('rotinas', 'portfolio-rebalance-review');
  assert.doesNotMatch(s, /política do cliente ou carteira modelo|política ou o modelo|ou à carteira modelo/);
  assert.match(s, /inclusive a carteira modelo do escritório\? Isso é a tarefa Comparador de carteira/);
});

// Correção depois da revisão (18/11): a tarefa agora é para quem já é cliente. Pedido enviado antes de colar os dados não
// pode virar só uma lista: o Claude entrega o que dá, marca o que falta e pede o resto, sem inventar.
test('rotina de pré-reunião: sem os dados do cliente, entrega o que dá, marca o que falta e pede o resto, sem inventar', () => {
  const s = skill('rotinas', 'pre-meeting');
  const regra = s.split('\n').find((l) => l.startsWith('**Dado que não veio**')) ?? '';
  assert.match(regra, /não invente/);
  assert.match(regra, /[Ee]ntregue o que dá para montar/);
  assert.match(regra, /`\[CONFERIR\]`/);
  assert.match(regra, /peça em uma frase/);
  assert.match(regra, /ainda não é cliente[^.]*tarefa Primeira reunião monta o roteiro e a apresentação/);
  assert.doesNotMatch(s, /Cliente sem nenhum dado = primeira reunião|entregue só a lista|entregue o roteiro de descoberta/);
});

// ---------------------------------------------------------------------------------------------------------
// Correções depois da revisão do passo 3 (18/11): regras guardadas de tarefa que saiu, nomes antigos, modelos e
// rascunhos feitos com o texto da 1.13, histórico sem área, skill do Follow-up e modo /mesa chat.

const PERFIL = { nome: 'Assessor Teste', atuacao: 'Assessor de investimento', escritorio: 'Escritório Teste' };
const MEU = '\nLembrete meu: citar a última conversa.'; // o que o assessor escreveu à mão no modelo ou no rascunho
// Nome na 1.13, código (que não mudou) e nome de hoje.
const RENOMEADAS = [['Primeira abordagem', 'abordagem', 'Primeira mensagem'], ['Roteiro de ligação', 'ligacao', 'Ligação de primeiro contato'],
  ['Sequência de WhatsApp', 'sequencia', 'Sequência para lead novo'], ['Proposta de assessoria', 'proposta', 'Proposta de assessoria (documento)'],
  ['Pré-reunião', 'pre-reuniao', 'Pré-reunião (cliente atual)']];
// Linha do pedido de hoje e como ela era na 1.13 (conferido nos pedidos montados antes × depois do passo 3: antes-depois/bruto/passo3-*).
const OBJETIVO = /^Objetivo: .*$/m;
const NA_113 = {
  'cliente-novo': [['- Se ainda não houve a primeira conversa: diga em uma linha que a tarefa Primeira reunião monta o roteiro e a apresentação com esta ficha',
    '- Se ainda não houve a primeira conversa: roteiro da primeira reunião de 30 minutos, em peça separada']],
  carteira: [[OBJETIVO, 'Objetivo: Ver onde a carteira se afasta da referência escolhida, sem ordem de compra, venda nem imposto.']],
  abordagem: [['[Mesa] Rotinas do dia › Primeira mensagem', '[Mesa] Rotinas do dia › Primeira abordagem'],
    [OBJETIVO, 'Objetivo: Preparar a primeira conversa com um contato novo, sem pressão e sem recomendar produto.']],
  ligacao: [['[Mesa] Rotinas do dia › Ligação de primeiro contato', '[Mesa] Rotinas do dia › Roteiro de ligação'],
    [OBJETIVO, 'Objetivo: Ter o roteiro exato da ligação, no tempo escolhido, terminando sempre com data e hora marcadas.']],
  sequencia: [['[Mesa] Rotinas do dia › Sequência para lead novo', '[Mesa] Rotinas do dia › Sequência de WhatsApp'],
    [OBJETIVO, 'Objetivo: Ter 5 toques de WhatsApp em 10 a 14 dias, cada um com objetivo, dia e texto prontos.']],
  followup: [['- Roteiro de ligação de 60 segundos para usar no lugar do segundo toque, em peça separada\n', '']],
  proposta: [['[Mesa] Rotinas do dia › Proposta de assessoria (documento)', '[Mesa] Rotinas do dia › Proposta de assessoria']],
  'pre-reuniao': [['[Mesa] Rotinas do dia › Pré-reunião (cliente atual)', '[Mesa] Rotinas do dia › Pré-reunião']],
};
const comoNa113 = (id, texto) => NA_113[id].reduce((t, [hoje, antes]) => {
  assert.ok(typeof hoje === 'string' ? t.includes(hoje) : hoje.test(t), `${id}: o pedido de hoje não tem ${hoje}`);
  return t.replace(hoje, () => antes);
}, texto);
const MUDOU = { 'cliente-novo': 'a lista do que receber', carteira: 'o objetivo', abordagem: 'o nome da tarefa e o objetivo', ligacao: 'o nome da tarefa e o objetivo',
  sequencia: 'o nome da tarefa e o objetivo', followup: 'a lista do que receber', proposta: 'o nome da tarefa', 'pre-reuniao': 'o nome da tarefa' };
const AVISO_MODELO = 'Seu modelo salvo ainda traz o texto da versão anterior.';
const AVISO_RASCUNHO = 'Este rascunho foi montado com o texto da versão anterior.';
const AVISO_REGRAS = 'Suas regras pessoais de «Roteiro de reunião»';
const REGRAS_ROTEIRO = ['Sempre em 30 minutos', 'Levar o extrato'];
const AJUSTES_COM_ROTEIRO = JSON.stringify({ tarefas: { 'roteiro-reuniao': { regras: REGRAS_ROTEIRO }, 'pre-reuniao': { regras: ['Perguntar da família'] } } });
const RESPOSTAS = { 'primeira-reuniao': { duracao: ['30 minutos'], perfil: ['Empresário'], resultado: ['Texto no chat'] },
  'segunda-reuniao': { decide: ['Valida'], resultado: ['Texto no chat'] }, 'pre-reuniao': { foco: ['Novo aporte'] } };
const rascunho = (estado, extra = {}) => JSON.stringify({ v: 1, em: Date.now() - 36e5, estado: { area: 'rotinas', passo: 0, campos: {}, ...estado }, ...extra });
const resumo = ({ tela, tarefa, passo, respostas }) => ({ tela, tarefa, passo, respostas });

for (const { nome, arq } of TELAS) {
  // O pedido de hoje, montado pela própria tela com o perfil de teste.
  const pedidoDeHoje = (id, respostas) => { const t = telaDe(arq); t.ligar({ ...PERFIL }); t.abrir(id, respostas); return t.pedido(); };

  test(`${nome} · modelo salvo com o texto da 1.13: a tela avisa o que mudou e só troca esses trechos quando o assessor pede`, async () => {
    for (const id of Object.keys(NA_113)) {
      const hoje = pedidoDeHoje(id), antigo = comoNa113(id, hoje) + MEU;
      const t = telaDe(arq);
      t.ligar({ ...PERFIL, modelos: { [id]: antigo } });
      t.abrir(id);
      assert.equal(t.pedido(), antigo, `${id}: a tela trocou o modelo do assessor sem ele pedir`);
      assert.ok(t.visivel().includes(`${AVISO_MODELO} Mudou nesta versão: ${MUDOU[id]}.`), `${id}: ${t.visivel()}`);
      await t.clicar('Trazer o texto novo');
      assert.equal(t.pedido(), hoje + MEU, `${id}: o texto novo não entrou, ou o que o assessor escreveu se perdeu`);
      assert.deepEqual(t.chamadas().filter((c) => c.arguments?.modelo).map((c) => c.arguments.modelo), [{ tarefa: id, texto: hoje + MEU }], `${id}: modelo gravado`);
      assert.ok(!t.visivel().includes(AVISO_MODELO), `${id}: o aviso ficou depois de atualizado`);
      t.zerarPedido(); t.abrir(id);
      assert.equal(t.pedido(), hoje + MEU);
      assert.ok(!t.visivel().includes(AVISO_MODELO), `${id}: o aviso voltou com o modelo já atualizado`);
    }
  });

  test(`${nome} · «Manter o meu modelo» cala o aviso daquele modelo, também depois de abrir a Mesa de novo`, async () => {
    const hoje = pedidoDeHoje('followup'), antigo = comoNa113('followup', hoje) + MEU;
    const t = telaDe(arq);
    t.ligar({ ...PERFIL, modelos: { followup: antigo } });
    t.abrir('followup');
    await t.clicar('Manter o meu modelo');
    assert.ok(!t.visivel().includes(AVISO_MODELO));
    assert.equal(t.pedido(), antigo);
    assert.deepEqual(t.chamadas().filter((c) => c.arguments?.modelo), [], 'o modelo foi regravado sem o assessor pedir');
    t.carregarAjustes(t.perfil().ajustes); t.zerarPedido(); t.abrir('followup');
    assert.ok(!t.visivel().includes(AVISO_MODELO), 'o aviso voltou depois de recarregar os ajustes');
    // outro texto no mesmo modelo (salvo de novo, ainda com o trecho antigo) volta a avisar
    t.ligar({ ...t.perfil(), modelos: { followup: antigo + '\nOutra linha minha.' } }); t.zerarPedido(); t.abrir('followup');
    assert.ok(t.visivel().includes(AVISO_MODELO));
  });

  test(`${nome} · modelo salvo nesta versão não recebe aviso (nem o título que só começa igual ao antigo)`, () => {
    for (const id of ['proposta', 'pre-reuniao', 'followup', 'abordagem']) {
      const hoje = pedidoDeHoje(id), t = telaDe(arq);
      t.ligar({ ...PERFIL, modelos: { [id]: hoje + MEU } });
      t.abrir(id);
      assert.equal(t.pedido(), hoje + MEU);
      assert.ok(!t.visivel().includes(AVISO_MODELO), id);
      assert.ok(!t.temBotao('Trazer o texto novo'), id);
    }
  });

  test(`${nome} · rascunho da 1.13 no fim: o texto volta como estava, a opção que saiu é avisada e o texto novo só entra quando o assessor pede`, async () => {
    const hoje = pedidoDeHoje('abordagem', { canal: ['WhatsApp'] });
    const antigo = comoNa113('abordagem', hoje).replace('- Canal: WhatsApp', '- Canal: Ligação') + MEU;
    const t = telaDe(arq);
    const ok = t.restaurar({ ...PERFIL, rascunho: rascunho({ tela: 'fim', tarefa: 'abordagem', respostas: { canal: ['Ligação'] } }, { texto: antigo }) }, true);
    assert.equal(ok, true);
    assert.deepEqual(resumo(t.estado()), { tela: 'fim', tarefa: 'abordagem', passo: 0, respostas: {} });
    assert.equal(t.avisos().at(-1), 'Voltei para onde você parou: Primeira mensagem. A opção «Ligação», da pergunta Canal, saiu desta tarefa: escolha outra.');
    assert.equal(t.pedido(), antigo, 'o texto do rascunho mudou sem o assessor pedir');
    const v = t.visivel();
    assert.ok(v.includes('Você editou o pedido à mão'), 'o texto do rascunho não ficou marcado como editado');
    assert.ok(v.includes(`${AVISO_RASCUNHO} Mudou nesta versão: o nome da tarefa, o objetivo e uma opção de resposta.`), v);
    t.preencher(0, 'Cliente Teste, médica');
    assert.equal(t.pedido(), antigo, 'mudar um campo apagou o que o assessor escreveu no rascunho');
    await t.clicar('Trazer o texto novo');
    const novo = t.pedido();
    assert.ok(novo.startsWith('[Mesa] Rotinas do dia › Primeira mensagem\n'), novo);
    assert.match(novo, /^Objetivo: Preparar a primeira mensagem para um contato novo/m);
    assert.match(novo, /^- Canal: não informado$/m);
    assert.doesNotMatch(novo, /Primeira abordagem|Canal: Ligação/);
    assert.ok(novo.endsWith(MEU), 'o que o assessor escreveu se perdeu');
    assert.ok(!t.visivel().includes(AVISO_RASCUNHO));
  });

  test(`${nome} · rascunho da 1.13 sem edição à mão: avisa, e o texto novo fica igual ao pedido de hoje`, async () => {
    const respostas = { tempo: ['30 segundos'], perfil: ['Empresário'] }, hoje = pedidoDeHoje('ligacao', respostas);
    const antigo = comoNa113('ligacao', hoje).replace('- Perfil: Empresário', '- Perfil: Empresário\n- Etapa: Primeiro contato');
    const t = telaDe(arq);
    t.restaurar({ ...PERFIL, rascunho: rascunho({ tela: 'fim', tarefa: 'ligacao', passo: 1, respostas: { ...respostas, etapa: ['Primeiro contato'] } }, { texto: antigo }) }, false);
    assert.deepEqual(resumo(t.estado()), { tela: 'fim', tarefa: 'ligacao', passo: 1, respostas });
    assert.equal(t.pedido(), antigo);
    assert.equal(t.pedidoAtual().editado, false, 'texto da 1.13 sem edição não é edição do assessor');
    assert.ok(t.visivel().includes(`${AVISO_RASCUNHO} Mudou nesta versão: o nome da tarefa e o objetivo.`), t.visivel());
    await t.clicar('Trazer o texto novo');
    assert.equal(t.pedido(), hoje);
  });

  test(`${nome} · rascunho nas perguntas: a resposta que não é mais opção sai e a tela volta para a pergunta dela`, () => {
    // «45 segundos» era uma opção pessoal do assessor, apagada depois que o rascunho foi gravado
    const t = telaDe(arq);
    t.restaurar({ ...PERFIL, rascunho: rascunho({ tela: 'guia', tarefa: 'ligacao', passo: 1, respostas: { tempo: ['45 segundos'], perfil: ['Empresário'] } }) }, true);
    assert.deepEqual(resumo(t.estado()), { tela: 'guia', tarefa: 'ligacao', passo: 0, respostas: { perfil: ['Empresário'] } });
    assert.equal(t.avisos().at(-1), 'Voltei para onde você parou: Ligação de primeiro contato. A opção «45 segundos», da pergunta Duração, saiu desta tarefa: escolha outra.');
    // rascunho da 1.13 com Canal = Ligação, nas perguntas ou no fim sem texto: volta para a pergunta
    for (const tela of ['guia', 'fim']) {
      const v = telaDe(arq);
      v.restaurar({ ...PERFIL, rascunho: rascunho({ tela, tarefa: 'abordagem', respostas: { canal: ['Ligação'] } }) }, true);
      assert.deepEqual(resumo(v.estado()), { tela: 'guia', tarefa: 'abordagem', passo: 0, respostas: {} }, tela);
      assert.equal(v.avisos().at(-1), 'Voltei para onde você parou: Primeira mensagem. A opção «Ligação», da pergunta Canal, saiu desta tarefa: escolha outra.');
    }
    // rascunho da 1.13 com a pergunta Etapa, que saiu: some sem aviso, porque não mudava nada no pedido; as outras respostas ficam
    const u = telaDe(arq);
    u.restaurar({ ...PERFIL, rascunho: rascunho({ tela: 'guia', tarefa: 'ligacao', passo: 1, respostas: { tempo: ['30 segundos'], perfil: ['Empresário'], etapa: ['Retomada'] } }) }, true);
    assert.deepEqual(resumo(u.estado()), { tela: 'guia', tarefa: 'ligacao', passo: 1, respostas: { tempo: ['30 segundos'], perfil: ['Empresário'] } });
    assert.equal(u.avisos().at(-1), 'Voltei para onde você parou: Ligação de primeiro contato.');
    // opção que o assessor personalizou continua valendo
    const w = telaDe(arq);
    w.carregarAjustes(JSON.stringify({ tarefas: { abordagem: { opcoes: { canal: ['WhatsApp', 'E-mail', 'Ligação'] } } } }));
    w.restaurar({ ...PERFIL, rascunho: rascunho({ tela: 'guia', tarefa: 'abordagem', respostas: { canal: ['Ligação'] } }) }, true);
    assert.deepEqual(w.estado().respostas, { canal: ['Ligação'] });
    assert.equal(w.avisos().at(-1), 'Voltei para onde você parou: Primeira mensagem.');
  });

  test(`${nome} · rascunho gravado nesta versão guarda se o texto foi editado à mão, e volta assim`, () => {
    const t = telaDe(arq, { imediato: true });
    t.ligar({ ...PERFIL });
    t.abrir('followup');
    const hoje = t.pedido();
    t.digitar(hoje + MEU);
    const r = JSON.parse(t.perfil().rascunho);
    assert.deepEqual([r.estado.tela, r.texto, r.editado, r.modelo], ['fim', hoje + MEU, true, false]);
    const u = telaDe(arq);
    u.restaurar({ ...PERFIL, rascunho: JSON.stringify(r) }, false);
    assert.equal(u.pedido(), hoje + MEU);
    assert.equal(u.pedidoAtual().editado, true);
    assert.ok(!u.visivel().includes(AVISO_RASCUNHO));
    u.preencher(0, 'Proposta de carteira enviada');
    assert.equal(u.pedido(), hoje + MEU, 'mudar um campo apagou o que o assessor escreveu');
  });

  test(`${nome} · regras pessoais de Roteiro de reunião ficam guardadas: um ajuste em outra tarefa não as apaga`, async () => {
    const t = telaDe(arq);
    t.ligar({ ...PERFIL });
    t.carregarAjustes(AJUSTES_COM_ROTEIRO);
    assert.deepEqual(Object.keys(t.ajustes().tarefas), ['pre-reuniao'], 'as regras da tarefa que saiu passaram a valer sozinhas');
    assert.equal((await t.editar({ tarefa: 'pre-reuniao', regras: ['Perguntar da família', 'Levar o extrato atualizado'] })).ok, true);
    const salvo = JSON.parse(t.perfil().ajustes).tarefas;
    assert.deepEqual(salvo['roteiro-reuniao'], { regras: REGRAS_ROTEIRO }, 'as regras guardadas mudaram ou sumiram');
    assert.deepEqual(salvo['pre-reuniao'].regras, ['Perguntar da família', 'Levar o extrato atualizado']);
  });

  test(`${nome} · as tarefas que herdaram o papel de Roteiro de reunião oferecem as regras guardadas, até o assessor decidir`, async () => {
    const t = telaDe(arq);
    t.ligar({ ...PERFIL });
    t.carregarAjustes(AJUSTES_COM_ROTEIRO);
    t.abrir('followup');
    assert.ok(!t.visivel().includes(AVISO_REGRAS), 'o aviso apareceu numa tarefa que não tem nada com reunião');
    t.abrir('primeira-reuniao', RESPOSTAS['primeira-reuniao']);
    assert.ok(t.visivel().includes(`${AVISO_REGRAS}, tarefa que saiu do menu, estão guardadas: «Sempre em 30 minutos»; «Levar o extrato».`), t.visivel());
    await t.clicar('Usar nesta tarefa');
    assert.deepEqual(t.ajustes().tarefas['primeira-reuniao'].regras, REGRAS_ROTEIRO);
    assert.match(t.pedido(), /^Minhas regras pessoais[^\n]*\n- Sempre em 30 minutos\n- Levar o extrato$/m);
    assert.deepEqual(JSON.parse(t.perfil().ajustes).tarefas['roteiro-reuniao'], { regras: REGRAS_ROTEIRO }, 'as regras guardadas sumiram');
    t.render();
    assert.ok(!t.visivel().includes(AVISO_REGRAS), 'o aviso continuou na tarefa que já tem as regras');
    t.abrir('segunda-reuniao', RESPOSTAS['segunda-reuniao']);
    assert.ok(t.visivel().includes(AVISO_REGRAS), 'a Segunda reunião não ofereceu as regras');
    await t.clicar('Não mostrar mais');
    assert.ok(!t.visivel().includes(AVISO_REGRAS));
    t.abrir('pre-reuniao', RESPOSTAS['pre-reuniao']);
    assert.ok(!t.visivel().includes(AVISO_REGRAS), 'o aviso voltou depois de «Não mostrar mais»');
    assert.deepEqual(JSON.parse(t.perfil().ajustes).tarefas['roteiro-reuniao'], { regras: REGRAS_ROTEIRO, avisado: true });
    t.carregarAjustes(t.perfil().ajustes);
    t.abrir('segunda-reuniao', RESPOSTAS['segunda-reuniao']);
    assert.ok(!t.visivel().includes(AVISO_REGRAS), 'o aviso voltou depois de abrir a Mesa de novo');
  });

  test(`${nome} · pedir para tirar as regras de Roteiro de reunião apaga as que estavam guardadas`, async () => {
    const t = telaDe(arq);
    t.ligar({ ...PERFIL });
    t.carregarAjustes(AJUSTES_COM_ROTEIRO);
    assert.deepEqual(await t.restaurarAjuste('Roteiro de reunião'), { ok: true, nome: 'Roteiro de reunião' });
    const salvo = JSON.parse(t.perfil().ajustes).tarefas;
    assert.ok(!('roteiro-reuniao' in salvo));
    assert.deepEqual(salvo['pre-reuniao'], { opcoes: {}, regras: ['Perguntar da família'] });
    assert.deepEqual(await t.restaurarAjuste('roteiro-reuniao'), { ok: false, motivo: 'essa tarefa não tem ajustes seus.' });
  });

  test(`${nome} · modelo salvo traz as regras pessoais de agora, não as do dia em que foi salvo`, async () => {
    const r = RESPOSTAS['primeira-reuniao'], hoje = pedidoDeHoje('primeira-reuniao', r);
    const t = telaDe(arq);
    t.ligar({ ...PERFIL, modelos: { 'primeira-reuniao': hoje + MEU } });
    await t.editar({ tarefa: 'primeira-reuniao', regras: ['Sempre em 30 minutos'] });
    t.zerarPedido(); t.abrir('primeira-reuniao', r);
    const comRegra = t.pedido();
    assert.ok(comRegra.includes('\n\nMinhas regras pessoais (valem sempre nesta tarefa; não substituem as regras abaixo):\n- Sempre em 30 minutos\n\nRegras: '), comRegra);
    assert.ok(comRegra.endsWith(MEU));
    // modelo salvo com uma regra que depois foi apagada: a regra sai do pedido
    const u = telaDe(arq);
    u.ligar({ ...PERFIL, modelos: { 'primeira-reuniao': comRegra } });
    u.abrir('primeira-reuniao', r);
    assert.equal(u.pedido(), hoje + MEU);
  });

  test(`${nome} · os nomes antigos das 5 tarefas renomeadas ainda acham a tarefa de hoje`, async () => {
    const t = telaDe(arq);
    for (const [antigo, , novo] of RENOMEADAS) {
      for (const ref of [antigo, antigo.toUpperCase(), `  ${antigo.toLowerCase()} `]) {
        const r = await t.editar({ tarefa: ref, regras: ['Sempre curto'] });
        assert.deepEqual([r.ok, r.nome], [true, novo], `${ref}: ${JSON.stringify(r)}`);
      }
      assert.deepEqual(await t.restaurarAjuste(antigo), { ok: true, nome: novo });
    }
  });

  test(`${nome} · tarefa própria com um nome antigo continua sendo achada por esse nome`, async () => {
    const t = telaDe(arq);
    const r = t.validarTarefa({ area: 'rotinas', nome: 'Roteiro de ligação', linha: 'Minha versão.', entrega: ['Roteiro de 30 segundos'] });
    t.carregarTarefasUsuario(JSON.stringify([r.ok]));
    const e = await t.editar({ tarefa: 'Roteiro de ligação', regras: ['Sempre curto'] });
    assert.deepEqual([e.ok, e.nome], [true, 'Roteiro de ligação']);
    assert.deepEqual(Object.keys(t.ajustes().tarefas), [r.ok.id]);
  });

  test(`${nome} · histórico de uma tarefa renomeada mostra o nome salvo e diz como ela se chama agora`, () => {
    for (const [antigo, id, novo] of RENOMEADAS) {
      const t = telaDe(arq, { status: 'pronto' });
      t.abrirDoHistorico({ ok: true, tarefa: id, area: 'rotinas', nome: antigo, em: HISTORICO_ROTEIRO.em });
      const { texto } = t.tela();
      assert.ok(texto.includes(antigo), texto);
      assert.ok(texto.includes(`Esta tarefa agora se chama «${novo}».`), texto);
    }
    const t = telaDe(arq, { status: 'pronto' });
    t.abrirDoHistorico({ ok: true, tarefa: 'primeira-reuniao', area: 'rotinas', nome: 'Primeira reunião', em: HISTORICO_ROTEIRO.em });
    assert.ok(!t.tela().texto.includes('agora se chama'));
  });

  test(`${nome} · histórico com área vazia, ausente ou desconhecida abre em Rotinas do dia, sem erro`, () => {
    for (const area of ['', undefined, null, 'area-que-nao-existe']) {
      const t = telaDe(arq, { status: 'pronto' });
      t.abrirDoHistorico({ ...HISTORICO_ROTEIRO, area });
      assert.equal(t.estado().area, 'rotinas', `área ${area}`);
      assert.match(t.tela().trilho, /Rotinas do dia.*Roteiro de reunião/);
      assert.ok(t.tela().texto.includes(ONDE_ESTA_O_ROTEIRO));
      assert.deepEqual(t.alertas(), []);
    }
  });
}

test('nomes antigos, tarefas que saíram e trechos da 1.13 são os mesmos nas duas telas', () => {
  const [a, b] = TELAS.map(({ arq }) => telaDe(arq).compat());
  assert.deepEqual(a, b);
  const { T } = TELAS[0].cat.retrato(), noMenu = TELAS[0].cat.tarefasDoMenu().map((x) => x.id);
  assert.deepEqual(Object.entries(a.NOMES_ANTIGOS).map(([antigo, id]) => [antigo, id, T[id]?.nome]), RENOMEADAS);
  for (const [, id] of RENOMEADAS) assert.ok(noMenu.includes(id), id);
  assert.deepEqual(Object.keys(a.TEXTO_ANTIGO).sort(), Object.keys(NA_113).sort());
});

test('skill do Follow-up: a ligação de 60 segundos no lugar do segundo toque, numa peça que a janela reconhece', () => {
  const s = skill('skills', 'relatorio-e-proposta');
  const follow = secao(s, 'Método').split('\n').find((l) => l.startsWith('**Follow-up pós-proposta:**')) ?? '';
  assert.match(follow, /60 segundos/);
  assert.match(follow, /no lugar do segundo toque/);
  const pecas = secao(s, 'Modelo de saída').split('\n').find((l) => l.startsWith('**Peças**')) ?? '';
  assert.match(pecas, /`roteiro-ligacao` \([^)]*60 segundos/);
  assert.match(readFileSync(path.join(RAIZ, 'janela', 'motor.mjs'), 'utf8'), /Tipos: [^.]*\broteiro-ligacao\b/);
});

// Modo /mesa chat: as linhas de Rotinas das duas skills seguem o menu (seção 6.4 do plano) e o catálogo das telas.
const linhasDaTabela = (texto) => texto.split('\n').filter((l) => l.startsWith('|') && !/^\|\s*-/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
const metodos = (celula) => [...celula.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
const NOMES_ROTINAS = MENU_ROTINAS.flatMap(([, l]) => l);
const DA_VERSAO_ANTERIOR = ['Primeira abordagem', 'Roteiro de ligação', 'Sequência de WhatsApp', 'Roteiro de reunião', 'Comparar com', 'Ligação (como abrir a conversa)'];
const catalogoRotinas = () => {
  const cat = TELAS[0].cat, { T } = cat.retrato();
  cat.definir({ perfil: { atuacao: 'Assessor de investimento' } });
  const r = Object.fromEntries(cat.tarefasDoMenu().filter((x) => x.area === 'rotinas').map(({ id }) => {
    const m = cat.montar(id, {}, []);
    return [T[id].nome, { linha: T[id].linha.replace(/\.$/, ''), skills: m.texto.match(/^(?:Skill|Rotina): (.*)\. Me peça/m)[1].split(' e '), perguntas: m.perguntas }];
  }));
  cat.definir({ perfil: null });
  return r;
};

test('modo /mesa chat (Code): as linhas de Rotinas são as 20 tarefas do menu, com a linha, a skill e as perguntas de cada uma', () => {
  const s = readFileSync(path.join(RAIZ, 'skill-mesa', 'SKILL.md'), 'utf8'), cat = catalogoRotinas();
  const rot = linhasDaTabela(s).filter((c) => c[0] === 'Rotinas');
  assert.deepEqual(rot.map((c) => c[1]), NOMES_ROTINAS);
  for (const [, tarefa, entrega, metodo, perguntas] of rot) {
    assert.equal(entrega, cat[tarefa].linha, tarefa);
    assert.deepEqual(metodos(metodo), cat[tarefa].skills, tarefa);
    assert.deepEqual(perguntas.split(' · ').filter(Boolean), cat[tarefa].perguntas.map((p) => p.curto), tarefa);
  }
  // cada pergunta das Rotinas está na lista de perguntas, com as opções do menu, na mesma ordem
  const defs = [...s.matchAll(/^- \*\*([^*]+)\*\*[^—\n]*— [^?\n]*\? (.*)$/gm)].map(([, n, ops]) => [n, ops.replace(/\.$/, '').split(' · ')]);
  for (const [tarefa, { perguntas }] of Object.entries(cat)) {
    for (const p of perguntas) {
      assert.ok(defs.some(([n, ops]) => n === p.curto && ops.length === p.opcoes.length && ops.every((o, i) => o.startsWith(p.opcoes[i]))), `${tarefa}: falta a pergunta ${p.curto} com ${p.opcoes.join(' | ')}`);
    }
  }
  // o grupo de Rotinas do passo 1 (Área e tarefa): da linha de Rotinas do dia até a de Mercado hoje
  const grupo = s.slice(s.indexOf('   - Rotinas do dia'), s.indexOf('   - Mercado hoje'));
  assert.ok(grupo.length > 20, 'não achei o grupo de Rotinas do dia');
  for (const n of NOMES_ROTINAS) assert.ok(grupo.toLowerCase().includes(n.toLowerCase()), `o grupo de Rotinas não cita ${n}`);
  for (const velho of DA_VERSAO_ANTERIOR) assert.ok(!s.includes(velho), `ainda cita ${velho}`);
});

test('modo /mesa chat (app): as linhas de Rotinas são as 20 tarefas do menu, com a skill de cada uma', () => {
  const s = readFileSync(path.join(RAIZ, 'skill-mesa-app', 'SKILL.md'), 'utf8'), cat = catalogoRotinas();
  const rot = linhasDaTabela(s).filter((c) => c[0] in cat);
  assert.deepEqual(rot.map((c) => c[0]), NOMES_ROTINAS);
  for (const [tarefa, metodo] of rot) assert.deepEqual(metodos(metodo), cat[tarefa].skills, tarefa);
  for (const velho of DA_VERSAO_ANTERIOR) assert.ok(!s.includes(velho), `ainda cita ${velho}`);
});

// ---------------------------------------------------------------------------------------------------------
// Rascunho gravado antes desta versão (revisão independente de 18/11): os campos são guardados pela posição. Tarefa
// cujos campos mudaram desde a 1.13, ou cujo formato (campos e opções) mudou desde que o rascunho foi gravado,
// recomeça: os campos não voltam no campo errado, a resposta que não é mais opção sai e o texto do pedido montado
// com o catálogo antigo não volta. A tela avisa uma vez. Tarefa que não mudou volta como antes.

const AVISO_RECOMECOU = (nome) => `A tarefa «${nome}» mudou nesta versão e o rascunho dela recomeçou: confira as escolhas e preencha os dados de novo.`;
// Campos como a 1.13 gravava (rótulos da 1.13, conferidos na 1.13 sem mudanças) e o que sairia no pedido de hoje se
// voltassem pela posição.
const CAMPOS_DA_113 = {
  fato: { rotulos: ['Texto integral do comunicado ou link da página oficial', 'Minha tese ou motivo de acompanhar a empresa'],
    campos: ['TEXTO INTEGRAL DO COMUNICADO da empresa', 'tese de dividendos'],
    errados: ['- Empresa (nome ou ticker): TEXTO INTEGRAL', '- Qual comunicado: tese de dividendos'] },
  grafico: { rotulos: ['Ativo, período e escala', 'Imagem do gráfico, série ou descrição', 'Indicadores que quero ver'],
    campos: ['TESTE3, 12 meses, diário', 'descrição do gráfico: topo duplo', 'Médias móveis'],
    errados: ['- Ativo (ticker): TESTE3, 12 meses', '- Período: descrição do gráfico', '- Escala: Médias móveis'] },
  macro: { rotulos: ['Indicador ou período'], campos: ['Só Selic'], errados: ['- Recorte: Só Selic'] },
};
// Tarefas cujos campos mudaram desde a 1.13 (rótulos, ordem ou opções; conferido contra a 1.13 sem mudanças em 18/11).
const MUDARAM_DESDE_113 = ['calendario', 'carteira', 'estudo', 'macro', 'fato', 'grafico', 'rf', 'pauta'];

for (const { nome, arq, cat } of TELAS) {
  const pedidoDeHoje = (id, respostas) => { const t = telaDe(arq); t.ligar({ ...PERFIL }); t.abrir(id, respostas); return t.pedido(); };

  test(`${nome} · rascunho da 1.13 de Fato relevante, Leitura de gráfico e Juros, inflação e câmbio: os campos não voltam no campo errado e o pedido recomeça`, () => {
    for (const [id, { rotulos, campos, errados }] of Object.entries(CAMPOS_DA_113)) {
      const { area, nome: tarefa } = cat.montar(id), respostas = { uso: ['Conversa de WhatsApp'] };
      const antigo = `[Mesa] Mercado › ${tarefa}\n\nDados que vou te passar:\n` + rotulos.map((r, i) => `- ${r}: ${campos[i]}`).join('\n') + MEU;
      for (const tela of ['guia', 'fim']) {
        const t = telaDe(arq);
        const ok = t.restaurar({ ...PERFIL, rascunho: rascunho({ tela, area, tarefa: id, respostas, campos: { [id]: campos } }, tela === 'fim' ? { texto: antigo } : {}) }, true);
        assert.equal(ok, true, `${id} (${tela})`);
        const e = t.estado();
        assert.deepEqual(resumo(e), { tela: 'guia', tarefa: id, passo: 0, respostas }, `${id} (${tela}): a tela não recomeçou na primeira pergunta`);
        assert.equal(e.campos[id], undefined, `${id} (${tela}): os campos da 1.13 voltaram`);
        assert.deepEqual(t.avisos(), [AVISO_RECOMECOU(tarefa)], `${id} (${tela})`);
        // segue até o fim com o que voltou: o pedido é o de hoje, sem os campos no lugar errado e sem o texto antigo
        t.abrir(id, e.respostas, e.campos);
        const p = t.pedido();
        for (const x of errados) assert.ok(!p.includes(x), `${id} (${tela}): ${x}`);
        assert.equal(p, pedidoDeHoje(id, respostas), `${id} (${tela}): o pedido não é o de hoje`);
        assert.ok(!t.visivel().includes('Você editou o pedido à mão'), `${id} (${tela}): o texto antigo voltou como editado`);
      }
    }
  });

  test(`${nome} · rascunho da 1.13: a resposta que não é mais opção sai também na tarefa que recomeça`, () => {
    // Revisão de carteira: os campos mudaram e a pergunta Comparar com quê saiu; «Planilha» não é opção de Resultado
    const { area, nome: tarefa } = cat.montar('carteira');
    const t = telaDe(arq);
    t.restaurar({ ...PERFIL, rascunho: rascunho({ tela: 'fim', area, tarefa: 'carteira', respostas: { base: ['Carteira modelo do escritório'], resultado: ['Planilha'] }, campos: { carteira: ['60% renda fixa', 'política antiga'] } }) }, true);
    const e = t.estado();
    assert.deepEqual(resumo(e), { tela: 'guia', tarefa: 'carteira', passo: 0, respostas: {} });
    assert.equal(e.campos.carteira, undefined);
    assert.deepEqual(t.avisos(), [AVISO_RECOMECOU(tarefa)]);
  });

  test(`${nome} · rascunho da 1.13: tarefa cujos campos não mudaram volta como antes; só saem os campos guardados das tarefas que mudaram`, () => {
    const { area } = cat.montar('post'), campos = ['Selic e juros', 'Captar novos clientes', '', 'Fundo claro'], respostas = { formato: ['Carrossel'] };
    const t = telaDe(arq);
    t.restaurar({ ...PERFIL, rascunho: rascunho({ tela: 'guia', area, tarefa: 'post', respostas, campos: { post: campos, fato: CAMPOS_DA_113.fato.campos } }) }, true);
    const e = t.estado();
    assert.deepEqual(resumo(e), { tela: 'guia', tarefa: 'post', passo: 0, respostas });
    assert.deepEqual(e.campos, { post: campos });
    assert.deepEqual(t.avisos(), ['Voltei para onde você parou: Criar um post.']);
    // no fim, com texto: o texto volta como estava
    const u = telaDe(arq);
    u.ligar({ ...PERFIL }); u.abrir('post', respostas, { post: campos });
    const texto = u.pedido(), v = telaDe(arq);
    v.restaurar({ ...PERFIL, rascunho: rascunho({ tela: 'fim', area, tarefa: 'post', respostas, campos: { post: campos } }, { texto }) }, true);
    assert.deepEqual(resumo(v.estado()), { tela: 'fim', tarefa: 'post', passo: 0, respostas });
    assert.deepEqual(v.estado().campos, { post: campos });
    assert.equal(v.pedido(), texto);
    assert.equal(v.pedidoAtual().editado, false);
  });

  test(`${nome} · rascunho gravado nesta versão leva o formato de cada tarefa; se o formato mudar depois, a tarefa recomeça`, () => {
    const t = telaDe(arq, { imediato: true });
    t.ligar({ ...PERFIL });
    t.abrir('followup');
    t.preencher(0, 'Proposta de carteira enviada');
    const r = JSON.parse(t.perfil().rascunho);
    assert.equal(typeof r.formato?.followup, 'string', 'o rascunho não guardou o formato da tarefa');
    // mesma versão: volta tudo, também com opções pessoais do assessor (elas não mudam o formato do catálogo)
    for (const ajustes of [null, JSON.stringify({ tarefas: { followup: { opcoes: { tempo: ['2 dias', '5 dias', '15 dias'] } } } })]) {
      const u = telaDe(arq);
      if (ajustes) u.carregarAjustes(ajustes);
      u.restaurar({ ...PERFIL, rascunho: JSON.stringify(r) }, true);
      assert.equal(u.estado().tela, 'fim');
      assert.equal(u.estado().campos.followup?.[0], 'Proposta de carteira enviada');
      assert.deepEqual(u.avisos(), ['Voltei para onde você parou: Follow-up da proposta.']);
    }
    // formato gravado por outra versão: os campos não voltam e o pedido recomeça
    const w = telaDe(arq);
    w.restaurar({ ...PERFIL, rascunho: JSON.stringify({ ...r, formato: { ...r.formato, followup: 'outra-versao' } }) }, true);
    assert.equal(w.estado().campos.followup, undefined);
    assert.deepEqual(resumo(w.estado()), { tela: 'guia', tarefa: 'followup', passo: 0, respostas: {} });
    assert.deepEqual(w.avisos(), [AVISO_RECOMECOU('Follow-up da proposta')]);
  });
}

test('formato das tarefas e lista das que mudaram desde a 1.13 são os mesmos nas duas telas', () => {
  const [a, b] = TELAS.map(({ arq }) => telaDe(arq).formatos());
  delete a.tarefas['editar-reels'];
  assert.deepEqual(a, b);
  assert.deepEqual(a.desde113, MUDARAM_DESDE_113);
});
