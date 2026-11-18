// Passo 6 do plano de melhorias (seção 8): Marketing, o Instagram do assessor, nível A (sem ligar nada).
// O ciclo de cinco tarefas nas duas telas, o campo "Minhas referências" no perfil, o carrossel com tipos novos de
// slide, foto do assessor e pasta da semana, e a trava de palavras em todo texto do carrossel.
// Gera arquivos só em pastas temporárias. Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { carregar } from './catalogo.mjs';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERV = path.join(RAIZ, 'servidor');
const TELAS = [['janela', path.join(RAIZ, 'janela', 'mesa-janela.html')], ['painel', path.join(SERV, 'painel-v2.html')]]
  .map(([nome, arq]) => ({ nome, arq, cat: carregar(arq) }));
const gerador = await import(pathToFileURL(path.join(SERV, 'gerador.mjs')).href);

// Seção 8.2: o ciclo do grupo "Post para Instagram", nesta ordem.
const CICLO = ['Estudar perfis de referência', 'Ideias para postar hoje', 'Semana de posts pronta', 'Criar um post', 'Como foram meus posts'];

// Seção 8.4: os pedidos novos, palavra por palavra (as quebras de linha do plano viram espaço).
const PEDIDOS = {
  referencias: {
    nome: 'Estudar perfis de referência',
    obj: 'Entender o que funciona nos perfis de assessores e influenciadores que eu acompanho e guardar isso como referência para as próximas pautas.',
    fonte: 'Só o que eu enviar (prints, links e legendas) e, se o conector de redes sociais estiver ligado, os posts e os números que ele trouxer dos perfis acompanhados. A busca na web serve para achar o perfil e o tema, não para afirmar número de engajamento. Para saber quais temas mais geram interação no Brasil, use o relatório FInfluence da ANBIMA, com a edição e a data. Não descreva post que você não viu.',
    entrega: [
      'Em uma frase (negrito): o padrão que mais se repete nos posts que funcionam',
      'Posts analisados em UMA tabela (Perfil | Data | Formato | Tema | Gancho da primeira tela | Estrutura | Chamada final | Números visíveis), um por linha',
      'Padrões em UMA tabela (Padrão | Em quantos posts apareceu | Exemplo | Como adaptar ao meu perfil sem copiar)',
      'Por perfil em UMA tabela (Perfil | Temas que repete | Formato mais usado | Frequência, se der para ver)',
      '3 espaços vazios: o que meu público pergunta e nenhum desses perfis está fazendo',
      'Ficha "Minhas referências" para guardar no perfil da Mesa (perfis, padrões e ganchos, em até 15 linhas); pergunte antes de gravar',
      'Conferir, sempre a última coisa da resposta, em texto simples e sem título, negrito ou tabela: o que não deu para ver (alcance, salvamentos) e de onde viria esse dado',
    ],
  },
  pauta: {
    nome: 'Ideias para postar hoje',
    obj: 'Sair com o post de hoje decidido: o que meu público pergunta, o que os perfis que eu acompanho postaram e funcionou, e o que está acontecendo no mercado, com o gancho pronto.',
    // O plano escreve "Fonte dos dados, nesta ordem: (1)…"; a tela já escreve "Fonte dos dados:", então o texto começa em "Nesta ordem".
    fonte: 'Nesta ordem: (1) Minhas referências guardadas no perfil da Mesa e os arquivos que anexei (prints e links de posts); (2) se o conector de redes sociais estiver ligado, os posts dos perfis acompanhados e os números dos meus últimos posts; (3) painel_macro, para o dado novo do dia e a agenda de divulgações; (4) busca na web para dúvidas e temas em alta, com link e data; (5) relatório FInfluence da ANBIMA, para saber quais temas mais geram interação. Diga de onde veio cada sinal. Não descreva post que você não viu e não estime alcance sem número.',
    entrega: [
      'Em uma frase (negrito): a ideia que eu postaria hoje e o motivo',
      'Sinais em UMA tabela de até 6 linhas (Sinal | De onde veio | Data | Tipo: dado, post de referência, pergunta de cliente ou busca)',
      'O que os perfis de referência fizeram em UMA tabela de até 5 linhas (Perfil | Post | Formato | Gancho | O que dá para adaptar sem copiar); sem post visto, diga isso em uma linha e siga',
      '5 ideias em UMA tabela, da melhor para a pior (Ideia | Formato | Dor do público | Por que agora | Gancho da primeira tela | Nota de 0 a 10 pelos cinco critérios da skill)',
      'A ideia número 1 já aberta, em peça separada: título da capa, roteiro slide a slide (ou cena a cena, se for Reels), legenda com chamada e 5 hashtags',
      'Pergunte se quero as imagens agora; se sim, gere com mesa_carrossel',
      'Como medir em 48 horas: o número que mostra se deu certo (salvamentos, envios ou respostas), comparado com a média dos meus últimos posts, se eu informei',
      'Conferir, sempre a última coisa da resposta, em texto simples e sem título, negrito ou tabela: até 5 itens (datas, números, regras do escritório)',
    ],
  },
  calendario: {
    nome: 'Semana de posts pronta',
    obj: 'Deixar a semana inteira pronta para programar: os posts criados (imagens, roteiros e legendas), com dia e horário, numa pasta só.',
    fonte: 'as mesmas da tarefa Ideias para postar hoje (Minhas referências, anexos, conector de redes sociais se estiver ligado, busca e relatório FInfluence), mais painel_macro para encaixar o post no dia em que sai um dado (agenda de divulgações). Horário: use o que os meus números mostrarem; sem número, proponha e marque como hipótese.',
    entrega: [
      'Em uma frase (negrito): o fio da semana e o post em que eu mais aposto',
      'Grade em UMA tabela (Dia e hora | Tema | Formato | Objetivo: alcance, autoridade, conversa ou contato | Gancho | De onde veio a ideia)',
      'Cada carrossel pronto, gerado com mesa_carrossel no formato feed e salvo na pasta da semana: capa, 5 a 7 slides e fechamento com chamada',
      'Cada Reels em peça separada: gancho dos 3 primeiros segundos, roteiro em tabela (cena, tempo, fala e texto na tela) de 30 a 45 segundos, e a capa gerada com mesa_carrossel',
      'Uma legenda por post, em peça separada: gancho, corpo, chamada, 5 hashtags e o aviso educativo',
      'Uma sequência de 3 stories para o dia do post principal, em peça separada',
      'Tabela de programação (Post | Pasta e arquivos | Dia e hora | Legenda) e o passo a passo para programar pelo caminho que escolhi; com conector ligado, só deixe os posts agendados depois do meu ok',
      'Conferir, sempre a última coisa da resposta, em texto simples e sem título, negrito ou tabela: até 5 itens (dados, datas, regras do escritório)',
    ],
  },
  'meus-posts': {
    nome: 'Como foram meus posts',
    obj: 'Ler os números dos meus posts e decidir o que repetir e o que mudar na próxima semana.',
    fonte: 'Os prints das estatísticas do Instagram que anexei, ou os números do conector de redes sociais, se estiver ligado. Sem número, não avalie o post.',
    entrega: [
      'Em uma frase (negrito): o que funcionou e o que não funcionou, com o número',
      'Posts em UMA tabela (Post | Data | Formato | Alcance | Salvamentos | Envios | Comentários | Seguidores ganhos | Leitura)',
      'Repetir e parar em UMA tabela de duas colunas, até 3 de cada, com o número que sustenta',
      'Testes para a próxima semana em UMA tabela de até 3 linhas (Hipótese | Como testar | O que medir)',
      'Atualização da ficha "Minhas referências"; pergunte antes de gravar',
      'Conferir, sempre a última coisa da resposta, em texto simples e sem título, negrito ou tabela',
    ],
  },
};

