import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, statSync, rmSync, realpathSync, chmodSync } from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { gerarCarrossel, gerarDocumento, gerarApresentacao, pastaBase } from './gerador.mjs';
import { NOMES_LAYOUT, NOMES_ICONE, NOMES_ILUSTRACAO } from './layouts.mjs';
import { painelMacro, documentosCvm, taxasTesouro, RECORTES, REFERENCIAS } from './dados-publicos.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PASTA_SKILLS = process.env.METODO_SKILLS
  ?? path.resolve(AQUI, '..', '..', '..', '01 - Manual', 'anexos', 'skills');
const PASTA_ROTINAS = process.env.ROTINAS_SKILLS ?? path.join(AQUI, 'rotinas');
const ROTINAS = ['prospect-intake', 'pre-meeting', 'post-meeting', 'portfolio-rebalance-review'];
const ARQUIVO_BASE = process.env.MESA_BASE ?? path.join(AQUI, 'base-assessor.md');
const PASTA_COFRE = process.env.MESA_COFRE || path.join(os.homedir(), 'Desktop', 'AppCaptaMais', 'knowledge');
const CHAVE_MANUAL = (process.env.CAPTAMAIS_MARKET_KEY || '').trim();
const CAPTAMAIS_URL = (process.env.CAPTAMAIS_URL || 'https://captamais.me').trim().replace(/\/+$/, '');
const urlSegura = (u) => { try { const x = new URL(u); return x.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(x.hostname); } catch { return false; } };


const PS_DPAPI = (modo) => `Add-Type -AssemblyName System.Security; $b=[Convert]::FromBase64String([Console]::In.ReadToEnd().Trim()); ` +
  `[Convert]::ToBase64String([Security.Cryptography.ProtectedData]::${modo}($b,$null,'CurrentUser'))`;
function proteger(texto) {
  const b64 = Buffer.from(texto, 'utf8').toString('base64');
  if (process.platform === 'win32') {
    try {
      const v = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', PS_DPAPI('Protect')], { input: b64, encoding: 'utf8', windowsHide: true, timeout: 20000 }).trim();
      if (v) return { dpapi: true, v };
    } catch {   }
  }
  return { dpapi: false, v: b64 };
}
function revelar(o) {
  if (!o?.v) return '';
  try {
    const b64 = o.dpapi
      ? execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', PS_DPAPI('Unprotect')], { input: o.v, encoding: 'utf8', windowsHide: true, timeout: 20000 }).trim()
      : o.v;
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch { return ''; }
}
const gravarSeguro = (arq, obj) => { mkdirSync(PASTA_PERFIL, { recursive: true }); writeFileSync(arq, JSON.stringify(obj), { mode: 0o600 }); try { chmodSync(arq, 0o600); } catch { } };
const lerJson = (arq) => { try { return JSON.parse(readFileSync(arq, 'utf8')); } catch { return null; } };
let cacheChave = { m: 0, v: '' };
function chaveAtual() {
  if (CHAVE_MANUAL) return CHAVE_MANUAL;
  try {
    const m = statSync(ARQUIVO_CONEXAO).mtimeMs;
    if (cacheChave.m === m) return cacheChave.v;
    const c = lerJson(ARQUIVO_CONEXAO);
    cacheChave = { m, v: c ? revelar(c.chave) : '' };
    return cacheChave.v;
  } catch { return ''; }
}
const esquecerConexao = () => { cacheChave = { m: 0, v: '' }; cacheConexao = { em: 0, valor: null }; };
const pareamentoPost = async (rota, corpo) => {
  const res = await fetch(`${CAPTAMAIS_URL}${rota}`, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json', 'x-captamais-client': 'mesa-do-assessor/1.0.0' }, body: JSON.stringify(corpo ?? {}),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
};

const ARQUIVO_TAREFA = process.env.MESA_TAREFA ?? path.join(os.tmpdir(), 'mesa-do-assessor-tarefa.json');
function enviarEvento(evento, dados = {}) {
  try {
    const chave = chaveAtual();
    if (!chave || !urlSegura(CAPTAMAIS_URL)) return;
    fetch(`${CAPTAMAIS_URL}/api/mcp/market/event`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json', 'x-captamais-market-key': chave, 'x-captamais-client': 'mesa-do-assessor/1.0.0' },
      body: JSON.stringify({ evento, ...dados }),
    }).catch(() => {});
  } catch {   }
}

let cacheConexao = { em: 0, valor: null };
async function estadoCaptaMais() {
  const CHAVE = chaveAtual();
  if (!CHAVE) return { estado: 'sem_chave' };
  if (!urlSegura(CAPTAMAIS_URL)) return { estado: 'endereco_invalido' };
  if (cacheConexao.valor && Date.now() - cacheConexao.em < 600_000) return cacheConexao.valor;
  let valor;
  try {
    const res = await fetch(`${CAPTAMAIS_URL}/api/mcp/market/status`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(6000),
      headers: { 'Content-Type': 'application/json', 'x-captamais-market-key': CHAVE, 'x-captamais-client': 'mesa-do-assessor/1.0.0' }, body: '{}',
    });
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403 || j?.linked === false) valor = { estado: 'chave_recusada' };
    else if (!res.ok) valor = { estado: 'sem_rede' };
    else valor = { estado: j?.blocked ? 'conta_pausada' : 'conectado', plano: j?.plan || null, ativos: j?.tools?.ativos === true, nome: j?.name || null, conta: `${CAPTAMAIS_URL}/my-account` };
  } catch { valor = { estado: 'sem_rede' }; }
  if (valor.estado !== 'sem_rede') cacheConexao = { em: Date.now(), valor };
  return valor;
}
const PASTA_PERFIL = process.env.MESA_PERFIL_DIR ?? path.join(os.homedir(), '.mesa-do-assessor');
const ARQUIVO_PERFIL = path.join(PASTA_PERFIL, 'perfil.json');
const ARQUIVO_CONEXAO = path.join(PASTA_PERFIL, 'conexao.json');
const ARQUIVO_PAREAMENTO = path.join(PASTA_PERFIL, 'pareamento.json');
const PAINEL_URI = 'ui://mesa-do-assessor/painel';
const SDK_PAINEL = readFileSync(createRequire(import.meta.url).resolve('@modelcontextprotocol/ext-apps/app-with-deps'), 'utf8')
  .replace(/export\s*\{([^}]*)\};?\s*$/, (_, lista) => 'globalThis.ExtApps={' + lista.split(',')
    .map((p) => { const [a, b] = p.trim().split(/\s+as\s+/); return `${b ?? a}:${a}`; }).join(',') + '};')
  .replace(/<\/script/gi, '<\\/script');
if (!SDK_PAINEL.includes('globalThis.ExtApps=')) console.error('mesa-do-assessor: não consegui embutir o SDK do painel');
const ARQUIVO_ANDAMENTO = process.env.MESA_ANDAMENTO ?? path.join(os.tmpdir(), 'mesa-do-assessor-andamento.json');

const comSkill = (pasta) => readdirSync(pasta, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(path.join(pasta, d.name, 'SKILL.md'))).map((d) => d.name);
const SKILLS_METODO = comSkill(PASTA_SKILLS);
const pastaDa = (skill) => path.join(ROTINAS.includes(skill) ? PASTA_ROTINAS : PASTA_SKILLS, skill);

const AREAS = 'Rotinas do dia (antes da reunião: cliente novo, primeira reunião, segunda reunião, pré-reunião (cliente atual); depois da reunião: pós-reunião; carteira: revisão de carteira, comparador de carteira; cliente: diagnóstico financeiro, relatório mensal ao cliente, proposta de assessoria (documento), follow-up da proposta; relacionamento: ritmo e indicação, explicar ao cliente, conversa sobre sucessão; prospecção: primeira mensagem, ligação de primeiro contato, sequência para lead novo, pitch e e-mail, objeção do cliente, retomar lead parado); ' +
  'Mercado hoje (juros, inflação e câmbio, fato relevante, gráfico, ação, setor, fundo imobiliário, renda fixa, estudo e apresentação de ativo); ' +
  'Marketing Profissional (Post para Instagram: criar um post, ideias para postar hoje, calendário de post; editar um Reels; landing page)';
