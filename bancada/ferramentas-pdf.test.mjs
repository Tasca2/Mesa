// Passo 4 do plano de melhorias (seções 7.3, 7.4 e 7.6): as ferramentas de PDF de verdade, pelo servidor da Mesa,
// e a opção de PDF nas telas. Gera arquivos numa pasta temporária (perfil, Documentos e temporários desviados),
// nunca na pasta do assessor. Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { carregar } from './catalogo.mjs';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TELAS = [['janela', path.join(RAIZ, 'janela', 'mesa-janela.html')], ['painel', path.join(RAIZ, 'servidor', 'painel-v2.html')]];
const COM_PDF = ['relatorio-mensal', 'carteira', 'primeira-reuniao', 'segunda-reuniao', 'comparador', 'proposta', 'diagnostico'];

for (const [nome, arq] of TELAS) {
  test(`${nome}: Comparador, Proposta e Diagnóstico perguntam "Como você quer o resultado?"`, () => {
    const cat = carregar(arq);
    assert.deepEqual([...cat.retrato().PDF_OK].sort(), [...COM_PDF].sort());
    for (const id of ['comparador', 'proposta', 'diagnostico']) {
      const ps = cat.montar(id, {}, []).perguntas;
      assert.ok(ps.some((p) => p.id === 'resultado' && p.opcoes.includes('PDF')), `${id} não pergunta o formato`);
    }
  });
}

