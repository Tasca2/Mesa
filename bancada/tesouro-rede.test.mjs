// Rede: a ferramenta taxas_tesouro contra o arquivo oficial do Tesouro Transparente baixado à parte, na mesma hora.
// A conferência lê o CSV com outra conta (expressão regular e datas como Date), sem usar o código que está sendo conferido.
// Também confere, no servidor de verdade, a pergunta "o arquivo mudou?" (If-None-Match), que deve voltar 304 sem baixar de novo.
// Sem internet, os testes são pulados.
// Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = await import(pathToFileURL(path.join(RAIZ, 'servidor', 'dados-publicos.mjs')).href);
const URL_OFICIAL = 'https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/PrecoTaxaTesouroDireto.csv';
const online = await fetch('https://www.tesourotransparente.gov.br/ckan/api/3/action/status_show', { signal: AbortSignal.timeout(20000) }).then(() => true, () => false);
const REDE = { skip: online ? false : 'sem internet: o Tesouro Transparente não respondeu', timeout: 300000 };

// Leitura independente: cada linha "tipo;DD/MM/AAAA;DD/MM/AAAA;n,nn;..." por expressão regular; a data mais nova pelo Date.
async function conferencia() {
  const r = await fetch(URL_OFICIAL, { signal: AbortSignal.timeout(180000) });
  assert.equal(r.status, 200);
  const texto = await r.text();
  const re = /^([^;\n]+);(\d\d)\/(\d\d)\/(\d{4});(\d\d)\/(\d\d)\/(\d{4});([-\d.,]+);([-\d.,]+);([-\d.,]+);([-\d.,]+);([-\d.,]+)\r?$/gm;
  const n = (s) => parseFloat(s.replace(/\./g, '').replace(',', '.'));
  let maior = 0; const linhas = [];
  for (const m of texto.matchAll(re)) {
    const base = Date.UTC(+m[7], +m[6] - 1, +m[5]);
    linhas.push({ base, tipo: m[1], venc: `${m[4]}-${m[3]}-${m[2]}`, v: [m[8], m[9], m[10], m[11], m[12]].map(n) });
    if (base > maior) maior = base;
  }
  const dia = linhas.filter((l) => l.base === maior);
  return { dataBase: new Date(maior).toISOString().slice(0, 10), dia, etag: r.headers.get('etag'), total: linhas.length };
}

test('taxas_tesouro confere com o arquivo oficial de hoje, título por título, e o 304 do servidor de verdade', REDE, async () => {
  const pasta = mkdtempSync(path.join(os.tmpdir(), 'mesa-tesouro-rede-'));
  try {
    const conf = await conferencia();
    assert.ok(conf.total > 100000, `arquivo curto demais: ${conf.total} linhas`);
    const hoje = D.hojeSP();
    const atraso = (Date.parse(hoje) - Date.parse(conf.dataBase)) / 864e5;
    assert.ok(atraso >= 0 && atraso <= 6, `data base ${conf.dataBase} longe de hoje (${hoje})`);

    // 1) baixa pela ferramenta, contando os pedidos
    const pedidos = [];
    const buscar = async (url, init) => { const r = await fetch(url, init); pedidos.push({ status: r.status, inm: init?.headers?.['if-none-match'] || null }); return r; };
    D.limparMemoriaTesouro();
    const agora = Date.now();
    const lista = await D.taxasTesouro({}, { pastaCache: pasta, buscar, agora });
    assert.deepEqual(lista.lacunas, []);
    assert.equal(lista.dataBase, conf.dataBase);
    assert.equal(lista.lista.length, conf.dia.length);
    assert.match(lista.fonte, new RegExp(`data base ${conf.dataBase.slice(8, 10)}/${conf.dataBase.slice(5, 7)}/${conf.dataBase.slice(0, 4)}`));

    // 2) cada título do dia, pelo nome que a própria lista deu: taxas e preços iguais aos do arquivo
    let conferidos = 0;
    for (const l of conf.dia) {
      const item = lista.lista.find((x) => x.tipo === l.tipo && x.vencimento === l.venc);
      assert.ok(item, `${l.tipo} ${l.venc} não está na lista`);
      const r = await D.taxasTesouro({ titulo: item.nome, vencimento: l.venc.split('-').reverse().join('/') }, { pastaCache: pasta, buscar, agora });
      const t = r.titulo;
      assert.ok(t, `${item.nome}: ${JSON.stringify(r.lacunas)}`);
      assert.deepEqual([t.tipo, t.vencimento, t.taxaCompra, t.taxaVenda, t.puCompra, t.puVenda, t.puBase], [l.tipo, l.venc, ...l.v], item.nome);
      conferidos++;
    }
    assert.equal(conferidos, conf.dia.length);
    assert.equal(pedidos.length, 1, 'baixou o arquivo mais de uma vez na mesma meia hora');

    // 3) Renda+ e Educa+: o ano do nome é o do início da renda (vencimento - 19 e vencimento - 4)
    const renda = conf.dia.filter((l) => /Renda\+/.test(l.tipo)), educa = conf.dia.filter((l) => /Educa\+/.test(l.tipo));
    assert.ok(renda.length && educa.length, 'o arquivo de hoje não tem Renda+ ou Educa+');
    for (const l of renda) {
      const ano = +l.venc.slice(0, 4) - 19;
      const r = await D.taxasTesouro({ titulo: `Renda+ ${ano}` }, { pastaCache: pasta, buscar, agora });
      assert.equal(r.titulo?.vencimento, l.venc, `Renda+ ${ano}`);
      assert.equal(l.venc.slice(5), '12-15');
    }
    for (const l of educa) {
      const ano = +l.venc.slice(0, 4) - 4;
      const r = await D.taxasTesouro({ titulo: `Educa+ ${ano}` }, { pastaCache: pasta, buscar, agora });
      assert.equal(r.titulo?.vencimento, l.venc, `Educa+ ${ano}`);
      assert.equal(l.venc.slice(5), '12-15');
    }

    // 4) meia hora depois: pergunta ao servidor oficial se o arquivo mudou; sem mudança, 304 e a cópia do dia
    D.limparMemoriaTesouro();
    const depois = await D.taxasTesouro({ titulo: lista.lista[0].nome }, { pastaCache: pasta, buscar, agora: agora + 31 * 60000 });
    assert.equal(pedidos.length, 2);
    assert.equal(pedidos[1].inm, conf.etag || pedidos[1].inm);
    if (pedidos[1].status === 304) assert.equal(depois.dataBase, conf.dataBase);
    else assert.equal(pedidos[1].status, 200, 'o servidor respondeu outra coisa ao pedido condicional');
    assert.deepEqual(depois.lacunas, []);
    assert.equal(readdirSync(pasta).filter((n) => /^tesouro-\d{4}-\d{2}-\d{2}\.json$/.test(n)).length, 1);
  } finally { D.limparMemoriaTesouro(); rmSync(pasta, { recursive: true, force: true }); }
});
