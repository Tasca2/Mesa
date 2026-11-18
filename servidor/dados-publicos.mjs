// Dados públicos da Mesa do Assessor: Banco Central, IBGE e CVM consultados direto, por código, sem leitura de página.
// painelMacro: juros, inflação, câmbio, Focus, Copom e agenda, com as variações já calculadas.
// documentosCvm: fatos relevantes e comunicados das companhias abertas (base aberta da CVM) e o PDF de um deles.
// Só módulos do Node (fetch, zlib, fs, path). Toda falha vira uma lacuna com o motivo: nenhum número é estimado.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pastaBase } from './gerador.mjs';

const SGS = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';
const OLINDA = 'https://olinda.bcb.gov.br/olinda/servico';
const COPOM = 'https://www.bcb.gov.br/api/servico/sitebcb/copom';
const IBGE = 'https://servicodados.ibge.gov.br/api/v3';
const CVM_IPE = (ano) => `https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_${ano}.zip`;
const AGENTE = 'Mozilla/5.0 (compatible; MesaDoAssessor/1.0; dados publicos)';

// Séries do painel. Nome oficial e unidade conferidos no serviço de séries do Banco Central (SGS) em 18/11/2026.
// tipo "preco": a variação é em %; tipo "taxa": a variação é a diferença em pontos percentuais.
export const SERIES = {
  selic: { codigo: 432, nome: 'Selic (meta do Copom)', unidade: '% ao ano', tipo: 'taxa', freq: 'D', oficial: 'Taxa de juros - Meta Selic definida pelo Copom' },
  cdiAno: { codigo: 4389, nome: 'CDI ao ano', unidade: '% ao ano', tipo: 'taxa', freq: 'D', oficial: 'Taxa de juros - CDI anualizada base 252' },
  cdiMes: { codigo: 4391, nome: 'CDI no mês', unidade: '% no mês', tipo: 'taxa', freq: 'M', acumula: true, oficial: 'Taxa de juros - CDI acumulada no mês' },
  ipcaMes: { codigo: 433, nome: 'IPCA do mês', unidade: '% no mês', tipo: 'taxa', freq: 'M', oficial: 'Índice nacional de preços ao consumidor-amplo (IPCA), variação % mensal' },
  ipca12m: { codigo: 13522, nome: 'IPCA em 12 meses', unidade: '% em 12 meses', tipo: 'taxa', freq: 'M', oficial: 'Índice nacional de preços ao consumidor - amplo (IPCA) - em 12 meses' },
  metaInflacao: { codigo: 13521, nome: 'Meta de inflação', unidade: '% ao ano', tipo: 'taxa', freq: 'A', oficial: 'Meta para a inflação' },
  igpmMes: { codigo: 189, nome: 'IGP-M do mês', unidade: '% no mês', tipo: 'taxa', freq: 'M', acumula: true, oficial: 'Índice geral de preços do mercado (IGP-M), variação % mensal' },
  dolar: { codigo: 1, nome: 'Dólar (PTAX, venda)', unidade: 'R$ por US$', tipo: 'preco', freq: 'D', oficial: 'Taxa de câmbio - Livre - Dólar americano (venda) - diário' },
  euro: { codigo: 21619, nome: 'Euro (venda)', unidade: 'R$ por euro', tipo: 'preco', freq: 'D', oficial: 'Taxa de câmbio - Livre - Euro (venda)' },
  poupanca: { codigo: 195, nome: 'Poupança (rendimento no período de um mês)', unidade: '% no período', tipo: 'taxa', freq: 'D', oficial: 'Depósitos de poupança a partir de 04.05.2012 - Rentabilidade no período' },
  desemprego: { codigo: 24369, nome: 'Desemprego (PNAD Contínua, trimestre móvel)', unidade: '% da força de trabalho', tipo: 'taxa', freq: 'M', oficial: 'Taxa de desocupação - PNADC' },
};
export const RECORTES = {
  'Painel completo': ['selic', 'cdiAno', 'cdiMes', 'ipcaMes', 'ipca12m', 'metaInflacao', 'igpmMes', 'dolar', 'euro', 'poupanca', 'desemprego'],
  'Juros e Copom': ['selic', 'cdiAno', 'cdiMes', 'poupanca'],
  'Inflação': ['ipcaMes', 'ipca12m', 'metaInflacao', 'igpmMes'],
  'Dólar e câmbio': ['dolar', 'euro'],
};
export const REFERENCIAS = ['Mês passado', 'Semana passada', 'Início do ano'];
const FOCUS_DO_RECORTE = {
  'Painel completo': ['IPCA', 'Selic', 'PIB Total', 'Câmbio'], 'Juros e Copom': ['Selic', 'IPCA'], 'Inflação': ['IPCA'], 'Dólar e câmbio': ['Câmbio'],
};

