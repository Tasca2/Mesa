// Rede: confere cada número que o painel_macro devolve contra uma consulta direta à fonte oficial, feita na mesma hora,
// e a busca e o download de documentos da CVM com casos reais. As consultas daqui são escritas à parte (outros endereços
// e outras contas), para não repetir o código que está sendo conferido. Sem internet, os testes são pulados.
// Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = await import(pathToFileURL(path.join(RAIZ, 'servidor', 'dados-publicos.mjs')).href);
const online = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json', { signal: AbortSignal.timeout(15000) }).then(() => true, () => false);
const REDE = { skip: online ? false : 'sem internet: os endereços oficiais não responderam', timeout: 240000 };

// ---------- consultas diretas ----------
const br = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
const mda = (s) => `${s.slice(5, 7)}-${s.slice(8, 10)}-${s.slice(0, 4)}`;
const deBr = (s) => s.split('/').reverse().join('-');
const dias = (s, n) => new Date(Date.parse(s + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
async function json(urls) {
  let erro = '';
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(40000) });
      if (r.ok) { const j = await r.json(); if (!(Array.isArray(j) && !j.length)) return j; erro = 'vazio'; } else erro = `HTTP ${r.status}`;
    } catch (e) { erro = String(e?.message || e); }
    await new Promise((ok) => setTimeout(ok, 900));
  }
  throw new Error(`${erro}: ${urls[0]}`);
}
// Série do SGS desde 1º de novembro do ano retrasado (início diferente do da ferramenta), como mapa data -> ponto. O SGS
// guarda a resposta de cada consulta por horas: o início recua conforme a hora e, se a resposta não trouxer a data que a
// ferramenta usou, a consulta é refeita com outro início.
async function sgs(codigo, hoje, precisaDe) {
  const ini = `${+hoje.slice(0, 4) - 2}-11-01`, r0 = D.recuoDaHora();
  let mapa = null;
  for (const k of [0, 1, 2]) {
    const j = await json([0, 1].map((x) => `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json&dataInicial=${br(dias(ini, -(r0 + 144 * k + 500 * x)))}&dataFinal=${br(hoje)}`));
    mapa = new Map(j.map((p) => [deBr(p.data), { valor: Number(p.valor), fim: (p.dataFim ?? p.datafim) ? deBr(p.dataFim ?? p.datafim) : null }]));
    if (!precisaDe || mapa.has(precisaDe)) break;
  }
  return mapa;
}
const ultimaData = (i) => i.mesEmAndamento?.data ?? (i.servicoPtax?.nota ? null : i.data);
const OLINDA = 'https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/';
const olinda = (recurso, filtro, extra = '') => json([`${OLINDA}${recurso}?$filter=${encodeURIComponent(filtro)}&$format=json${extra}`]).then((j) => j.value);
const COPOM = 'https://www.bcb.gov.br/api/servico/sitebcb/copom/';
const semHtml = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/[\u200b\u00a0]/g, ' ').replace(/\s+/g, ' ').trim();
const pertoDe = (obtido, exato, rotulo) => assert.ok(Math.abs(obtido - exato) <= 0.005 + 1e-9, `${rotulo}: ${obtido} contra ${exato} da conta direta`);

