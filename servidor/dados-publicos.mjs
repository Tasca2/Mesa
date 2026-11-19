import { mkdirSync, writeFileSync, readFileSync, readdirSync, renameSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pastaBase } from './gerador.mjs';

const SGS = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';
const OLINDA = 'https://olinda.bcb.gov.br/olinda/servico';
const COPOM = 'https://www.bcb.gov.br/api/servico/sitebcb/copom';
const IBGE = 'https://servicodados.ibge.gov.br/api/v3';
const CVM_IPE = (ano) => `https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_${ano}.zip`;
const AGENTE = 'Mozilla/5.0 (compatible; MesaDoAssessor/1.0; dados publicos)';

export const SERIES = {
  selic: { codigo: 432, nome: 'Selic (meta do Copom)', unidade: '% ao ano', tipo: 'taxa', freq: 'D', oficial: 'Taxa de juros - Meta Selic definida pelo Copom' },
  cdiAno: { codigo: 4389, nome: 'CDI ao ano', unidade: '% ao ano', tipo: 'taxa', freq: 'D', oficial: 'Taxa de juros - CDI anualizada base 252' },
  cdiMes: { codigo: 4391, nome: 'CDI no mês', unidade: '% no mês', tipo: 'taxa', freq: 'M', acumula: true, parcialNoMes: true, oficial: 'Taxa de juros - CDI acumulada no mês' },
  ipcaMes: { codigo: 433, nome: 'IPCA do mês', unidade: '% no mês', tipo: 'taxa', freq: 'M', oficial: 'Índice nacional de preços ao consumidor-amplo (IPCA), variação % mensal' },
  ipca12m: { codigo: 13522, nome: 'IPCA em 12 meses', unidade: '% em 12 meses', tipo: 'taxa', freq: 'M', oficial: 'Índice nacional de preços ao consumidor - amplo (IPCA) - em 12 meses' },
  metaInflacao: { codigo: 13521, nome: 'Meta de inflação', unidade: '% ao ano', tipo: 'taxa', freq: 'A', oficial: 'Meta para a inflação' },
  igpmMes: { codigo: 189, nome: 'IGP-M do mês', unidade: '% no mês', tipo: 'taxa', freq: 'M', acumula: true, oficial: 'Índice geral de preços do mercado (IGP-M), variação % mensal' },
  dolar: { codigo: 1, nome: 'Dólar (PTAX de fechamento, venda)', unidade: 'R$ por US$', tipo: 'preco', freq: 'D', oficial: 'Taxa de câmbio - Livre - Dólar americano (venda) - diário',
    oQueE: 'A série 1 do SGS é a taxa PTAX de fechamento, de venda, do Banco Central (fonte no cadastro: Sisbacen PTAX800): um valor por dia útil. Não é a cotação de agora nem o câmbio de varejo.' },
  euro: { codigo: 21619, nome: 'Euro (venda)', unidade: 'R$ por euro', tipo: 'preco', freq: 'D', oficial: 'Taxa de câmbio - Livre - Euro (venda)' },
  poupanca: { codigo: 195, nome: 'Poupança (rendimento no período de um mês)', unidade: '% no período', tipo: 'taxa', freq: 'D', oficial: 'Depósitos de poupança a partir de 04.05.2012 - Rentabilidade no período' },
  desemprego: { codigo: 24369, nome: 'Desemprego (PNAD Contínua, trimestre móvel)', unidade: '% da força de trabalho', tipo: 'taxa', freq: 'M', oficial: 'Taxa de desocupação - PNADC' },
};
export const CDI_DIARIO = { codigo: 12, oficial: 'Taxa de juros - CDI', unidade: '% ao dia' };
export const INDICE_IGPM = {
  url: "https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='IGP12_IGPM12')",
  nome: 'IGP-M - geral - índice (ago. 1994 = 100)', fonte: 'FGV (Conjuntura Econômica - IGP), série IGP12_IGPM12 do Ipeadata',
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

const iso = (d) => d.toISOString().slice(0, 10);
const utc = (s) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) || 1));
export const hojeSP = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const br = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
const mdA = (s) => `${s.slice(5, 7)}-${s.slice(8, 10)}-${s.slice(0, 4)}`;
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
export const arred = (x, n = 2) => {
  if (x == null || !Number.isFinite(x)) return null;
  const f = 10 ** n, r = Math.sign(x) * Math.round(Math.abs(x) * f + 1e-9) / f;
  return Object.is(r, -0) ? 0 : r;
};
const pct = (x) => x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + '%';
const variacao = (tipo, atual, base) => (base == null || !Number.isFinite(base) ? null : tipo === 'preco' ? (base === 0 ? null : arred((atual / base - 1) * 100)) : arred(atual - base));
const ultimoAte = (pts, limite) => { let r = null; for (const p of pts) { if (p.data <= limite) r = p; else break; } return r; };
const sem = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const num3 = (x) => x.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const mesesAte = (ate, n) => Array.from({ length: n }, (_, k) => iso(new Date(Date.UTC(+ate.slice(0, 4), +ate.slice(5, 7) - n + k, 1))).slice(0, 7));
const diasDeSemanaEntre = (a, b) => { let n = 0; for (let d = somarDias(a, 1); d < b; d = somarDias(d, 1)) { const w = utc(d).getUTCDay(); if (w > 0 && w < 6) n++; } return n; };