// ---------- datas e números ----------
const iso = (d) => d.toISOString().slice(0, 10);
const utc = (s) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) || 1));
export const hojeSP = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const br = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
const mdA = (s) => `${s.slice(5, 7)}-${s.slice(8, 10)}-${s.slice(0, 4)}`; // formato mês-dia-ano dos serviços olinda e IBGE
const deBr = (s) => { const [d, m, a] = String(s).split('/'); return `${a}-${m}-${d}`; };
export const somarDias = (s, n) => { const d = utc(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const fimDoMesAnterior = (s) => iso(new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, 0)));
const fimDoAnoAnterior = (s) => `${+s.slice(0, 4) - 1}-12-31`;
const mesAntes = (s) => {
  const a = +s.slice(0, 4), m = +s.slice(5, 7), d = +s.slice(8, 10);
  const ultimo = new Date(Date.UTC(a, m - 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(a, m - 2, Math.min(d, ultimo))));
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Arredonda "para longe do zero" na casa pedida (como a conta à mão), sem o erro de ponto flutuante.
export const arred = (x, n = 2) => {
  if (x == null || !Number.isFinite(x)) return null;
  const f = 10 ** n, r = Math.sign(x) * Math.round(Math.abs(x) * f + 1e-9) / f;
  return Object.is(r, -0) ? 0 : r;
};
const pct = (x) => x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + '%';
const variacao = (tipo, atual, base) => (base == null || !Number.isFinite(base) ? null : tipo === 'preco' ? (base === 0 ? null : arred((atual / base - 1) * 100)) : arred(atual - base));
const ultimoAte = (pts, limite) => { let r = null; for (const p of pts) { if (p.data <= limite) r = p; else break; } return r; };
const sem = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

// ---------- busca ----------
const cache = new Map();
const MINUTOS_DE_CACHE = 10;
async function obter(url, { tipo = 'json', tempo = 25000, cabecalhos = {}, semCache = false } = {}) {
  const c = cache.get(url);
  if (!semCache && c && Date.now() - c.em < MINUTOS_DE_CACHE * 60000) return c.v;
  const r = await fetch(url, { headers: { accept: tipo === 'json' ? 'application/json' : '*/*', 'user-agent': AGENTE, ...cabecalhos }, signal: AbortSignal.timeout(tempo) });
  if (!r.ok) throw new Error(r.status === 304 ? 'o endereço respondeu HTTP 304, sem conteúdo' : `o endereço respondeu HTTP ${r.status}`);
  let v;
  if (tipo === 'json') { const t = await r.text(); try { v = JSON.parse(t); } catch { throw new Error('a resposta não veio em JSON'); } } else v = Buffer.from(await r.arrayBuffer());
  const vazio = Array.isArray(v) ? !v.length : (v && Array.isArray(v.value) && !v.value.length);
  if (!vazio) cache.set(url, { em: Date.now(), v });
  return v;
}
const motivo = (e) => (e?.name === 'TimeoutError' ? 'o endereço não respondeu a tempo' : String(e?.message || e));
// Tenta, em ordem, endereços equivalentes da mesma consulta. O servidor do Banco Central às vezes responde a um endereço
// exato com HTTP 304 sem conteúdo ou com lista vazia (visto em 18/11/2026 na série 432) e responde certo ao vizinho.
async function obterUmDe(urls, opcoes = {}) {
  let erro = '';
  for (let t = 0; t < urls.length; t++) {
    try {
      const v = await obter(urls[t], { ...opcoes, semCache: t > 0 });
      const vazio = v == null || (Array.isArray(v) ? !v.length : ['value', 'conteudo', 'items'].some((k) => Array.isArray(v[k]) && !v[k].length));
      if (!vazio) return { url: urls[t], v };
      erro = 'a consulta veio vazia';
    } catch (e) { erro = motivo(e); }
    if (t < urls.length - 1) await espera(700 * (t + 1));
  }
  throw new Error(erro);
}

const urlSgs = (codigo, de, ate) => `${SGS}.${codigo}/dados?formato=json&dataInicial=${br(de)}&dataFinal=${br(ate)}`;
// O SGS guarda a resposta de cada consulta (série, início e fim) por horas: em 18/11/2026 a mesma consulta voltou sem o
// dado do dia anterior, e outra voltou com HTTP 304 vazio. Por isso o início recua um dia a cada 10 minutos do dia
// (a consulta é nova a cada 10 minutos) e, se falhar, recua mais 144 dias. Recuar o início não muda as contas, que só
// usam do ano anterior em diante.
export const recuoDaHora = (agora = new Date()) => {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(agora).split(':').map(Number);
  return Math.floor((h * 60 + m) / 10);
};
async function serieSgs(codigo, de, ate) {
  const r0 = recuoDaHora();
  const { url, v } = await obterUmDe([0, 1, 2].map((k) => urlSgs(codigo, somarDias(de, -(r0 + 144 * k)), ate)));
  if (!Array.isArray(v)) throw new Error('a série não veio em lista');
  return { url, pontos: v.map((p) => ({ data: deBr(p.data), valor: Number(p.valor), ...(p.dataFim || p.datafim ? { dataFim: deBr(p.dataFim || p.datafim) } : {}) })).filter((p) => Number.isFinite(p.valor)) };
}
const urlOlinda = (recurso, filtro, extra = {}) => `${OLINDA}/${recurso}?` + new URLSearchParams({ $filter: filtro, $format: 'json', $top: '5000', ...extra }).toString().replace(/\+/g, '%20');

// ---------- contas ----------
// Um indicador com o último valor e as variações já calculadas: no dia (contra o dado anterior), no mês (contra o
// último dado do mês anterior; em série mensal, contra o mês anterior), no ano (contra o último dado do ano anterior)
// e contra a referência escolhida. Em série mensal, o mês corrente ainda aberto fica à parte (mesEmAndamento).
export function calcularIndicador(def, pontosBrutos, comparar = 'Mês passado', { hoje = hojeSP() } = {}) {
  const ref = REFERENCIAS.includes(comparar) ? comparar : 'Mês passado';
  let pts = (pontosBrutos || []).filter((p) => p && Number.isFinite(p.valor) && p.data <= hoje).sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  let mesEmAndamento = null;
  if (def.freq === 'M' && pts.length && pts.at(-1).data.slice(0, 7) === hoje.slice(0, 7)) {
    const p = pts.at(-1);
    mesEmAndamento = { data: p.data, valor: p.valor, nota: 'mês em andamento: acumulado até o último dia útil publicado, ainda não fechou' };
    pts = pts.slice(0, -1);
  }
  if (!pts.length) return null;
  const u = pts.at(-1), anterior = pts.at(-2) ?? null;
  const contra = (p) => (p ? { comparadoCom: { data: p.data, valor: p.valor }, variacao: variacao(def.tipo, u.valor, p.valor) } : null);
  let dia = null, mes = null, ano = null, refPonto = null, nota = '';
  if (def.freq === 'D') {
    dia = contra(anterior);
    mes = contra(ultimoAte(pts, fimDoMesAnterior(u.data)));
    ano = contra(ultimoAte(pts, fimDoAnoAnterior(u.data)));
    refPonto = ultimoAte(pts, ref === 'Semana passada' ? somarDias(u.data, -7) : ref === 'Início do ano' ? fimDoAnoAnterior(u.data) : mesAntes(u.data));
  } else if (def.freq === 'M') {
    mes = contra(anterior);
    ano = contra(ultimoAte(pts, fimDoAnoAnterior(u.data)));
    refPonto = ref === 'Início do ano' ? ultimoAte(pts, fimDoAnoAnterior(u.data)) : anterior;
    if (ref === 'Semana passada') nota = 'série mensal: a comparação mais próxima de uma semana é o mês anterior';
  } else {
    ano = contra(anterior);
    refPonto = anterior;
    if (ref !== 'Início do ano') nota = 'série anual: a comparação é com o ano anterior';
  }
  const r = {
    id: def.id, indicador: def.nome, serie: def.codigo, codigo: `SGS ${def.codigo}`, unidade: def.unidade,
    data: u.data, valor: u.valor, ...(u.dataFim ? { periodoAte: u.dataFim } : {}),
    unidadeDaVariacao: def.tipo === 'preco' ? '%' : 'p.p.',
    variacoes: { dia, mes, ano },
    referencia: refPonto ? { nome: ref, ...contra(refPonto), ...(nota ? { nota } : {}) } : { nome: ref, comparadoCom: null, variacao: null, nota: 'sem dado na data de referência' },
    ...(mesEmAndamento ? { mesEmAndamento } : {}),
  };
  if (def.acumula) {
    const doAno = pts.filter((p) => p.data.slice(0, 4) === u.data.slice(0, 4));
    r.acumuladoNoAno = composicao(doAno);
    const doze = pts.slice(-12);
    if (doze.length === 12 && utc(doze[0].data).getTime() === Date.UTC(+u.data.slice(0, 4), +u.data.slice(5, 7) - 12, 1)) r.acumulado12Meses = composicao(doze);
  }
  return r;
}
function composicao(lista) {
  if (!lista.length) return null;
  const f = lista.reduce((a, p) => a * (1 + p.valor / 100), 1);
  return { valor: arred((f - 1) * 100), meses: lista.length, de: lista[0].data.slice(0, 7), ate: lista.at(-1).data.slice(0, 7),
    conta: `composição das ${lista.length} variações mensais (de ${lista[0].data.slice(0, 7)} a ${lista.at(-1).data.slice(0, 7)}): (1 + mês 1) × (1 + mês 2) × … − 1` };
}

// Juro real: (1 + Selic) ÷ (1 + inflação) − 1, com a conta escrita.
export function juroReal(selic, inflacao) {
  if (!Number.isFinite(selic) || !Number.isFinite(inflacao)) return null;
  const valor = arred(((1 + selic / 100) / (1 + inflacao / 100) - 1) * 100);
  return { valor, conta: `(1 + ${pct(selic)}) ÷ (1 + ${pct(inflacao)}) − 1 = ${pct(valor)}` };
}

// Focus: a data mais recente com estatística e a última data até 28 dias antes dela (a coluna "há 4 semanas").
export function escolherDatasFocus(datas) {
  const ds = [...new Set((datas || []).filter(Boolean))].sort();
  if (!ds.length) return { atual: null, quatroSemanas: null };
  const atual = ds.at(-1), limite = somarDias(atual, -28);
  return { atual, quatroSemanas: ds.filter((d) => d <= limite).at(-1) ?? null };
}

export function limparHtml(s) {
  return String(s ?? '')
    .replace(/<\/(p|div|li|h\d|tr|table)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/[\u200b\u00a0]/g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
}

// Decisão (a frase "O Copom decidiu ...") e placar (nomes listados depois de "Votaram ..." ou "Votou ...").
export function lerComunicado(texto) {
  const t = String(texto || '').replace(/\s+/g, ' ');
  const decisao = (t.match(/O Copom decidiu[\s\S]*?\.(?=\s+[A-ZÀ-Ú]|\s*$)/) || [])[0] ?? null;
  const frases = [...t.matchAll(/\bVot(?:aram|ou)\b[^:]*:\s*([^.]*?)\.(?=\s|$)/g)];
  const nomes = (s) => s.replace(/,?\s+e\s+(?=[A-ZÀ-Ú])/g, ', ').split(',').map((x) => x.trim()).filter(Boolean).length;
  const votacao = frases.map((f) => f[0]);
  return { decisao, votacao, votos: frases.length ? { aFavor: nomes(frases[0][1]), contra: frases.slice(1).reduce((a, f) => a + nomes(f[1]), 0) } : null };
}

const AGENDA = [
  ['Índice Nacional de Preços ao Consumidor Amplo 15', 'IPCA-15'],
  ['Índice Nacional de Preços ao Consumidor Amplo', 'IPCA'],
  ['Índice Nacional de Preços ao Consumidor', 'INPC'],
  ['Sistema de Contas Nacionais Trimestrais', 'PIB trimestral'],
  ['Pesquisa Nacional por Amostra de Domicílios Contínua Mensal', 'Desemprego (PNAD Contínua)'],
  ['Pesquisa Mensal de Comércio', 'Vendas do comércio'],
  ['Pesquisa Mensal de Serviços', 'Volume de serviços'],
  ['Pesquisa Industrial Mensal: Produção Física - Brasil', 'Produção industrial'],
].map(([t, n]) => [sem(t), n]);
// Divulgações do IBGE que mexem com a conversa do assessor, de hoje até `dias` à frente, em ordem de data.
export function filtrarAgenda(itens, hoje, dias = 30) {
  const ate = somarDias(hoje, dias), dois = (n) => String(n).padStart(2, '0');
  return (itens || []).map((x) => {
    const nome = AGENDA.find(([t]) => t === sem(x.titulo))?.[1];
    if (!nome) return null;
    const [d, h] = String(x.data_divulgacao || '').split(' ');
    const data = deBr(d);
    if (!(data >= hoje && data <= ate)) return null;
    const ini = x.mes_referencia_inicio ? `${x.ano_referencia_inicio}-${dois(x.mes_referencia_inicio)}` : x.ano_referencia_inicio ? String(x.ano_referencia_inicio) : null;
    const fim = x.mes_referencia_fim ? `${x.ano_referencia_fim}-${dois(x.mes_referencia_fim)}` : null;
    return { data, hora: h ? h.slice(0, 5) : null, divulgacao: nome, titulo: x.titulo, referencia: fim ? `${ini} a ${fim}` : ini };
  }).filter(Boolean).sort((a, b) => a.data.localeCompare(b.data) || a.divulgacao.localeCompare(b.divulgacao));
}

// ---------- painel ----------
async function blocoFocus(hoje, recorte, lacunas) {
  const ano = +hoje.slice(0, 4), desde = somarDias(hoje, -60 - recuoDaHora()), quais = FOCUS_DO_RECORTE[recorte];
  try {
    const filtro = `(${quais.map((i) => `Indicador eq '${i}'`).join(' or ')}) and (DataReferencia eq '${ano}' or DataReferencia eq '${ano + 1}') and baseCalculo eq 0 and Data ge '${desde}'`;
    const variantes = (recurso, f, sel) => ['5000', '4999', '4998'].map((top) => urlOlinda(`Expectativas/versao/v1/odata/${recurso}`, f, { $select: sel, $top: top }));
    const [ra, rd] = await Promise.all([
      obterUmDe(variantes('ExpectativasMercadoAnuais', filtro, 'Indicador,Data,DataReferencia,Mediana,numeroRespondentes')),
      quais.includes('IPCA') ? obterUmDe(variantes('ExpectativasMercadoInflacao12Meses', `Indicador eq 'IPCA' and Suavizada eq 'S' and baseCalculo eq 0 and Data ge '${desde}'`, 'Indicador,Data,Mediana,numeroRespondentes'))
        .catch((e) => { lacunas.push({ bloco: 'focus', item: 'IPCA esperado para 12 meses', motivo: motivo(e) }); return null; }) : null,
    ]);
    const anuais = ra.v, doze = rd?.v;
    const linhas = anuais?.value || [];
    const { atual, quatroSemanas } = escolherDatasFocus(linhas.map((l) => l.Data));
    if (!atual) { lacunas.push({ bloco: 'focus', item: 'Focus', motivo: 'o serviço de Expectativas não trouxe estatística nos últimos 60 dias' }); return null; }
    const achar = (ind, d, a) => linhas.find((l) => l.Indicador === ind && l.Data === d && l.DataReferencia === String(a));
    const indicadores = quais.map((ind) => ({
      indicador: ind, unidade: ind === 'Câmbio' ? 'R$ por US$ (fim do ano)' : ind === 'Selic' ? '% ao ano (fim do ano)' : '% no ano',
      anos: Object.fromEntries([ano, ano + 1].map((a) => {
        const h = achar(ind, atual, a), q = quatroSemanas ? achar(ind, quatroSemanas, a) : null;
        if (!h) lacunas.push({ bloco: 'focus', item: `${ind} ${a}`, motivo: `sem mediana em ${br(atual)}` });
        return [a, h ? { mediana: h.Mediana, ha4Semanas: q?.Mediana ?? null, mudou: q ? arred(h.Mediana - q.Mediana) : null, respondentes: h.numeroRespondentes } : null];
      })),
    }));
    let ipca12Meses = null;
    if (doze?.value) {
      const h = doze.value.find((l) => l.Data === atual), q = quatroSemanas ? doze.value.find((l) => l.Data === quatroSemanas) : null;
      if (h) ipca12Meses = { mediana: h.Mediana, ha4Semanas: q?.Mediana ?? null, mudou: q ? arred(h.Mediana - q.Mediana) : null, respondentes: h.numeroRespondentes, nota: 'inflação esperada para os próximos 12 meses (série suavizada)' };
      else lacunas.push({ bloco: 'focus', item: 'IPCA esperado para 12 meses', motivo: `sem mediana em ${br(atual)}` });
    }
    return {
      fonte: 'Banco Central, Expectativas de Mercado (Focus), olinda.bcb.gov.br: mediana, base de cálculo 0 (respostas dos últimos 30 dias)',
      data: atual, quatroSemanasAntes: quatroSemanas, nota: 'data da estatística no serviço de Expectativas (respostas consideradas até este dia)',
      indicadores, ...(ipca12Meses ? { ipca12Meses } : {}), consultas: [ra.url, ...(rd ? [rd.url] : [])],
    };
  } catch (e) {
    lacunas.push({ bloco: 'focus', item: 'Focus', motivo: motivo(e) });
    return null;
  }
}

async function blocoCopom(lacunas) {
  try {
    const lista = ((await obterUmDe([`${COPOM}/comunicados?quantidade=2`, `${COPOM}/comunicados?quantidade=3`])).v?.conteudo || []).slice(0, 2);
    const atas = await obterUmDe([`${COPOM}/atas?quantidade=3`, `${COPOM}/atas?quantidade=4`]).then((r) => r.v?.conteudo || []).catch((e) => { lacunas.push({ bloco: 'copom', item: 'atas', motivo: motivo(e) }); return []; });
    const reunioes = await Promise.all(lista.map(async (c) => {
      const n = c.nro_reuniao;
      const urlTexto = `${COPOM}/comunicados_detalhes?nro_reuniao=${n}`;
      let texto = '';
      try { texto = limparHtml((await obterUmDe([urlTexto, urlTexto])).v?.conteudo?.[0]?.textoComunicado); } catch (e) { lacunas.push({ bloco: 'copom', item: `comunicado da ${n}ª reunião`, motivo: motivo(e) }); }
      const ata = atas.find((a) => a.nroReuniao === n);
      let pdfAta = null;
      if (ata) { const u = `${COPOM}/atas_detalhes?nro_reuniao=${n}`; try { pdfAta = (await obterUmDe([u, u])).v?.conteudo?.[0]?.urlPdfAta ?? null; } catch { } }
      const lido = lerComunicado(texto);
      return {
        reuniao: n, dataDaDecisao: c.dataReferencia, ...(ata?.titulo ? { periodo: String(ata.titulo).replace(/^.*?-\s*/, '') } : {}), titulo: String(c.titulo || '').replace(/^\d+ª reunião - /i, '').replace(/\s+/g, ' ').trim(),
        decisao: lido.decisao, votacao: lido.votacao, votos: lido.votos,
        comunicado: { consulta: urlTexto, texto: texto || null },
        ata: ata ? { publicadaEm: ata.dataPublicacao, pdf: pdfAta } : null,
      };
    }));
    if (!reunioes.length) lacunas.push({ bloco: 'copom', item: 'comunicados', motivo: 'a lista de comunicados veio vazia' });
    lacunas.push({ bloco: 'copom', item: 'data da próxima reunião', motivo: 'sem endereço de dados oficial que responda (a página do calendário do Copom é montada por script); a data não é deduzida da série 432' });
    return { fonte: 'Banco Central, comunicados e atas do Copom (www.bcb.gov.br/api/servico/sitebcb/copom)', reunioes, proximaReuniao: null };
  } catch (e) {
    lacunas.push({ bloco: 'copom', item: 'Copom', motivo: motivo(e) });
    return null;
  }
}

async function blocoAgenda(hoje, lacunas) {
  try {
    const { url, v: j } = await obterUmDe(['300', '299', '298'].map((q) => `${IBGE}/calendario/?qtd=${q}&de=${mdA(hoje)}&ate=${mdA(somarDias(hoje, 30))}`));
    return { fonte: 'IBGE, calendário de divulgações (servicodados.ibge.gov.br)', consulta: url, ate: somarDias(hoje, 30), itens: filtrarAgenda(j?.items || [], hoje),
      nota: 'Copom fora da agenda: a data da próxima reunião está nas lacunas' };
  } catch (e) {
    lacunas.push({ bloco: 'agenda', item: 'calendário do IBGE', motivo: motivo(e) });
    return null;
  }
}

// Dólar: a série 1 do SGS é conferida no serviço PTAX (mesmo dia e mesmo valor). Se o PTAX já tiver um dia mais novo, ele entra.
async function conferirPtax(pts, hoje, lacunas) {
  const ptax = (de) => `${OLINDA}/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='${mdA(de)}'&@dataFinalCotacao='${mdA(hoje)}'&$format=json`;
  try {
    const r0 = recuoDaHora();
    const { url, v: j } = await obterUmDe([10, 11, 12].map((k) => ptax(somarDias(hoje, -(k + r0)))));
    const v = [...(j?.value || [])].sort((a, b) => String(a.dataHoraCotacao).localeCompare(String(b.dataHoraCotacao)));
    const ultimo = v.at(-1);
    if (!ultimo) return { pts, conferencia: null };
    const data = String(ultimo.dataHoraCotacao).slice(0, 10), valor = ultimo.cotacaoVenda;
    const noSgs = pts.find((p) => p.data === data);
    if (!noSgs && data > (pts.at(-1)?.data || '')) return { pts: [...pts, { data, valor }], conferencia: { consulta: url, data, cotacaoVenda: valor, boletim: String(ultimo.dataHoraCotacao).slice(11, 16), nota: 'dia ainda fora da série 1: valor do serviço PTAX' } };
    if (noSgs && Math.abs(noSgs.valor - valor) > 0.00005) lacunas.push({ bloco: 'indicadores', item: 'dólar', motivo: `série 1 (${noSgs.valor}) e serviço PTAX (${valor}) diferem em ${br(data)}` });
    return { pts, conferencia: { consulta: url, data, cotacaoVenda: valor, boletim: String(ultimo.dataHoraCotacao).slice(11, 16), bate: !!noSgs && Math.abs(noSgs.valor - valor) <= 0.00005 } };
  } catch (e) {
    lacunas.push({ bloco: 'indicadores', item: 'dólar no serviço PTAX', motivo: motivo(e) });
    return { pts, conferencia: null };
  }
}

// IPCA de conferência no IBGE (tabela 1737): variação do mês, acumulada no ano e em 12 meses.
async function conferirIbge(lacunas) {
  try {
    const { url, v: j } = await obterUmDe(['-2', '-3'].map((p) => `${IBGE}/agregados/1737/periodos/${p}/variaveis/63%7C69%7C2265?localidades=N1%5Ball%5D`));
    const ser = (id) => j.find((v) => String(v.id) === id)?.resultados?.[0]?.series?.[0]?.serie || {};
    const per = Object.keys(ser('63')).sort().at(-1);
    if (!per) throw new Error('a tabela veio sem período');
    const n = (id) => { const x = Number(ser(id)[per]); return Number.isFinite(x) ? x : null; };
    return { consulta: url, periodo: `${per.slice(0, 4)}-${per.slice(4, 6)}`, mensal: n('63'), noAno: n('69'), em12Meses: n('2265'), fonte: 'IBGE, tabela 1737 (variáveis 63, 69 e 2265)' };
  } catch (e) {
    lacunas.push({ bloco: 'indicadores', item: 'IPCA no IBGE (conferência e acumulado no ano)', motivo: motivo(e) });
    return null;
  }
}

export async function painelMacro({ recorte, comparar } = {}, opcoes = {}) {
  const hoje = opcoes.hoje || hojeSP();
  const rec = RECORTES[recorte] ? recorte : 'Painel completo';
  const ref = REFERENCIAS.includes(comparar) ? comparar : 'Mês passado';
  const lacunas = [];
  const ids = RECORTES[rec];
  const comJuroReal = rec !== 'Dólar e câmbio';
  const buscar = [...new Set([...ids, ...(comJuroReal ? ['selic', 'ipca12m'] : [])])];
  const de = `${+hoje.slice(0, 4) - 1}-01-01`; // o ano anterior inteiro: cobre o início do ano e os 12 meses
  const [series, focus, copom, agenda, ibge] = await Promise.all([
    Promise.all(buscar.map(async (id) => { try { return [id, await serieSgs(SERIES[id].codigo, de, hoje)]; } catch (e) { lacunas.push({ bloco: 'indicadores', item: `${SERIES[id].nome} (SGS ${SERIES[id].codigo})`, motivo: motivo(e) }); return [id, null]; } })),
    blocoFocus(hoje, rec, lacunas),
    rec === 'Painel completo' || rec === 'Juros e Copom' ? blocoCopom(lacunas) : null,
    blocoAgenda(hoje, lacunas),
    ids.includes('ipcaMes') ? conferirIbge(lacunas) : null,
  ]);
  const porId = Object.fromEntries(series);
  const calc = {};
  for (const id of buscar) {
    const s = porId[id];
    if (!s) continue;
    let pts = s.pontos, extra = {};
    if (id === 'dolar') { const c = await conferirPtax(pts, hoje, lacunas); pts = c.pts; if (c.conferencia) extra.servicoPtax = c.conferencia; }
    const ind = calcularIndicador({ id, ...SERIES[id] }, pts, ref, { hoje });
    if (!ind) { lacunas.push({ bloco: 'indicadores', item: SERIES[id].nome, motivo: 'a série não trouxe dado até hoje' }); continue; }
    calc[id] = { ...ind, fonte: `Banco Central, SGS ${SERIES[id].codigo}: ${SERIES[id].oficial}`, consulta: s.url, ...extra };
  }
  if (calc.ipcaMes && ibge) {
    const bate = ibge.periodo === calc.ipcaMes.data.slice(0, 7) && ibge.mensal === calc.ipcaMes.valor && (!calc.ipca12m || ibge.em12Meses === calc.ipca12m.valor);
    calc.ipcaMes.conferenciaIbge = { ...ibge, bate };
    if (ibge.periodo === calc.ipcaMes.data.slice(0, 7) && ibge.noAno != null) calc.ipcaMes.acumuladoNoAno = { valor: ibge.noAno, ate: ibge.periodo, fonte: 'IBGE, tabela 1737, variável 69 (variação acumulada no ano)' };
    if (!bate) lacunas.push({ bloco: 'indicadores', item: 'IPCA', motivo: `Banco Central e IBGE não batem: SGS ${calc.ipcaMes.data.slice(0, 7)} ${calc.ipcaMes.valor}% e ${calc.ipca12m?.valor ?? '?'}% em 12 meses; IBGE ${ibge.periodo} ${ibge.mensal}% e ${ibge.em12Meses}%` });
  }
  let jr = null;
  if (comJuroReal) {
    const selic = calc.selic, i12 = calc.ipca12m, esperado = focus?.ipca12Meses;
    const a = selic && i12 ? juroReal(selic.valor, i12.valor) : null, b = selic && esperado ? juroReal(selic.valor, esperado.mediana) : null;
    jr = {
      formula: '(1 + Selic) ÷ (1 + inflação) − 1',
      contraIpca12Meses: a ? { ...a, selic: { valor: selic.valor, data: selic.data }, inflacao: { valor: i12.valor, data: i12.data, fonte: 'SGS 13522, IPCA em 12 meses' }, leitura: 'com a inflação que já aconteceu (últimos 12 meses)' } : null,
      contraIpcaEsperado: b ? { ...b, selic: { valor: selic.valor, data: selic.data }, inflacao: { valor: esperado.mediana, data: focus.data, fonte: 'Focus, IPCA esperado para os próximos 12 meses (suavizada), mediana' }, leitura: 'com a inflação que o mercado espera para os próximos 12 meses' } : null,
    };
    if (!a) lacunas.push({ bloco: 'juroReal', item: 'contra o IPCA de 12 meses', motivo: 'faltou a Selic ou o IPCA de 12 meses' });
    if (!b) lacunas.push({ bloco: 'juroReal', item: 'contra o IPCA esperado', motivo: 'faltou a Selic ou o IPCA esperado do Focus' });
  }
  return {
    hoje, recorte: rec, comparar: ref,
    legenda: 'Em cada indicador: valor e data do último dado; variacoes.dia contra o dado anterior, variacoes.mes contra o último dado do mês anterior (em série mensal, contra o mês anterior), variacoes.ano contra o último dado do ano anterior e referencia contra a referência escolhida. Em taxa a variação é a diferença em pontos percentuais (p.p.); em dólar e euro, em %. As contas já estão feitas: use os números como vieram.',
    indicadores: ids.map((id) => calc[id]).filter(Boolean),
    juroReal: jr, copom, focus, agenda, lacunas,
  };
}

// ---------- CVM ----------
// Lê um arquivo compactado (zip) pelo diretório central e abre cada arquivo com zlib (sem dependência).
export function lerZip(buf) {
  let fim = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) if (buf.readUInt32LE(i) === 0x06054b50) { fim = i; break; }
  if (fim < 0) throw new Error('arquivo compactado inválido: sem diretório central');
  const total = buf.readUInt16LE(fim + 10);
  let p = buf.readUInt32LE(fim + 16);
  if (p === 0xffffffff || total === 0xffff) throw new Error('arquivo compactado em formato ZIP64, não suportado');
  const arquivos = [];
  for (let k = 0; k < total; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('arquivo compactado inválido: diretório central corrompido');
    const flags = buf.readUInt16LE(p + 8), metodo = buf.readUInt16LE(p + 10), comp = buf.readUInt32LE(p + 20), tam = buf.readUInt32LE(p + 24);
    const nNome = buf.readUInt16LE(p + 28), nExtra = buf.readUInt16LE(p + 30), nComent = buf.readUInt16LE(p + 32), local = buf.readUInt32LE(p + 42);
    const nome = buf.subarray(p + 46, p + 46 + nNome).toString(flags & 0x800 ? 'utf8' : 'latin1');
    p += 46 + nNome + nExtra + nComent;
    if (buf.readUInt32LE(local) !== 0x04034b50) throw new Error('arquivo compactado inválido: cabeçalho local');
    const ini = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const bruto = buf.subarray(ini, ini + comp);
    const dados = metodo === 0 ? Buffer.from(bruto) : metodo === 8 ? zlib.inflateRawSync(bruto) : null;
    if (!dados) throw new Error(`arquivo compactado com método ${metodo}, não suportado`);
    if (dados.length !== tam) throw new Error(`arquivo compactado inválido: ${nome} com tamanho diferente do declarado`);
    arquivos.push({ nome, dados });
  }
  return arquivos;
}

// CSV com separador ";" (o da CVM). Aspas só valem quando abrem o campo.
export function lerCsv(texto, sep = ';') {
  const linhas = []; let linha = [], campo = '', aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else aspas = false; } else campo += c;
      continue;
    }
    if (c === '"' && campo === '') { aspas = true; continue; }
    if (c === sep) { linha.push(campo); campo = ''; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.length > 1 || linha[0] !== '') linhas.push(linha);
      linha = [];
      continue;
    }
    campo += c;
  }
  if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

