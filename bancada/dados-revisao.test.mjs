// Correções do passo 2 depois da revisão de 18/11/2026 (servidor/dados-publicos.mjs), com entradas fixas, sem internet:
// o IGP-M divulgado no próprio mês, os acumulados com o método oficial (CDI pelos dias, IGP-M pelo número-índice da FGV),
// a variação "no dia" do dólar com as datas comparadas e a limpeza dos caches.
// Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = await import(pathToFileURL(path.join(RAIZ, 'servidor', 'dados-publicos.mjs')).href);

const def = (id) => ({ id, ...D.SERIES[id] });
const pontos = (pares) => pares.map(([data, valor]) => ({ data, valor }));

// IGP-M (Banco Central, série 189, conferida em 18/11/2026): setembro 1,57 e outubro 1,47. A FGV divulgou o de outubro
// em 29/10/2026, dentro do próprio mês; o de novembro sai em 27/11/2026 (calendário de divulgação da FGV).
test('IGP-M divulgado no próprio mês é o último dado, não "mês em andamento"', () => {
  const r = D.calcularIndicador(def('igpmMes'), pontos([['2026-09-01', 1.57], ['2026-10-01', 1.47]]), 'Mês passado', { hoje: '2026-10-30' });
  assert.equal(r.data, '2026-10-01');
  assert.equal(r.valor, 1.47);
  assert.equal(r.mesEmAndamento, undefined, 'o IGP-M do mês fechado saiu como mês em andamento');
  assert.deepEqual(r.variacoes.mes, { comparadoCom: { data: '2026-09-01', valor: 1.57 }, variacao: -0.1 });
});

test('só o CDI do mês (série 4391, acumulado até o último dia útil) fica à parte como mês em andamento', () => {
  assert.equal(D.SERIES.cdiMes.parcialNoMes, true);
  const parciais = Object.entries(D.SERIES).filter(([, s]) => s.parcialNoMes).map(([id]) => id);
  assert.deepEqual(parciais, ['cdiMes']);
  for (const id of ['ipcaMes', 'ipca12m', 'desemprego']) {
    const r = D.calcularIndicador(def(id), pontos([['2026-09-01', 1], ['2026-10-01', 2]]), 'Mês passado', { hoje: '2026-10-20' });
    assert.equal(r.data, '2026-10-01', id);
    assert.equal(r.mesEmAndamento, undefined, id);
  }
});

// CDI de teste: 12 meses com 2 dias úteis cada, a 0,5% ao dia. Cada mês composto dá 1,0025%, que a série mensal (4391)
// publica arredondado: 1,00. Pelos dias, 12 meses dão 12,72%; compondo os meses arredondados, 12,68%.
const DIAS = [], MESES = [];
for (let k = 0; k < 12; k++) {
  const a = 2025 + Math.floor((10 + k) / 12), m = String(((10 + k) % 12) + 1).padStart(2, '0');
  DIAS.push({ data: `${a}-${m}-03`, valor: 0.5 }, { data: `${a}-${m}-04`, valor: 0.5 });
  MESES.push({ data: `${a}-${m}-01`, valor: 1.0 });
}

test('CDI: acumulado em 12 meses e no ano pela composição dos fatores diários (série 12), conferida mês a mês com a 4391', () => {
  const ind = D.calcularIndicador(def('cdiMes'), MESES, 'Mês passado', { hoje: '2026-11-18' });
  assert.equal(ind.data, '2026-10-01');
  assert.equal(ind.acumulado12Meses.valor, 12.68, 'sem a série diária, vale a composição dos meses');
  assert.equal(ind.acumulado12Meses.aproximado, true);
  assert.match(ind.acumulado12Meses.metodo, /calculado pela Mesa/);
  const lacunas = [];
  const r = D.acumuladosDoCdi(ind, DIAS, MESES, lacunas);
  assert.deepEqual(lacunas, []);
  assert.equal(r.acumulado12Meses.valor, 12.72);
  assert.deepEqual([r.acumulado12Meses.de, r.acumulado12Meses.ate, r.acumulado12Meses.dias], ['2025-11', '2026-10', 24]);
  assert.deepEqual([r.acumulado12Meses.primeiroDia, r.acumulado12Meses.ultimoDia], ['2025-11-03', '2026-10-04']);
  assert.match(r.acumulado12Meses.metodo, /fatores diários/);
  assert.match(r.acumulado12Meses.fonte, /SGS 12/);
  assert.equal(r.acumulado12Meses.aproximado, undefined);
  assert.equal(r.acumuladoNoAno.valor, Math.round((1.005 ** 20 - 1) * 10000) / 100);
  assert.deepEqual([r.acumuladoNoAno.de, r.acumuladoNoAno.ate, r.acumuladoNoAno.dias], ['2026-01', '2026-10', 20]);
});

