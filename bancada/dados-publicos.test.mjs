// Passo 2 do plano de melhorias (Mercado, os dados): as contas e as leituras de servidor/dados-publicos.mjs com
// entradas fixas, sem internet. Os números das séries são de teste (redondos), salvo onde o comentário diz a fonte.
// Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = await import(pathToFileURL(path.join(RAIZ, 'servidor', 'dados-publicos.mjs')).href);

const def = (id) => ({ id, ...D.SERIES[id] });
const pontos = (pares) => pares.map(([data, valor]) => ({ data, valor }));

// Dólar: valores e contas conferidos no passo 1 (Banco Central, série 1, em 18/11/2026).
const DOLAR = pontos([['2025-12-31', 5.5024], ['2026-10-16', 5.0826], ['2026-10-30', 5.4212], ['2026-11-16', 5.7324], ['2026-11-17', 5.7851]]);

test('dólar: variação no dia, no mês, no ano e contra o mês passado, em %', () => {
  const r = D.calcularIndicador(def('dolar'), DOLAR, 'Mês passado');
  assert.equal(r.valor, 5.7851);
  assert.equal(r.data, '2026-11-17');
  assert.equal(r.unidadeDaVariacao, '%');
  assert.deepEqual(r.variacoes.dia, { comparadoCom: { data: '2026-11-16', valor: 5.7324 }, variacao: 0.92, rotulo: 'de 16/11/2026 a 17/11/2026' });
  assert.deepEqual(r.variacoes.mes, { comparadoCom: { data: '2026-10-30', valor: 5.4212 }, variacao: 6.71 });
  assert.deepEqual(r.variacoes.ano, { comparadoCom: { data: '2025-12-31', valor: 5.5024 }, variacao: 5.14 });
  assert.deepEqual(r.referencia, { nome: 'Mês passado', comparadoCom: { data: '2026-10-16', valor: 5.0826 }, variacao: 13.82 });
});

test('a referência pega o último dado até a data (fim de semana e feriado não têm dado)', () => {
  // Semana passada: 7 dias antes de 17/11 é 10/11; o último dado até lá é 30/10.
  assert.deepEqual(D.calcularIndicador(def('dolar'), DOLAR, 'Semana passada').referencia.comparadoCom, { data: '2026-10-30', valor: 5.4212 });
  // Início do ano: o último dado do ano anterior.
  assert.deepEqual(D.calcularIndicador(def('dolar'), DOLAR, 'Início do ano').referencia, { nome: 'Início do ano', comparadoCom: { data: '2025-12-31', valor: 5.5024 }, variacao: 5.14 });
  // Sem comparar: vale o padrão do pedido, o mês passado.
  assert.equal(D.calcularIndicador(def('dolar'), DOLAR).referencia.nome, 'Mês passado');
});

test('taxa ao ano: a variação é a diferença em pontos percentuais, não %', () => {
  const r = D.calcularIndicador(def('selic'), pontos([['2025-12-31', 15], ['2026-10-17', 14.25], ['2026-11-16', 13.75], ['2026-11-17', 13.75]]), 'Mês passado');
  assert.equal(r.unidadeDaVariacao, 'p.p.');
  assert.equal(r.referencia.variacao, -0.5);
  assert.equal(r.variacoes.ano.variacao, -1.25);
  assert.equal(r.variacoes.dia.variacao, 0);
});