const cache = new Map();
const MINUTOS_DE_CACHE = 10;
export function guardarNoCache(mapa, chave, valor, validadeMs, agora = Date.now()) {
  for (const [k, e] of mapa) if (agora - e.em >= validadeMs) mapa.delete(k);
  mapa.set(chave, { em: agora, v: valor });
}
async function obter(url, { tipo = 'json', tempo = 25000, cabecalhos = {}, semCache = false } = {}) {
  const c = cache.get(url);
  if (!semCache && c && Date.now() - c.em < MINUTOS_DE_CACHE * 60000) return c.v;
  const r = await fetch(url, { headers: { accept: tipo === 'json' ? 'application/json' : '*/*', 'user-agent': AGENTE, ...cabecalhos }, signal: AbortSignal.timeout(tempo) });
  if (!r.ok) throw new Error(r.status === 304 ? 'o endereço respondeu HTTP 304, sem conteúdo' : `o endereço respondeu HTTP ${r.status}`);
  let v;
  if (tipo === 'json') { const t = await r.text(); try { v = JSON.parse(t); } catch { throw new Error('a resposta não veio em JSON'); } } else v = Buffer.from(await r.arrayBuffer());
  const vazio = Array.isArray(v) ? !v.length : (v && Array.isArray(v.value) && !v.value.length);
  if (!vazio) guardarNoCache(cache, url, v, MINUTOS_DE_CACHE * 60000);
  return v;
}
const motivo = (e) => (e?.name === 'TimeoutError' ? 'o endereço não respondeu a tempo' : String(e?.message || e));
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