// Fala com o servidor da Mesa pelo mesmo canal que o Claude usa (MCP por entrada e saída padrão).
function servidor(env) {
  const p = spawn(process.execPath, [path.join(RAIZ, 'servidor', 'server.mjs')], { env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
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
    chamar,
    fechar: () => p.kill(),
  };
}

test('mesa_documento e mesa_apresentacao aceitam os campos novos e geram o PDF', { timeout: 180000 }, async () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'mesa-passo4-'));
  mkdirSync(path.join(tmp, 'Documents'));
  const SERV = path.join(RAIZ, 'servidor');
  const env = { ...process.env, USERPROFILE: tmp, HOME: tmp, TEMP: tmp, TMP: tmp, MESA_PERFIL_DIR: path.join(tmp, 'perfil'), MESA_TAREFA: path.join(tmp, 'tarefa.json'),
    MESA_ANDAMENTO: path.join(tmp, 'andamento.json'), MESA_COFRE: path.join(tmp, 'cofre'), CAPTAMAIS_MARKET_KEY: '',
    METODO_SKILLS: path.join(SERV, 'skills'), ROTINAS_SKILLS: path.join(SERV, 'rotinas'), MESA_BASE: path.join(SERV, 'base-assessor.md') };
  const s = servidor(env);
  try {
    await s.iniciar();
    const resp = await s.chamar('tools/list', {});
    assert.ok(resp.result, resp.error?.message);
    const lista = resp.result.tools;
    const doc = lista.find((f) => f.name === 'mesa_documento').inputSchema;
    for (const campo of ['cliente', 'dataBase', 'capa', 'destaques', 'tipo', 'tema', 'termosConfirmados']) assert.ok(doc.properties[campo], `mesa_documento sem o campo ${campo}`);
    assert.ok(doc.properties.secoes.items.properties.grafico, 'mesa_documento sem gráfico por seção');
    const apr = lista.find((f) => f.name === 'mesa_apresentacao').inputSchema;
    for (const campo of ['cliente', 'tipo']) assert.ok(apr.properties[campo], `mesa_apresentacao sem o campo ${campo}`);
    for (const l of ['rosca', 'linha', 'comparativo']) assert.ok(apr.properties.slides.items.properties.layout.enum.includes(l));

    const r1 = await s.chamar('tools/call', { name: 'mesa_documento', arguments: {
      titulo: 'Comparador de carteira', cliente: 'Cliente Teste', dataBase: '31/10/2026', tipo: 'carteira',
      destaques: [{ rotulo: 'Maior classe', valor: '70% → 40%', nota: 'Renda fixa pós-fixada' }],
      secoes: [{ titulo: 'Resumo', texto: '**A maior diferença está na concentração.**' },
        { titulo: 'Composição por classe', grafico: { tipo: 'barras-duplas', unidade: '%', total: true, rotulos: ['Renda fixa', 'Ações'], series: [{ nome: 'Atual', valores: [85, 15] }, { nome: 'Modelo', valores: [80, 20] }] } },
        { titulo: 'Perguntas para a conversa', texto: '1. Primeira?\n2. Segunda?' }] } });
    assert.ok(!r1.result.isError, r1.result.content?.[0]?.text);
    const pdf = JSON.parse(r1.result.content[0].text).pdf;
    assert.ok(pdf.startsWith(tmp), 'o PDF saiu fora da pasta temporária');
    assert.ok(readFileSync(pdf).subarray(0, 5).toString() === '%PDF-');

    // O rodapé de compliance e "N de M" moram nas margens da página (@page). Conferido no texto do PDF que o navegador gerou
    // (pdftotext, do Poppler): toda página leva a frase e o número.
    const paginasDoPdf = (arq) => execFileSync('pdftotext', ['-enc', 'UTF-8', arq, '-'], { encoding: 'utf8' }).split('\f').filter((p) => p.trim());
    const pags = paginasDoPdf(pdf);
    assert.ok(pags.length >= 1);
    pags.forEach((p, k) => {
      assert.match(p, /Material informativo e educacional\. Não é recomendação de compra, venda ou alocação de ativos, nem promessa de retorno\./, `página ${k + 1} sem o rodapé de compliance`);
      assert.match(p, new RegExp(`\\b${k + 1} de ${pags.length}\\b`), `página ${k + 1} sem "${k + 1} de ${pags.length}"`);
    });

    // Capa da folha A4 com o cargo do perfil (atuacao), como na capa dos slides.
    const salvo = await s.chamar('tools/call', { name: 'mesa_perfil', arguments: { salvar: { nome: 'Assessor Teste', atuacao: 'Assessor de investimento', escritorio: 'Escritório Teste' } } });
    assert.ok(!salvo.result?.isError, JSON.stringify(salvo).slice(0, 300));
    const r3 = await s.chamar('tools/call', { name: 'mesa_documento', arguments: { titulo: 'Proposta de assessoria', capa: true, tipo: 'proposta', cliente: 'Cliente Teste', secoes: [{ titulo: 'Resumo', texto: '**Texto.**' }] } });
    assert.ok(!r3.result.isError, r3.result.content?.[0]?.text);
    const capa = paginasDoPdf(JSON.parse(r3.result.content[0].text).pdf)[0];
    assert.match(capa, /Assessor Teste/);
    assert.match(capa, /Assessor de investimento/, 'a capa não mostra o cargo do perfil');

    const antigo = await s.chamar('tools/call', { name: 'mesa_documento', arguments: { titulo: 'Relatório', secoes: [{ titulo: 'Resumo', texto: '**Frase.**\n\n- item' }] } });
    assert.ok(!antigo.result.isError, 'a chamada antiga, sem campos novos, falhou');

    const r2 = await s.chamar('tools/call', { name: 'mesa_apresentacao', arguments: {
      titulo: 'Segunda reunião', cliente: 'Cliente Teste', tipo: 'reuniao', rodape: 'Material informativo. Assessor Teste, Escritório Teste.',
      slides: [{ layout: 'capa', titulo: 'Segunda reunião' },
        { layout: 'rosca', titulo: 'Onde está a carteira', itens: [{ rotulo: 'Renda fixa', valor: '85%' }, { rotulo: 'Ações', valor: '15%' }] },
        { layout: 'linha', titulo: 'Carteira e CDI', retornos: true, rotulos: ['jan', 'fev'], series: [{ nome: 'Carteira', valores: [1, 1.2] }, { nome: 'CDI', valores: [1.1, 1] }] },
        { layout: 'comparativo', titulo: 'Atual e proposta', legenda: ['Atual', 'Proposta'], itens: [{ rotulo: 'Renda fixa', valor: '85%', valor2: '80%' }] }] } });
    assert.ok(!r2.result.isError, r2.result.content?.[0]?.text);
    assert.ok(existsSync(JSON.parse(r2.result.content[0].text).pdf));
  } finally {
    s.fechar();
    rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  }
});