test('série mensal: o antes é o mês anterior; semana passada também (com nota); no ano, dezembro do ano anterior', () => {
  const m = pontos([['2025-11-01', 0.2], ['2025-12-01', 0.3], ['2026-01-01', 0.4], ['2026-02-01', 0.5], ['2026-03-01', 0.1], ['2026-04-01', 0.2],
    ['2026-05-01', 0.3], ['2026-06-01', 0.2], ['2026-07-01', 0.1], ['2026-08-01', -0.3], ['2026-09-01', 0.8], ['2026-10-01', 0.1]]);
  const r = D.calcularIndicador(def('igpmMes'), m, 'Mês passado', { hoje: '2026-11-18' });
  assert.equal(r.data, '2026-10-01');
  assert.equal(r.variacoes.dia, null);
  assert.deepEqual(r.variacoes.mes, { comparadoCom: { data: '2026-09-01', valor: 0.8 }, variacao: -0.7 });
  assert.deepEqual(r.variacoes.ano, { comparadoCom: { data: '2025-12-01', valor: 0.3 }, variacao: -0.2 });
  assert.deepEqual(r.referencia.comparadoCom, { data: '2026-09-01', valor: 0.8 });
  const semana = D.calcularIndicador(def('igpmMes'), m, 'Semana passada', { hoje: '2026-11-18' }).referencia;
  assert.deepEqual(semana.comparadoCom, { data: '2026-09-01', valor: 0.8 });
  assert.match(semana.nota, /mensal/);
  // acumulado no ano e em 12 meses: composição das variações mensais, com a conta
  const ano = [0.4, 0.5, 0.1, 0.2, 0.3, 0.2, 0.1, -0.3, 0.8, 0.1].reduce((f, v) => f * (1 + v / 100), 1);
  const doze = [0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3, 0.2, 0.1, -0.3, 0.8, 0.1].reduce((f, v) => f * (1 + v / 100), 1);
  assert.equal(r.acumuladoNoAno.valor, Math.round((ano - 1) * 10000) / 100);
  assert.equal(r.acumuladoNoAno.meses, 10);
  assert.equal(r.acumulado12Meses.valor, Math.round((doze - 1) * 10000) / 100);
  assert.match(r.acumulado12Meses.conta, /composição/);
});

test('série mensal com o mês corrente ainda aberto: o número principal é o último mês fechado', () => {
  const r = D.calcularIndicador(def('cdiMes'), pontos([['2026-09-01', 1.1], ['2026-10-01', 1.0], ['2026-11-01', 0.5]]), 'Mês passado', { hoje: '2026-11-18' });
  assert.equal(r.data, '2026-10-01');
  assert.equal(r.valor, 1.0);
  assert.deepEqual(r.mesEmAndamento && { data: r.mesEmAndamento.data, valor: r.mesEmAndamento.valor }, { data: '2026-11-01', valor: 0.5 });
  assert.equal(r.referencia.variacao, -0.1);
});

test('meta anual: compara com o ano anterior', () => {
  const r = D.calcularIndicador(def('metaInflacao'), pontos([['2025-01-01', 3], ['2026-01-01', 3]]), 'Mês passado', { hoje: '2026-11-18' });
  assert.equal(r.valor, 3);
  assert.deepEqual(r.referencia.comparadoCom, { data: '2025-01-01', valor: 3 });
  assert.equal(r.referencia.variacao, 0);
});

test('juro real: (1 + Selic) / (1 + inflação) - 1, com a conta escrita', () => {
  // Contas conferidas no passo 1: Selic 13,75% contra IPCA de 12 meses 4,63% dá 8,72%.
  const a = D.juroReal(13.75, 4.63);
  assert.equal(a.valor, 8.72);
  assert.equal(a.conta, '(1 + 13,75%) ÷ (1 + 4,63%) − 1 = 8,72%');
  assert.equal(D.juroReal(13.75, 5.1484).valor, 8.18);
  assert.equal(D.juroReal(null, 4.63), null);
});

test('Focus: a data do relatório é a mais recente e a de 4 semanas antes é a última até 28 dias antes', () => {
  const datas = ['2026-11-13', '2026-11-12', '2026-11-11', '2026-10-17', '2026-10-16', '2026-10-15', '2026-10-09'];
  assert.deepEqual(D.escolherDatasFocus(datas), { atual: '2026-11-13', quatroSemanas: '2026-10-16' });
  // sem dado exatamente 28 dias antes (feriado), vale o dia útil anterior
  assert.deepEqual(D.escolherDatasFocus(datas.filter((d) => d !== '2026-10-16')), { atual: '2026-11-13', quatroSemanas: '2026-10-15' });
  assert.deepEqual(D.escolherDatasFocus([]), { atual: null, quatroSemanas: null });
});