test('CDI: se um mês dos dias não bate com a série mensal, fica a composição dos meses, marcada como aproximada, e a lacuna', () => {
  const ind = D.calcularIndicador(def('cdiMes'), MESES, 'Mês passado', { hoje: '2026-11-18' });
  const lacunas = [];
  const r = D.acumuladosDoCdi(ind, DIAS.filter((p) => p.data !== '2026-03-04'), MESES, lacunas);
  assert.equal(r.acumulado12Meses.valor, 12.68);
  assert.equal(r.acumulado12Meses.aproximado, true);
  assert.ok(lacunas.some((l) => /2026-03/.test(l.motivo)), JSON.stringify(lacunas));
  const semDias = [];
  assert.equal(D.acumuladosDoCdi(ind, null, MESES, semDias).acumulado12Meses.aproximado, true);
  assert.equal(semDias.length, 1);
});

// Número-índice do IGP-M (FGV, ago. 1994 = 100), série IGP12_IGPM12 do Ipeadata, conferido em 18/11/2026; o release
// da FGV de 29/10/2026 diz 1,47% no mês, 4,97% no ano e 5,24% em 12 meses. Os meses da série 189, compostos, dão 5,25%.
const INDICE = pontos([['2025-10-01', 1182.005], ['2025-12-01', 1184.998], ['2026-09-01', 1225.846], ['2026-10-01', 1243.905]]);
const IGPM_189 = pontos([['2025-11-01', 0.27], ['2025-12-01', -0.01], ['2026-01-01', 0.41], ['2026-02-01', -0.73], ['2026-03-01', 0.52], ['2026-04-01', 2.73],
  ['2026-05-01', 0.84], ['2026-06-01', -0.5], ['2026-07-01', -1.16], ['2026-08-01', -0.22], ['2026-09-01', 1.57], ['2026-10-01', 1.47]]);

test('IGP-M: acumulados pelo número-índice da FGV (5,24% em 12 meses e 4,97% no ano), não pela composição (5,25%)', () => {
  const ind = D.calcularIndicador(def('igpmMes'), IGPM_189, 'Mês passado', { hoje: '2026-11-18' });
  assert.equal(ind.acumulado12Meses.valor, 5.25, 'a composição dos meses arredondados');
  assert.equal(ind.acumulado12Meses.aproximado, true);
  const lacunas = [];
  const r = D.acumuladosDoIgpm(ind, INDICE, lacunas);
  assert.deepEqual(lacunas, []);
  assert.equal(r.acumulado12Meses.valor, 5.24);
  assert.equal(r.acumuladoNoAno.valor, 4.97);
  assert.deepEqual([r.acumulado12Meses.de, r.acumulado12Meses.ate, r.acumulado12Meses.meses], ['2025-11', '2026-10', 12]);
  assert.match(r.acumulado12Meses.metodo, /número-índice/);
  assert.match(r.acumulado12Meses.fonte, /FGV/);
  assert.match(r.acumulado12Meses.conta, /1\.?243,905 ÷ 1\.?182,005 − 1 = 5,24%/);
  assert.equal(r.acumulado12Meses.aproximado, undefined);
});

test('IGP-M: índice sem o mês mais novo (o Ipeadata ainda não atualizou) mantém a composição marcada e avisa', () => {
  const ind = D.calcularIndicador(def('igpmMes'), IGPM_189, 'Mês passado', { hoje: '2026-11-18' });
  const lacunas = [];
  const r = D.acumuladosDoIgpm(ind, INDICE.filter((p) => p.data !== '2026-10-01'), lacunas);
  assert.equal(r.acumulado12Meses.valor, 5.25);
  assert.equal(r.acumulado12Meses.aproximado, true);
  assert.match(lacunas[0].motivo, /2026-10/);
  // índice alterado de propósito (1.250 em out/2026), que não bate com o mês publicado na série 189: não usa
  const torto = [];
  D.acumuladosDoIgpm(ind, INDICE.map((p) => (p.data === '2026-10-01' ? { ...p, valor: 1250 } : p)), torto);
  assert.equal(torto.length, 1);
});