export function documentosDoCsv(texto) {
  const [cab = [], ...linhas] = lerCsv(texto);
  const i = Object.fromEntries(cab.map((c, k) => [c.replace(/^\uFEFF/, '').trim(), k]));
  return linhas.filter((l) => l.length >= cab.length).map((l) => {
    const link = l[i.Link_Download] || '';
    return {
      cnpj: l[i.CNPJ_Companhia], empresa: l[i.Nome_Companhia], codigoCvm: l[i.Codigo_CVM], data: l[i.Data_Entrega], dataReferencia: l[i.Data_Referencia],
      categoria: l[i.Categoria], tipo: l[i.Tipo] || '', especie: l[i.Especie] || '', assunto: l[i.Assunto] || '',
      protocolo: (link.match(/numProtocolo=(\d+)/) || [])[1] || '', protocoloEntrega: l[i.Protocolo_Entrega] || '', versao: l[i.Versao] || '', link,
    };
  });
}

const SUFIXOS = /\b(S A|SA|S A EM RECUPERACAO JUDICIAL|EM RECUPERACAO JUDICIAL|CIA|COMPANHIA)\b/g;
const semSufixo = (s) => sem(s).replace(/\bS A\b|\bSA\b|\bS\/A\b/g, ' ').replace(/\s+/g, ' ').trim();
// Escolhe a companhia: pelo CNPJ (inteiro ou raiz) ou pelo nome. Pelo nome, só escolhe sozinho quando há um nome igual ao
// pedido ou uma única companhia que tem todas as palavras; senão devolve as candidatas para chamar de novo com o CNPJ.
export function filtrarDocumentos(docs, { empresa, tipos, quantidade } = {}) {
  const q = String(empresa ?? '').trim(), digitos = q.replace(/\D/g, '');
  const empresas = new Map();
  for (const d of docs) { const e = empresas.get(d.cnpj) || { nome: d.empresa, cnpj: d.cnpj, codigoCvm: d.codigoCvm, documentos: 0 }; e.documentos++; empresas.set(d.cnpj, e); }
  let candidatas = [];
  if (digitos.length >= 8 && /^[\d.\/\-\s]+$/.test(q)) {
    candidatas = [...empresas.values()].filter((e) => String(e.cnpj).replace(/\D/g, '').startsWith(digitos)).map((e) => ({ ...e, pontos: 3 }));
  } else if (sem(q)) {
    const alvo = semSufixo(q), palavras = sem(q).split(' ');
    for (const e of empresas.values()) {
      const nome = sem(e.nome), pontos = semSufixo(e.nome) === alvo ? 3 : palavras.every((w) => new RegExp(`(^| )${w}( |$)`).test(nome)) ? 1 : 0;
      if (pontos) candidatas.push({ ...e, pontos });
    }
  }
  const iguais = candidatas.filter((c) => c.pontos === 3);
  const escolhida = iguais.length === 1 ? iguais[0] : candidatas.length === 1 ? candidatas[0] : null;
  const categorias = (Array.isArray(tipos) && tipos.length ? tipos : ['Fato Relevante', 'Comunicado ao Mercado']).map(sem);
  const n = Math.min(Math.max(Number(quantidade) || 5, 1), 20);
  const documentos = escolhida ? docs.filter((d) => d.cnpj === escolhida.cnpj && categorias.some((c) => sem(d.categoria).startsWith(c)))
    .sort((a, b) => b.data.localeCompare(a.data) || Number(b.protocolo) - Number(a.protocolo)).slice(0, n)
    .map((d) => ({ data: d.data, categoria: d.categoria, ...(d.tipo ? { tipo: d.tipo } : {}), ...(d.especie ? { especie: d.especie } : {}), assunto: d.assunto, protocolo: d.protocolo, link: d.link, dataReferencia: d.dataReferencia, versao: d.versao })) : [];
  return {
    empresa: escolhida ? { nome: escolhida.nome, cnpj: escolhida.cnpj, codigoCvm: escolhida.codigoCvm } : null,
    candidatas: escolhida ? [] : candidatas.sort((a, b) => b.pontos - a.pontos || b.documentos - a.documentos).slice(0, 10).map(({ nome, cnpj, documentos }) => ({ nome, cnpj, documentos })),
    documentos,
  };
}