// Periodicidade de cada série, pelo cadastro do SGS: mensais e anual; as outras são diárias.
const MENSAIS = ['cdiMes', 'ipcaMes', 'ipca12m', 'igpmMes', 'desemprego'], ANUAIS = ['metaInflacao'];
// O dado da data citada e a data que a regra manda: anterior, último até o fim do mês anterior, até o fim do ano anterior.
function confereIndicador(i, serie, hoje, comparar) {
  let datas = [...serie.keys()].filter((d) => d <= hoje).sort();
  const mensal = MENSAIS.includes(i.id), anual = ANUAIS.includes(i.id);
  if (mensal && datas.at(-1).slice(0, 7) === hoje.slice(0, 7)) assert.ok(i.mesEmAndamento, `${i.id}: o mês corrente, ainda aberto, não ficou à parte`);
  if (i.servicoPtax?.nota) datas = [...datas, i.data]; // dia que só o serviço PTAX já tinha (conferido à parte)
  if (i.mesEmAndamento) {
    assert.equal(i.mesEmAndamento.data, datas.at(-1), `${i.id}: mês em andamento`);
    assert.equal(i.mesEmAndamento.valor, serie.get(datas.at(-1)).valor, `${i.id}: valor do mês em andamento`);
    datas = datas.slice(0, -1);
  }
  assert.equal(i.data, datas.at(-1), `${i.id}: a data não é a do último dado`);
  if (!i.servicoPtax?.nota) assert.equal(i.valor, serie.get(i.data).valor, `${i.id}: valor de ${i.data}`);
  if (i.periodoAte) assert.equal(i.periodoAte, serie.get(i.data).fim, `${i.id}: fim do período`);
  const ultimoAte = (lim) => datas.filter((d) => d <= lim).at(-1);
  const fimMesAnt = new Date(Date.UTC(+i.data.slice(0, 4), +i.data.slice(5, 7) - 1, 0)).toISOString().slice(0, 10);
  const fimAnoAnt = `${+i.data.slice(0, 4) - 1}-12-31`;
  const anterior = datas.at(-2);
  const conta = (base) => (i.unidadeDaVariacao === '%' ? (i.valor / base - 1) * 100 : i.valor - base);
  const ref = (() => {
    if (anual) return anterior;
    if (comparar === 'Início do ano') return ultimoAte(fimAnoAnt);
    if (mensal) return anterior;
    if (comparar === 'Semana passada') return ultimoAte(dias(i.data, -7));
    const [a, m, d] = i.data.split('-').map(Number), ult = new Date(Date.UTC(a, m - 1, 0)).getUTCDate();
    return ultimoAte(new Date(Date.UTC(a, m - 2, Math.min(d, ult))).toISOString().slice(0, 10));
  })();
  const esperado = {
    dia: anual || mensal ? null : anterior,
    mes: anual ? null : mensal ? anterior : ultimoAte(fimMesAnt),
    ano: anual ? anterior : ultimoAte(fimAnoAnt),
  };
  for (const [k, data] of Object.entries(esperado)) {
    const v = i.variacoes[k];
    if (!data) { assert.equal(v, null, `${i.id}: variação ${k} deveria vir vazia`); continue; }
    assert.equal(v.comparadoCom.data, data, `${i.id}: a variação ${k} compara com a data errada`);
    assert.equal(v.comparadoCom.valor, serie.get(data).valor, `${i.id}: valor de ${data}`);
    pertoDe(v.variacao, conta(serie.get(data).valor), `${i.id}: variação ${k}`);
  }
  assert.equal(i.referencia.nome, comparar);
  assert.equal(i.referencia.comparadoCom.data, ref, `${i.id}: a referência ${comparar} compara com a data errada`);
  assert.equal(i.referencia.comparadoCom.valor, serie.get(ref).valor, `${i.id}: valor da referência`);
  pertoDe(i.referencia.variacao, conta(serie.get(ref).valor), `${i.id}: variação contra ${comparar}`);
  const composto = (ds) => (ds.reduce((f, d) => f * (1 + serie.get(d).valor / 100), 1) - 1) * 100;
  if (i.acumulado12Meses) pertoDe(i.acumulado12Meses.valor, composto(datas.slice(-12)), `${i.id}: 12 meses`);
  if (i.acumuladoNoAno && i.id !== 'ipcaMes') {
    const doAno = datas.filter((d) => d.slice(0, 4) === i.data.slice(0, 4));
    assert.equal(i.acumuladoNoAno.meses, doAno.length, `${i.id}: meses no ano`);
    pertoDe(i.acumuladoNoAno.valor, composto(doAno), `${i.id}: acumulado no ano`);
  }
}