const COMO_ATUALIZAR = 'Em toda tarefa enviada pela Mesa (mensagem que começa com [Mesa]), chame mesa_perfil para saber quem é o assessor, ' +
  'chame mesa_andamento antes de cada pedido ao assessor, dizendo em uma frase o que ele precisa responder ou anexar no chat, ' +
  'e ao terminar, com concluido=true; depois registre a tarefa com mesa_perfil (registrar).';

const PERFIL_VAZIO = { nome: '', atuacao: '', escritorio: '', publico: '', tom: '', exemplo: '', canal: '', tamanho: '', tratamento: '', assinatura: '', evitar: '', exemplos: [], historico: [], modelos: {} };
const lerPerfil = () => {
  try { return { ...PERFIL_VAZIO, ...JSON.parse(readFileSync(ARQUIVO_PERFIL, 'utf8')) }; } catch { return { ...PERFIL_VAZIO }; }
};
const gravarPerfil = (p) => { mkdirSync(PASTA_PERFIL, { recursive: true }); writeFileSync(ARQUIVO_PERFIL, JSON.stringify(p, null, 2)); };

const sem = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const PASTAS_FORA = new Set(['.obsidian', '.trash', 'attachments', '_templates', '_inbox']);
const cacheCofre = new Map();
function notasDoCofre(incluirCfa) {
  const achados = [];
  const varrer = (dir) => {
    for (const it of readdirSync(dir, { withFileTypes: true })) {
      const cheio = path.join(dir, it.name);
      if (it.isDirectory()) { if (!PASTAS_FORA.has(it.name) && (incluirCfa || !it.name.startsWith('cfa-lv1'))) varrer(cheio); }
      else if (it.name.endsWith('.md') && it.name !== 'README.md') achados.push(cheio);
    }
  };
  if (existsSync(PASTA_COFRE)) varrer(PASTA_COFRE);
  return achados;
}
function textoDaNota(arquivo) {
  const m = statSync(arquivo).mtimeMs;
  const c = cacheCofre.get(arquivo);
  if (c && c.m === m) return c.t;
  const t = readFileSync(arquivo, 'utf8').replace(/^---[\s\S]*?---\s*/, '').replace(/<[^>]+>/g, '').replace(/\*\*/g, '');
  cacheCofre.set(arquivo, { m, t });
  return t;
}
function buscarNoCofre(tema, limite) {
  const termos = [...new Set(sem(tema).split(/[^a-z0-9]+/).filter((w) => w.length >= 3))];
  if (!termos.length) return [];
  const pontuadas = [];
  for (const arq of notasDoCofre(termos.includes('cfa'))) {
    const texto = textoDaNota(arq), norm = sem(texto), rel = sem(path.relative(PASTA_COFRE, arq));
    let pts = 0, cobertos = 0;
    for (const t of termos) {
      const n = norm.split(t).length - 1, noNome = rel.includes(t);
      if (n || noNome) cobertos++;
      pts += Math.min(n, 10) + (noNome ? 15 : 0);
    }
    pts = Math.round(pts * (cobertos / termos.length) ** 2);
    if (pts > 0) pontuadas.push({ arq, texto, pts });
  }
  return pontuadas.sort((a, b) => b.pts - a.pts).slice(0, limite).map(({ arq, texto, pts }) => {
    const trechos = texto.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 40)
      .map((p) => ({ p, n: termos.filter((t) => sem(p).includes(t)).length })).filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n).slice(0, 3).map((x) => x.p.slice(0, 900));
    return { nota: path.relative(PASTA_COFRE, arq).replace(/\\/g, '/'), pontos: pts, trechos };
  });
}

const TIPOS_ENTREGA = { '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.png': 'image/png', '.md': 'text/markdown' };
function arquivoDaEntrega(andamento) {
  const bruto = andamento?.entrega?.arquivo;
  if (!bruto) return { erro: 'sem_arquivo' };
  try {
    const real = realpathSync(path.resolve(bruto));
    const casa = realpathSync(os.homedir()), tmp = realpathSync(os.tmpdir());
    const dentro = (base) => real === base || real.startsWith(base + path.sep);
    if (!dentro(casa) && !dentro(tmp)) return { erro: 'fora_da_pasta' };
    const rel = path.relative(dentro(casa) ? casa : tmp, real).split(path.sep);
    if (rel.some((x) => x.startsWith('.') && x !== '.mesa-do-assessor')) return { erro: 'fora_da_pasta' };
    const tipo = TIPOS_ENTREGA[path.extname(real).toLowerCase()];
    if (!tipo) return { erro: 'tipo_nao_permitido' };
    const st = statSync(real);
    if (!st.isFile() || st.size > 12 * 1024 * 1024) return { erro: 'grande_demais' };
    return { real, tipo, nome: path.basename(real), bytes: st.size };
  } catch { return { erro: 'nao_encontrado' }; }
}
const nomeSeguro = (s, max) => String(s || '').normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').replace(/^[.\s]+|[.\s]+$/g, '').slice(0, max).trim();
function guardarEntrega(entrega, tarefa) {
  try {
    const texto = String(entrega?.texto || '').trim();
    if (!texto) return null;
    const cliente = nomeSeguro(entrega.cliente, 50) || 'Sem cliente';
    const pasta = path.join(pastaBase(), 'Entregas', cliente);
    mkdirSync(pasta, { recursive: true });
    const d = new Date(), dois = (n) => String(n).padStart(2, '0');
    const data = `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`, hora = `${dois(d.getHours())}${dois(d.getMinutes())}`;
    const titulo = nomeSeguro(entrega.titulo || tarefa || 'Entrega', 70) || 'Entrega';
    let nome = `${data} ${hora} - ${titulo}.md`;
    for (let i = 2; existsSync(path.join(pasta, nome)); i++) nome = `${data} ${hora} - ${titulo} (${i}).md`;
    const cab = [`# ${entrega.titulo || tarefa || 'Entrega'}`, '', `- Tarefa: ${tarefa || '—'}`, `- Cliente: ${cliente}`, `- Data: ${d.toLocaleString('pt-BR')}`, '', '---', ''];
    writeFileSync(path.join(pasta, nome), cab.join('\n') + texto + '\n', 'utf8');
    return { cliente, nome };
  } catch { return null; }
}
function vistaDoAndamento(a) {
  if (!a?.entrega) return a;
  const f = a.entrega.arquivo ? arquivoDaEntrega(a) : null;
  const { arquivo, ...resto } = a.entrega;
  return { ...a, entrega: { ...resto, arquivoNome: f?.nome ?? null, arquivoKb: f?.bytes ? Math.max(1, Math.round(f.bytes / 1024)) : null, arquivoErro: arquivo && f?.erro ? f.erro : null } };
}
const lerAndamento = () => {
  try {
    const a = JSON.parse(readFileSync(ARQUIVO_ANDAMENTO, 'utf8'));
    if (a?.em && Date.now() - a.em > 7 * 864e5) { rmSync(ARQUIVO_ANDAMENTO, { force: true }); return null; }
    return a;
  } catch { return null; }
};

function arquivosExtras(pasta) {
  const extras = [];
  const varrer = (dir, rel) => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const relItem = path.join(rel, item.name);
      if (item.isDirectory()) { if (item.name !== 'evals') varrer(path.join(dir, item.name), relItem); }
      else if (relItem !== 'SKILL.md') extras.push(relItem);
    }
  };
  varrer(pasta, '');
  return extras;
}