// PDF inteiro: começa com %PDF-, termina com %%EOF e, se for linearizado, tem o tamanho que ele mesmo declara.
export function ehPdfCompleto(b) {
  if (!Buffer.isBuffer(b) || b.length < 16 || b.subarray(0, 5).toString('latin1') !== '%PDF-') return false;
  if (!b.subarray(Math.max(0, b.length - 1024)).toString('latin1').includes('%%EOF')) return false;
  const lin = b.subarray(0, 2048).toString('latin1').match(/\/Linearized\s+1(?:\.0)?\s*\/L\s+(\d+)/);
  return !(lin && Number(lin[1]) !== b.length);
}

const cacheCvm = new Map();
async function baseCvm(ano) {
  const c = cacheCvm.get(ano);
  if (c && Date.now() - c.em < 6 * 3600000) return c;
  const url = CVM_IPE(ano);
  const r = await fetch(url, { headers: { 'user-agent': AGENTE }, signal: AbortSignal.timeout(90000) });
  if (!r.ok) throw new Error(`a base da CVM respondeu HTTP ${r.status}`);
  const zip = lerZip(Buffer.from(await r.arrayBuffer()));
  const csv = zip.find((a) => /\.csv$/i.test(a.nome));
  if (!csv) throw new Error('o arquivo da CVM veio sem a planilha');
  const docs = documentosDoCsv(new TextDecoder('windows-1252').decode(csv.dados));
  const lm = r.headers.get('last-modified');
  const v = { em: Date.now(), url, docs, atualizadaEm: lm ? iso(new Date(lm)) : null, maisRecente: docs.reduce((m, d) => (d.data > m ? d.data : m), '') };
  cacheCvm.set(ano, v);
  return v;
}