let painel = null;
test('painel completo: cada número bate com a consulta direta ao Banco Central e ao IBGE feita agora', REDE, async () => {
  painel = await D.painelMacro({});
  const hoje = painel.hoje;
  assert.equal(painel.recorte, 'Painel completo');
  assert.equal(painel.comparar, 'Mês passado');
  assert.deepEqual(painel.indicadores.map((i) => i.id), D.RECORTES['Painel completo'], `faltou indicador; lacunas: ${JSON.stringify(painel.lacunas)}`);
  const porId = Object.fromEntries(painel.indicadores.map((i) => [i.id, i]));
  for (const i of painel.indicadores) confereIndicador(i, await sgs(i.serie, hoje, ultimaData(i)), hoje, 'Mês passado');

  // dólar: o mesmo valor no serviço PTAX do dia (outro endereço: cotação do dia, boletim de fechamento)
  const d = porId.dolar;
  const ptax = await json([`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${mda(d.servicoPtax.data)}'&$format=json`]);
  assert.equal(ptax.value.at(-1).cotacaoVenda, d.servicoPtax.cotacaoVenda);
  if (d.servicoPtax.data === d.data) assert.equal(d.valor, d.servicoPtax.cotacaoVenda);

  // IPCA: o mês, o acumulado no ano e os 12 meses no IBGE, consultando o período pelo número
  const ip = porId.ipcaMes, per = ip.data.slice(0, 7).replace('-', '');
  const ibge = await json([`https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/${per}/variaveis/63%7C69%7C2265?localidades=N1%5Ball%5D`]);
  const v = (id) => Number(ibge.find((x) => String(x.id) === id).resultados[0].series[0].serie[per]);
  assert.equal(ip.valor, v('63'), 'IPCA do mês: Banco Central e IBGE');
  assert.equal(ip.acumuladoNoAno.valor, v('69'), 'IPCA no ano');
  assert.equal(porId.ipca12m.valor, v('2265'), 'IPCA em 12 meses');
  assert.equal(ip.conferenciaIbge.bate, true);
  assert.deepEqual([ip.conferenciaIbge.periodo, ip.conferenciaIbge.mensal, ip.conferenciaIbge.noAno, ip.conferenciaIbge.em12Meses], [ip.data.slice(0, 7), v('63'), v('69'), v('2265')]);

  // Focus: as medianas da data do relatório e de 4 semanas antes, consultadas por data
  const f = painel.focus;
  const datas = (await olinda('ExpectativasMercadoAnuais', `Indicador eq 'IPCA' and baseCalculo eq 0 and Data ge '${dias(hoje, -60)}'`, '&$select=Data&$orderby=Data%20desc&$top=5000')).map((x) => x.Data).sort();
  assert.equal(f.data, datas.at(-1), 'a data do Focus não é a mais recente');
  assert.equal(f.quatroSemanasAntes, datas.filter((x) => x <= dias(f.data, -28)).at(-1), 'a data de 4 semanas antes não é a última até 28 dias antes');
  const doDia = async (data) => olinda('ExpectativasMercadoAnuais', `Data eq '${data}' and baseCalculo eq 0`, '&$select=Indicador,DataReferencia,Mediana,numeroRespondentes&$top=500');
  const [hojeF, antesF] = [await doDia(f.data), await doDia(f.quatroSemanasAntes)];
  assert.deepEqual(f.indicadores.map((x) => x.indicador), ['IPCA', 'Selic', 'PIB Total', 'Câmbio']);
  for (const ind of f.indicadores) {
    for (const [ano, x] of Object.entries(ind.anos)) {
      const h = hojeF.find((l) => l.Indicador === ind.indicador && l.DataReferencia === ano), a = antesF.find((l) => l.Indicador === ind.indicador && l.DataReferencia === ano);
      assert.equal(x.mediana, h.Mediana, `${ind.indicador} ${ano}`);
      assert.equal(x.respondentes, h.numeroRespondentes, `${ind.indicador} ${ano}: respondentes`);
      assert.equal(x.ha4Semanas, a.Mediana, `${ind.indicador} ${ano}: há 4 semanas`);
      pertoDe(x.mudou, h.Mediana - a.Mediana, `${ind.indicador} ${ano}: mudou`);
    }
  }
  const doze = async (data) => (await olinda('ExpectativasMercadoInflacao12Meses', `Indicador eq 'IPCA' and Suavizada eq 'S' and baseCalculo eq 0 and Data eq '${data}'`))[0];
  const [d12, a12] = [await doze(f.data), await doze(f.quatroSemanasAntes)];
  assert.equal(f.ipca12Meses.mediana, d12.Mediana);
  assert.equal(f.ipca12Meses.ha4Semanas, a12.Mediana);
  assert.equal(f.ipca12Meses.respondentes, d12.numeroRespondentes);
  pertoDe(f.ipca12Meses.mudou, d12.Mediana - a12.Mediana, 'IPCA esperado para 12 meses: mudou');

  // juro real: as duas contas com os números conferidos acima
  const jr = painel.juroReal;
  assert.equal(jr.contraIpca12Meses.selic.valor, porId.selic.valor);
  assert.equal(jr.contraIpca12Meses.inflacao.valor, porId.ipca12m.valor);
  pertoDe(jr.contraIpca12Meses.valor, ((1 + porId.selic.valor / 100) / (1 + porId.ipca12m.valor / 100) - 1) * 100, 'juro real contra o IPCA de 12 meses');
  assert.equal(jr.contraIpcaEsperado.inflacao.valor, d12.Mediana);
  assert.equal(jr.contraIpcaEsperado.selic.valor, porId.selic.valor);
  pertoDe(jr.contraIpcaEsperado.valor, ((1 + porId.selic.valor / 100) / (1 + d12.Mediana / 100) - 1) * 100, 'juro real contra o IPCA esperado');

  // Copom: as duas últimas reuniões, a decisão escrita no comunicado, o placar e a ata
  const lista = (await json([`${COPOM}comunicados?quantidade=2`])).conteudo;
  const atas = (await json([`${COPOM}atas?quantidade=4`])).conteudo;
  assert.deepEqual(painel.copom.reunioes.map((r) => r.reuniao), lista.map((c) => c.nro_reuniao));
  for (const r of painel.copom.reunioes) {
    const c = lista.find((x) => x.nro_reuniao === r.reuniao);
    assert.equal(r.dataDaDecisao, c.dataReferencia);
    assert.ok(semHtml(c.titulo).includes(r.titulo), `título da ${r.reuniao}ª: ${r.titulo}`);
    const texto = semHtml((await json([`${COPOM}comunicados_detalhes?nro_reuniao=${r.reuniao}`])).conteudo[0].textoComunicado);
    assert.ok(r.decisao && texto.includes(r.decisao.replace(/\s+/g, ' ')), `a decisão da ${r.reuniao}ª não está no comunicado`);
    assert.equal(r.comunicado.texto.replace(/\s+/g, ' '), texto, `o texto do comunicado da ${r.reuniao}ª não é o publicado`);
    const membros = [...texto.matchAll(/Vot(?:aram|ou)[^:]*:([^.]*)\./g)].map((m) => m[1].split(/,|\se\s/).map((x) => x.trim()).filter((x) => x && x !== 'e').length);
    assert.equal(r.votos.aFavor, membros[0], `placar da ${r.reuniao}ª`);
    assert.equal(r.votos.contra, membros.slice(1).reduce((a, b) => a + b, 0));
    const ata = atas.find((a) => a.nroReuniao === r.reuniao);
    if (ata) {
      assert.equal(r.ata.publicadaEm, ata.dataPublicacao);
      assert.ok(String(ata.titulo).includes(r.periodo), `período da ${r.reuniao}ª: ${r.periodo}`);
      assert.equal(r.ata.pdf, (await json([`${COPOM}atas_detalhes?nro_reuniao=${r.reuniao}`])).conteudo[0].urlPdfAta);
    } else assert.equal(r.ata, null);
  }
  assert.equal(painel.copom.proximaReuniao, null, 'a próxima reunião não tem fonte de dados oficial');
  assert.ok(painel.lacunas.some((l) => l.bloco === 'copom' && /próxima reunião/.test(l.item)), 'a próxima reunião não está nas lacunas');

  // agenda: o calendário do IBGE dos próximos 30 dias, filtrado aqui pelos mesmos títulos
  const TITULOS = ['Índice Nacional de Preços ao Consumidor Amplo 15', 'Índice Nacional de Preços ao Consumidor Amplo', 'Índice Nacional de Preços ao Consumidor', 'Sistema de Contas Nacionais Trimestrais',
    'Pesquisa Nacional por Amostra de Domicílios Contínua Mensal', 'Pesquisa Mensal de Comércio', 'Pesquisa Mensal de Serviços', 'Pesquisa Industrial Mensal: Produção Física - Brasil'];
  // a hora do calendário vem em UTC; a conversão para Brasília é conferida contra a hora das notícias do IBGE (abaixo)
  const sp = (s) => { const [d, h] = s.split(' '); const t = new Date(`${deBr(d)}T${h}Z`); return { data: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(t), hora: new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(t) }; };
  const cal = await json([`https://servicodados.ibge.gov.br/api/v3/calendario/?qtd=250&de=${mda(hoje)}&ate=${mda(dias(hoje, 30))}`]);
  const esperado = cal.items.filter((x) => TITULOS.includes(x.titulo)).map((x) => `${sp(x.data_divulgacao).data} ${x.titulo}`).filter((x) => x.slice(0, 10) >= hoje && x.slice(0, 10) <= dias(hoje, 30)).sort();
  assert.deepEqual(painel.agenda.itens.map((x) => `${x.data} ${x.titulo}`).sort(), esperado);
  const dois = (n) => String(n).padStart(2, '0');
  for (const x of painel.agenda.itens) {
    const c = cal.items.find((y) => y.titulo === x.titulo && sp(y.data_divulgacao).data === x.data);
    assert.equal(x.hora, sp(c.data_divulgacao).hora, `${x.divulgacao}: hora`);
    assert.ok(x.referencia.startsWith(c.mes_referencia_inicio ? `${c.ano_referencia_inicio}-${dois(c.mes_referencia_inicio)}` : String(c.ano_referencia_inicio)), `${x.divulgacao}: referência ${x.referencia}`);
    if (c.mes_referencia_fim && c.mes_referencia_fim !== c.mes_referencia_inicio) assert.ok(x.referencia.endsWith(`${c.ano_referencia_fim}-${dois(c.mes_referencia_fim)}`));
  }
  // prova da conversão: nas divulgações dos últimos 15 dias, a hora de Brasília é a hora em que o IBGE publicou a notícia
  const passado = await json([`https://servicodados.ibge.gov.br/api/v3/calendario/?qtd=250&de=${mda(dias(hoje, -15))}&ate=${mda(hoje)}`]);
  const noticias = await json([`https://servicodados.ibge.gov.br/api/v3/noticias/?tipo=release&qtd=100&de=${mda(dias(hoje, -15))}&ate=${mda(hoje)}`]);
  const horasDasNoticias = new Set(noticias.items.map((n) => `${deBr(n.data_publicacao.slice(0, 10))} ${n.data_publicacao.slice(11, 16)}`));
  const diasComNoticia = new Set([...horasDasNoticias].map((x) => x.slice(0, 10)));
  const conferidas = passado.items.filter((x) => TITULOS.includes(x.titulo)).map((x) => sp(x.data_divulgacao)).filter((q) => diasComNoticia.has(q.data));
  assert.ok(conferidas.length > 0, 'nenhuma divulgação recente para conferir a hora contra a notícia do IBGE');
  for (const q of conferidas) assert.ok(horasDasNoticias.has(`${q.data} ${q.hora}`), `divulgação de ${q.data} às ${q.hora} (Brasília) sem notícia do IBGE nessa hora`);
});