test('Copom: decisão e placar saem do texto do comunicado', () => {
  const texto = 'O Copom decidiu manter a taxa Selic em 13,75% a.a., e entende que essa decisão é compatível com a meta. Sem prejuízo do objetivo. ' +
    'Votaram por essa decisão os seguintes membros do Comitê: Pessoa Um (presidente), Pessoa Dois, Pessoa Três, e Pessoa Quatro. Tabela 1';
  const r = D.lerComunicado(texto);
  assert.equal(r.decisao, 'O Copom decidiu manter a taxa Selic em 13,75% a.a., e entende que essa decisão é compatível com a meta.');
  assert.deepEqual(r.votos, { aFavor: 4, contra: 0 });
  const dividido = D.lerComunicado(texto.replace('Tabela 1', 'Votou por reduzir a taxa em 0,25 p.p. o seguinte membro do Comitê: Pessoa Cinco. Tabela 1'));
  assert.deepEqual(dividido.votos, { aFavor: 4, contra: 1 });
  assert.equal(D.limparHtml('<p>Votaram&#58; A&#160;e&nbsp;B &quot;x&quot;\u200b</p>'), 'Votaram: A e B "x"');
});

test('agenda: só as divulgações que mexem com a conversa, nos próximos 30 dias, em ordem de data', () => {
  const itens = [
    { titulo: 'Índice Nacional de Preços ao Consumidor Amplo', data_divulgacao: '11/12/2026 12:00:00', ano_referencia_inicio: 2026, mes_referencia_inicio: 11 },
    { titulo: 'Pesquisa urbanística do entorno dos domicílios', data_divulgacao: '16/12/2026 13:00:00' },
    { titulo: 'Índice Nacional de Preços ao Consumidor Amplo 15', data_divulgacao: '26/11/2026 12:00:00', ano_referencia_inicio: 2026, mes_referencia_inicio: 11 },
    { titulo: 'Índice Nacional de Preços ao Consumidor Amplo', data_divulgacao: '10/01/2027 12:00:00', ano_referencia_inicio: 2026, mes_referencia_inicio: 12 },
  ];
  assert.deepEqual(D.filtrarAgenda(itens, '2026-11-18').map((x) => [x.data, x.divulgacao, x.referencia]), [
    ['2026-11-26', 'IPCA-15', '2026-11'],
    ['2026-12-11', 'IPCA', '2026-11'],
  ]);
});

// Em 12/11/2026 o calendário do IBGE dizia "12/11/2026 12:00:00" para o IPCA, e a notícia do IBGE sobre o mesmo IPCA
// saiu "12/11/2026 09:00:00": a hora do calendário vem em UTC, três horas à frente de Brasília.
test('agenda: a hora do calendário do IBGE vem em UTC e a Mesa mostra a de Brasília, com a data que muda junto', () => {
  const itens = [
    { titulo: 'Índice Nacional de Preços ao Consumidor Amplo 15', data_divulgacao: '26/11/2026 12:00:00', ano_referencia_inicio: 2026, mes_referencia_inicio: 11 },
    { titulo: 'Pesquisa Mensal de Serviços', data_divulgacao: '10/12/2026 01:30:00', ano_referencia_inicio: 2026, mes_referencia_inicio: 10 },
    { titulo: 'Pesquisa Mensal de Comércio', data_divulgacao: '19/11/2026 02:00:00', ano_referencia_inicio: 2026, mes_referencia_inicio: 9 },
    { titulo: 'Índice Nacional de Preços ao Consumidor', data_divulgacao: '18/11/2026 02:59:00', ano_referencia_inicio: 2026, mes_referencia_inicio: 10 },
  ];
  assert.deepEqual(D.filtrarAgenda(itens, '2026-11-18').map((x) => [x.data, x.hora, x.divulgacao]), [
    ['2026-11-18', '23:00', 'Vendas do comércio'],
    ['2026-11-26', '09:00', 'IPCA-15'],
    ['2026-12-09', '22:30', 'Volume de serviços'],
  ]);
});