// Revisão do passo 4: o comparador da 1.13 (chamada antiga, com o Conferir) terminava numa p. 2 com um item e o aviso,
// 92% vazia. Folha que passa da página por pouco sai com espaçamento justo (mesma letra) quando isso economiza a página;
// folha que passa com folga continua igual.
const COMPARADOR_113 = {
  titulo: 'Comparador de carteira', subtitulo: 'Carteira atual × carteira modelo do escritório · data-base 31/10/2026 [CONFERIR: amostra]',
  rodape: 'Assessor Teste, assessor de investimentos vinculado ao Escritório Teste.',
  secoes: [
    { titulo: 'Resumo', texto: '**A maior diferença está na concentração: a carteira atual tem 70% em renda fixa pós-fixada e a modelo distribui em quatro classes.**\n\nA liquidez diária cai de 60% para 45% e o número de posições sobe de 6 para 11.' },
    { titulo: 'Composição por classe', texto: '| Classe | Atual | Modelo | Diferença |\n|---|---|---|---|\n| Renda fixa pós | 70% | 40% | ▼ 30 p.p. |\n| Renda fixa inflação | 0% | 15% | ▲ 15 p.p. |\n| Multimercado | 10% | 15% | ▲ 5 p.p. |\n| Ações | 15% | 20% | ▲ 5 p.p. |\n| Exterior | 5% | 10% | ▲ 5 p.p. |' },
    { titulo: 'Maiores posições', texto: '| Posição | Atual | Modelo |\n|---|---|---|\n| CDB Banco A | 35% | 10% |\n| Tesouro Selic | 25% | 15% |\n| Fundo multimercado B | 10% | 8% |' },
    { titulo: 'Liquidez e vencimentos', texto: '- Liquidez diária: 60% na atual, 45% na modelo\n- Vencimentos em 12 meses: 2 títulos na atual, 1 na modelo\n- Prazo médio: ● parcial, falta o vencimento de um CDB' },
    { titulo: 'Roteiro da conversa', texto: 'As duas carteiras diferem em concentração e prazo. Nenhuma é melhor em si: depende do objetivo e do prazo do cliente.\n\n1. O que você precisa ter disponível nos próximos 12 meses?\n2. Como você se sentiria com parte do patrimônio variando mais?\n3. Há algum objetivo com data marcada?' },
    { titulo: 'Conferir', texto: '- Data-base das duas carteiras\n- Custos informados pela outra instituição' },
  ],
};

test('folha que passa da página só com o último item e o aviso sai justa em uma página; folha longa continua igual', { timeout: 180000 }, async () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'mesa-fix4-'));
  mkdirSync(path.join(tmp, 'Documents'));
  const SERV = path.join(RAIZ, 'servidor');
  const env = { ...process.env, USERPROFILE: tmp, HOME: tmp, TEMP: tmp, TMP: tmp, MESA_PERFIL_DIR: path.join(tmp, 'perfil'), MESA_TAREFA: path.join(tmp, 'tarefa.json'),
    MESA_ANDAMENTO: path.join(tmp, 'andamento.json'), MESA_COFRE: path.join(tmp, 'cofre'), CAPTAMAIS_MARKET_KEY: '',
    METODO_SKILLS: path.join(SERV, 'skills'), ROTINAS_SKILLS: path.join(SERV, 'rotinas'), MESA_BASE: path.join(SERV, 'base-assessor.md') };
  const s = servidor(env);
  const paginas = (arq) => execFileSync('pdftotext', ['-enc', 'UTF-8', arq, '-'], { encoding: 'utf8' }).split('\f').filter((p) => p.trim());
  // O gerador direto, num processo com a mesma casa e os mesmos temporários de teste: devolve o resultado inteiro
  // (com justo: true quando ficou a versão de espaçamento justo).
  const MOD = JSON.stringify(pathToFileURL(path.join(SERV, 'gerador.mjs')).href);
  const gerarDireto = (args) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
    `const g = await import(${MOD}); console.log(JSON.stringify(await g.gerarDocumento(JSON.parse(process.argv[1]), {})));`, JSON.stringify(args)],
  { env, encoding: 'utf8', timeout: 120000 }));
  try {
    await s.iniciar();
    const r1 = await s.chamar('tools/call', { name: 'mesa_documento', arguments: COMPARADOR_113 });
    assert.ok(!r1.result.isError, r1.result.content?.[0]?.text);
    const curto = JSON.parse(r1.result.content[0].text).pdf;
    const p1 = paginas(curto);
    assert.equal(p1.length, 1, `o comparador da 1.13 ainda sai com ${p1.length} páginas`);
    assert.match(p1[0], /Custos informados pela outra instituição/);
    assert.match(p1[0], /Aviso importante\./);

    assert.equal(gerarDireto(COMPARADOR_113).justo, true);

    // Controle: com três seções a mais, a folha passa da página com folga. Continua em 2 páginas, com o espaçamento normal
    // e com conteúdo além do aviso na última página.
    const longo = { ...COMPARADOR_113, secoes: [...COMPARADOR_113.secoes.slice(0, 5), ...COMPARADOR_113.secoes.slice(1, 4).map((x) => ({ ...x, titulo: `${x.titulo} (modelo)` })), COMPARADOR_113.secoes[5]] };
    const r2 = gerarDireto(longo);
    assert.equal(r2.justo, undefined, 'a folha longa também saiu com o espaçamento justo');
    const p2 = paginas(r2.pdf);
    assert.equal(p2.length, 2);
    assert.match(p2[1], /Prazo médio/, 'a última página tem só o aviso');
  } finally {
    s.fechar();
    rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  }
});
