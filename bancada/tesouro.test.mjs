// Passo 7 do plano de melhorias (Produtos): a ferramenta taxas_tesouro, que lê o arquivo oficial de preços e taxas do
// Tesouro Direto (Tesouro Transparente) e devolve, para um título, as taxas de compra e de venda, os preços e a data base,
// mais os títulos de vencimento parecido. Sem internet: o arquivo vem de um trecho do CSV real de 18/11/2026
// (bancada/fixtures/tesouro-trecho.csv: o cabeçalho, as 58 linhas de 17/11/2026 e 6 linhas de 16/11/2026 fora de ordem).
// Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = process.env.MESA_RAIZ || path.resolve(AQUI, '..');
const D = await import(pathToFileURL(path.join(RAIZ, 'servidor', 'dados-publicos.mjs')).href);
const CSV = readFileSync(path.join(AQUI, 'fixtures', 'tesouro-trecho.csv'), 'latin1');
const ETAG = '"1794997396.09-14700232"', LM = 'Wed, 18 Nov 2026 10:23:16 GMT';
const AGORA = Date.parse('2026-11-18T16:00:00-03:00');
const pasta = () => mkdtempSync(path.join(os.tmpdir(), 'mesa-tesouro-'));

// Servidor de mentira no lugar do fetch: guarda os pedidos e responde na ordem dada.
function buscaFalsa(respostas) {
  const pedidos = [];
  const f = async (url, init = {}) => {
    pedidos.push({ url, cabecalhos: Object.fromEntries(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v])) });
    const r = respostas.shift();
    if (!r) throw new Error('pedido a mais');
    if (r instanceof Error) throw r;
    return new Response(r.corpo ?? null, { status: r.status, headers: r.cabecalhos || {} });
  };
  f.pedidos = pedidos;
  return f;
}
const OK = () => ({ status: 200, corpo: CSV, cabecalhos: { etag: ETAG, 'last-modified': LM, 'content-type': 'text/csv' } });

// ---------- leitura do arquivo ----------
test('lê a última data base do arquivo, mesmo com linhas de outra data antes e depois do bloco', () => {
  const r = D.lerTesouro(CSV);
  assert.equal(r.dataBase, '2026-11-17');
  assert.equal(r.titulos.length, 58);
  assert.ok(r.titulos.every((t) => t.dataBase === '2026-11-17'));
  const ipca35 = r.titulos.find((t) => t.tipo === 'Tesouro IPCA+' && t.vencimento === '2035-05-15');
  // linha do CSV: Tesouro IPCA+;15/05/2035;17/11/2026;7,76;7,88;2543,22;2518,40;2518,40
  assert.deepEqual([ipca35.taxaCompra, ipca35.taxaVenda, ipca35.puCompra, ipca35.puVenda, ipca35.puBase], [7.76, 7.88, 2543.22, 2518.4, 2518.4]);
});

test('acha as colunas pelo nome e aceita ponto de milhar no preço (formato que os metadados oficiais descrevem)', () => {
  const r = D.lerTesouro('Data Base;Tipo Titulo;Data Vencimento;Taxa Venda Manha;Taxa Compra Manha;PU Compra Manha;PU Venda Manha;PU Base Manha\r\n' +
    '17/11/2026;Tesouro IPCA+;15/05/2035;7,88;7,76;2.543,22;2.518,40;2.518,40\r\n');
  assert.deepEqual([r.titulos[0].taxaCompra, r.titulos[0].taxaVenda, r.titulos[0].puCompra], [7.76, 7.88, 2543.22]);
});

test('arquivo com outro formato: diz a coluna que falta, sem inventar número', () => {
  assert.throws(() => D.lerTesouro('Tipo;Vencimento;Taxa\nTesouro Selic;01/03/2031;0,11\n'), /falta a coluna/);
  assert.throws(() => D.lerTesouro(''), /falta a coluna|vazio/);
});

// ---------- nomes e taxas ----------
test('nome comercial: Renda+ e Educa+ levam o ano da conversão, não o do vencimento', () => {
  assert.equal(D.nomeDoTitulo('Tesouro Renda+ Aposentadoria Extra', '2049-12-15'), 'Tesouro Renda+ Aposentadoria Extra 2030');
  assert.equal(D.nomeDoTitulo('Tesouro Educa+', '2031-12-15'), 'Tesouro Educa+ 2027');
  assert.equal(D.nomeDoTitulo('Tesouro IPCA+', '2035-05-15'), 'Tesouro IPCA+ 2035');
  assert.equal(D.nomeDoTitulo('Tesouro Prefixado com Juros Semestrais', '2037-01-01'), 'Tesouro Prefixado com Juros Semestrais 2037');
});