// Arquivo compactado (zip) montado aqui, com um arquivo comprimido e outro guardado sem compressão.
function zipDe(arquivos) {
  const partes = [], central = []; let pos = 0;
  for (const { nome, dados, comprimir } of arquivos) {
    const n = Buffer.from(nome), corpo = comprimir ? zlib.deflateRawSync(dados) : dados;
    const crc = zlib.crc32(dados);
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(comprimir ? 8 : 0, 8);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(corpo.length, 18); local.writeUInt32LE(dados.length, 22); local.writeUInt16LE(n.length, 26);
    const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(comprimir ? 8 : 0, 10);
    cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(corpo.length, 20); cd.writeUInt32LE(dados.length, 24); cd.writeUInt16LE(n.length, 28); cd.writeUInt32LE(pos, 42);
    partes.push(local, n, corpo); central.push(cd, n); pos += 30 + n.length + corpo.length;
  }
  const cdBuf = Buffer.concat(central), fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0); fim.writeUInt16LE(arquivos.length, 8); fim.writeUInt16LE(arquivos.length, 10); fim.writeUInt32LE(cdBuf.length, 12); fim.writeUInt32LE(pos, 16);
  return Buffer.concat([...partes, cdBuf, fim]);
}

test('zip: lê o diretório central e abre arquivo comprimido e sem compressão', () => {
  const grande = Buffer.from('linha;de;teste\r\n'.repeat(5000));
  const zip = zipDe([{ nome: 'a.csv', dados: grande, comprimir: true }, { nome: 'b.txt', dados: Buffer.from('sem compressão'), comprimir: false }]);
  const r = D.lerZip(zip);
  assert.deepEqual(r.map((x) => x.nome), ['a.csv', 'b.txt']);
  assert.ok(r[0].dados.equals(grande));
  assert.equal(r[1].dados.toString(), 'sem compressão');
  assert.throws(() => D.lerZip(Buffer.from('não é zip')), /compactado/);
});

test('csv: separa por ponto e vírgula, respeita aspas e linhas com CRLF', () => {
  assert.deepEqual(D.lerCsv('a;b;c\r\n1;"dois; e meio";3\r\n4;Projeto "X";6\r\n'), [['a', 'b', 'c'], ['1', 'dois; e meio', '3'], ['4', 'Projeto "X"', '6']]);
});

// Linhas no formato do arquivo de documentos da CVM (IPE), com companhias de teste.
const CAB = 'CNPJ_Companhia;Nome_Companhia;Codigo_CVM;Data_Referencia;Categoria;Tipo;Especie;Assunto;Data_Entrega;Tipo_Apresentacao;Protocolo_Entrega;Versao;Link_Download';
const lk = (n) => `https://www.rad.cvm.gov.br/ENET/frmDownloadDocumento.aspx?Tela=ext&descTipo=IPE&CodigoInstituicao=1&numProtocolo=${n}&numSequencia=9${n}&numVersao=1`;
const LINHAS = [
  `00.000.000/0001-91;COMPANHIA EXEMPLO S.A.;1;2026-11-10;Fato Relevante;;;Exemplo informa resultado;2026-11-10;AP - Apresentação;X1;1;${lk(1001)}`,
  `00.000.000/0001-91;COMPANHIA EXEMPLO S.A.;1;2026-11-10;Comunicado ao Mercado;;;Exemplo comunica evento;2026-11-10;AP - Apresentação;X2;1;${lk(1003)}`,
  `00.000.000/0001-91;COMPANHIA EXEMPLO S.A.;1;2026-11-12;Assembleia;AGE;Ata;Ata da assembleia;2026-11-12;AP - Apresentação;X3;1;${lk(1005)}`,
  `00.000.000/0001-91;COMPANHIA EXEMPLO S.A.;1;2026-10-01;Fato Relevante;;;Exemplo informa outra coisa;2026-10-01;AP - Apresentação;X4;1;${lk(900)}`,
  `11.111.111/0001-11;EXEMPLO PARTICIPAÇÕES S.A.;2;2026-11-11;Fato Relevante;;;Participações informa;2026-11-11;AP - Apresentação;X5;1;${lk(1004)}`,
  `22.222.222/0001-22;OUTRA COMPANHIA S.A.;3;2026-11-14;Comunicado ao Mercado;;;Outra comunica;2026-11-14;AP - Apresentação;X6;1;${lk(1010)}`,
].join('\r\n');
const docs = () => D.documentosDoCsv(`${CAB}\r\n${LINHAS}\r\n`);