export function calcularIndicador(def, pontosBrutos, comparar = 'Mês passado', { hoje = hojeSP() } = {}) {
  const ref = REFERENCIAS.includes(comparar) ? comparar : 'Mês passado';
  let pts = (pontosBrutos || []).filter((p) => p && Number.isFinite(p.valor) && p.data <= hoje).sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  let mesEmAndamento = null;
  if (def.parcialNoMes && pts.length && pts.at(-1).data.slice(0, 7) === hoje.slice(0, 7)) {
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
    if (dia) {
      dia.rotulo = `de ${br(anterior.data)} a ${br(u.data)}`;
      const n = diasDeSemanaEntre(anterior.data, u.data);
      if (n) dia.nota = `entre as duas datas há ${n} ${n > 1 ? 'dias' : 'dia'} de semana sem dado (feriado ou dado ainda não publicado): a variação cobre todo esse intervalo`;
    }
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
  return { valor: arred((f - 1) * 100), meses: lista.length, de: lista[0].data.slice(0, 7), ate: lista.at(-1).data.slice(0, 7), aproximado: true,
    metodo: 'composição das variações mensais publicadas, que vêm arredondadas em 2 casas: valor calculado pela Mesa, pode diferir em alguns centésimos do número oficial',
    conta: `composição das ${lista.length} variações mensais (de ${lista[0].data.slice(0, 7)} a ${lista.at(-1).data.slice(0, 7)}): (1 + mês 1) × (1 + mês 2) × … − 1` };
}

export function acumuladosDoCdi(ind, dias, meses, lacunas, { consulta, erro } = {}) {
  if (!ind) return ind;
  if (!Array.isArray(dias) || !dias.length) {
    lacunas.push({ bloco: 'indicadores', item: 'CDI acumulado (série diária 12)', motivo: `a série diária do CDI não veio${erro ? ` (${erro})` : ''}: os acumulados ficam pela composição dos meses, aproximada` });
    return ind;
  }
  const porMes = new Map();
  for (const p of [...dias].filter((p) => p && Number.isFinite(p.valor)).sort((a, b) => (a.data < b.data ? -1 : 1))) {
    const m = p.data.slice(0, 7);
    if (!porMes.has(m)) porMes.set(m, []);
    porMes.get(m).push(p);
  }
  const daSerieMensal = new Map((meses || []).map((p) => [p.data.slice(0, 7), p.valor]));
  const fator = (lista) => lista.reduce((a, p) => a * (1 + p.valor / 100), 1);
  const bate = (m) => porMes.get(m)?.length && daSerieMensal.has(m) && Math.abs(arred((fator(porMes.get(m)) - 1) * 100) - daSerieMensal.get(m)) <= 0.01 + 1e-9;
  const fim = ind.data.slice(0, 7), doze = mesesAte(fim, 12);
  const r = { ...ind };
  for (const [chave, janela, nome] of [['acumulado12Meses', doze, 'em 12 meses'], ['acumuladoNoAno', doze.filter((m) => m.slice(0, 4) === fim.slice(0, 4)), 'no ano']]) {
    const falhos = janela.filter((m) => !bate(m));
    if (falhos.length) {
      lacunas.push({ bloco: 'indicadores', item: `CDI acumulado ${nome}`, motivo: `os dias da série 12 não batem com a série 4391 em ${falhos.join(', ')}: fica a composição dos meses, aproximada` });
      continue;
    }
    const lista = janela.flatMap((m) => porMes.get(m));
    const valor = arred((fator(lista) - 1) * 100);
    r[chave] = {
      valor, meses: janela.length, dias: lista.length, de: janela[0], ate: janela.at(-1), primeiroDia: lista[0].data, ultimoDia: lista.at(-1).data,
      metodo: 'composição dos fatores diários do CDI (série 12 do SGS), a mesma conta da série mensal 4391; cada mês conferido com a 4391',
      fonte: `Banco Central, SGS ${CDI_DIARIO.codigo}: ${CDI_DIARIO.oficial} (${CDI_DIARIO.unidade})`, ...(consulta ? { consulta } : {}),
      conta: `(1 + CDI do 1º dia) × (1 + CDI do 2º dia) × … − 1, com os ${lista.length} dias úteis de ${br(lista[0].data)} a ${br(lista.at(-1).data)} = ${pct(valor)}`,
    };
  }
  return r;
}

export function acumuladosDoIgpm(ind, indice, lacunas, { consulta, erro } = {}) {
  if (!ind) return ind;
  const item = 'IGP-M acumulado (número-índice da FGV)', depois = 'os acumulados ficam pela composição dos meses, aproximada';
  const mapa = new Map((indice || []).filter((p) => p && Number.isFinite(p.valor)).map((p) => [p.data.slice(0, 7), p.valor]));
  const fim = ind.data.slice(0, 7), [antes] = mesesAte(fim, 2);
  if (!mapa.size) { lacunas.push({ bloco: 'indicadores', item, motivo: `o número-índice do IGP-M não veio${erro ? ` (${erro})` : ''}: ${depois}` }); return ind; }
  const iu = mapa.get(fim), ia = mapa.get(antes);
  if (iu == null || ia == null) { lacunas.push({ bloco: 'indicadores', item, motivo: `o número-índice do IGP-M ainda não tem ${iu == null ? fim : antes}: ${depois}` }); return ind; }
  const doMes = arred((iu / ia - 1) * 100);
  if (Math.abs(doMes - ind.valor) > 0.01 + 1e-9) { lacunas.push({ bloco: 'indicadores', item, motivo: `o número-índice dá ${pct(doMes)} em ${fim} e a série 189 dá ${pct(ind.valor)}: ${depois}` }); return ind; }
  const r = { ...ind };
  for (const [chave, base, meses] of [['acumulado12Meses', mesesAte(fim, 13)[0], 12], ['acumuladoNoAno', `${+fim.slice(0, 4) - 1}-12`, +fim.slice(5, 7)]]) {
    const ib = mapa.get(base);
    if (ib == null) { lacunas.push({ bloco: 'indicadores', item, motivo: `o número-índice não tem ${base}: o acumulado ${chave === 'acumuladoNoAno' ? 'no ano' : 'em 12 meses'} fica pela composição dos meses, aproximada` }); continue; }
    const valor = arred((iu / ib - 1) * 100);
    r[chave] = {
      valor, meses, de: mesesAte(fim, meses)[0], ate: fim,
      metodo: 'variação do número-índice do IGP-M entre o mês de referência e o mês-base, a conta da FGV',
      fonte: `${INDICE_IGPM.nome}: ${INDICE_IGPM.fonte}`, ...(consulta ? { consulta } : {}),
      conta: `${num3(iu)} ÷ ${num3(ib)} − 1 = ${pct(valor)} (índice de ${fim} sobre o de ${base})`,
    };
  }
  return r;
}

export function juroReal(selic, inflacao) {
  if (!Number.isFinite(selic) || !Number.isFinite(inflacao)) return null;
  const valor = arred(((1 + selic / 100) / (1 + inflacao / 100) - 1) * 100);
  return { valor, conta: `(1 + ${pct(selic)}) ÷ (1 + ${pct(inflacao)}) − 1 = ${pct(valor)}` };
}

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
const deUtc = (s) => {
  const m = String(s || '').match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?/);
  if (!m) return null;
  if (!m[4]) return { data: `${m[3]}-${m[2]}-${m[1]}`, hora: null };
  const t = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]));
  return {
    data: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(t),
    hora: new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(t),
  };
};
export function filtrarAgenda(itens, hoje, dias = 30) {
  const ate = somarDias(hoje, dias), dois = (n) => String(n).padStart(2, '0');
  return (itens || []).map((x) => {
    const nome = AGENDA.find(([t]) => t === sem(x.titulo))?.[1];
    if (!nome) return null;
    const quando = deUtc(x.data_divulgacao);
    if (!quando) return null;
    const { data, hora } = quando;
    if (!(data >= hoje && data <= ate)) return null;
    const ini = x.mes_referencia_inicio ? `${x.ano_referencia_inicio}-${dois(x.mes_referencia_inicio)}` : x.ano_referencia_inicio ? String(x.ano_referencia_inicio) : null;
    const fim = x.mes_referencia_fim ? `${x.ano_referencia_fim}-${dois(x.mes_referencia_fim)}` : null;
    return { data, hora, divulgacao: nome, titulo: x.titulo, referencia: fim ? `${ini} a ${fim}` : ini };
  }).filter(Boolean).sort((a, b) => a.data.localeCompare(b.data) || a.divulgacao.localeCompare(b.divulgacao));
}

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
    return { fonte: 'IBGE, calendário de divulgações (servicodados.ibge.gov.br)', consulta: url, ate: somarDias(hoje, 30), horario: 'de Brasília (o calendário do IBGE publica a hora em UTC, três horas à frente; aqui ela já vem convertida)', itens: filtrarAgenda(j?.items || [], hoje),
      nota: 'Copom fora da agenda: a data da próxima reunião está nas lacunas' };
  } catch (e) {
    lacunas.push({ bloco: 'agenda', item: 'calendário do IBGE', motivo: motivo(e) });
    return null;
  }
}

export function juntarPtax(pts, cotacoes) {
  const porDia = new Map();
  for (const c of [...(cotacoes || [])].sort((a, b) => String(a.dataHoraCotacao).localeCompare(String(b.dataHoraCotacao)))) {
    const valor = Number(c.cotacaoVenda);
    if (Number.isFinite(valor)) porDia.set(String(c.dataHoraCotacao).slice(0, 10), { valor, boletim: String(c.dataHoraCotacao).slice(11, 16) });
  }
  const naSerie = new Map(pts.map((p) => [p.data, p.valor])), ultimaDaSerie = pts.at(-1)?.data || '';
  const novos = [], divergencias = [];
  let conferidos = 0;
  for (const [data, c] of porDia) {
    if (naSerie.has(data)) {
      conferidos++;
      if (Math.abs(naSerie.get(data) - c.valor) > 0.00005) divergencias.push({ data, sgs: naSerie.get(data), ptax: c.valor });
    } else if (data > ultimaDaSerie) novos.push(data);
  }
  const ud = [...porDia.keys()].at(-1);
  return {
    pts: [...pts, ...novos.map((data) => ({ data, valor: porDia.get(data).valor }))], novos, divergencias, conferidos,
    ultimo: ud ? { data: ud, cotacaoVenda: porDia.get(ud).valor, boletim: porDia.get(ud).boletim } : null,
  };
}