test('a taxa sai junto com o indexador do tipo do título', () => {
  assert.equal(D.taxaEmTexto('Tesouro Selic', 0.11), 'Selic + 0,11% ao ano');
  assert.equal(D.taxaEmTexto('Tesouro IPCA+', 7.76), 'IPCA + 7,76% ao ano');
  assert.equal(D.taxaEmTexto('Tesouro Renda+ Aposentadoria Extra', 7.58), 'IPCA + 7,58% ao ano');
  assert.equal(D.taxaEmTexto('Tesouro IGPM+ com Juros Semestrais', 7.64), 'IGP-M + 7,64% ao ano');
  assert.equal(D.taxaEmTexto('Tesouro Prefixado', 15.27), '15,27% ao ano (prefixado)');
  assert.equal(D.taxaEmTexto('Tesouro Prefixado', 14.9), '14,90% ao ano (prefixado)');
});

// ---------- achar o título ----------
const { titulos } = D.lerTesouro(CSV);
const achar = (q) => D.acharTitulo(titulos, q);

test('acha o título pelo nome do site, com ou sem "Tesouro", e pelos nomes antigos (LTN, NTN-B...)', () => {
  const casos = [
    ['Tesouro IPCA+ 2035', 'Tesouro IPCA+', '2035-05-15'],
    ['ipca+ 2035', 'Tesouro IPCA+', '2035-05-15'],
    ['IPCA+ com juros semestrais 2035', 'Tesouro IPCA+ com Juros Semestrais', '2035-05-15'],
    ['Prefixado 2029', 'Tesouro Prefixado', '2029-01-01'],
    ['Tesouro Prefixado com Juros Semestrais 2033', 'Tesouro Prefixado com Juros Semestrais', '2033-01-01'],
    ['Selic 2031', 'Tesouro Selic', '2031-03-01'],
    ['IGP-M 2031', 'Tesouro IGPM+ com Juros Semestrais', '2031-01-01'],
    ['LTN 2028', 'Tesouro Prefixado', '2028-01-01'],
    ['NTN-B Principal 2045', 'Tesouro IPCA+', '2045-05-15'],
    ['NTN-B 2045', 'Tesouro IPCA+ com Juros Semestrais', '2045-05-15'],
    ['LFT 2029', 'Tesouro Selic', '2029-03-01'],
  ];
  for (const [q, tipo, venc] of casos) {
    const r = achar(q);
    assert.ok(r.titulo, `${q}: não achou`);
    assert.deepEqual([r.titulo.tipo, r.titulo.vencimento], [tipo, venc], q);
  }
});

test('Renda+ e Educa+: o ano do nome não é o vencimento', () => {
  const r = achar('Tesouro Renda+ 2030');
  assert.equal(r.titulo.vencimento, '2049-12-15');
  assert.equal(r.titulo.nome, 'Tesouro Renda+ Aposentadoria Extra 2030');
  assert.match(r.titulo.pagamento, /mensal/);
  const e = achar('Educa+ 2027');
  assert.equal(e.titulo.vencimento, '2031-12-15');
  // quem informa o ano do vencimento acha o mesmo título, com a explicação
  const v = achar('Renda+ 2049');
  assert.equal(v.titulo.nome, 'Tesouro Renda+ Aposentadoria Extra 2030');
  assert.match(v.nota, /2049 é o ano do vencimento/);
});

test('pela data de vencimento, com o tipo', () => {
  const r = D.acharTitulo(titulos, 'Tesouro IPCA+', { vencimento: '15/08/2032' });
  assert.deepEqual([r.titulo.tipo, r.titulo.vencimento], ['Tesouro IPCA+', '2032-08-15']);
});