test('CVM: filtra pelo CNPJ, pelas categorias padrão e põe o mais recente primeiro', () => {
  const r = D.filtrarDocumentos(docs(), { empresa: '00.000.000/0001-91' });
  assert.equal(r.empresa.nome, 'COMPANHIA EXEMPLO S.A.');
  assert.deepEqual(r.documentos.map((d) => [d.data, d.categoria, d.protocolo]), [
    ['2026-11-10', 'Comunicado ao Mercado', '1003'],
    ['2026-11-10', 'Fato Relevante', '1001'],
    ['2026-10-01', 'Fato Relevante', '900'],
  ]);
  assert.equal(r.documentos[0].link, lk(1003));
  assert.equal(r.documentos[0].assunto, 'Exemplo comunica evento');
});

test('CVM: pelo nome, escolhe a companhia cujo nome é o pedido; quantidade e categorias mudam a lista', () => {
  const r = D.filtrarDocumentos(docs(), { empresa: 'Companhia Exemplo', quantidade: 1 });
  assert.equal(r.empresa.cnpj, '00.000.000/0001-91');
  assert.equal(r.documentos.length, 1);
  const todas = D.filtrarDocumentos(docs(), { empresa: '00000000000191', tipos: ['Assembleia'] });
  assert.deepEqual(todas.documentos.map((d) => d.protocolo), ['1005']);
});

test('CVM: nome que serve para duas companhias devolve as candidatas, sem escolher sozinho', () => {
  const r = D.filtrarDocumentos(docs(), { empresa: 'Exemplo' });
  assert.equal(r.empresa, null);
  assert.deepEqual(r.candidatas.map((c) => c.cnpj).sort(), ['00.000.000/0001-91', '11.111.111/0001-11']);
  assert.deepEqual(r.documentos, []);
  assert.equal(D.filtrarDocumentos(docs(), { empresa: 'Inexistente' }).empresa, null);
});

test('PDF: aceita só arquivo que começa com %PDF e termina inteiro', () => {
  assert.equal(D.ehPdfCompleto(Buffer.from('%PDF-1.6\n%%EOF\n' + 'x'.repeat(2000))), false); // %%EOF longe do fim: veio cortado ou com sobra
  const certo = Buffer.from('%PDF-1.7\nconteudo\n%%EOF\n');
  assert.equal(D.ehPdfCompleto(certo), true);
  assert.equal(D.ehPdfCompleto(Buffer.from('\r\n<!DOCTYPE html><html></html>')), false);
  const cortado = Buffer.from('%PDF-1.6\n1 0 obj<</Linearized 1/L 99999>>endobj\nmeio do arquivo');
  assert.equal(D.ehPdfCompleto(cortado), false);
  const linearCerto = Buffer.from('%PDF-1.6\n1 0 obj<</Linearized 1/L 00000>>endobj\n%%EOF\n');
  const tam = String(linearCerto.length).padStart(5, '0');
  assert.equal(D.ehPdfCompleto(Buffer.from(linearCerto.toString().replace('00000', tam))), true);
});