async function conferirPtax(pts, hoje, lacunas) {
  const ptax = (de) => `${OLINDA}/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='${mdA(de)}'&@dataFinalCotacao='${mdA(hoje)}'&$format=json`;
  try {
    const r0 = recuoDaHora();
    const { url, v: j } = await obterUmDe([10, 11, 12].map((k) => ptax(somarDias(hoje, -(k + r0)))));
    const x = juntarPtax(pts, j?.value);
    if (!x.ultimo) return { pts, conferencia: null };
    for (const d of x.divergencias) lacunas.push({ bloco: 'indicadores', item: 'dólar', motivo: `série 1 (${d.sgs}) e serviço PTAX (${d.ptax}) diferem em ${br(d.data)}` });
    const fora = x.novos.length ? { diasForaDaSerie1: x.novos, nota: `${x.novos.length > 1 ? 'dias' : 'dia'} ainda fora da série 1 (${x.novos.map(br).join(', ')}): valor do serviço PTAX` } : {};
    return { pts: x.pts, conferencia: { consulta: url, data: x.ultimo.data, cotacaoVenda: x.ultimo.cotacaoVenda, boletim: x.ultimo.boletim, diasConferidos: x.conferidos, bate: x.conferidos > 0 && !x.divergencias.length, ...fora } };
  } catch (e) {
    lacunas.push({ bloco: 'indicadores', item: 'dólar no serviço PTAX', motivo: motivo(e) });
    return { pts, conferencia: null };
  }
}

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
  const de = `${+hoje.slice(0, 4) - 1}-01-01`;
  const indiceIgpm = async () => {
    const j = await obter(INDICE_IGPM.url, { tempo: 30000 });
    if (!Array.isArray(j?.value)) throw new Error('o Ipeadata não devolveu a lista de valores');
    return { url: INDICE_IGPM.url, pontos: j.value.map((p) => ({ data: String(p.VALDATA).slice(0, 10), valor: Number(p.VALVALOR) })).filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.data) && Number.isFinite(p.valor)) };
  };
  const [series, focus, copom, agenda, ibge, cdiDia, igpmIndice] = await Promise.all([
    Promise.all(buscar.map(async (id) => { try { return [id, await serieSgs(SERIES[id].codigo, de, hoje)]; } catch (e) { lacunas.push({ bloco: 'indicadores', item: `${SERIES[id].nome} (SGS ${SERIES[id].codigo})`, motivo: motivo(e) }); return [id, null]; } })),
    blocoFocus(hoje, rec, lacunas),
    rec === 'Painel completo' || rec === 'Juros e Copom' ? blocoCopom(lacunas) : null,
    blocoAgenda(hoje, lacunas),
    ids.includes('ipcaMes') ? conferirIbge(lacunas) : null,
    ids.includes('cdiMes') ? serieSgs(CDI_DIARIO.codigo, de, hoje).catch((e) => ({ erro: motivo(e) })) : null,
    ids.includes('igpmMes') ? indiceIgpm().catch((e) => ({ erro: motivo(e) })) : null,
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
    calc[id] = { ...ind, fonte: `Banco Central, SGS ${SERIES[id].codigo}: ${SERIES[id].oficial}`, consulta: s.url, ...(SERIES[id].oQueE ? { oQueE: SERIES[id].oQueE } : {}), ...extra };
  }
  if (calc.cdiMes) calc.cdiMes = acumuladosDoCdi(calc.cdiMes, cdiDia?.pontos, porId.cdiMes?.pontos, lacunas, { consulta: cdiDia?.url, erro: cdiDia?.erro });
  if (calc.igpmMes) calc.igpmMes = acumuladosDoIgpm(calc.igpmMes, igpmIndice?.pontos, lacunas, { consulta: igpmIndice?.url, erro: igpmIndice?.erro });
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
    legenda: 'Em cada indicador: valor e data do último dado; variacoes.dia contra o dado anterior (rotulo diz as duas datas comparadas; com nota, há dia de semana sem dado no meio e a variação cobre o intervalo todo: diga as datas), variacoes.mes contra o último dado do mês anterior (em série mensal, contra o mês anterior), variacoes.ano contra o último dado do ano anterior e referencia contra a referência escolhida. Em taxa a variação é a diferença em pontos percentuais (p.p.); em dólar e euro, em %. Só o CDI do mês tem mesEmAndamento (o mês corrente, ainda aberto). Os acumulados do CDI e do IGP-M seguem a conta oficial (CDI pelos dias da série 12; IGP-M pelo número-índice da FGV); se vierem com aproximado: true, são a composição dos meses calculada pela Mesa: diga isso. As contas já estão feitas: use os números como vieram.',
    indicadores: ids.map((id) => calc[id]).filter(Boolean),
    juroReal: jr, copom, focus, agenda, lacunas,
  };
}

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

