// Conferências que valem para qualquer versão do catálogo. Rodar: node --test bancada/
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { carregar, ferramentasDoServidor, corteDaTela } from './catalogo.mjs';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARQ_JANELA = path.join(RAIZ, 'janela', 'mesa-janela.html');
const ARQ_PAINEL = path.join(RAIZ, 'servidor', 'painel-v2.html');
const janela = carregar(ARQ_JANELA);
const painel = carregar(ARQ_PAINEL);

// A tarefa de editar vídeo só existe na janela (o painel do Claude Desktop não recebe vídeo): lá ela tem
// um grupo próprio no menu e um pedido montado por outra função, sem objetivo no catálogo.
const semVideo = (c) => {
  for (const k of ['T', 'PEDIDO', 'CAMPOS']) delete c[k]['editar-reels'];
  for (const a of c.AREAS) a.grupos = a.grupos.map((g) => ({ ...g, tarefas: g.tarefas.filter((id) => id !== 'editar-reels') })).filter((g) => g.tarefas.length);
  return c;
};

test('os dois catálogos (janela e painel) são iguais, fora a tarefa de vídeo', () => {
  assert.deepEqual(semVideo(painel.retrato()), semVideo(janela.retrato()));
});

test('toda tarefa do menu tem nome, linha e pedido com objetivo', () => {
  for (const [tela, cat] of [['janela', janela], ['painel', painel]]) {
    const c = cat.retrato();
    for (const { id } of cat.tarefasDoMenu()) {
      assert.ok(c.T[id]?.nome && c.T[id]?.linha, `${tela}: a tarefa ${id} está no menu e não tem nome ou linha`);
      if (id !== 'editar-reels') assert.ok(c.PEDIDO[id]?.obj, `${tela}: a tarefa ${id} está no menu e não tem pedido com objetivo`);
    }
  }
});

test('o pedido só cita ferramenta que o servidor da Mesa registra', () => {
  const existentes = new Set(ferramentasDoServidor(path.join(RAIZ, 'servidor', 'server.mjs')));
  const NOME = /\b(mesa_[a-z_]+|analise_ativo|painel_macro|documentos_cvm|taxas_tesouro|medidas_grafico|consultar_cofre|carregar_metodo|landing_captamais)\b/g;
  const faltando = new Set();
  for (const cat of [janela, painel]) {
    for (const { id } of cat.tarefasDoMenu()) {
      for (const uso of ['Conversa de WhatsApp', 'Entender a fundo', 'Material para o cliente']) {
        for (const [, nome] of cat.montar(id, { uso: [uso] }, []).texto.matchAll(NOME)) if (!existentes.has(nome)) faltando.add(`${id}: ${nome}`);
      }
    }
  }
  assert.deepEqual([...faltando], []);
});

test('nenhum pedido montado, com os campos ainda vazios, chega perto do corte da tela', () => {
  const MARGEM = 1500; // espaço para o que o assessor digita nos campos curtos
  for (const [tela, cat, arq] of [['janela', janela, ARQ_JANELA], ['painel', painel, ARQ_PAINEL]]) {
    const corte = corteDaTela(arq);
    const grandes = [];
    for (const { id } of cat.tarefasDoMenu()) {
      for (const uso of ['Conversa de WhatsApp', 'Entender a fundo', 'Material para o cliente']) {
        const n = cat.montar(id, { uso: [uso] }, []).texto.length;
        if (n > corte - MARGEM) grandes.push(`${id} (${uso}): ${n} de ${corte}`);
      }
    }
    assert.deepEqual(grandes, [], `${tela}: pedidos que passam de ${corte - MARGEM} caracteres`);
  }
});