// Campos de cada tarefa (seção 8.4; "Como foram meus posts" não tem campos no plano: ver a decisão no relatório).
const PERFIS = 'Perfis que acompanho (opcional)';
const LINKS = 'Links ou legendas de posts (opcional)';
const CAMPOS = {
  referencias: ['Perfis que acompanho (até 10)', 'O que eu admiro neles (opcional)', 'Dúvidas que meus clientes mais fazem (opcional)', LINKS],
  pauta: ['Para quem quero falar', 'Dúvidas que clientes e prospects mais me fazem (opcional)', 'Meus posts que mais salvaram ou geraram conversa (opcional)', PERFIS, LINKS],
  calendario: ['Semana ou período', 'Temas que quero incluir (opcional)', PERFIS],
  'meus-posts': ['Números dos posts (ou anexe os prints)', 'Período'],
};

const itens = (texto) => {
  const linhas = texto.split('\n'), r = [];
  for (let k = linhas.indexOf('O que preciso receber:') + 1; k > 0 && k < linhas.length && linhas[k].startsWith('- '); k++) r.push(linhas[k].slice(2));
  return r;
};

// O bloco do catálogo da tela, sem navegador, com uma saída para as funções internas que o teste usa.
function blocoDe(arq) {
  const linhas = readFileSync(arq, 'utf8').split('\n');
  const ini = linhas.findIndex((l) => /^ {2}const AREAS = /.test(l));
  const fim = linhas.findIndex((l, i) => i > ini && l.startsWith('  const $ = (s) => document.querySelector(s);'));
  const ctx = vm.createContext({ window: {}, console });
  const fonte = linhas.slice(ini, fim).join('\n') + '\n;globalThis.__t = { acha: (r) => achaTarefa(r) };';
  new vm.Script(fonte, { filename: arq }).runInContext(ctx, { timeout: 5000 });
  return ctx.__t;
}