const nomeArquivo = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'documento';
// O link do sistema Rad da CVM devolve o PDF com etiqueta de página (text/html) e, em boa parte dos pedidos, devolve a
// casca da página em vez do documento (em 18/11/2026, de 14 pedidos espaçados, 4 trouxeram o PDF; repetir com o cookie
// da sessão não ajudou). Tenta até 8 vezes, em cerca de 30 segundos, e só grava quando o arquivo chega inteiro.
const TENTATIVAS_RAD = 8;
async function baixarPdf(doc, pasta) {
  let erro = '';
  for (let t = 1; t <= TENTATIVAS_RAD; t++) {
    try {
      const r = await fetch(doc.link, { headers: { 'user-agent': AGENTE, accept: 'application/pdf,*/*' }, signal: AbortSignal.timeout(60000) });
      const b = Buffer.from(await r.arrayBuffer());
      if (r.ok && ehPdfCompleto(b)) {
        mkdirSync(pasta, { recursive: true });
        const arquivo = path.join(pasta, `CVM-${doc.protocolo}-${doc.data}-${nomeArquivo(doc.assunto)}.pdf`);
        writeFileSync(arquivo, b);
        return { arquivo, bytes: b.length, tentativas: t, etiquetaDoServidor: r.headers.get('content-type') };
      }
      erro = !r.ok ? `HTTP ${r.status}` : b.subarray(0, 5).toString('latin1') === '%PDF-' ? 'o PDF chegou cortado' : 'a CVM devolveu uma página em vez do documento';
    } catch (e) { erro = motivo(e); }
    if (t < TENTATIVAS_RAD) await espera(1000 * t); // espera crescente: as falhas vêm em sequência
  }
  throw new Error(`${erro} (${TENTATIVAS_RAD} tentativas)`);
}