for (const [recorte, comparar, ids] of [['Dólar e câmbio', 'Semana passada', ['dolar', 'euro']], ['Inflação', 'Início do ano', ['ipcaMes', 'ipca12m', 'metaInflacao', 'igpmMes']], ['Juros e Copom', 'Semana passada', ['selic', 'cdiAno', 'cdiMes', 'poupanca']]]) {
  test(`recorte ${recorte}, comparando com ${comparar}: só os indicadores do recorte, com a referência certa`, REDE, async () => {
    const p = await D.painelMacro({ recorte, comparar });
    assert.equal(p.recorte, recorte);
    assert.deepEqual(p.indicadores.map((i) => i.id), ids, `lacunas: ${JSON.stringify(p.lacunas)}`);
    for (const i of p.indicadores) confereIndicador(i, await sgs(i.serie, p.hoje, ultimaData(i)), p.hoje, comparar);
    assert.equal(p.juroReal === null, recorte === 'Dólar e câmbio');
    assert.equal(p.copom === null, recorte !== 'Juros e Copom');
  });
}

test('CVM: Petrobras pelo nome traz o Fato Relevante de 10/11/2026 (protocolo 1587552) e o 1587545, com o aviso da base semanal', REDE, async () => {
  const r = await D.documentosCvm({ empresa: 'Petrobras', quantidade: 20 });
  assert.equal(r.empresa?.cnpj, '33.000.167/0001-01', JSON.stringify(r.candidatas));
  const doc = (p) => r.documentos.find((d) => d.protocolo === p);
  assert.ok(doc('1587552'), 'não achou o protocolo 1587552');
  assert.equal(doc('1587552').data, '2026-11-10');
  assert.equal(doc('1587552').categoria, 'Fato Relevante');
  assert.match(doc('1587552').assunto, /projeções operacionais e financeiras para 2026/);
  assert.ok(doc('1587545'), 'não achou o protocolo 1587545');
  assert.equal(doc('1587545').data, '2026-11-10');
  // Na base da CVM o 1587545 está como Fato Relevante (o plano o chamava de comunicado).
  assert.equal(doc('1587545').categoria, 'Fato Relevante');
  assert.match(doc('1587545').assunto, /remuneração aos acionistas/);
  const datas = r.documentos.map((d) => d.data);
  assert.deepEqual(datas, [...datas].sort().reverse(), 'a lista não está do mais recente para o mais antigo');
  assert.ok(r.documentos.every((d) => ['Fato Relevante', 'Comunicado ao Mercado'].includes(d.categoria)));
  if (r.documentoMaisRecenteNaBase < D.hojeSP()) assert.match(r.aviso, /atualizada uma vez por semana/);
  const porCnpj = await D.documentosCvm({ empresa: '33000167000101', tipos: ['Fato Relevante'], quantidade: 20 });
  assert.ok(porCnpj.documentos.every((d) => d.categoria === 'Fato Relevante'));
  assert.ok(['1587552', '1587545'].every((p) => porCnpj.documentos.some((d) => d.protocolo === p)), 'pelo CNPJ não achou os dois');
});