for (const { nome, arq, cat } of TELAS) {
  test(`${nome} · Marketing: o grupo Post para Instagram segue o ciclo da seção 8.2, e a área conta ${nome === 'janela' ? 7 : 6} tarefas`, () => {
    const { T } = cat.retrato();
    const menu = cat.tarefasDoMenu().filter((x) => x.area === 'instagram');
    assert.equal(menu[0].areaNome, 'Marketing Profissional');
    assert.deepEqual(menu.filter((x) => x.grupo === 'Post para Instagram').map((x) => T[x.id].nome), CICLO);
    assert.deepEqual(menu.filter((x) => x.grupo !== 'Post para Instagram').map((x) => T[x.id].nome),
      nome === 'janela' ? ['Editar um vídeo (Reels)', 'Landing page'] : ['Landing page']);
    assert.equal(menu.length, nome === 'janela' ? 7 : 6);
  });

  for (const [id, p] of Object.entries(PEDIDOS)) {
    test(`${nome} · ${p.nome}: objetivo, fonte e entrega do plano, palavra por palavra`, () => {
      const m = cat.montar(id, id === 'calendario' ? { quantos: ['5'], programar: ['Só quero a pasta'] } : {}, []);
      assert.equal(m.nome, p.nome);
      assert.ok(m.texto.startsWith(`[Mesa] Marketing Profissional › ${p.nome}\n`), m.texto.slice(0, 80));
      assert.ok(m.texto.includes(`\nObjetivo: ${p.obj}\n`), `objetivo diferente do plano em ${id}`);
      assert.ok(m.texto.includes(`\nFonte dos dados: ${p.fonte}\n`), `fonte diferente do plano em ${id}`);
      assert.deepEqual(itens(m.texto), p.entrega);
      assert.ok(/\nSkill: [^\n]*pauta-de-conteudo/.test(m.texto), 'o pedido não aponta a skill de pauta');
      assert.deepEqual(m.campos.map((f) => f.rotulo), CAMPOS[id]);
    });
  }

  test(`${nome} · Semana de posts pronta pergunta objetivo, quantos posts e como programar`, () => {
    const m = cat.montar('calendario', { objetivo: ['Educar'], quantos: ['5'], programar: ['Só quero a pasta'] }, []);
    assert.deepEqual(m.perguntas.map((p) => p.id), ['objetivo', 'quantos', 'programar']);
    const [obj, qt, pg] = m.perguntas;
    assert.equal(obj.titulo, 'Qual o objetivo da semana?');
    assert.equal(qt.titulo, 'Quantos posts?');
    assert.deepEqual(qt.opcoes, ['3', '5', '7']);
    assert.equal(pg.titulo, 'Como você vai programar?');
    assert.deepEqual(pg.opcoes, ['Meta Business Suite', 'Conector ligado ao Claude', 'Só quero a pasta']);
    assert.ok(m.texto.includes('\n- Posts: 5\n'), 'a escolha de quantos posts não entrou no pedido');
    assert.ok(m.texto.includes('\n- Programar: Só quero a pasta\n'), 'a escolha de como programar não entrou no pedido');
    const { T } = cat.retrato();
    assert.match(T.calendario.perguntas[1].opcoes[1].d ?? '', /padrão/i, 'a opção 5 não diz que é o padrão');
  });

  test(`${nome} · Ideias para postar hoje pergunta o objetivo do post de hoje; as tarefas novas vão direto aos campos`, () => {
    const p = cat.montar('pauta', {}, []);
    assert.deepEqual(p.perguntas.map((x) => x.id), ['objetivo']);
    assert.equal(p.perguntas[0].titulo, 'O que você quer com o post de hoje?');
    for (const id of ['referencias', 'meus-posts']) {
      const m = cat.montar(id, {}, []);
      assert.deepEqual(m.perguntas, [], `${id} não deveria ter pergunta`);
      assert.ok(!m.texto.includes('Minhas escolhas:'), `${id} escreve escolhas que não existem`);
    }
  });

  test(`${nome} · "Perfis que acompanho" já vem preenchido com Minhas referências do perfil`, () => {
    try {
      cat.definir({ perfil: { nome: 'Assessor Teste', referencias: 'Perfis: @perfil.um, @perfil_dois e @perfil.um.\nPadrão: carrossel com número na capa' } });
      for (const id of ['pauta', 'calendario']) {
        assert.ok(cat.montar(id, {}, []).texto.includes(`\n- ${PERFIS}: @perfil.um, @perfil_dois\n`), `${id} sem os perfis do perfil`);
      }
      assert.ok(cat.montar('referencias', {}, []).texto.includes('\n- Perfis que acompanho (até 10): @perfil.um, @perfil_dois\n'));
      cat.definir({ perfil: { nome: 'Assessor Teste', referencias: 'Sigo dois assessores do Sul que postam toda semana' } });
      assert.ok(cat.montar('pauta', {}, []).texto.includes(`\n- ${PERFIS}: Sigo dois assessores do Sul que postam toda semana\n`));
      cat.definir({ perfil: { nome: 'Assessor Teste' } });
      assert.ok(cat.montar('pauta', {}, []).texto.includes(`\n- ${PERFIS}: (não informado, é opcional)\n`));
      assert.ok(cat.montar('referencias', {}, []).texto.includes('\n- Perfis que acompanho (até 10): [COLE AQUI]\n'));
    } finally { cat.definir({ perfil: null }); }
  });

  test(`${nome} · o nome antigo "Calendário de post" ainda acha a tarefa`, () => {
    const t = blocoDe(arq);
    assert.equal(t.acha('Calendário de post'), 'calendario');
    assert.equal(t.acha('calendário de post'), 'calendario');
    assert.equal(t.acha('Semana de posts pronta'), 'calendario');
    assert.equal(t.acha('Estudar perfis de referência'), 'referencias');
    assert.equal(t.acha('Como foram meus posts'), 'meus-posts');
  });
}