export async function documentosCvm({ empresa, tipos, quantidade, protocolo } = {}, opcoes = {}) {
  const hoje = opcoes.hoje || hojeSP(), ano = +hoje.slice(0, 4);
  const lacunas = [];
  let base;
  try { base = await baseCvm(ano); } catch (e) {
    return { fonte: 'CVM, Dados Abertos: documentos das companhias abertas (IPE)', empresa: null, documentos: [], lacunas: [{ item: `base de documentos da CVM de ${ano}`, motivo: motivo(e) }] };
  }
  let docs = base.docs;
  if (hoje.slice(5, 7) <= '02') {
    try { docs = [...docs, ...(await baseCvm(ano - 1)).docs]; } catch (e) { lacunas.push({ item: `base de documentos da CVM de ${ano - 1}`, motivo: motivo(e) }); }
  }
  const info = {
    fonte: 'CVM, Dados Abertos: documentos das companhias abertas (IPE)', baseConsultada: base.url, baseAtualizadaEm: base.atualizadaEm, documentoMaisRecenteNaBase: base.maisRecente,
    ...(base.maisRecente && base.maisRecente < hoje ? { aviso: `A base aberta da CVM é atualizada uma vez por semana: o documento mais recente dela é de ${br(base.maisRecente)}. Comunicado entregue depois disso não aparece aqui; peça o texto, o link ou o PDF ao assessor.` } : {}),
  };
  if (protocolo) {
    const p = String(protocolo).trim();
    const doc = docs.find((d) => d.protocolo === p || d.protocoloEntrega === p);
    if (!doc) return { ...info, documento: null, arquivo: null, lacunas: [...lacunas, { item: `protocolo ${p}`, motivo: 'não está na base aberta da CVM (pode ser mais novo que a base ou o número está errado)' }] };
    const documento = { empresa: doc.empresa, cnpj: doc.cnpj, data: doc.data, categoria: doc.categoria, ...(doc.tipo ? { tipo: doc.tipo } : {}), assunto: doc.assunto, protocolo: doc.protocolo, link: doc.link };
    try {
      const b = await baixarPdf(doc, opcoes.pastaFontes || path.join(pastaBase(), 'Fontes'));
      return { ...info, documento, arquivo: b.arquivo, bytes: b.bytes, tentativas: b.tentativas, lacunas };
    } catch (e) {
      return { ...info, documento, arquivo: null, lacunas: [...lacunas, { item: 'PDF do documento', motivo: `${motivo(e)}; o link oficial está em documento.link` }] };
    }
  }
  if (!String(empresa ?? '').trim()) return { ...info, empresa: null, documentos: [], lacunas: [...lacunas, { item: 'empresa', motivo: 'informe o nome da companhia, o CNPJ ou o protocolo' }] };
  const r = filtrarDocumentos(docs, { empresa, tipos, quantidade });
  if (!r.empresa) lacunas.push({ item: 'empresa', motivo: r.candidatas.length ? 'mais de uma companhia com esse nome: chame de novo com o CNPJ de uma das candidatas' : `nenhuma companhia aberta com "${String(empresa).slice(0, 60)}" na base da CVM; tente o nome da companhia ou o CNPJ (a analise_ativo devolve o cnpj pelo ticker)` });
  else if (!r.documentos.length) lacunas.push({ item: 'documentos', motivo: 'nenhum documento dessas categorias na base deste ano' });
  return { ...info, empresa: r.empresa, candidatas: r.candidatas, categorias: Array.isArray(tipos) && tipos.length ? tipos : ['Fato Relevante', 'Comunicado ao Mercado'], documentos: r.documentos, lacunas };
}