test('CVM: o protocolo 1587552 baixa o PDF inteiro (começa com %PDF e termina em %%EOF)', REDE, async () => {
  const pasta = mkdtempSync(path.join(os.tmpdir(), 'mesa-fontes-'));
  try {
    // O Rad da CVM devolve a casca da página no lugar do PDF em boa parte dos pedidos, em sequência: até 3 rodadas,
    // com pausa entre elas. Rodada que falha tem de dizer o motivo e deixar o link oficial.
    let r = null;
    for (let k = 0; k < 3 && !r?.arquivo; k++) {
      if (k) {
        assert.ok(r.documento?.link?.startsWith('https://www.rad.cvm.gov.br/'), 'a falha não deixou o link oficial');
        assert.match(r.lacunas.at(-1).motivo, /tentativas/);
        await new Promise((ok) => setTimeout(ok, 20000));
      }
      r = await D.documentosCvm({ protocolo: '1587552' }, { pastaFontes: pasta });
    }
    assert.ok(r.arquivo, JSON.stringify(r.lacunas));
    assert.equal(path.dirname(r.arquivo), pasta);
    const b = readFileSync(r.arquivo);
    assert.equal(b.subarray(0, 5).toString('latin1'), '%PDF-');
    assert.ok(D.ehPdfCompleto(b));
    assert.equal(r.bytes, statSync(r.arquivo).size);
    assert.equal(r.documento.protocolo, '1587552');
  } finally { rmSync(pasta, { recursive: true, force: true }); }
});