export function ehPdfCompleto(b) {
  if (!Buffer.isBuffer(b) || b.length < 16 || b.subarray(0, 5).toString('latin1') !== '%PDF-') return false;
  if (!b.subarray(Math.max(0, b.length - 1024)).toString('latin1').includes('%%EOF')) return false;
  const lin = b.subarray(0, 2048).toString('latin1').match(/\/Linearized\s+1(?:\.0)?\s*\/L\s+(\d+)/);
  return !(lin && Number(lin[1]) !== b.length);
}

const cacheCvm = new Map();
const HORAS_DE_CACHE_CVM = 6;
async function baseCvm(ano) {
  const c = cacheCvm.get(ano);
  if (c && Date.now() - c.em < HORAS_DE_CACHE_CVM * 3600000) return c.v;
  const url = CVM_IPE(ano);
  const r = await fetch(url, { headers: { 'user-agent': AGENTE }, signal: AbortSignal.timeout(90000) });
  if (!r.ok) throw new Error(`a base da CVM respondeu HTTP ${r.status}`);
  const zip = lerZip(Buffer.from(await r.arrayBuffer()));
  const csv = zip.find((a) => /\.csv$/i.test(a.nome));
  if (!csv) throw new Error('o arquivo da CVM veio sem a planilha');
  const docs = documentosDoCsv(new TextDecoder('windows-1252').decode(csv.dados));
  const lm = r.headers.get('last-modified');
  const v = { url, docs, atualizadaEm: lm ? iso(new Date(lm)) : null, maisRecente: docs.reduce((m, d) => (d.data > m ? d.data : m), '') };
  guardarNoCache(cacheCvm, ano, v, HORAS_DE_CACHE_CVM * 3600000);
  return v;
}

const nomeArquivo = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'documento';
const TENTATIVAS_RAD = 8;
const linkDaCvm = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && /(^|\.)cvm\.gov\.br$/.test(x.hostname); } catch { return false; } };
async function baixarPdf(doc, pasta) {
  if (!linkDaCvm(doc.link)) throw new Error('o link do documento não é do site da CVM');
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
    if (t < TENTATIVAS_RAD) await espera(1000 * t);
  }
  throw new Error(`${erro} (${TENTATIVAS_RAD} tentativas)`);
}

