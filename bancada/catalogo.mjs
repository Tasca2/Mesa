// Bancada de teste da Mesa do Assessor.
// Carrega o catálogo de pedidos de uma das duas telas (janela/mesa-janela.html ou servidor/painel-v2.html)
// sem abrir navegador e monta o pedido com o mesmo código que a tela usa.
// Não faz parte do produto: nada aqui é copiado para o computador do assessor.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const TOPO = /^ {2}\S/;       // declaração no nível do script da tela (2 espaços)
const FECHO = /^ {2}[\]})]/;  // linha que fecha uma declaração de várias linhas

// Trecho de uma declaração de topo que começa com `inicio` (ex.: "function montarPedido").
function trecho(linhas, inicio) {
  const i = linhas.findIndex((l) => l.startsWith('  ' + inicio));
  if (i < 0) return '';
  let j = i + 1;
  for (; j < linhas.length; j++) {
    const l = linhas[j];
    if (!l.trim()) {
      let k = j + 1; while (k < linhas.length && !linhas[k].trim()) k++;
      if (k >= linhas.length || (TOPO.test(linhas[k]) && !FECHO.test(linhas[k]))) break;
      continue;
    }
    if (FECHO.test(l)) { j++; break; }
    if (TOPO.test(l)) break;
  }
  return linhas.slice(i, j).join('\n');
}

const DEPOIS_DO_BLOCO = ['const estado = ', 'function linhasVoz', 'const skillsDe', 'const ehEdicaoVideo', 'const pedidoEdicaoVideo', 'function montarPedido', 'const instrucao'];

const EPILOGO = `
;globalThis.__mesa = {
  definir(o) { if ('perfil' in o) perfil = o.perfil; if ('captamais' in o) captamais = o.captamais; },
  tarefasDoMenu() { return JSON.stringify(AREAS.flatMap((a) => a.grupos.flatMap((g) => g.tarefas.map((id) => ({ area: a.id, areaNome: a.nome, grupo: g.nome, id }))))); },
  montar(tarefa, respostas, campos) {
    const a = AREAS.find((x) => x.grupos.some((g) => g.tarefas.includes(tarefa)));
    Object.assign(estado, { tela: 'guia', area: a ? a.id : null, tarefa, passo: 0, respostas: respostas || {}, campos: { [tarefa]: campos || [] } });
    const t = T[tarefa], ps = perguntasDe(t);
    return JSON.stringify({ texto: montarPedido(t, ps), contexto: instrucao(t), nome: t.nome, linha: t.linha, area: a ? a.id : '', areaNome: a ? a.nome : '',
      perguntas: ps.map((p) => ({ id: p.id, curto: p.curto, titulo: p.titulo, multi: !!p.multi, opcoes: (p.opcoes || []).map((o) => o.t) })), campos: camposDe(tarefa) });
  },
  retrato() {
    const usos = ['', ...USO_MERCADO.opcoes.map((o) => o.t)];
    const entregaDe = (id) => {
      const e = PEDIDO[id].entrega;
      if (typeof e !== 'function') return e;
      const r = {};
      for (const u of usos) { estado.respostas = u ? { uso: [u] } : {}; r[u || '(sem uso)'] = e(); }
      estado.respostas = {};
      return r;
    };
    return JSON.stringify({ AREAS, T, PEDIDO: Object.fromEntries(Object.keys(PEDIDO).map((id) => [id, { ...PEDIDO[id], entrega: entregaDe(id) }])), CAMPOS, REGRAS_PEDIDO, PDF_OK, RESULTADO, USO_MERCADO, ATUACAO });
  },
};`;

// Devolve { definir, tarefasDoMenu, montar, retrato } da tela pedida. Tudo o que sai é JSON em texto.
export function carregar(arquivo) {
  const linhas = readFileSync(arquivo, 'utf8').split('\n');
  const ini = linhas.findIndex((l) => /^ {2}const AREAS = /.test(l));
  const fim = linhas.findIndex((l, i) => i > ini && l.startsWith('  const $ = (s) => document.querySelector(s);'));
  if (ini < 0 || fim < 0) throw new Error(`Não achei o bloco do catálogo em ${arquivo}`);
  const depois = linhas.slice(fim);
  const fonte = [linhas.slice(ini, fim).join('\n'), ...DEPOIS_DO_BLOCO.map((d) => trecho(depois, d)), EPILOGO].join('\n');
  const ctx = vm.createContext({ window: {}, console });
  new vm.Script(fonte, { filename: arquivo }).runInContext(ctx, { timeout: 5000 });
  const m = ctx.__mesa;
  return {
    definir: (o) => m.definir(o),
    tarefasDoMenu: () => JSON.parse(m.tarefasDoMenu()),
    montar: (tarefa, respostas, campos) => JSON.parse(m.montar(tarefa, respostas, campos)),
    retrato: () => JSON.parse(m.retrato()),
  };
}

// Nomes das ferramentas que o servidor da Mesa registra.
export function ferramentasDoServidor(arquivoServidor) {
  return [...readFileSync(arquivoServidor, 'utf8').matchAll(/register(?:App)?Tool\(\s*(?:server,\s*)?'([a-z_]+)'/g)].map((m) => m[1]);
}

// Tamanho em que a tela corta o pedido antes de enviar: a constante CORTE_PEDIDO (desde o passo 2) ou, nas versões
// anteriores, o número escrito no próprio corte.
export function corteDaTela(arquivo) {
  const s = readFileSync(arquivo, 'utf8');
  const m = s.match(/\bconst CORTE_PEDIDO = (\d+);/) || s.match(/promptAtual\(t, ps\)\.texto \|\| ""\)\.trim\(\)\.slice\(0, (\d+)\)/);
  if (!m) throw new Error(`Não achei o corte do pedido em ${arquivo}`);
  return Number(m[1]);
}

// Tamanho em que o motor da janela corta o pedido ao receber.
export function corteDoMotor(arquivoMotor) {
  const s = readFileSync(arquivoMotor, 'utf8');
  // Desde a revisão do passo 2 o limite é uma constante; nas versões anteriores, o número escrito no corte do /api/send.
  const m = s.match(/const LIMITE_MENSAGEM = (\d+)/) || s.match(/case '\/api\/send':[\s\S]{0,400}?corpo\.texto \|\| ''\)\.trim\(\)\.slice\(0, (\d+)\)/);
  if (!m) throw new Error(`Não achei o corte do pedido em ${arquivoMotor}`);
  return Number(m[1]);
}