test('servidor da Mesa: as duas ferramentas aparecem para o Claude e respondem pelo protocolo MCP', REDE, async () => {
  const req = createRequire(path.join(RAIZ, 'servidor', 'package.json'));
  const imp = (p) => import(pathToFileURL(req.resolve(p)).href);
  const { Client } = await imp('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await imp('@modelcontextprotocol/sdk/client/stdio.js');
  const dados = mkdtempSync(path.join(os.tmpdir(), 'mesa-mcp-'));
  const c = new Client({ name: 'bancada', version: '1.0.0' }, { capabilities: {} });
  try {
    await c.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(RAIZ, 'servidor', 'server.mjs')], stderr: 'ignore',
      env: { ...process.env, METODO_SKILLS: path.join(RAIZ, 'servidor', 'skills'), ROTINAS_SKILLS: path.join(RAIZ, 'servidor', 'rotinas'), MESA_BASE: path.join(RAIZ, 'servidor', 'base-assessor.md'), MESA_PERFIL_DIR: dados, MESA_ANDAMENTO: path.join(dados, 'andamento.json'), MESA_TAREFA: path.join(dados, 'tarefa.json'), CAPTAMAIS_MARKET_KEY: '' } }));
    const { tools } = await c.listTools();
    const pm = tools.find((t) => t.name === 'painel_macro'), dc = tools.find((t) => t.name === 'documentos_cvm');
    assert.ok(pm && dc, 'as ferramentas não aparecem na lista');
    assert.deepEqual(pm.inputSchema.properties.recorte.enum, Object.keys(D.RECORTES));
    assert.deepEqual(pm.inputSchema.properties.comparar.enum, D.REFERENCIAS);
    assert.deepEqual(Object.keys(dc.inputSchema.properties).sort(), ['empresa', 'protocolo', 'quantidade', 'tipos']);
    const p = await c.callTool({ name: 'painel_macro', arguments: { recorte: 'Dólar e câmbio', comparar: 'Semana passada' } }, undefined, { timeout: 180000 });
    assert.ok(!p.isError, p.content?.[0]?.text);
    assert.deepEqual(p.structuredContent.indicadores.map((i) => i.id), ['dolar', 'euro']);
    assert.deepEqual(JSON.parse(p.content[0].text).indicadores.map((i) => i.valor), p.structuredContent.indicadores.map((i) => i.valor));
    const errado = await c.callTool({ name: 'painel_macro', arguments: { recorte: 'Só dólar' } }).catch((e) => ({ isError: true, content: [{ text: String(e.message) }] }));
    assert.ok(errado.isError, 'aceitou um recorte que não existe');
    const d = await c.callTool({ name: 'documentos_cvm', arguments: { empresa: 'Petrobras', quantidade: 3 } }, undefined, { timeout: 180000 });
    assert.ok(!d.isError, d.content?.[0]?.text);
    assert.equal(d.structuredContent.documentos.length, 3);
    const vazio = await c.callTool({ name: 'documentos_cvm', arguments: {} });
    assert.ok(vazio.isError);
  } finally { await c.close().catch(() => {}); rmSync(dados, { recursive: true, force: true }); }
});
