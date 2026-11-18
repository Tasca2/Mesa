// Passo 4 do plano de melhorias (seções 7.3, 7.4 e 7.6): as ferramentas de PDF de verdade, pelo servidor da Mesa,
// e a opção de PDF nas telas. Gera arquivos numa pasta temporária (perfil, Documentos e temporários desviados),
// nunca na pasta do assessor. Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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
    for (const campo of ['cliente', 'dataBase', 'capa', 'destaques', 'tipo', 'tema']) assert.ok(doc.properties[campo], `mesa_documento sem o campo ${campo}`);
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
