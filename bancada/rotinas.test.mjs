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
class No {
  constructor(tag) {
    this.tag = tag; this.filhos = []; this.className = ''; this.html = ''; this.id = ''; this.dataset = {}; this.hidden = false;
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
  append(...n) { for (const x of n) this.filhos.push(typeof x === 'string' ? Object.assign(new No('#texto'), { html: x }) : x); }
  prepend(...n) { this.filhos.unshift(...n); }
  replaceChildren(...n) { this.filhos = []; this.html = ''; this.append(...n); }
  get childElementCount() { return this.filhos.length; }
  querySelector(s) { return todos(this).slice(1).find((n) => (s[0] === '.' ? n.classList.contains(s.slice(1)) : s[0] === '#' ? n.id === s.slice(1) : n.tag === s)) ?? null; }
  setAttribute() {} addEventListener() {} remove() {} focus() {}
  getBoundingClientRect() { return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }; }
}

const DA_TELA = ['const $ = ', 'const el = ', 'const esc = ', 'const estado = ', 'let ultimaChaveTela', 'const GLIFOS', 'function porta', 'function trilho',
  'let videoEscolhido', 'function ir(', 'function render()', 'let editandoPerfil', 'function telaInicio', 'function dossie', 'function telaAcompanhar',
  'let andamento = null', 'const quando = ', 'function abrirDoHistorico', 'function telaHistorico', 'let promptEdit', 'let rascunhoTimer',
  'function agendarRascunho', 'function restaurarRascunho', 'let app = null'];
const PRELUDIO = 'function telaLista() {} function telaGuia() {} function telaFim() {} function avisar() {} function faixaCaptaMais() { return el("div"); } ' +
  'function linhaPerfil() { return el("div"); } function cartaoPerfil() { return el("div"); } function cartaoEditarPerfil() { return el("div"); }';
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
};`;

function telaDe(arquivo, { status } = {}) {
  const linhas = readFileSync(arquivo, 'utf8').split('\n');
  const ini = linhas.findIndex((l) => /^ {2}const AREAS = /.test(l));
  const fim = linhas.findIndex((l, i) => i > ini && l.startsWith('  const $ = (s) => document.querySelector(s);'));
  const depois = linhas.slice(fim);
  const fonte = [PRELUDIO, linhas.slice(ini, fim).join('\n'), ...DA_TELA.map((d) => trecho(depois, d)), EPILOGO].join('\n');
  const alertas = [], fixar = { n: 0 };
  const nos = { '#tela': new No('main'), '#voltar': new No('button'), '#trilho': new No('nav') };
  const documento = { body: new No('body'), createElement: (tag) => new No(tag), querySelector: (s) => nos[s] ?? null, getElementById: (id) => nos['#' + id] ?? null, addEventListener() {} };
  const janela = { __mesaHistorico: { fixar: () => { fixar.n++; } }, ...(status ? { __mesaStatus: () => ({ estado: status }) } : {}) };
  const ctx = vm.createContext({ window: janela, document: documento, alert: (m) => alertas.push(String(m)), console, setTimeout, clearTimeout, setInterval, clearInterval });
  new vm.Script(fonte, { filename: arquivo }).runInContext(ctx, { timeout: 5000 });
  const t = ctx.__tela;
  return {
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
  for (const ref of Object.keys(SAIRAM)) assert.deepEqual(await a.editar({ tarefa: ref, regras: ['x'] }), await b.editar({ tarefa: ref, regras: ['x'] }));
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

test('rotina de pré-reunião: sem dado do cliente, aponta a tarefa Primeira reunião em vez de montar outro roteiro', () => {
  const s = skill('rotinas', 'pre-meeting');
  assert.doesNotMatch(s, /entregue o roteiro de descoberta/);
  assert.match(s, /tarefa Primeira reunião monta o roteiro e a apresentação/);
});