test('sem tipo, o ano sozinho não escolhe: devolve as candidatas', () => {
  const r = achar('2035');
  assert.equal(r.titulo, null);
  assert.deepEqual(r.candidatas.map((c) => c.nome).sort(), ['Tesouro Educa+ 2031', 'Tesouro Educa+ 2035', 'Tesouro IPCA+ 2035', 'Tesouro IPCA+ com Juros Semestrais 2035', 'Tesouro Prefixado com Juros Semestrais 2035', 'Tesouro Renda+ Aposentadoria Extra 2035']);
  assert.equal(achar('Tesouro Prefixado 2099').titulo, null);
});

// ---------- prazo parecido ----------
test('títulos de vencimento parecido: o mais perto de cada tipo, sem Renda+ e Educa+ (pagam renda mensal)', () => {
  const p = D.parecidos(titulos, '2029-01-02');
  assert.deepEqual(p.map((x) => [x.tipo, x.vencimento]), [
    ['Tesouro Prefixado', '2029-01-01'],
    ['Tesouro Prefixado com Juros Semestrais', '2029-01-01'],
    ['Tesouro IPCA+', '2029-05-15'],
    ['Tesouro IPCA+ com Juros Semestrais', '2030-08-15'],
    ['Tesouro Selic', '2029-03-01'],
    ['Tesouro IGPM+ com Juros Semestrais', '2031-01-01'],
  ]);
  assert.equal(p[0].diasDoAlvo, -1);
  assert.equal(p[0].taxaCompraTexto, '14,98% ao ano (prefixado)');
  assert.deepEqual(D.parecidos(titulos, '2029-01-02', { indexador: 'ipca' }).map((x) => x.tipo), ['Tesouro IPCA+', 'Tesouro IPCA+ com Juros Semestrais']);
  // o próprio título fica de fora quando é ele o alvo
  const sem = D.parecidos(titulos, '2035-05-15', { excluir: { tipo: 'Tesouro IPCA+', vencimento: '2035-05-15' } });
  assert.ok(!sem.some((x) => x.tipo === 'Tesouro IPCA+' && x.vencimento === '2035-05-15'));
});