export async function documentosCvm({ empresa, tipos, quantidade, protocolo } = {}, opcoes = {}) {
  const hoje = opcoes.hoje || hojeSP(), ano = +hoje.slice(0, 4);
  const lacunas = [];
  const vazio = (l) => ({ fonte: 'CVM, Dados Abertos: documentos das companhias abertas (IPE)', empresa: null, documentos: [], lacunas: l });
  const inicioDoAno = hoje.slice(5, 7) <= '02';
  let base, docs = [];
  try { base = await baseCvm(ano); docs = base.docs; } catch (e) {
    lacunas.push({ item: `base de documentos da CVM de ${ano}`, motivo: motivo(e) });
    if (!inicioDoAno) return vazio(lacunas);
  }
  if (inicioDoAno) {
    try { const ant = await baseCvm(ano - 1); docs = [...docs, ...ant.docs]; base = base || ant; } catch (e) { lacunas.push({ item: `base de documentos da CVM de ${ano - 1}`, motivo: motivo(e) }); }
    if (!base) return vazio(lacunas);
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

export const TESOURO_CSV = process.env.MESA_TESOURO_URL ||
  'https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/PrecoTaxaTesouroDireto.csv';
const FONTE_TESOURO = 'Tesouro Transparente (Tesouro Nacional), arquivo PrecoTaxaTesouroDireto';
const MINUTOS_TESOURO = 30;
const COLUNAS_TESOURO = { tipo: 'Tipo Titulo', vencimento: 'Data Vencimento', dataBase: 'Data Base', taxaCompra: 'Taxa Compra Manha',
  taxaVenda: 'Taxa Venda Manha', puCompra: 'PU Compra Manha', puVenda: 'PU Venda Manha', puBase: 'PU Base Manha' };
const TIPOS_TESOURO = ['Tesouro Prefixado', 'Tesouro Prefixado com Juros Semestrais', 'Tesouro IPCA+', 'Tesouro IPCA+ com Juros Semestrais',
  'Tesouro Selic', 'Tesouro IGPM+ com Juros Semestrais', 'Tesouro Renda+ Aposentadoria Extra', 'Tesouro Educa+'];
const PARECIDOS_TESOURO = TIPOS_TESOURO.slice(0, 6);
const chaveTipo = (s) => sem(s).replace(/ /g, '');
const dataBrOk = (s) => (/^\d{2}\/\d{2}\/\d{4}$/.test(String(s ?? '').trim()) ? deBr(String(s).trim()) : null);
const numBr = (s) => {
  let t = String(s ?? '').trim();
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const x = Number(t);
  return Number.isFinite(x) ? x : null;
};
const diasEntre = (a, b) => Math.round((utc(a) - utc(b)) / 86400000);
const diaEmSP = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(ms));
const RENDA_MENSAL = { RENDA: { anos: 20, parcelas: 240 }, EDUCA: { anos: 5, parcelas: 60 } };
const rendaMensal = (tipo) => (/\bRENDA\b/.test(sem(tipo)) ? RENDA_MENSAL.RENDA : /\bEDUCA\b/.test(sem(tipo)) ? RENDA_MENSAL.EDUCA : null);

export function indexadorDoTipo(tipo) {
  const s = sem(tipo);
  if (/PREFIXADO/.test(s)) return 'prefixado';
  if (/SELIC/.test(s)) return 'selic';
  if (/\bIGP ?M\b/.test(s)) return 'igpm';
  if (/IPCA|\bRENDA\b|\bEDUCA\b/.test(s)) return 'ipca';
  return null;
}
export function nomeDoTitulo(tipo, vencimento) {
  const ano = +String(vencimento).slice(0, 4), r = rendaMensal(tipo);
  return `${tipo} ${r ? ano - r.anos + 1 : ano}`;
}
export function taxaEmTexto(tipo, taxa) {
  if (taxa == null || !Number.isFinite(taxa)) return null;
  const n = (x) => x.toFixed(2).replace('.', ',');
  const i = indexadorDoTipo(tipo);
  if (i === 'prefixado') return `${n(taxa)}% ao ano (prefixado)`;
  const nome = { ipca: 'IPCA', selic: 'Selic', igpm: 'IGP-M' }[i];
  if (!nome) return `${n(taxa)}% ao ano`;
  return `${nome} ${taxa < 0 ? '-' : '+'} ${n(Math.abs(taxa))}% ao ano`;
}
function formaDePagamento(tipo, vencimento) {
  const r = rendaMensal(tipo);
  if (r) {
    const inicio = +vencimento.slice(0, 4) - r.anos + 1;
    return `Renda mensal: ${r.parcelas} parcelas (${r.anos} anos), de 15/01/${inicio} até o vencimento em ${br(vencimento)}; antes de 15/01/${inicio} o título não paga nada`;
  }
  if (/SEMESTRAIS/.test(sem(tipo))) return 'Juros a cada seis meses e o valor de face no vencimento';
  return 'Tudo no vencimento';
}
const completarTitulo = (t) => ({
  nome: nomeDoTitulo(t.tipo, t.vencimento), tipo: t.tipo, vencimento: t.vencimento, indexador: indexadorDoTipo(t.tipo),
  taxaCompra: t.taxaCompra, taxaVenda: t.taxaVenda, taxaCompraTexto: taxaEmTexto(t.tipo, t.taxaCompra), taxaVendaTexto: taxaEmTexto(t.tipo, t.taxaVenda),
  puCompra: t.puCompra, puVenda: t.puVenda, puBase: t.puBase, pagamento: formaDePagamento(t.tipo, t.vencimento),
  diasCorridosAteOVencimento: t.dataBase ? diasEntre(t.vencimento, t.dataBase) : null, dataBase: t.dataBase,
});
const ordemTipo = (tipo) => { const i = TIPOS_TESOURO.findIndex((x) => chaveTipo(x) === chaveTipo(tipo)); return i < 0 ? 99 : i; };

export function lerTesouro(texto) {
  const linhas = String(texto ?? '').replace(/^﻿/, '').split(/\r?\n/);
  const cab = (linhas[0] || '').split(';').map(sem);
  const col = {};
  for (const [k, nome] of Object.entries(COLUNAS_TESOURO)) {
    col[k] = cab.indexOf(sem(nome));
    if (col[k] < 0) throw new Error(`o arquivo do Tesouro mudou de formato: falta a coluna "${nome}"`);
  }
  let maior = '', sel = [];
  for (let n = 1; n < linhas.length; n++) {
    if (!linhas[n]) continue;
    const c = linhas[n].split(';'), d = dataBrOk(c[col.dataBase]);
    if (!d) continue;
    if (d > maior) { maior = d; sel = [c]; } else if (d === maior) sel.push(c);
  }
  if (!sel.length) throw new Error('o arquivo do Tesouro veio sem nenhuma linha de taxa');
  const titulos = sel
    .map((c) => ({ tipo: String(c[col.tipo] ?? '').trim(), vencimento: dataBrOk(c[col.vencimento]), dataBase: maior,
      taxaCompra: numBr(c[col.taxaCompra]), taxaVenda: numBr(c[col.taxaVenda]), puCompra: numBr(c[col.puCompra]), puVenda: numBr(c[col.puVenda]), puBase: numBr(c[col.puBase]) }))
    .filter((t) => t.tipo && t.vencimento)
    .map(completarTitulo)
    .sort((a, b) => ordemTipo(a.tipo) - ordemTipo(b.tipo) || (a.vencimento < b.vencimento ? -1 : a.vencimento > b.vencimento ? 1 : 0));
  return { dataBase: maior, titulos };
}

const NOMES_ANTIGOS = [
  [/\bNTN ?B ?PRINCIPAL\b|\bNTNB ?P\b/, 'Tesouro IPCA+'], [/\bNTN ?B\b|\bNTNB\b/, 'Tesouro IPCA+ com Juros Semestrais'],
  [/\bNTN ?F\b|\bNTNF\b/, 'Tesouro Prefixado com Juros Semestrais'], [/\bNTN ?C\b|\bNTNC\b/, 'Tesouro IGPM+ com Juros Semestrais'],
  [/\bLTN\b/, 'Tesouro Prefixado'], [/\bLFT\b/, 'Tesouro Selic'],
];
function tipoDaConsulta(q) {
  if (/\bRENDA\b(?! FIXA)/.test(q)) return 'Tesouro Renda+ Aposentadoria Extra';
  if (/\bEDUCA\b/.test(q)) return 'Tesouro Educa+';
  for (const [re, tipo] of NOMES_ANTIGOS) if (re.test(q)) return tipo;
  const js = /SEMESTR|\bJS\b|\bCUPOM\b/.test(q);
  if (/\bIGP ?M\b/.test(q)) return 'Tesouro IGPM+ com Juros Semestrais';
  if (/\bIPCA\b/.test(q)) return js ? 'Tesouro IPCA+ com Juros Semestrais' : 'Tesouro IPCA+';
  if (/\bPRE ?FIXADO\b|\bPRE\b/.test(q)) return js ? 'Tesouro Prefixado com Juros Semestrais' : 'Tesouro Prefixado';
  if (/\bSELIC\b/.test(q)) return 'Tesouro Selic';
  return null;
}
function lerVencimento(s) {
  const t = String(s ?? '').trim();
  let m = t.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return { iso: `${m[3]}-${m[2]}-${m[1]}` };
  m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return { iso: `${m[1]}-${m[2]}-${m[3]}` };
  m = t.match(/^(?:19|20)\d{2}$/);
  return m ? { ano: +m[0] } : null;
}
const resumoTitulo = (t) => ({ nome: t.nome, tipo: t.tipo, vencimento: t.vencimento, taxaCompraTexto: t.taxaCompraTexto });

export function acharTitulo(titulos, consulta, { vencimento } = {}) {
  const bruto = String(consulta ?? ''), q = sem(bruto);
  const tipo = tipoDaConsulta(q);
  const doTipo = tipo ? titulos.filter((t) => chaveTipo(t.tipo) === chaveTipo(tipo)) : titulos;
  const v = lerVencimento(vencimento), naConsulta = lerVencimento(bruto.match(/\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/)?.[0]);
  const data = v?.iso || naConsulta?.iso;
  const anos = q.match(/\b(?:19|20)\d{2}\b/g), ano = v?.ano || (anos ? +anos[anos.length - 1] : null);
  const anoDoNome = (t) => +t.nome.slice(-4), anoDoVencimento = (t) => +t.vencimento.slice(0, 4);
  const nada = (motivo, candidatas = []) => ({ titulo: null, candidatas: candidatas.map(resumoTitulo), motivo });
  if (data) {
    const achados = doTipo.filter((t) => t.vencimento === data);
    if (achados.length === 1) return { titulo: achados[0], candidatas: [] };
    if (achados.length > 1) return nada('mais de um título vence nessa data: diga o tipo (Prefixado, IPCA+, Selic...)', achados);
    return nada(`não há ${tipo || 'título'} com vencimento em ${br(data)} no arquivo do dia`, tipo ? doTipo : []);
  }
  if (ano && tipo) {
    const peloNome = doTipo.filter((t) => anoDoNome(t) === ano);
    if (peloNome.length === 1) return { titulo: peloNome[0], candidatas: [] };
    if (peloNome.length > 1) return nada('mais de um título desse tipo nesse ano: diga a data de vencimento', peloNome);
    const peloVencimento = doTipo.filter((t) => anoDoVencimento(t) === ano);
    if (peloVencimento.length === 1) {
      const t = peloVencimento[0];
      return { titulo: t, candidatas: [], nota: `${ano} é o ano do vencimento; o nome do título traz o ano em que começa a renda mensal: ${t.nome}` };
    }
    return nada(`não há ${tipo} ${ano} no arquivo do dia; os títulos desse tipo estão em candidatas`, doTipo);
  }
  if (ano) {
    const c = titulos.filter((t) => anoDoNome(t) === ano || anoDoVencimento(t) === ano);
    if (c.length === 1) return { titulo: c[0], candidatas: [] };
    return nada(c.length ? 'mais de um título com esse ano: diga o tipo (Prefixado, IPCA+, Selic...)' : `não há título com ${ano} no nome ou no vencimento`, c);
  }
  if (tipo && doTipo.length === 1) return { titulo: doTipo[0], candidatas: [] };
  return nada(tipo ? 'diga o ano ou a data de vencimento do título' : 'diga o tipo e o ano do título, por exemplo "Tesouro IPCA+ 2035"', tipo ? doTipo : []);
}

export function parecidos(titulos, alvo, { indexador, excluir } = {}) {
  const r = [];
  for (const tipo of PARECIDOS_TESOURO) {
    let melhor = null;
    for (const t of titulos) {
      if (chaveTipo(t.tipo) !== chaveTipo(tipo) || (indexador && t.indexador !== indexador)) continue;
      if (excluir && chaveTipo(excluir.tipo) === chaveTipo(t.tipo) && excluir.vencimento === t.vencimento) continue;
      const d = diasEntre(t.vencimento, alvo);
      if (!melhor || Math.abs(d) < Math.abs(melhor.d) || (Math.abs(d) === Math.abs(melhor.d) && d < melhor.d)) melhor = { t, d };
    }
    if (melhor) {
      const { t, d } = melhor;
      r.push({ nome: t.nome, tipo: t.tipo, vencimento: t.vencimento, indexador: t.indexador, taxaCompra: t.taxaCompra, taxaVenda: t.taxaVenda,
        taxaCompraTexto: t.taxaCompraTexto, pagamento: t.pagamento, diasDoAlvo: d });
    }
  }
  return r;
}

let memoriaTesouro = null;
export const limparMemoriaTesouro = () => { memoriaTesouro = null; };
const ARQUIVO_TESOURO = /^tesouro-(\d{4}-\d{2}-\d{2})\.json$/;
function copiaGuardada(pasta, url) {
  if (!pasta) return null;
  let nomes;
  try { nomes = readdirSync(pasta).filter((n) => ARQUIVO_TESOURO.test(n)).sort().reverse(); } catch { return null; }
  for (const n of nomes) {
    try {
      const c = JSON.parse(readFileSync(path.join(pasta, n), 'utf8'));
      if (c && c.url === url && typeof c.dataBase === 'string' && Array.isArray(c.titulos) && c.titulos.length && Number.isFinite(c.conferidoEm)) return c;
    } catch { /* cópia estragada: ignora e baixa de novo */ }
  }
  return null;
}
function guardarCopia(pasta, copia) {
  if (!pasta) return;
  try {
    mkdirSync(pasta, { recursive: true });
    const nome = `tesouro-${copia.dia}.json`, tmp = path.join(pasta, `${nome}.${process.pid}.tmp`);
    writeFileSync(tmp, JSON.stringify(copia));
    renameSync(tmp, path.join(pasta, nome));
    for (const n of readdirSync(pasta)) if (ARQUIVO_TESOURO.test(n) && n !== nome) { try { unlinkSync(path.join(pasta, n)); } catch { /* fica para a próxima */ } }
  } catch { /* sem disco, a cópia fica só na memória */ }
}
async function baseTesouro({ pastaCache, buscar = fetch, agora, url, tempo = 90000 }) {
  let g = memoriaTesouro && memoriaTesouro.url === url && memoriaTesouro.pasta === pastaCache ? memoriaTesouro.copia : copiaGuardada(pastaCache, url);
  if (g && agora - g.conferidoEm < MINUTOS_TESOURO * 60000) return { copia: g, lacuna: null };
  const dia = diaEmSP(agora);
  const cab = { accept: 'text/csv,*/*', 'user-agent': AGENTE };
  if (g?.etag) cab['if-none-match'] = g.etag;
  if (g?.ultimaAlteracao) cab['if-modified-since'] = g.ultimaAlteracao;
  let nova;
  try {
    const r = await buscar(url, { headers: cab, signal: AbortSignal.timeout(tempo) });
    if (r.status === 304 && g) nova = { ...g, dia, conferidoEm: agora, etag: r.headers.get('etag') || g.etag };
    else if (!r.ok) throw new Error(`o arquivo do Tesouro respondeu HTTP ${r.status}`);
    else {
      const { dataBase, titulos } = lerTesouro(await r.text());
      nova = { url, dia, conferidoEm: agora, etag: r.headers.get('etag'), ultimaAlteracao: r.headers.get('last-modified'), dataBase, titulos };
    }
  } catch (e) {
    if (!g) throw e;
    return { copia: g, lacuna: { item: 'arquivo de preços e taxas do Tesouro', motivo: `${motivo(e)}; usei a cópia guardada em ${br(diaEmSP(g.conferidoEm))}, com data base ${br(g.dataBase)}` } };
  }
  guardarCopia(pastaCache, nova);
  memoriaTesouro = { url, pasta: pastaCache, copia: nova };
  return { copia: nova, lacuna: null };
}

const AVISO_TESOURO = 'O arquivo traz a taxa de mercado de cada título na data base; ele não diz se o título está à venda hoje no Tesouro Direto. ' +
  'Use como referência do título público de prazo parecido, com a data base, sem dizer que o título está disponível para compra.';
const LEGENDA_TESOURO = 'taxaCompra: taxa para o investidor comprar o título (no Prefixado é a taxa ao ano; nos outros, o adicional sobre o indexador, ' +
  'escrito por extenso em taxaCompraTexto). taxaVenda: taxa para o investidor revender o título ao Tesouro antes do vencimento, sempre um pouco maior. ' +
  'puCompra e puVenda: preço de um título em R$ por essas taxas, com liquidação no dia útil seguinte. puBase: preço pela taxa de venda com liquidação ' +
  'no mesmo dia, o usado na marcação a mercado. diasCorridosAteOVencimento: contados da data base. diasDoAlvo: vencimento do título parecido menos o ' +
  'prazo procurado, em dias (negativo: vence antes).';

export async function taxasTesouro({ titulo, vencimento, indexador } = {}, opcoes = {}) {
  const url = opcoes.url || TESOURO_CSV, agora = opcoes.agora ?? Date.now();
  const lacunas = [];
  let base;
  try {
    const b = await baseTesouro({ ...opcoes, url, agora });
    base = b.copia;
    if (b.lacuna) lacunas.push(b.lacuna);
  } catch (e) {
    return { fonte: FONTE_TESOURO, consulta: url, dataBase: null, titulo: null, parecidos: [], lacunas: [{ item: 'arquivo de preços e taxas do Tesouro', motivo: motivo(e) }] };
  }
  const titulos = base.titulos.map(completarTitulo);
  const idx = ['prefixado', 'ipca', 'selic', 'igpm'].includes(indexador) ? indexador : undefined;
  const info = { fonte: `${FONTE_TESOURO}, data base ${br(base.dataBase)}`, consulta: url, dataBase: base.dataBase,
    ...(base.ultimaAlteracao ? { arquivoAlteradoEm: base.ultimaAlteracao } : {}), aviso: AVISO_TESOURO, legenda: LEGENDA_TESOURO };
  const q = String(titulo ?? '').trim();
  if (q) {
    const a = acharTitulo(titulos, q, { vencimento });
    if (!a.titulo) return { ...info, titulo: null, candidatas: a.candidatas, parecidos: [], lacunas: [...lacunas, { item: `título "${q.slice(0, 80)}"`, motivo: a.motivo }] };
    return { ...info, titulo: a.titulo, ...(a.nota ? { nota: a.nota } : {}), parecidos: parecidos(titulos, a.titulo.vencimento, { indexador: idx, excluir: a.titulo }), lacunas };
  }
  const v = lerVencimento(vencimento);
  if (v) return { ...info, titulo: null, prazoProcurado: v.iso || String(v.ano), parecidos: parecidos(titulos, v.iso || `${v.ano}-07-01`, { indexador: idx }), lacunas };
  return { ...info, titulo: null, lista: titulos.filter((t) => !idx || t.indexador === idx).map(({ nome, tipo, vencimento: venc, taxaCompraTexto }) => ({ nome, tipo, vencimento: venc, taxaCompraTexto })), lacunas };
}