test('dólar: a variação "no dia" diz as datas comparadas e avisa quando pula dia útil', () => {
  const r = D.calcularIndicador(def('dolar'), pontos([['2026-11-13', 5.6518], ['2026-11-16', 5.7324], ['2026-11-17', 5.7851]]), 'Mês passado', { hoje: '2026-11-18' });
  assert.equal(r.variacoes.dia.rotulo, 'de 16/11/2026 a 17/11/2026');
  assert.equal(r.variacoes.dia.nota, undefined, 'dias seguidos');
  const fimDeSemana = D.calcularIndicador(def('dolar'), pontos([['2026-11-13', 5.6518], ['2026-11-16', 5.7324]]), 'Mês passado', { hoje: '2026-11-16' });
  assert.equal(fimDeSemana.variacoes.dia.rotulo, 'de 13/11/2026 a 16/11/2026');
  assert.equal(fimDeSemana.variacoes.dia.nota, undefined, 'de sexta para segunda não falta dia de semana');
  // série com 16/11 e 17/11 tirados de propósito: a variação "no dia" cobre de 13/11 a 18/11
  const pulo = D.calcularIndicador(def('dolar'), pontos([['2026-11-13', 5.6518], ['2026-11-18', 5.8102]]), 'Mês passado', { hoje: '2026-11-18' });
  assert.equal(pulo.variacoes.dia.rotulo, 'de 13/11/2026 a 18/11/2026');
  assert.match(pulo.variacoes.dia.nota, /há 2 dias de semana sem dado/);
});

test('dólar: todos os dias do serviço PTAX mais novos que a série 1 entram, e o "dia" compara dias seguidos', () => {
  const sgs = pontos([['2026-11-13', 5.6518], ['2026-11-16', 5.7324]]);
  const ptax = [
    { dataHoraCotacao: '2026-11-16 13:06:32.509', cotacaoVenda: 5.7324 },
    { dataHoraCotacao: '2026-11-17 13:07:26.015', cotacaoVenda: 5.7851 },
    { dataHoraCotacao: '2026-11-18 13:08:44.271', cotacaoVenda: 5.8102 },
  ];
  const j = D.juntarPtax(sgs, ptax);
  assert.deepEqual(j.pts.map((p) => [p.data, p.valor]), [['2026-11-13', 5.6518], ['2026-11-16', 5.7324], ['2026-11-17', 5.7851], ['2026-11-18', 5.8102]]);
  assert.deepEqual(j.novos, ['2026-11-17', '2026-11-18']);
  assert.deepEqual(j.divergencias, []);
  assert.deepEqual([j.ultimo.data, j.ultimo.cotacaoVenda, j.ultimo.boletim], ['2026-11-18', 5.8102, '13:08']);
  const r = D.calcularIndicador(def('dolar'), j.pts, 'Mês passado', { hoje: '2026-11-18' });
  assert.equal(r.variacoes.dia.rotulo, 'de 17/11/2026 a 18/11/2026');
  // divergência simulada (5,7330 no lugar de 5,7324): vira divergência, não troca o valor da série
  const diferente = D.juntarPtax(sgs, [{ dataHoraCotacao: '2026-11-16 13:06:32', cotacaoVenda: 5.7330 }]);
  assert.deepEqual(diferente.divergencias, [{ data: '2026-11-16', sgs: 5.7324, ptax: 5.733 }]);
});

test('dólar: a ferramenta diz que a série 1 é a PTAX de fechamento, de venda', () => {
  assert.match(D.SERIES.dolar.nome, /PTAX/);
  assert.match(D.SERIES.dolar.oQueE, /série 1 do SGS é a taxa PTAX de fechamento, de venda/);
  assert.match(D.SERIES.dolar.oQueE, /PTAX800/);
});

test('cache: gravar tira as entradas vencidas', () => {
  const agora = 10 * 3600000;
  const m = new Map([['velha', { em: agora - 11 * 60000, v: 1 }], ['nova', { em: agora - 60000, v: 2 }]]);
  D.guardarNoCache(m, 'outra', 3, 10 * 60000, agora);
  assert.deepEqual([...m.keys()].sort(), ['nova', 'outra']);
  assert.deepEqual(m.get('outra'), { em: agora, v: 3 });
});