// ---------- a ferramenta, com o arquivo guardado no dia ----------
test('taxasTesouro: devolve o título com taxa, preço, data base e fonte; guarda a cópia do dia', async () => {
  const dir = pasta();
  try {
    const buscar = buscaFalsa([OK()]);
    const r = await D.taxasTesouro({ titulo: 'Tesouro IPCA+ 2032' }, { pastaCache: dir, buscar, agora: AGORA });
    assert.equal(buscar.pedidos.length, 1);
    assert.equal(buscar.pedidos[0].url, D.TESOURO_CSV);
    assert.equal(buscar.pedidos[0].cabecalhos['if-none-match'], undefined);
    assert.equal(r.dataBase, '2026-11-17');
    assert.match(r.fonte, /Tesouro Transparente/);
    assert.match(r.fonte, /data base 17\/11\/2026/);
    assert.equal(r.consulta, D.TESOURO_CSV);
    // linha do CSV: Tesouro IPCA+;15/08/2032;17/11/2026;7,78;7,90;3113,73;3092,70;3092,70
    assert.deepEqual(r.titulo && [r.titulo.nome, r.titulo.vencimento, r.titulo.taxaCompra, r.titulo.taxaVenda, r.titulo.puCompra, r.titulo.puVenda, r.titulo.puBase],
      ['Tesouro IPCA+ 2032', '2032-08-15', 7.78, 7.9, 3113.73, 3092.7, 3092.7]);
    assert.equal(r.titulo.taxaCompraTexto, 'IPCA + 7,78% ao ano');
    assert.equal(r.titulo.diasCorridosAteOVencimento, 2098);
    assert.ok(r.parecidos.length >= 4 && !r.parecidos.some((x) => x.tipo === 'Tesouro IPCA+' && x.vencimento === '2032-08-15'));
    assert.match(r.aviso, /não diz se o título está à venda/);
    assert.match(r.legenda, /taxaVenda/);
    assert.deepEqual(r.lacunas, []);
    assert.deepEqual(readdirSync(dir), ['tesouro-2026-11-18.json']);
    const guardado = JSON.parse(readFileSync(path.join(dir, 'tesouro-2026-11-18.json'), 'utf8'));
    assert.equal(guardado.etag, ETAG);
    assert.equal(guardado.ultimaAlteracao, LM);
    assert.equal(guardado.titulos.length, 58);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('taxasTesouro: na mesma meia hora não vai à rede; depois pergunta se mudou (304) e usa a cópia do dia', async () => {
  const dir = pasta();
  try {
    const buscar = buscaFalsa([OK(), { status: 304, cabecalhos: { etag: ETAG } }]);
    await D.taxasTesouro({ titulo: 'Selic 2031' }, { pastaCache: dir, buscar, agora: AGORA });
    D.limparMemoriaTesouro();
    const r2 = await D.taxasTesouro({ titulo: 'Selic 2031' }, { pastaCache: dir, buscar, agora: AGORA + 10 * 60000 });
    assert.equal(buscar.pedidos.length, 1, 'foi à rede de novo dentro da meia hora');
    assert.equal(r2.titulo.taxaCompraTexto, 'Selic + 0,11% ao ano');
    const r3 = await D.taxasTesouro({ titulo: 'Selic 2031' }, { pastaCache: dir, buscar, agora: AGORA + 45 * 60000 });
    assert.equal(buscar.pedidos.length, 2);
    assert.equal(buscar.pedidos[1].cabecalhos['if-none-match'], ETAG);
    assert.equal(buscar.pedidos[1].cabecalhos['if-modified-since'], LM);
    assert.equal(r3.dataBase, '2026-11-17');
    assert.equal(r3.titulo.puCompra, 20231.37);
    assert.deepEqual(r3.lacunas, []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('taxasTesouro: a cópia de outro dia sai quando a do dia é gravada; arquivo que não é do Tesouro fica', async () => {
  const dir = pasta();
  try {
    writeFileSync(path.join(dir, 'tesouro-2026-11-10.json'), '{}');
    writeFileSync(path.join(dir, 'outro-arquivo.json'), '{}');
    await D.taxasTesouro({ titulo: 'Prefixado 2029' }, { pastaCache: dir, buscar: buscaFalsa([OK()]), agora: AGORA });
    assert.deepEqual(readdirSync(dir).sort(), ['outro-arquivo.json', 'tesouro-2026-11-18.json']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('taxasTesouro: no dia seguinte, 304 renova a cópia guardada e apaga a de ontem', async () => {
  const dir = pasta();
  try {
    const buscar = buscaFalsa([OK(), { status: 304 }]);
    await D.taxasTesouro({ titulo: 'Prefixado 2029' }, { pastaCache: dir, buscar, agora: AGORA });
    D.limparMemoriaTesouro();
    const amanha = AGORA + 24 * 3600000;
    const r = await D.taxasTesouro({ titulo: 'Prefixado 2029' }, { pastaCache: dir, buscar, agora: amanha });
    assert.equal(buscar.pedidos[1].cabecalhos['if-none-match'], ETAG);
    assert.equal(r.titulo.taxaCompra, 14.98);
    assert.deepEqual(readdirSync(dir), ['tesouro-2026-11-19.json']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('taxasTesouro: sem rede e com cópia guardada, usa a cópia e diz isso; sem cópia, só a lacuna', async () => {
  const dir = pasta();
  try {
    await D.taxasTesouro({ titulo: 'IPCA+ 2035' }, { pastaCache: dir, buscar: buscaFalsa([OK()]), agora: AGORA });
    D.limparMemoriaTesouro();
    const r = await D.taxasTesouro({ titulo: 'IPCA+ 2035' }, { pastaCache: dir, buscar: buscaFalsa([new Error('rede caiu')]), agora: AGORA + 3 * 3600000 });
    assert.equal(r.titulo.taxaCompra, 7.76);
    assert.equal(r.lacunas.length, 1);
    assert.match(r.lacunas[0].motivo, /rede caiu/);
    assert.match(r.lacunas[0].motivo, /cópia guardada/);
    const vazio = pasta();
    try {
      const s = await D.taxasTesouro({ titulo: 'IPCA+ 2035' }, { pastaCache: vazio, buscar: buscaFalsa([{ status: 503 }]), agora: AGORA });
      assert.equal(s.titulo, null);
      assert.equal(s.dataBase, null);
      assert.match(s.lacunas[0].motivo, /HTTP 503/);
    } finally { rmSync(vazio, { recursive: true, force: true }); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('taxasTesouro: sem título, devolve a lista do dia; com vencimento, os de prazo parecido', async () => {
  const dir = pasta();
  try {
    const buscar = buscaFalsa([OK()]);
    const todos = await D.taxasTesouro({}, { pastaCache: dir, buscar, agora: AGORA });
    assert.equal(todos.titulo, null);
    assert.equal(todos.lista.length, 58);
    assert.deepEqual(Object.keys(todos.lista[0]).sort(), ['nome', 'taxaCompraTexto', 'tipo', 'vencimento']);
    const perto = await D.taxasTesouro({ vencimento: '02/01/2029' }, { pastaCache: dir, buscar, agora: AGORA });
    assert.equal(perto.titulo, null);
    assert.equal(perto.parecidos[0].nome, 'Tesouro Prefixado 2029');
    assert.equal(perto.lista, undefined);
    const naoAchou = await D.taxasTesouro({ titulo: 'Tesouro Prefixado 2099' }, { pastaCache: dir, buscar, agora: AGORA });
    assert.equal(naoAchou.titulo, null);
    assert.match(naoAchou.lacunas[0].motivo, /não há/i);
    assert.ok(naoAchou.candidatas.length > 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---------- o servidor da Mesa, de verdade, com um servidor HTTP local no lugar do Tesouro ----------
test('servidor da Mesa: taxas_tesouro aparece para o Claude, responde e usa a cópia do dia na segunda chamada', async () => {
  const pedidos = [];
  const srv = http.createServer((req, res) => {
    pedidos.push({ inm: req.headers['if-none-match'] || null });
    if (req.headers['if-none-match'] === ETAG) { res.writeHead(304, { etag: ETAG }); res.end(); return; }
    res.writeHead(200, { 'content-type': 'text/csv', etag: ETAG, 'last-modified': LM }); res.end(CSV);
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  const req = createRequire(path.join(RAIZ, 'servidor', 'package.json'));
  const imp = (p) => import(pathToFileURL(req.resolve(p)).href);
  const { Client } = await imp('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await imp('@modelcontextprotocol/sdk/client/stdio.js');
  const dados = pasta();
  const c = new Client({ name: 'bancada', version: '1.0.0' }, { capabilities: {} });
  try {
    await c.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(RAIZ, 'servidor', 'server.mjs')], stderr: 'ignore',
      env: { ...process.env, METODO_SKILLS: path.join(RAIZ, 'servidor', 'skills'), ROTINAS_SKILLS: path.join(RAIZ, 'servidor', 'rotinas'), MESA_BASE: path.join(RAIZ, 'servidor', 'base-assessor.md'),
        MESA_PERFIL_DIR: dados, MESA_ANDAMENTO: path.join(dados, 'andamento.json'), MESA_TAREFA: path.join(dados, 'tarefa.json'), CAPTAMAIS_MARKET_KEY: '',
        MESA_TESOURO_URL: `http://127.0.0.1:${srv.address().port}/PrecoTaxaTesouroDireto.csv` } }));
    const { tools } = await c.listTools();
    const t = tools.find((x) => x.name === 'taxas_tesouro');
    assert.ok(t, 'taxas_tesouro não aparece na lista');
    assert.deepEqual(Object.keys(t.inputSchema.properties).sort(), ['indexador', 'titulo', 'vencimento']);
    assert.deepEqual(t.inputSchema.properties.indexador.enum, ['prefixado', 'ipca', 'selic', 'igpm']);
    const r = await c.callTool({ name: 'taxas_tesouro', arguments: { titulo: 'Renda+ 2030' } });
    assert.ok(!r.isError, r.content?.[0]?.text);
    assert.equal(r.structuredContent.titulo.vencimento, '2049-12-15');
    assert.equal(r.structuredContent.titulo.taxaCompraTexto, 'IPCA + 7,58% ao ano');
    assert.deepEqual(JSON.parse(r.content[0].text).titulo, r.structuredContent.titulo);
    assert.ok(existsSync(path.join(dados, 'cache')), 'a cópia do dia não foi para a pasta da Mesa');
    const r2 = await c.callTool({ name: 'taxas_tesouro', arguments: { titulo: 'Educa+ 2027' } });
    assert.equal(r2.structuredContent.titulo.vencimento, '2031-12-15');
    assert.equal(pedidos.length, 1, 'baixou o arquivo duas vezes');
  } finally { await c.close().catch(() => {}); srv.close(); rmSync(dados, { recursive: true, force: true }); }
});