function buildServer() {
  const server = new McpServer({ name: 'mesa-do-assessor', version: '1.0.0' });

  registerAppTool(
    server,
    'abrir_painel',
    {
      title: 'Abrir a Mesa do Assessor',
      description:
        'Abre a Mesa do Assessor: painel interativo que guia o assessor de investimentos pelas rotinas do dia, pelo ' +
        'mercado e pelos posts, até a skill certa. Use quando o usuário pedir a mesa ou o painel, ou não souber por onde ' +
        'começar. O parâmetro opcional area abre o painel direto numa área.',
      inputSchema: {
        area: z.enum(['rotinas', 'mercado', 'instagram']).optional()
          .describe('Área para abrir direto: rotinas, mercado ou instagram'),
      },
      annotations: { readOnlyHint: true },
      _meta: { ui: { resourceUri: PAINEL_URI } },
    },
    async ({ area }) => ({
      content: [{
        type: 'text',
        text: 'Mesa do Assessor aberta. O assessor escolhe a tarefa no painel e o pedido chega pelo chat. ' +
          `Áreas: ${AREAS}.\n${COMO_ATUALIZAR}`,
      }],
      structuredContent: { areaInicial: area ?? null },
    }),
  );

  server.registerTool(
    'mesa_andamento',
    {
      title: 'Atualizar a Mesa',
      description:
        'Mostra no painel da Mesa do Assessor o que o assessor precisa fazer agora no chat. ' + COMO_ATUALIZAR +
        ' Exemplo de agora: "Anexe o release do trimestre" ou "Escreva o código da ação".',
      inputSchema: {
        agora: z.string().max(200).describe('O que o assessor precisa responder ou anexar no chat agora, em uma frase curta'),
        detalhe: z.string().max(300).optional().describe('Formato ou exemplo da resposta esperada'),
        passos: z.array(z.object({ nome: z.string().max(60), estado: z.enum(['feito', 'agora', 'depois']) })).max(8).optional()
          .describe('Etapas da tarefa e em qual ela está'),
        concluido: z.boolean().optional().describe('true quando a entrega estiver pronta'),
        entrega: z.object({
          titulo: z.string().max(100).optional().describe('Nome da entrega, ex.: "Estudo de PETR4"'),
          cliente: z.string().max(60).optional().describe('Apelido do cliente ou lead desta entrega, o mesmo que o assessor usou (ex.: "Bernardo"). A Mesa guarda a entrega numa pasta com esse nome. Sem cliente (ex.: post, mercado), deixe vazio.'),
          texto: z.string().max(20000).optional().describe('O texto INTEGRAL e pronto para usar de tudo que foi entregue (todas as peças, uma depois da outra, cada uma com seu título). Nunca um resumo nem a lista do que a entrega contém: é o que o assessor copia pelo painel.'),
          arquivo: z.string().max(500).optional().describe('Caminho completo do arquivo gerado (PDF, DOCX, PPTX, XLSX, PNG ou MD) para o assessor baixar pelo painel'),
        }).optional().describe('Use junto com concluido=true: o painel mostra os botões Baixar e Copiar.'),
      },
      annotations: { destructiveHint: false, openWorldHint: false },
    },
    async (andamento) => {
      const t = (() => { try { return JSON.parse(readFileSync(ARQUIVO_TAREFA, 'utf8')); } catch { return {}; } })();
      let aviso = '';
      if (andamento.concluido && andamento.entrega?.texto) {
        const antes = lerAndamento();
        const igual = antes?.entrega?.guardada && String(antes.entrega.texto || '').trim() === String(andamento.entrega.texto).trim();
        const guardada = igual ? antes.entrega.guardada : guardarEntrega(andamento.entrega, t.tarefa);
        if (guardada) { andamento = { ...andamento, entrega: { ...andamento.entrega, guardada } }; aviso = ` Entrega guardada em Documentos › Mesa do Assessor › Entregas › ${guardada.cliente}.`; }
      }
      writeFileSync(ARQUIVO_ANDAMENTO, JSON.stringify({ ...andamento, em: Date.now() }));
      if (andamento.concluido) {
        enviarEvento('tarefa_concluida', { tarefa: t.tarefa, area: t.area });
      }
      return { content: [{ type: 'text', text: 'Painel atualizado.' + aviso }] };
    },
  );

  registerAppTool(
    server,
    'mesa_ler_andamento',
    {
      description: 'Lê o último andamento gravado pela Mesa. Uso do painel; o Claude não precisa chamar.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
      _meta: { ui: { visibility: ['model', 'app'] } },
    },
    async () => {
      const andamento = vistaDoAndamento(lerAndamento());
      return { content: [{ type: 'text', text: JSON.stringify(andamento) }], structuredContent: { andamento } };
    },
  );

  registerAppTool(
    server,
    'mesa_baixar',
    {
      description: 'Uso do painel: devolve o arquivo da última entrega para o botão Baixar. O Claude não precisa chamar.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
      _meta: { ui: { visibility: ['app'] } },
    },
    async () => {
      const f = arquivoDaEntrega(lerAndamento());
      if (f.erro) return { structuredContent: { ok: false, erro: f.erro }, content: [{ type: 'text', text: 'Arquivo indisponível.' }] };
      const blob = readFileSync(f.real).toString('base64');
      enviarEvento('entrega_baixada', { tipo: path.extname(f.nome).slice(1) });
      return { structuredContent: { ok: true, nome: f.nome, tipo: f.tipo, blob }, content: [{ type: 'text', text: 'Arquivo pronto.' }] };
    },
  );

  registerAppTool(
    server,
    'mesa_perfil',
    {
      title: 'Perfil do assessor',
      description:
        'Lê o perfil do assessor (nome, atuação, escritório, público, tom, canal, tamanho, tratamento, assinatura, termos que evita e até 3 mensagens de exemplo) e as últimas tarefas feitas na Mesa. ' +
        'Chame no começo de toda tarefa da Mesa e use o que vier em vez de perguntar de novo. ' +
        'Para salvar ou atualizar o perfil, envie "salvar"; para lembrar a tarefa que acabou de entregar, envie "registrar".',
      inputSchema: {
        salvar: z.object({
          nome: z.string().max(80).optional(),
          atuacao: z.enum(['Assessor de investimento', 'Consultor de valores mobiliários', 'Planejador financeiro']).optional(),
          escritorio: z.string().max(80).optional(),
          publico: z.string().max(200).optional().describe('Quem ele atende, ex.: médicos, empresários, aposentados'),
          tom: z.string().max(200).optional().describe('Como ele fala com clientes, ex.: direto e próximo, formal'),
          exemplo: z.string().max(600).optional().describe('Uma mensagem real do assessor a um cliente, sem dados do cliente: serve de modelo do jeito de escrever, nunca dos fatos'),
          canal: z.string().max(40).optional().describe('Canal que mais usa com cliente, ex.: WhatsApp, ligação, e-mail'),
          tamanho: z.string().max(40).optional().describe('Tamanho preferido das mensagens, ex.: curtas, médias'),
          tratamento: z.string().max(40).optional().describe('Como trata o cliente, ex.: você, senhor(a)'),
          assinatura: z.string().max(200).optional().describe('Identificação que vai no fim das peças: nome, registro e escritório'),
          evitar: z.string().max(200).optional().describe('Palavras, expressões e emojis que o assessor nunca usa'),
          exemplos: z.array(z.string().max(600)).max(3).optional().describe('Até 3 mensagens reais do assessor, sem dados de cliente: modelo do jeito de escrever, nunca dos fatos'),
          avisoDados: z.enum(['nunca', 'sempre']).optional().describe('Uso do painel: se a Mesa deve voltar a perguntar sobre conectar os dados de mercado'),
          marca: z.object({
            tema: z.enum(['escuro', 'claro', 'marinho']).optional(),
            estilo: z.enum(['serifada', 'moderna']).optional(),
            cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Cor de destaque do escritório'),
            logo: z.string().max(400).optional().describe('Caminho completo do arquivo do logo (PNG, JPG, WEBP ou SVG)'),
            foto: z.string().max(400).optional().describe('Caminho completo da foto do assessor'),
            rodape: z.string().max(260).optional().describe('Identificação e aviso de compliance usados no pé das apresentações'),
          }).optional().describe('Kit de marca usado nas apresentações em PDF; os campos enviados são somados aos que já existem'),
        }).optional(),
        registrar: z.string().max(80).optional().describe('Nome da tarefa que acabou de ser entregue'),
        tarefas: z.string().max(60000).nullable().optional().describe('Uso do painel: tarefas criadas pelo assessor (JSON)'),
        ajustes: z.string().max(60000).nullable().optional().describe('Uso do painel: ajustes pessoais de tarefas e skills (JSON)'),
        rascunho: z.string().max(80000).nullable().optional().describe('Uso do painel: guarda (texto) ou apaga (null) onde o assessor parou, para ele voltar do mesmo ponto'),
        modelo: z.object({ tarefa: z.string().regex(/^[a-z0-9-]{1,40}$/), texto: z.string().max(8000).nullable() }).optional()
          .describe('Uso do painel: guarda (texto) ou apaga (null) o modelo de pedido do assessor para uma tarefa'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      _meta: { ui: { visibility: ['model', 'app'] } },
    },
    async ({ salvar, registrar, modelo, rascunho, tarefas, ajustes }) => {
      const p = lerPerfil();
      if (!p.modelos || typeof p.modelos !== 'object') p.modelos = {};
      if (typeof p.rascunho === 'string') { try { if (Date.now() - (JSON.parse(p.rascunho).em || 0) > 14 * 864e5) { p.rascunho = null; gravarPerfil(p); } } catch { p.rascunho = null; } }
      const marcaAntes = p.marca || {};
      if (salvar) Object.assign(p, Object.fromEntries(Object.entries(salvar).filter(([, v]) => v !== undefined)));
      if (salvar?.marca) p.marca = { ...marcaAntes, ...salvar.marca };
      if (registrar) p.historico = [{ tarefa: registrar, em: new Date().toISOString() }, ...p.historico].slice(0, 10);
      if (modelo) { if (modelo.texto === null) delete p.modelos[modelo.tarefa]; else p.modelos[modelo.tarefa] = modelo.texto; }
      if (rascunho !== undefined) p.rascunho = rascunho;
      if (tarefas !== undefined) p.tarefas = tarefas;
      if (ajustes !== undefined) p.ajustes = ajustes;
      if (salvar || registrar || modelo || rascunho !== undefined || tarefas !== undefined || ajustes !== undefined) gravarPerfil(p);
      const configurado = !!(p.nome || p.atuacao);
      const captamais = await estadoCaptaMais();
      const { modelos: _modelos, rascunho: _rascunho, tarefas: _tarefas, ajustes: _ajustes, ...paraOClaude } = p;
      return { content: [{ type: 'text', text: JSON.stringify({ configurado, ...paraOClaude, captamais }) }], structuredContent: { configurado, perfil: p, captamais } };
    },
  );

  registerAppTool(
    server,
    'mesa_registrar',
    {
      title: 'Registrar uso da Mesa',
      description: 'Uso do painel da Mesa (o Claude não precisa chamar). Registra a abertura do painel e o envio de uma tarefa.',
      inputSchema: {
        evento: z.enum(['painel_aberto', 'tarefa_enviada', 'prompt_copiado', 'conversa_continuada']),
        tarefa: z.string().max(60).optional(),
        area: z.string().max(40).optional(),
        respostas: z.array(z.string().max(60)).max(8).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      _meta: { ui: { visibility: ['model', 'app'] } },
    },
    async ({ evento, tarefa, area, respostas }) => {
      if (evento === 'tarefa_enviada' && tarefa) {
        try { writeFileSync(ARQUIVO_TAREFA, JSON.stringify({ tarefa, area: area ?? null, em: Date.now() })); } catch {   }
      }
      enviarEvento(evento, { tarefa, area, respostas });
      return { content: [{ type: 'text', text: 'ok' }] };
    },
  );

  registerAppTool(
    server,
    'mesa_conectar',
    {
      title: 'Entrar no CaptaMais',
      description:
        'Uso do painel da Mesa (o Claude não precisa chamar). "iniciar" pede um código ao CaptaMais para o assessor autorizar em Minha Conta; ' +
        '"verificar" confere se ele já autorizou e guarda a conexão neste computador; "sair" desliga a conexão daqui.',
      inputSchema: {
        acao: z.enum(['iniciar', 'verificar', 'sair', 'guardar']),
        chave: z.string().regex(/^ctm_mk_[a-f0-9]{48}$/).optional(), nome: z.string().max(60).optional(), plano: z.string().max(20).optional(),
        segredo: z.string().max(100).optional().describe('Uso interno da janela da Mesa'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      _meta: { ui: { visibility: ['model', 'app'] } },
    },
    async ({ acao, chave, nome, plano, segredo }) => {
      const resposta = (o) => ({ content: [{ type: 'text', text: JSON.stringify(o) }], structuredContent: o });
      try {
        if (acao === 'sair') {
          for (const a of [ARQUIVO_CONEXAO, ARQUIVO_PAREAMENTO]) { try { rmSync(a, { force: true }); } catch {   } }
          esquecerConexao();
          return resposta({ status: 'desconectado', manual: !!CHAVE_MANUAL });
        }
        if (acao === 'guardar') {
          const esperado = process.env.MESA_SEGREDO_LOCAL || '';
          const igual = esperado.length >= 32 && typeof segredo === 'string' && segredo.length === esperado.length && crypto.timingSafeEqual(Buffer.from(segredo), Buffer.from(esperado));
          if (!igual || !chave) return resposta({ status: 'erro', mensagem: 'Não autorizado.' });
          gravarSeguro(ARQUIVO_CONEXAO, { chave: proteger(chave), nome: String(nome || '').slice(0, 60), plano: String(plano || '').slice(0, 20), em: new Date().toISOString() });
          rmSync(ARQUIVO_PAREAMENTO, { force: true });
          esquecerConexao();
          return resposta({ status: 'conectado', nome: nome || '', plano: plano || '' });
        }
        if (!urlSegura(CAPTAMAIS_URL)) return resposta({ status: 'erro', mensagem: 'Não foi possível conectar ao CaptaMais agora.' });
        if (acao === 'iniciar') {
          const { status, json } = await pareamentoPost('/api/mcp/pair/start', { device: 'Mesa do Assessor' });
          if (status !== 200 || !json?.success) return resposta({ status: 'erro', mensagem: String(json?.message || 'Não consegui iniciar a conexão agora. Tente de novo.') });
          gravarSeguro(ARQUIVO_PAREAMENTO, { code: json.code, segredo: proteger(json.deviceSecret), expira: Date.now() + (json.expiresInSec || 600) * 1000 });
          return resposta({ status: 'aguardando', codigo: json.code, expiraEm: Date.now() + (json.expiresInSec || 600) * 1000, intervalo: json.intervalSec || 3, conta: `${CAPTAMAIS_URL}/my-account?mesa=${encodeURIComponent(json.code)}`, cadastro: `${CAPTAMAIS_URL}/register?mesa=${encodeURIComponent(json.code)}` });
        }
        const p = lerJson(ARQUIVO_PAREAMENTO);
        if (!p) return resposta({ status: 'nenhum' });
        if (Date.now() > p.expira) { rmSync(ARQUIVO_PAREAMENTO, { force: true }); return resposta({ status: 'vencido' }); }
        const { status, json } = await pareamentoPost('/api/mcp/pair/poll', { code: p.code, deviceSecret: revelar(p.segredo) });
        if (status === 429) return resposta({ status: 'aguardando' });
        if (json?.status === 'pending') return resposta({ status: 'aguardando' });
        if (json?.status === 'approved' && json.apiKey) {
          gravarSeguro(ARQUIVO_CONEXAO, { chave: proteger(json.apiKey), nome: json.name || '', plano: json.plan || '', em: new Date().toISOString() });
          rmSync(ARQUIVO_PAREAMENTO, { force: true });
          esquecerConexao();
          return resposta({ status: 'conectado', nome: json.name || '', plano: json.plan || '' });
        }
        if (['expired', 'claimed', 'invalid'].includes(json?.status) || status === 404) { rmSync(ARQUIVO_PAREAMENTO, { force: true }); return resposta({ status: 'vencido' }); }
        return resposta({ status: 'aguardando' });
      } catch (e) {
        return resposta({ status: 'erro', mensagem: `Não consegui falar com o CaptaMais: ${e?.message ?? e}` });
      }
    },
  );

  server.registerTool(
    'mesa_carrossel',
    {
      title: 'Gerar imagens do carrossel ou da arte',
      description:
        'Gera as imagens prontas para postar (PNG) e um PDF com todos os slides, a partir do texto que você escreveu. Use para carrossel (3 a 10 slides) ou para uma arte única (1 slide) de Instagram. ' +
        'Slides curtos: título de até 12 palavras, texto de até 2 linhas, "destaque" só para um número grande (ex.: "10,75%"), "fonte" com órgão e data quando houver dado de mercado. ' +
        'Capa no primeiro slide e fechamento com chamada no último. O rodapé leva a identificação do profissional conforme a atuação dele e o aviso "conteúdo educativo, não é recomendação". ' +
        'Depois de gerar, chame mesa_andamento com concluido=true e entrega.arquivo = o caminho do PDF devolvido, e diga ao assessor onde ficou a pasta com as imagens.',
      inputSchema: {
        titulo: z.string().min(2).max(120).describe('Nome da peça (vira o nome da pasta)'),
        formato: z.enum(['feed', 'quadrado', 'stories']).optional().describe('feed 1080x1350 (padrão), quadrado 1080x1080, stories 1080x1920'),
        tema: z.enum(['escuro', 'claro']).optional().describe('Fundo escuro (padrão) ou claro'),
        cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Cor de destaque em hexadecimal, ex.: #E8C88E'),
        rodape: z.string().max(240).describe('Identificação do profissional e aviso, em uma linha'),
        slides: z.array(z.object({
          tipo: z.enum(['capa', 'conteudo', 'fechamento']).optional(),
          titulo: z.string().min(1).max(140),
          texto: z.string().max(420).optional(),
          destaque: z.string().max(24).optional(),
          fonte: z.string().max(140).optional(),
        })).min(1).max(10),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async (args) => {
      try {
        const r = await gerarCarrossel(args);
        return { content: [{ type: 'text', text: JSON.stringify({ ok: true, pasta: r.pasta, imagens: r.imagens.map((x) => path.basename(x)), pdf: r.pdf }) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: `Não consegui gerar as imagens: ${e?.message ?? e}. Entregue o texto dos slides no chat.` }] };
      }
    },
  );

  server.registerTool(
    'mesa_apresentacao',
    {
      title: 'Gerar apresentação em PDF',
      description:
        'Gera uma apresentação em PDF (16:9) com a marca do assessor (logo, foto, cores e fonte guardadas no perfil), montada em layouts prontos. Use para apresentação de reunião (quem sou, escritório, soluções) e material de reunião. ' +
        'Você escreve o conteúdo; o visual é dos layouts: capa (titulo, subtitulo) · perfil (titulo + itens {rotulo, texto}, até 5) · numeros (titulo + itens {valor, rotulo, fonte}, até 4, só número informado com fonte e data) · pilares (titulo + itens {titulo, texto}, 2 a 4) · etapas (titulo + itens {titulo, texto}, 2 a 4) · ' +
        'agenda (titulo + itens {titulo, texto}: o roteiro da conversa) · secao (divisor de capítulo: etiqueta com o número, titulo, subtitulo) · templo (titulo + itens {titulo, texto}, 2 a 4: pilares de valores sustentando o escritório, subtitulo = nome no frontão) · ilustracao (titulo, subtitulo, ilustracao: ' + NOMES_ILUSTRACAO.join(', ') + ') · ' +
        'diagrama (titulo + itens {titulo, texto, icone, ligacao}, modelo "fluxo" com 2 a 5 nós ligados por seta, ou "hub" com o primeiro item no centro e até 6 ao redor) · imagem (titulo, subtitulo, imagem do assessor, modelo "metade" ou "cheia") · ' +
        'ícones da biblioteca (use em itens de pilares, etapas, lista e diagrama): ' + NOMES_ICONE.join(', ') + '; o assessor também pode usar a própria imagem, citando o nome do arquivo guardado na pasta "Minhas imagens" · ' +
        'tabela (titulo, cabecalho[], linhas[][]) · barras (titulo + itens {rotulo, valor em %, valor2 opcional}, legenda[] se houver valor2) · ' +
        'rosca (titulo + itens {rotulo, valor, texto opcional}, 2 a 8: composição, ex.: classes da carteira em % ou em R$; as fatias saem dos valores enviados) · ' +
        'linha (titulo + rotulos[] + series [{nome, valores[]}], até 3 séries: histórico em base 100 feito pelo código; com retornos=true os valores são o retorno % de cada período e inicio é o rótulo do ponto de partida; sem retornos, níveis como cota ou preço) · ' +
        'comparativo (titulo + legenda [A, B] + itens {rotulo, valor, valor2, texto opcional}, até 7: A × B com a diferença calculada no meio; se o valor não for número, a diferença mostra o texto) · frase (titulo como frase-conclusão) · lista (titulo + itens {titulo, texto}, até 6) · galeria (titulo, subtitulo opcional, itens {titulo, texto, imagem, icone}, 2 a 3 colunas com a foto do assessor ou de pessoas em moldura em arco; sem imagem, usa o ícone) · fechamento (titulo, passos[], contato[]). ' +
        'Regras: um título-conclusão por página, textos curtos, sem emoji, sem dado inventado; use só os layouts que o assunto pede e varie-os (não repita o mesmo em páginas seguidas). Nome, escritório, logo e foto vêm do perfil (mesa_perfil, campo marca); se faltarem, a página sai sem eles. ' +
        'cliente (apelido ou iniciais, nunca CPF, conta ou valor) vai na capa e no rodapé. tipo: reuniao (padrão) ou, em material de mercado, estudo ou mercado: aí a trava de palavras só barra promessa, risco zero e superlativo, e rentabilidade ou retorno precisa do período na mesma página (ex.: "em 12 meses até out/2026"); a linha de fonte não passa pela trava. ' +
        'O rodapé leva a identificação do profissional e o aviso de compliance. Depois de gerar, chame mesa_andamento com concluido=true e entrega.arquivo = o caminho do PDF, e diga onde o arquivo ficou. Se vier "avisos", conte ao assessor.',
      inputSchema: {
        titulo: z.string().min(2).max(120).describe('Nome da peça (vira o nome da pasta)'),
        tema: z.enum(['escuro', 'claro', 'marinho']).optional().describe('Padrão: o do perfil, ou escuro'),
        cliente: z.string().max(60).optional().describe('Nome curto do cliente na capa e no rodapé: apelido ou iniciais'),
        tipo: z.enum(['reuniao', 'carteira', 'relatorio', 'proposta', 'diagnostico', 'estudo', 'mercado', 'geral']).optional().describe('reuniao (padrão): trava de palavras completa; estudo ou mercado: lista menor, para material de mercado'),
        estilo: z.enum(['serifada', 'moderna', 'minimo']).optional().describe('serifada e moderna: visual private, com cartões, degradês e molduras (padrão: serifada); minimo: o visual enxuto antigo'),
        cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Cor de destaque; padrão: a do perfil ou a do tema'),
        rodape: z.string().max(260).optional().describe('Identificação do profissional e aviso, em uma linha, em todas as páginas'),
        termosConfirmados: z.array(z.string().max(40)).max(8).optional().describe('Só quando o assessor afirmou de fato algo que a trava de compliance bloqueou (ex.: "independência"); nunca por conta própria'),
        previas: z.boolean().optional().describe('true também gera uma imagem PNG por página (para conferir o visual)'),
        slides: z.array(z.object({
          layout: z.enum(NOMES_LAYOUT),
          etiqueta: z.string().max(40).optional().describe('Rótulo pequeno acima do título, ex.: "Quem sou"'),
          titulo: z.string().min(1).max(160),
          subtitulo: z.string().max(300).optional(),
          texto: z.string().max(300).optional(),
          ponte: z.string().max(170).optional().describe('Frase curta no pé da página que liga esta página à próxima (ex.: "Com isso claro, vamos ver como eu trabalho")'),
          ilustracao: z.enum(NOMES_ILUSTRACAO).optional().describe('Ilustração em traço: nos layouts ilustracao e imagem (quando o assessor não tem foto)'),
          modelo: z.enum(['fluxo', 'hub', 'metade', 'cheia']).optional().describe('diagrama: fluxo (padrão) ou hub; imagem: metade (padrão) ou cheia'),
          imagem: z.string().max(400).optional().describe('layout imagem: caminho de uma imagem do assessor ou só o nome do arquivo guardado na pasta "Minhas imagens"'),
          itens: z.array(z.object({
            imagem: z.string().max(400).optional().describe('layout galeria: imagem do assessor (nome do arquivo em "Minhas imagens" ou caminho)'),
            icone: z.string().max(400).optional().describe('Nome de um ícone da biblioteca ou imagem do assessor (caminho ou nome do arquivo em "Minhas imagens")'),
            ligacao: z.string().max(40).optional().describe('diagrama fluxo: texto curto da seta que sai deste item'),
            rotulo: z.string().max(80).optional(), titulo: z.string().max(90).optional(), texto: z.string().max(260).optional(),
            valor: z.union([z.string().max(24), z.number()]).optional(), valor2: z.union([z.string().max(24), z.number()]).optional().describe('barras: segundo valor em %; comparativo: o valor da coluna B'), fonte: z.string().max(100).optional(),
          })).max(8).optional(),
          cabecalho: z.array(z.string().max(60)).max(5).optional(),
          linhas: z.array(z.array(z.string().max(120)).max(5)).max(8).optional(),
          legenda: z.array(z.string().max(40)).max(2).optional(),
          rotulos: z.array(z.string().max(24)).max(24).optional().describe('linha: um rótulo por ponto, ex.: meses'),
          series: z.array(z.object({ nome: z.string().max(40), valores: z.array(z.number()).max(24) })).max(3).optional().describe('linha: até 3 séries, um valor por rótulo'),
          retornos: z.boolean().optional().describe('linha: true quando os valores são o retorno % de cada período'),
          inicio: z.string().max(20).optional().describe('linha com retornos: rótulo do ponto de partida (base 100), ex.: "dez/25"'),
          passos: z.array(z.string().max(140)).max(5).optional(),
          contato: z.array(z.string().max(120)).max(5).optional(),
          fonte: z.string().max(160).optional(),
        })).min(1).max(18),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async (args) => {
      try {
        const p = lerPerfil();
        const r = await gerarApresentacao(args, { ...(p.marca || {}), nome: p.nome, escritorio: p.escritorio, cargo: p.atuacao });
        return { content: [{ type: 'text', text: JSON.stringify({ ok: true, pasta: r.pasta, pdf: r.pdf, imagens: r.imagens, avisos: r.avisos, minhasImagens: r.minhasImagens }) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: `Não consegui gerar a apresentação: ${e?.message ?? e}. Entregue o texto dos slides no chat.` }] };
      }
    },
  );

  server.registerTool(
    'mesa_documento',
    {
      title: 'Gerar documento em PDF',
      description:
        'Gera um PDF (A4) com o texto final que você escreveu, em seções. Use quando o assessor pedir o resultado em PDF. ' +
        'O texto de cada seção aceita parágrafos, listas com "- ", listas numeradas com "1. ", títulos com "## ", **negrito** e tabelas em linhas "| a | b |" (primeira linha é o cabeçalho; coluna de números sai alinhada à direita; linha que começa com "Total" sai destacada). ' +
        'cliente (apelido ou iniciais, nunca CPF, conta ou valor) e dataBase vão no cabeçalho: "Preparado para M. · Data-base 31/10/2026". capa=true abre com uma capa (título, cliente, logo e foto do perfil): use em Proposta e Estudo. ' +
        'destaques: até 4 cartões no topo com número grande, rótulo e nota, só com números que estão no texto. grafico em uma seção (barras, barras-duplas, rosca ou linha, com rotulos e series): o código desenha o gráfico e, embaixo, a tabela com os mesmos números (diferença e total feitos pelo código), então não repita essa tabela no texto. ' +
        'tipo escolhe o aviso do fim (carteira, relatorio, proposta, diagnostico, estudo, mercado ou geral); o rodapé de toda página já leva o aviso curto e o número da página. ' +
        'Dado de mercado leva fonte e data no próprio texto. Depois de gerar, chame mesa_andamento com concluido=true e entrega.arquivo = o caminho devolvido, e diga ao assessor onde o arquivo ficou.',
      inputSchema: {
        titulo: z.string().min(2).max(120),
        subtitulo: z.string().max(200).optional().describe('Ex.: ativo e data-base'),
        cliente: z.string().max(60).optional().describe('Para quem é o material: apelido ou iniciais, ex.: "M." ou "Família T."'),
        dataBase: z.string().max(40).optional().describe('Data-base dos números, ex.: 31/10/2026'),
        capa: z.boolean().optional().describe('true: página de capa (Proposta e Estudo)'),
        tipo: z.enum(['reuniao', 'carteira', 'relatorio', 'proposta', 'diagnostico', 'estudo', 'mercado', 'geral']).optional().describe('Decide o texto do aviso no fim do documento'),
        tema: z.enum(['marinho', 'escuro', 'claro']).optional().describe('Cores da folha, sempre em fundo branco: marinho (padrão), escuro (grafite) ou claro (bege)'),
        destaques: z.array(z.object({ rotulo: z.string().max(40), valor: z.string().max(30), nota: z.string().max(80).optional() })).max(4).optional().describe('Até 4 números em destaque no topo, ex.: {rotulo: "Renda fixa pós", valor: "70% → 40%", nota: "atual → modelo"}'),
        secoes: z.array(z.object({
          titulo: z.string().max(120).optional(),
          texto: z.string().max(8000).optional(),
          grafico: z.object({
            tipo: z.enum(['barras', 'barras-duplas', 'rosca', 'linha']),
            titulo: z.string().max(100).optional(),
            rotulos: z.array(z.string().max(60)).min(1).max(24),
            series: z.array(z.object({ nome: z.string().max(40), valores: z.array(z.number()).max(24) })).min(1).max(3).describe('barras e rosca: 1 série; barras-duplas: 2 (A e B); linha: até 3'),
            unidade: z.string().max(6).optional().describe('%, R$, US$ ou vazio'),
            casas: z.number().int().min(0).max(4).optional(),
            retornos: z.boolean().optional().describe('linha: valores são o retorno % de cada período; o código compõe a base 100'),
            base100: z.boolean().optional().describe('linha: valores são níveis (cota, preço); o código põe em base 100'),
            inicio: z.string().max(20).optional().describe('linha com retornos: rótulo do ponto de partida'),
            categoria: z.string().max(30).optional().describe('Nome da primeira coluna da tabela'),
            total: z.boolean().optional().describe('barras: linha de total na tabela (a rosca já soma)'),
            tabela: z.boolean().optional().describe('false: só o gráfico, sem a tabela'),
            fonte: z.string().max(160).optional(),
          }).optional().describe('Gráfico desenhado pelo código a partir destes números, com a tabela dos mesmos números embaixo'),
        })).min(1).max(30),
        rodape: z.string().max(400).optional().describe('Identificação do profissional e avisos, quando a peça for para o público'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async (args) => {
      try {
        const p = lerPerfil();
        const r = await gerarDocumento(args, { ...(p.marca || {}), nome: p.nome, escritorio: p.escritorio });
        return { content: [{ type: 'text', text: JSON.stringify({ ok: true, pdf: r.pdf }) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: `Não consegui gerar o PDF: ${e?.message ?? e}. Entregue o texto no chat.` }] };
      }
    },
  );

  server.registerTool(
    'consultar_cofre',
    {
      title: 'Consultar o cofre do assessor',
      description:
        'Busca no segundo cérebro do assessor (notas sobre prospecção, SPIN, cold call, relacionamento, legislação CVM e técnico) ' +
        'e devolve os trechos mais ligados ao tema, com o nome da nota. Use antes de montar roteiro de venda, resposta a objeção, ' +
        'texto de relacionamento ou ponto de regulação, e cite a nota usada. Os volumes do CFA só entram se o tema citar "cfa".',
      inputSchema: {
        tema: z.string().min(3).max(200).describe('Palavras do assunto, ex.: "objeção preço SPIN" ou "legislação consultoria CVM"'),
        limite: z.number().int().min(1).max(5).optional().describe('Quantas notas devolver (padrão 3)'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ tema, limite }) => {
      const SEM_COFRE = { content: [{ type: 'text', text: 'SEM_COFRE: o cofre de conhecimento não está disponível agora. Siga com o método geral (SPIN, IPQF, cadência) sem citar notas e sem mencionar o cofre ao assessor.' }] };
      let achados;
      if (existsSync(PASTA_COFRE)) {
        achados = buscarNoCofre(tema, limite ?? 3);
      } else {
        const CHAVE = chaveAtual();
        if (!CHAVE || !urlSegura(CAPTAMAIS_URL)) return SEM_COFRE;
        try {
          const res = await fetch(`${CAPTAMAIS_URL}/api/mcp/cofre/search`, {
            method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
            headers: { 'Content-Type': 'application/json', 'x-captamais-market-key': CHAVE, 'x-captamais-client': 'mesa-do-assessor/1.0.0' },
            body: JSON.stringify({ tema, limite: limite ?? 3 }),
          });
          const j = await res.json().catch(() => ({}));
          if (!res.ok || !j?.disponivel) return SEM_COFRE;
          achados = Array.isArray(j.achados) ? j.achados : [];
        } catch { return SEM_COFRE; }
      }
      if (!achados.length) return { content: [{ type: 'text', text: `Nada no cofre sobre "${tema}". Diga ao assessor e siga só com o que ele enviou.` }] };
      if (existsSync(PASTA_COFRE)) enviarEvento('cofre_consultado', { quantidade: achados.length });
      return { content: [{ type: 'text', text: JSON.stringify(achados) }] };
    },
  );

  server.registerTool(
    'analise_ativo',
    {
      title: 'Análise de ativo (CaptaMais)',
      description:
        'Busca na conta CaptaMais do assessor os dados da Análise de Ativo (histórico e rentabilidade mensal, comparação com índice) ' +
        'de uma ação, FII, ETF ou fundo. Use para estudos e apresentações. Se a conta não estiver conectada, avise o assessor e peça os dados por colagem. ' +
        'Índice de comparação: use tipo=indice e o código (CDI, IPCA, IBOV, IFIX, SMLL, IDIV, SP500-BRL, dólar), na mesma janela do ativo. Com pesquisa=true, para ações e FIIs, traz também preço-alvo e recomendação das casas de research, múltiplos e indicadores, números dos relatórios, resumo por IA, últimos relatórios, balanços trimestrais e a lista de arquivos da CVM.',
      inputSchema: {
        ticker: z.string().max(40).optional().describe('Ticker, ex.: PETR4, HGLG11, IVVB11'),
        tipo: z.enum(['acoes', 'fii', 'etf', 'fundo', 'indice']).optional(),
        nome: z.string().max(120).optional().describe('Nome do fundo, quando não houver ticker'),
        cnpj: z.string().max(20).optional().describe('CNPJ do fundo'),
        pesquisa: z.boolean().optional().describe('true, para ações e FIIs: inclui a pesquisa das casas, múltiplos, relatórios e balanços'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ ticker, tipo, nome, cnpj, pesquisa }) => {
      if (!ticker && !nome && !cnpj) return { isError: true, content: [{ type: 'text', text: 'Informe ticker, nome do fundo ou CNPJ.' }] };
      const CHAVE = chaveAtual();
      if (!CHAVE) {
        return { content: [{ type: 'text', text: 'SEM_CONEXAO: o assessor ainda não conectou o CaptaMais. Não trave a tarefa: diga em uma frase que clicando em Entrar no CaptaMais (canto direito da Mesa) os dados do ativo vêm direto da Análise de Ativo, e siga agora pedindo que ele cole os dados da tela Análise de Ativo (ou um print). Marque como "fonte: informado pelo assessor" tudo que ele colar e não complete número de memória.' }] };
      }
      if (!urlSegura(CAPTAMAIS_URL)) {
        return { isError: true, content: [{ type: 'text', text: 'Não foi possível conectar ao CaptaMais agora. Siga com os dados que o assessor colar.' }] };
      }
      try {
        const res = await fetch(`${CAPTAMAIS_URL}/api/mcp/asset/analysis`, {
          method: 'POST',
          redirect: 'error', signal: AbortSignal.timeout(20000),
          headers: { 'Content-Type': 'application/json', 'x-captamais-market-key': CHAVE, 'x-captamais-client': 'mesa-do-assessor/1.0.0' },
          body: JSON.stringify({ ticker, tipo, nome, cnpj, pesquisa: pesquisa === true }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 404) return { content: [{ type: 'text', text: 'Esta versão do CaptaMais ainda não oferece a análise de ativo pelo conector. Peça ao assessor os dados da tela Análise de Ativo (colagem ou print) e siga com eles.' }] };
        if (res.status === 401) return { content: [{ type: 'text', text: 'SEM_CONEXAO: a conexão com o CaptaMais expirou. Peça ao assessor para clicar em Reconectar CaptaMais (canto direito da Mesa); enquanto isso, siga com os dados que ele colar.' }] };
        if (res.status === 429) return { content: [{ type: 'text', text: `LIMITE: ${String(json?.message || 'Muitas consultas em pouco tempo.')} Não repita a consulta agora: diga ao assessor em uma frase que a consulta de ativos pausou por alguns instantes e siga com os dados que ele colar.` }] };
        if (res.status === 403) return { content: [{ type: 'text', text: `SEM_ANALISE: a Análise de Ativo não está disponível para esta conta agora. Diga isso ao assessor em uma frase e siga com os dados que ele colar.` }] };
        if (!res.ok || json?.success === false) return { isError: true, content: [{ type: 'text', text: String(json?.message || `Falha no CaptaMais (HTTP ${res.status}).`) }] };
        return { content: [{ type: 'text', text: JSON.stringify(json.data ?? json) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: `Não consegui falar com o CaptaMais: ${e?.message ?? e}` }] };
      }
    },
  );

  server.registerTool(
    'painel_macro',
    {
      title: 'Painel de juros, inflação e câmbio (Banco Central e IBGE)',
      description:
        'Consulta as fontes oficiais direto, por código, e devolve num pacote só: indicadores (Selic, CDI ao ano e no mês, IPCA do mês e em 12 meses, meta de inflação, IGP-M, dólar, euro, poupança e desemprego, ' +
        'cada um com o código da série, valor, unidade, data e as variações já calculadas no dia, no mês, no ano e contra a referência escolhida), juroReal (Selic contra o IPCA de 12 meses e contra o IPCA esperado, com a conta), ' +
        'copom (as duas últimas reuniões: data, decisão, placar, texto do comunicado e link da ata), focus (medianas da data mais recente e de 4 semanas antes, deste ano e do próximo), ' +
        'agenda (divulgações do IBGE nos próximos 30 dias) e lacunas (o que não respondeu, com o motivo). Chame antes de qualquer busca sobre juros, inflação ou câmbio. ' +
        'Use as variações como vieram, sem refazer as contas; o que estiver em lacunas fica marcado, sem estimar.',
      inputSchema: {
        recorte: z.enum(Object.keys(RECORTES)).optional().describe('Padrão: Painel completo'),
        comparar: z.enum(REFERENCIAS).optional().describe('Referência da coluna Antes. Padrão: Mês passado'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ recorte, comparar }) => {
      try {
        const painel = await painelMacro({ recorte, comparar });
        return { content: [{ type: 'text', text: JSON.stringify(painel) }], structuredContent: painel };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: `Não consegui montar o painel agora: ${e?.message ?? e}. Busque as séries oficiais uma a uma (api.bcb.gov.br, SGS) e marque o que não achar, sem estimar.` }] };
      }
    },
  );

  server.registerTool(
    'documentos_cvm',
    {
      title: 'Documentos das companhias abertas (CVM)',
      description:
        'Lista fatos relevantes e comunicados ao mercado de uma companhia aberta pela base aberta da CVM (dados.cvm.gov.br): data de entrega, categoria, assunto, protocolo e link oficial, do mais recente para o mais antigo. ' +
        'Com protocolo, baixa o PDF do documento para a pasta Mesa do Assessor/Fontes e devolve o caminho do arquivo; se você não conseguir ler o PDF, diga isso ao assessor e peça o texto colado, sem resumir por notícia. ' +
        'A base da CVM é atualizada uma vez por semana: o campo aviso diz até que dia ela vai, e documento entregue depois disso não aparece; nesse caso peça ao assessor o texto, o link ou o PDF. ' +
        'Empresa: nome da companhia ou CNPJ (a analise_ativo devolve o cnpj pelo ticker). Se o nome servir para mais de uma companhia, a resposta traz as candidatas: chame de novo com o CNPJ.',
      inputSchema: {
        empresa: z.string().max(120).optional().describe('Nome da companhia ou CNPJ, ex.: Petrobras ou 33.000.167/0001-01'),
        tipos: z.array(z.string().max(60)).max(6).optional().describe('Categorias da CVM. Padrão: Fato Relevante e Comunicado ao Mercado. Outras: Aviso aos Acionistas, Assembleia, Calendário de Eventos Corporativos'),
        quantidade: z.number().int().min(1).max(20).optional().describe('Quantos documentos, do mais recente para o mais antigo. Padrão: 5'),
        protocolo: z.string().max(20).optional().describe('Protocolo de um documento da lista: baixa o PDF e devolve o caminho do arquivo'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ empresa, tipos, quantidade, protocolo }) => {
      if (!empresa && !protocolo) return { isError: true, content: [{ type: 'text', text: 'Informe o nome ou o CNPJ da companhia, ou o protocolo de um documento.' }] };
      try {
        const r = await documentosCvm({ empresa, tipos, quantidade, protocolo });
        return { content: [{ type: 'text', text: JSON.stringify(r) }], structuredContent: r };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: `Não consegui consultar a CVM agora: ${e?.message ?? e}. Peça ao assessor o texto, o link ou o PDF do comunicado.` }] };
      }
    },
  );

  server.registerTool(
    'taxas_tesouro',
    {
      title: 'Taxas e preços do Tesouro Direto (Tesouro Transparente)',
      description:
        'Lê o arquivo oficial de preços e taxas do Tesouro Direto (Tesouro Transparente, guardado no dia) e devolve a última data base. ' +
        'Para um título: taxa de compra e de venda já com o indexador escrito (taxaCompraTexto, por exemplo "IPCA + 7,76% ao ano"), preço (PU), forma de pagamento, dias até o vencimento ' +
        'e, em parecidos, o título de vencimento mais perto de cada tipo: a referência do "título público de prazo parecido" para comparar CDB, LCI, LCA, debênture ou fundo na mesma base. ' +
        'Aceita o nome do site ("Tesouro IPCA+ 2035", "Prefixado 2029", "Renda+ 2030", "Educa+ 2027") e os antigos (LTN, LFT, NTN-B, NTN-B Principal, NTN-F). ' +
        'No Renda+ e no Educa+ o ano do nome é o início da renda mensal, não o vencimento. Sem título e com vencimento: os títulos de prazo parecido com essa data. Sem nada: a lista do dia. ' +
        'Cite a fonte e a data base que vierem na resposta. O arquivo não diz se o título está à venda hoje: não diga que está disponível para compra.',
      inputSchema: {
        titulo: z.string().max(120).optional().describe('Nome do título, ex.: Tesouro IPCA+ 2035, Prefixado 2029, Renda+ 2030, NTN-B 2045'),
        vencimento: z.string().max(20).optional().describe('Data de vencimento DD/MM/AAAA. Com título, escolhe entre títulos do mesmo tipo; sem título, é o prazo do produto a comparar'),
        indexador: z.enum(['prefixado', 'ipca', 'selic', 'igpm']).optional().describe('Restringe os títulos parecidos e a lista a um indexador'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ titulo, vencimento, indexador }) => {
      try {
        const r = await taxasTesouro({ titulo, vencimento, indexador }, { pastaCache: path.join(PASTA_PERFIL, 'cache') });
        return { content: [{ type: 'text', text: JSON.stringify(r) }], structuredContent: r };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: `Não consegui ler o arquivo do Tesouro agora: ${e?.message ?? e}. Marque o título público de prazo parecido como sem dado, sem estimar.` }] };
      }
    },
  );

  server.registerTool(
    'landing_captamais',
    {
      title: 'Landing page no CaptaMais (rascunho)',
      description:
        'Cria a landing page de captação na conta CaptaMais do assessor, como RASCUNHO. Nunca publica e nunca altera uma página que já exista (cada conta tem uma). ' +
        'A página fica em captamais.me/landingpage/<slug> depois que o assessor revisar e publicar na tela Landing Page. Use só com a skill landing-page-captacao e depois de mostrar o texto ao assessor.',
      inputSchema: {
        slug: z.string().min(3).max(48).describe('Link da página: 3 a 48 caracteres, letras minúsculas, números e hífen'),
        conteudo: z.record(z.string(), z.any()).describe('Campos da landing nos nomes do CaptaMais: template (diagnostico, direto, confianca ou autoridade), headline, publicName, bio, productTitle, productDescription, differentiators, ctaTitle, whatsapp, instagramUrl, leadFields, wealthOptions, tagline, badges, stats, audiences, steps, formTitle, formIntro etc.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ slug, conteudo }) => {
      const CHAVE = chaveAtual();
      if (!CHAVE) {
        return { content: [{ type: 'text', text: 'SEM_CONEXAO: o assessor ainda não conectou o CaptaMais, então não dá para gravar a página. Diga em uma frase que clicando em Entrar no CaptaMais (canto direito da Mesa) o rascunho passa a ser criado direto, e entregue o texto da página pronto para ele colar na tela Landing Page.' }] };
      }
      if (!urlSegura(CAPTAMAIS_URL)) {
        return { isError: true, content: [{ type: 'text', text: 'Não foi possível conectar ao CaptaMais agora. Entregue o texto da página pronto para colar.' }] };
      }
      try {
        const res = await fetch(`${CAPTAMAIS_URL}/api/mcp/landing/rascunho`, {
          method: 'POST',
          redirect: 'error', signal: AbortSignal.timeout(20000),
          headers: { 'Content-Type': 'application/json', 'x-captamais-market-key': CHAVE, 'x-captamais-client': 'mesa-do-assessor/1.0.0' },
          body: JSON.stringify({ slug, content: conteudo }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 404) return { content: [{ type: 'text', text: 'ROTA_INDISPONIVEL: esta versão do CaptaMais ainda não cria a landing pelo conector. Entregue o texto da página pronto para o assessor colar na tela Landing Page.' }] };
        if (res.status === 401) return { content: [{ type: 'text', text: 'SEM_CONEXAO: a conexão com o CaptaMais expirou. Peça ao assessor para clicar em Reconectar CaptaMais (canto direito da Mesa) e entregue o texto pronto para colar.' }] };
        if (res.status === 429) return { content: [{ type: 'text', text: 'LIMITE: muitas consultas em pouco tempo. Não repita agora: entregue o texto pronto para colar.' }] };
        if (res.status === 409) return { content: [{ type: 'text', text: `${json?.code === 'slug_em_uso' ? 'SLUG_EM_USO' : 'JA_EXISTE'}: ${String(json?.message || '')} ${json?.data ? JSON.stringify(json.data) : ''}` }] };
        if (!res.ok || json?.success === false) return { isError: true, content: [{ type: 'text', text: String(json?.message || `Falha no CaptaMais (HTTP ${res.status}).`) }] };
        return { content: [{ type: 'text', text: `OK_RASCUNHO: ${JSON.stringify(json.data ?? json)}. A página NÃO está publicada: o assessor revisa, sobe a foto e publica em ${json?.data?.editar || CAPTAMAIS_URL + '/landing-page'}.` }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: `Não consegui falar com o CaptaMais: ${e?.message ?? e}` }] };
      }
    },
  );

  server.registerTool(
    'carregar_metodo',
    {
      title: 'Carregar skill do Método',
      description:
        'Devolve as instruções completas de uma skill do Método (livro IA no Mercado Financeiro) ou de uma rotina da ' +
        'Anthropic usada pela Mesa. Chame antes de executar um pedido que cite a skill ou a rotina, inclusive os ' +
        'enviados pela Mesa do Assessor, e siga as instruções devolvidas.',
      inputSchema: { skill: z.enum([...SKILLS_METODO, ...ROTINAS]).describe('Nome da skill do Método ou da rotina') },
      annotations: { readOnlyHint: true },
    },
    async ({ skill }) => {
      const pasta = pastaDa(skill);
      const arquivo = path.join(pasta, 'SKILL.md');
      if (!existsSync(arquivo)) {
        return { isError: true, content: [{ type: 'text', text: `Skill ${skill} não encontrada em ${path.dirname(pasta)}.` }] };
      }
      const extras = arquivosExtras(pasta);
      const aviso = extras.length
        ? `\n\n---\nArquivos de apoio desta skill, não incluídos aqui: ${extras.join(', ')}. Se você puder ler arquivos, estão em ${pasta}.`
        : '';
      const antes = existsSync(ARQUIVO_BASE) ? readFileSync(ARQUIVO_BASE, 'utf8').trim() + '\n\n---\n\n' : '';
      enviarEvento('rotina_carregada', { skill });
      return { content: [{ type: 'text', text: antes + readFileSync(arquivo, 'utf8') + aviso }] };
    },
  );

  registerAppResource(server, 'Painel da Mesa do Assessor', PAINEL_URI,
    { description: 'Painel interativo da Mesa do Assessor' },
    async () => ({
      contents: [{
        uri: PAINEL_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: readFileSync(path.join(AQUI, 'painel-v2.html'), 'utf8')
          .replace('<script type="module">', () => `<script type="module">${SDK_PAINEL}</script>\n<script type="module">`),
        _meta: { ui: {
          csp: { resourceDomains: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'] },
          prefersBorder: false,
          permissions: { clipboardWrite: {} },
        } },
      }],
    }));

  return server;
}

await buildServer().connect(new StdioServerTransport());
console.error(`mesa-do-assessor pronto; ${SKILLS_METODO.length} skills em ${PASTA_SKILLS}; rotinas em ${PASTA_ROTINAS}`);