test('as duas telas trazem as tarefas de Marketing iguais', () => {
  const [a, b] = TELAS.map(({ cat }) => cat.retrato());
  for (const id of Object.keys(PEDIDOS)) {
    assert.deepEqual(a.T[id], b.T[id], `T.${id}`);
    assert.deepEqual(a.PEDIDO[id], b.PEDIDO[id], `PEDIDO.${id}`);
    assert.deepEqual(a.CAMPOS[id], b.CAMPOS[id], `CAMPOS.${id}`);
  }
});

test('o texto das áreas que o Claude recebe lista o ciclo de Marketing', () => {
  const m = readFileSync(path.join(SERV, 'server.mjs'), 'utf8').match(/const AREAS = ((?:\s*'(?:[^'\\]|\\.)*'\s*\+?)+);/);
  const texto = vm.runInNewContext(m[1]).toLowerCase();
  const mk = texto.slice(texto.indexOf('marketing profissional'));
  assert.ok(mk.includes('post para instagram: estudar perfis de referência, ideias para postar hoje, semana de posts pronta, criar um post, como foram meus posts'), mk);
  assert.ok(!texto.includes('calendário de post'), 'ainda cita o nome antigo');
});

// ---------------------------------------------------------------------------------------------------------
// Servidor da Mesa pelo mesmo canal que o Claude usa (MCP por entrada e saída padrão), numa pasta temporária.
function servidor(env) {
  const p = spawn(process.execPath, [path.join(SERV, 'server.mjs')], { env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  let buf = '', id = 0, erro = '';
  const espera = new Map();
  p.stderr.on('data', (d) => { erro += d; });
  p.on('exit', (c) => { for (const [, f] of espera) f({ error: { message: `o servidor saiu (código ${c}): ${erro.slice(-400)}` } }); espera.clear(); });
  p.stdout.on('data', (d) => {
    buf += d;
    for (let k; (k = buf.indexOf('\n')) >= 0;) {
      const linha = buf.slice(0, k); buf = buf.slice(k + 1);
      try { const m = JSON.parse(linha); if (espera.has(m.id)) { espera.get(m.id)(m); espera.delete(m.id); } } catch { }
    }
  });
  const chamar = (method, params) => new Promise((ok) => { const n = ++id; espera.set(n, ok); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: n, method, params }) + '\n'); });
  return {
    async iniciar() {
      await chamar('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'bancada', version: '1' } });
      p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    },
    ferramenta: (name, args) => chamar('tools/call', { name, arguments: args }),
    fechar: () => p.kill(),
  };
}
const ambiente = (tmp) => ({ ...process.env, USERPROFILE: tmp, HOME: tmp, TEMP: tmp, TMP: tmp, MESA_PERFIL_DIR: path.join(tmp, 'perfil'), MESA_TAREFA: path.join(tmp, 'tarefa.json'),
  MESA_ANDAMENTO: path.join(tmp, 'andamento.json'), MESA_COFRE: path.join(tmp, 'cofre'), CAPTAMAIS_MARKET_KEY: '',
  METODO_SKILLS: path.join(SERV, 'skills'), ROTINAS_SKILLS: path.join(SERV, 'rotinas'), MESA_BASE: path.join(SERV, 'base-assessor.md') });
// PNG de 1 x 1 ponto, só para a foto de teste.
const PNG_MINIMO = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const tamanhoPng = (arq) => { const b = readFileSync(arq); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test('mesa_perfil guarda e devolve "Minhas referências"', { timeout: 60000 }, async () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'mesa-passo6-perfil-'));
  const s = servidor(ambiente(tmp));
  try {
    await s.iniciar();
    const ficha = 'Perfis: @perfil.um, @perfil_dois\nPadrão: carrossel de 7 slides com número grande na capa';
    const g = await s.ferramenta('mesa_perfil', { salvar: { nome: 'Assessor Teste', referencias: ficha } });
    assert.ok(!g.error && !g.result.isError, JSON.stringify(g).slice(0, 400));
    const l = await s.ferramenta('mesa_perfil', {});
    assert.equal(l.result.structuredContent.perfil.referencias, ficha);
    assert.equal(JSON.parse(l.result.content[0].text).referencias, ficha, 'o Claude não recebe a ficha');
    const disco = JSON.parse(readFileSync(path.join(tmp, 'perfil', readdirSync(path.join(tmp, 'perfil')).find((f) => f.endsWith('.json'))), 'utf8'));
    assert.equal(disco.referencias, ficha);
    await s.ferramenta('mesa_perfil', { salvar: { tom: 'direto' } });
    assert.equal((await s.ferramenta('mesa_perfil', {})).result.structuredContent.perfil.referencias, ficha, 'salvar outro campo apagou a ficha');
    const grande = await s.ferramenta('mesa_perfil', { salvar: { referencias: 'x'.repeat(3001) } });
    assert.ok(grande.error || grande.result.isError, 'aceitou ficha maior que 3.000 caracteres');
  } finally { s.fechar(); rmSync(tmp, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------------------------------------------------
// Carrossel: tipos novos, contador, seta, foto, cor e tema da marca (montado sem navegador).
const BASE = { titulo: 'Teste do carrossel', rodape: 'Assessor Teste · Escritório Teste · Conteúdo educativo, não é recomendação' };
const SETE = [
  { tipo: 'capa', titulo: 'Como ler o seu extrato' },
  { tipo: 'numero', titulo: 'O prazo para conferir', destaque: '48 h', texto: 'depois de postar' },
  { tipo: 'lista', titulo: 'Três passos', itens: [{ titulo: 'Item um', texto: 'texto um' }, { titulo: 'Item dois', texto: 'texto dois' }, { titulo: 'Item três' }] },
  { tipo: 'comparacao', titulo: 'Antes e depois', colunas: [{ titulo: 'Antes', itens: ['sem lista', 'sem data'] }, { titulo: 'Depois', texto: 'com lista e data' }] },
  { tipo: 'passos', titulo: 'Como fazer', passos: ['Abrir o extrato', 'Separar por prazo', 'Anotar as datas'] },
  { tipo: 'citacao', titulo: 'O que ouvi', texto: 'Eu nunca soube quando vencia cada aplicação.', autor: 'Cliente Teste' },
  { tipo: 'fechamento', titulo: 'Quer ajuda com o seu?', texto: 'Me chame no direct.' },
];

test('carrossel: os cinco tipos novos de slide aparecem com o conteúdo enviado', () => {
  const c = gerador.montarCarrossel({ ...BASE, slides: SETE }, {});
  assert.equal(c.slides.length, 7);
  assert.equal(c.W, 1080); assert.equal(c.H, 1350);
  const [, numero, lista, comp, passos, citacao] = c.slides;
  assert.match(numero, /class="slide numero"/); assert.match(numero, /class="gigante"[^>]*>48 h</); assert.match(numero, /depois de postar/);
  assert.match(lista, /class="slide lista"/);
  for (const x of ['Item um', 'texto um', 'Item dois', 'Item três']) assert.ok(lista.includes(x), x);
  assert.equal((lista.match(/<li/g) || []).length, 3);
  assert.match(comp, /class="slide comparacao"/);
  for (const x of ['Antes', 'Depois', 'sem lista', 'sem data', 'com lista e data']) assert.ok(comp.includes(x), x);
  assert.equal((comp.match(/class="coluna/g) || []).length, 2);
  assert.match(passos, /class="slide passos"/);
  for (const x of ['Abrir o extrato', 'Separar por prazo', 'Anotar as datas']) assert.ok(passos.includes(x), x);
  assert.match(citacao, /class="slide citacao"/); assert.match(citacao, /Eu nunca soube quando vencia cada aplicação\./); assert.match(citacao, /Cliente Teste/);
});

test('carrossel: contador "2/7", seta de arrastar na capa e seta em todo slide menos o último', () => {
  const c = gerador.montarCarrossel({ ...BASE, slides: SETE }, {});
  c.slides.forEach((h, k) => assert.match(h, new RegExp(`class="cont">${k + 1}/7<`), `slide ${k + 1}`));
  assert.match(c.slides[0], /Arraste/);
  c.slides.slice(0, -1).forEach((h, k) => assert.match(h, /class="seta">→</, `slide ${k + 1} sem seta`));
  assert.doesNotMatch(c.slides[6], /class="seta">→</);
  assert.doesNotMatch(c.slides[6], /Arraste/);
  const um = gerador.montarCarrossel({ ...BASE, slides: [{ tipo: 'capa', titulo: 'Arte única' }] }, {});
  assert.doesNotMatch(um.slides[0], /Arraste|class="cont">1\/1</, 'arte única não tem contador nem seta');
});

test('carrossel: foto, nome e cargo do perfil na capa e no fechamento; sem foto, as iniciais', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'mesa-passo6-foto-'));
  try {
    const foto = path.join(tmp, 'foto.png'); writeFileSync(foto, PNG_MINIMO);
    const marca = { foto, nome: 'Assessor Teste', cargo: 'Assessor de investimento', escritorio: 'Escritório Teste' };
    const c = gerador.montarCarrossel({ ...BASE, slides: SETE }, marca);
    for (const k of [0, 6]) {
      assert.ok(c.slides[k].includes('data:image/png;base64,'), `slide ${k + 1} sem a foto`);
      assert.ok(c.slides[k].includes('Assessor Teste'), `slide ${k + 1} sem o nome`);
    }
    assert.ok(c.slides[0].includes('Assessor de investimento · Escritório Teste'));
    for (const k of [1, 2, 3, 4, 5]) assert.ok(!c.slides[k].includes('data:image'), `slide ${k + 1} com foto`);
    assert.deepEqual(c.avisos, []);
    const sem = gerador.montarCarrossel({ ...BASE, slides: SETE }, { nome: 'Assessor Teste' });
    assert.match(sem.slides[0], /class="rosto iniciais">AT</);
    const sumiu = gerador.montarCarrossel({ ...BASE, slides: SETE }, { nome: 'Assessor Teste', foto: path.join(tmp, 'nao-existe.png') });
    assert.ok(sumiu.avisos.some((a) => /foto/.test(a)), 'foto que não existe não virou aviso');
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('carrossel: tema e cor vêm da marca do perfil; o que vier na chamada vence', () => {
  const s = { ...BASE, slides: SETE.slice(0, 2) };
  assert.ok(gerador.montarCarrossel(s, { cor: '#3366CC' }).css.includes('#3366CC'));
  const v = gerador.montarCarrossel({ ...s, cor: '#AA0000' }, { cor: '#3366CC' }).css;
  assert.ok(v.includes('#AA0000') && !v.includes('#3366CC'));
  assert.ok(gerador.montarCarrossel(s, { tema: 'marinho' }).css.includes('#0B1F33'), 'tema marinho da marca');
  assert.ok(gerador.montarCarrossel(s, { tema: 'claro' }).css.includes('#F7F3EC'), 'tema claro da marca');
  assert.ok(gerador.montarCarrossel({ ...s, tema: 'escuro' }, { tema: 'claro' }).css.includes('#101113'));
  const st = gerador.montarCarrossel({ ...s, formato: 'stories' }, {});
  assert.deepEqual([st.W, st.H], [1080, 1920]);
});

test('carrossel: texto enviado é escapado e o máximo segue 10 slides (limite de fotos do Meta Business Suite)', () => {
  const c = gerador.montarCarrossel({ ...BASE, slides: [{ tipo: 'lista', titulo: '<b>x</b>', itens: [{ titulo: '<i>y</i>' }] }] }, {});
  assert.ok(c.slides[0].includes('&lt;b&gt;x&lt;/b&gt;') && c.slides[0].includes('&lt;i&gt;y&lt;/i&gt;'));
  const doze = Array.from({ length: 12 }, (_, k) => ({ titulo: `Slide ${k + 1}` }));
  assert.equal(gerador.montarCarrossel({ ...BASE, slides: doze }, {}).slides.length, 10);
});

// ---------------------------------------------------------------------------------------------------------
// Trava de palavras do carrossel: promessa, risco zero, superlativo e retorno sem período, em todo texto do slide.
test('carrossel: a trava lê todo campo de texto dos tipos novos', () => {
  const casos = [
    { tipo: 'lista', titulo: 'ok', itens: [{ titulo: 'Retorno garantido' }] },
    { tipo: 'lista', titulo: 'ok', itens: [{ titulo: 'ok', texto: 'sem risco nenhum' }] },
    { tipo: 'comparacao', titulo: 'ok', colunas: [{ titulo: 'A', itens: ['risco zero'] }, { titulo: 'B' }] },
    { tipo: 'comparacao', titulo: 'ok', colunas: [{ titulo: 'A' }, { titulo: 'B', texto: 'imperdível' }] },
    { tipo: 'comparacao', titulo: 'ok', colunas: [{ titulo: 'Oportunidade única' }, { titulo: 'B' }] },
    { tipo: 'passos', titulo: 'ok', passos: ['Aplicar e ver que vai render'] },
    { tipo: 'citacao', titulo: 'ok', texto: 'Dinheiro fácil todo mês.', autor: 'x' },
    { tipo: 'citacao', titulo: 'ok', texto: 'ok', autor: 'Quem garante o retorno' },
    { tipo: 'numero', titulo: 'ok', destaque: 'Risco zero' },
    { tipo: 'capa', titulo: 'A rentabilidade da poupança' },
  ];
  casos.forEach((s, k) => assert.equal(gerador.revisarCarrossel([s]).length > 0, true, `caso ${k + 1} passou: ${JSON.stringify(s)}`));
});

test('carrossel: fonte e rodapé passam pela lista sem contar como retorno; período, [CONFERIR] e termosConfirmados', () => {
  assert.deepEqual(gerador.revisarCarrossel([{ tipo: 'numero', titulo: 'O prazo para conferir', destaque: '48 h', fonte: 'Central de Ajuda da Meta, lida em 18/11/2026' }]), []);
  assert.ok(gerador.revisarCarrossel([{ titulo: 'ok', fonte: 'Fonte Teste: risco zero' }]).length > 0, 'a fonte também sai na imagem');
  assert.ok(gerador.revisarCarrossel([{ titulo: 'ok' }], [], 'Assessor Teste · retorno garantido').length > 0, 'o rodapé também sai na imagem');
  assert.deepEqual(gerador.revisarCarrossel([{ titulo: 'A rentabilidade da poupança em 12 meses' }]), []);
  assert.deepEqual(gerador.revisarCarrossel([{ titulo: 'A rentabilidade da poupança', fonte: 'BCB, 12 meses até out/2026' }]), []);
  assert.ok(gerador.revisarCarrossel([{ titulo: 'Retorno garantido [CONFERIR]' }]).length > 0, '[CONFERIR] liberou a promessa numa imagem que vai ao público');
  assert.deepEqual(gerador.revisarCarrossel([{ titulo: 'Risco zero de esquecer o vencimento' }], ['risco zero']), []);
  assert.match(gerador.revisarCarrossel([{ titulo: 'ok' }, { titulo: 'ok', passos: ['vai render'] }])[0], /^slide 2:/);
});

test('mesa_carrossel não gera imagem com frase barrada pela trava', { timeout: 60000 }, async () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'mesa-passo6-trava-'));
  mkdirSync(path.join(tmp, 'Documents'));
  const s = servidor(ambiente(tmp));
  try {
    await s.iniciar();
    const r = await s.ferramenta('mesa_carrossel', { ...BASE, pasta: 'Semana de 23-11/1-seg-teste', slides: [{ tipo: 'lista', titulo: 'ok', itens: [{ titulo: 'Retorno garantido' }] }] });
    assert.ok(r.result?.isError, JSON.stringify(r).slice(0, 300));
    const msg = r.result.content[0].text;
    assert.match(msg, /Retorno garantido/); assert.match(msg, /termosConfirmados/);
    assert.doesNotMatch(msg, /Entregue o texto dos slides no chat/, 'trava não pode mandar entregar o texto barrado');
    assert.ok(!existsSync(path.join(tmp, 'Documents', 'Mesa do Assessor', 'Semana de 23-11')), 'criou a pasta mesmo barrando');
  } finally { s.fechar(); rmSync(tmp, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------------------------------------------------
// Pasta da semana: dentro de Mesa do Assessor, sempre, com nome limpo.
test('carrossel: a pasta pedida fica dentro da pasta da Mesa, com nome limpo', () => {
  const base = mkdtempSync(path.join(os.tmpdir(), 'mesa-passo6-pasta-'));
  try {
    const r = (p) => gerador.resolverPasta(base, p);
    assert.equal(r('Semana de 23-11/1-seg-tema'), path.join(base, 'Semana de 23-11', '1-seg-tema'));
    assert.equal(r('Semana de 23-11\\2-ter-previdência'), path.join(base, 'Semana de 23-11', '2-ter-previdência'));
    assert.equal(r('../../Windows/System32'), path.join(base, 'Windows', 'System32'));
    assert.equal(r('C:\\Users\\Fulano'), path.join(base, 'C', 'Users', 'Fulano'));
    assert.equal(r('/etc/passwd'), path.join(base, 'etc', 'passwd'));
    assert.equal(r('Semana <23>: "x"|y?*'), path.join(base, 'Semana 23 xy'));
    assert.equal(r('CON/nul.txt'), path.join(base, '_CON', '_nul.txt'));
    assert.equal(path.basename(r('x'.repeat(100))).length, 60);
    assert.equal(r('a/b/c/d'), path.join(base, 'a', 'b', 'c-d'));
    for (const vazio of ['', '..', '///', ' . ', '...', null, undefined]) assert.equal(r(vazio), null, JSON.stringify(vazio));
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test('carrossel: pasta que já tem arquivo não é sobrescrita, ganha " (2)"', () => {
  const base = mkdtempSync(path.join(os.tmpdir(), 'mesa-passo6-pasta-'));
  try {
    const alvo = path.join(base, 'Semana de 23-11', '1-seg-tema');
    mkdirSync(alvo, { recursive: true });
    assert.equal(gerador.resolverPasta(base, 'Semana de 23-11/1-seg-tema'), alvo, 'pasta vazia pode ser usada');
    writeFileSync(path.join(alvo, 'slide-01.png'), 'x');
    assert.equal(gerador.resolverPasta(base, 'Semana de 23-11/1-seg-tema'), alvo + ' (2)');
    mkdirSync(alvo + ' (2)'); writeFileSync(path.join(alvo + ' (2)', 'slide-01.png'), 'x');
    assert.equal(gerador.resolverPasta(base, 'Semana de 23-11/1-seg-tema'), alvo + ' (3)');
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test('mesa_carrossel gera as imagens na pasta da semana, com a marca do perfil', { timeout: 240000 }, async () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'mesa-passo6-render-'));
  mkdirSync(path.join(tmp, 'Documents'));
  const s = servidor(ambiente(tmp));
  try {
    await s.iniciar();
    const foto = path.join(tmp, 'foto.png'); writeFileSync(foto, PNG_MINIMO);
    await s.ferramenta('mesa_perfil', { salvar: { nome: 'Assessor Teste', atuacao: 'Assessor de investimento', marca: { tema: 'marinho', cor: '#3366CC', foto } } });
    const pedido = { ...BASE, pasta: 'Semana de 23-11/1-seg-teste', slides: [SETE[0], SETE[1], SETE[2], SETE[6]] };
    const r = await s.ferramenta('mesa_carrossel', pedido);
    assert.ok(!r.error && !r.result.isError, JSON.stringify(r).slice(0, 500));
    const j = JSON.parse(r.result.content[0].text);
    const esperado = path.join(tmp, 'Documents', 'Mesa do Assessor', 'Semana de 23-11', '1-seg-teste');
    assert.equal(j.pasta, esperado);
    assert.deepEqual(j.imagens, ['slide-01.png', 'slide-02.png', 'slide-03.png', 'slide-04.png']);
    for (const im of j.imagens) assert.deepEqual(tamanhoPng(path.join(esperado, im)), [1080, 1350], im);
    assert.ok(existsSync(j.pdf) && path.dirname(j.pdf) === esperado);
    assert.ok(!j.avisos, `avisos inesperados: ${j.avisos}`);
    const de_novo = JSON.parse((await s.ferramenta('mesa_carrossel', pedido)).result.content[0].text);
    assert.equal(de_novo.pasta, esperado + ' (2)', 'a segunda geração sobrescreveu a primeira');
    await s.ferramenta('mesa_perfil', { salvar: { marca: { foto: path.join(tmp, 'sumiu.png') } } });
    const aviso = JSON.parse((await s.ferramenta('mesa_carrossel', { ...pedido, slides: [SETE[0]] })).result.content[0].text);
    assert.ok((aviso.avisos || []).some((a) => /foto/.test(a)), 'a marca do perfil não chegou ao gerador');
  } finally { s.fechar(); rmSync(tmp, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------------------------------------------------
// Skills e modo chat.
test('skill de pauta: o limite do que o Claude enxerga depende do que foi enviado; FInfluence com edição e data', () => {
  const s = readFileSync(path.join(SERV, 'skills', 'pauta-de-conteudo', 'SKILL.md'), 'utf8');
  assert.ok(!s.includes('Você não enxerga as métricas do Instagram dele nem o que os concorrentes postam por dentro'), 'a frase fixa continua');
  for (const x of ['Estudar perfis de referência', 'Como foram meus posts', 'Minhas referências', 'FInfluence', '11ª edição', '16/11/2026', 'mesa_perfil']) assert.ok(s.includes(x), `falta ${x}`);
  assert.match(s, /0 a 10/);
});

test('skill de calendário: pasta da semana e o passo a passo da Central de Ajuda da Meta, com a data da leitura', () => {
  const s = readFileSync(path.join(SERV, 'skills', 'calendario-de-conteudo', 'SKILL.md'), 'utf8');
  for (const x of ['mesa_carrossel', 'pasta', 'Semana de', 'Meta Business Suite', '2223502627919449', '18/11/2026', 'Programar', 'Horários ativos', '10 fotos']) assert.ok(s.includes(x), `falta ${x}`);
});

test('modo chat: as tabelas de Marketing listam o ciclo novo', () => {
  const chat = readFileSync(path.join(RAIZ, 'skill-mesa', 'SKILL.md'), 'utf8');
  for (const n of CICLO) assert.ok(chat.includes(n), `skill-mesa sem ${n}`);
  assert.ok(!chat.includes('Calendário de post'), 'skill-mesa ainda cita o nome antigo');
  const app = readFileSync(path.join(RAIZ, 'skill-mesa-app', 'SKILL.md'), 'utf8');
  for (const n of ['Estudar perfis de referência', 'Ideias para postar hoje', 'Semana de posts pronta', 'Como foram meus posts']) assert.ok(app.includes(n), `skill-mesa-app sem ${n}`);
});
