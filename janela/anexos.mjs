// Anexos da janela da Mesa (PDF e imagem): nome seguro, tipo, tamanho, pasta de destino, regra de leitura
// do Claude e o aviso que vai junto do pedido. Sem efeito ao importar; quem grava é o motor.
import path from 'node:path';
import { existsSync } from 'node:fs';

export const PASTA_ANEXOS = 'Anexos';   // Documentos › Mesa do Assessor › Anexos › dia
export const PASTA_FONTES = 'Fontes';   // Documentos › Mesa do Assessor › Fontes (documentos oficiais baixados pela Mesa)
export const MAX_ANEXOS = 6;            // arquivos esperando envio, por mensagem
export const TERMINAL = ['Bash', 'PowerShell']; // escondidos do Claude fora da edição de vídeo

const MB = 1024 * 1024;
export const TIPOS_ANEXO = {
  '.pdf': { tipo: 'pdf', rotulo: 'PDF', limite: 20 * MB },
  '.png': { tipo: 'imagem', rotulo: 'imagem PNG', limite: 10 * MB },
  '.jpg': { tipo: 'imagem', rotulo: 'imagem JPG', limite: 10 * MB },
  '.jpeg': { tipo: 'imagem', rotulo: 'imagem JPG', limite: 10 * MB },
  '.webp': { tipo: 'imagem', rotulo: 'imagem WEBP', limite: 10 * MB },
};
const RESERVADOS = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

// Só o nome do arquivo, sem pasta (vale para / e \ em qualquer sistema).
const soNome = (nome) => String(nome ?? '').split(/[\\/]/).pop();

// { ext, tipo, rotulo, limite } ou null quando não é PDF nem imagem aceita.
export function tipoDoAnexo(nome) {
  const ext = path.extname(soNome(nome)).toLowerCase();
  return TIPOS_ANEXO[ext] ? { ext, ...TIPOS_ANEXO[ext] } : null;
}

// Nome para gravar: sem acento, sem pasta, só letras, números, ponto, hífen e sublinhado; extensão em minúscula.
// Devolve '' quando o tipo não é aceito.
export function nomeSeguro(nome) {
  const t = tipoDoAnexo(nome);
  if (!t) return '';
  const n = soNome(nome);
  let base = n.slice(0, n.length - t.ext.length).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 60).replace(/[-.]+$/g, '');
  if (!base) base = 'anexo';
  if (RESERVADOS.test(base)) base = 'arquivo-' + base;
  return base + t.ext;
}

// O começo do arquivo precisa ser do tipo que a extensão diz.
export function assinaturaConfere(ext, bytes) {
  const b = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes || []);
  const comeca = (...x) => b.length >= x.length && x.every((v, i) => b[i] === v);
  switch (String(ext).toLowerCase()) {
    case '.pdf': return b.subarray(0, 5).toString('latin1') === '%PDF-';
    case '.png': return comeca(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case '.jpg': case '.jpeg': return comeca(0xff, 0xd8, 0xff);
    case '.webp': return b.length >= 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP';
    default: return false;
  }
}

// '' quando o tamanho serve; senão, a frase para o assessor.
export function erroDeTamanho(ext, bytes) {
  const t = TIPOS_ANEXO[String(ext).toLowerCase()];
  if (!t) return 'Anexe PDF ou imagem (PNG, JPG ou WEBP).';
  if (!(bytes > 0)) return 'O arquivo está vazio.';
  if (bytes > t.limite) return `O arquivo passa de ${t.limite / MB} MB (limite para ${t.tipo === 'pdf' ? 'PDF' : 'imagem'}).`;
  return '';
}

// true só para caminho absoluto estritamente dentro de base.
export function dentroDe(base, alvo) {
  if (!path.isAbsolute(String(alvo || ''))) return false;
  const rel = path.relative(path.resolve(base), path.resolve(alvo));
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

const dois = (n) => String(n).padStart(2, '0');

// { pasta, arquivo, nome } dentro de base/AAAA-MM-DD, com a hora na frente e sem sobrescrever; null se o tipo não serve.
export function destinoDoAnexo(base, nomeOriginal, quando = new Date()) {
  const seguro = nomeSeguro(nomeOriginal);
  if (!seguro) return null;
  const pasta = path.join(base, `${quando.getFullYear()}-${dois(quando.getMonth() + 1)}-${dois(quando.getDate())}`);
  const hora = `${dois(quando.getHours())}${dois(quando.getMinutes())}${dois(quando.getSeconds())}`;
  const ext = path.extname(seguro), raiz = seguro.slice(0, -ext.length);
  for (let i = 1; i < 1000; i++) {
    const nome = `${hora}-${raiz}${i > 1 ? '-' + i : ''}${ext}`, arquivo = path.join(pasta, nome);
    if (!dentroDe(base, arquivo)) return null;
    if (!existsSync(arquivo) && !existsSync(arquivo + '.part')) return { pasta, arquivo, nome };
  }
  return null;
}

// Regra de permissão do Claude Code para ler tudo dentro de uma pasta, por caminho absoluto.
// No Windows o Claude Code compara caminhos no formato //c/Users/...; //C:/... não vale (testado no 2.1.325).
export function regraLeitura(pasta, plataforma = process.platform) {
  let p = String(pasta).replace(/[\\/]+$/, '');
  if (plataforma === 'win32') p = p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, l) => '/' + l.toLowerCase());
  return `Read(/${p.startsWith('/') ? '' : '/'}${p}/**)`;
}

// Parte dos argumentos do Claude que decide pastas e ferramentas.
// Vídeo: exatamente como na 1.13. Os demais: terminal escondido e leitura só das pastas indicadas (Anexos e Fontes).
export function argsDeFerramentas({ video = false, pastasVideo = [], permitidasVideo = [], negadasVideo = [], permitidasWeb = [], pastasLeitura = [], plataforma = process.platform } = {}) {
  if (video) return ['--add-dir', ...pastasVideo, '--allowedTools', ['mcp__mesa', ...permitidasVideo].join(','), '--disallowedTools', negadasVideo.join(',')];
  return [
    ...(pastasLeitura.length ? ['--add-dir', ...pastasLeitura] : []),
    '--allowedTools', ['mcp__mesa', ...permitidasWeb, ...pastasLeitura.filter((p) => !/[,()]/.test(p)).map((p) => regraLeitura(p, plataforma))].join(','),
    '--disallowedTools', TERMINAL.join(','),
  ];
}

// Aviso que vai antes do pedido quando a mensagem leva anexos.
export function blocoDeAnexos(anexos) {
  if (!Array.isArray(anexos) || !anexos.length) return '';
  const n = anexos.length;
  return [
    '[Anexos desta mensagem]',
    `O assessor anexou ${n === 1 ? '1 arquivo' : n + ' arquivos'} a esta mensagem. ${n === 1 ? 'Ele faz' : 'Eles fazem'} parte do pedido: quando o pedido falar em texto colado, documento, PDF, imagem, gráfico ou print enviado, é deste anexo que se trata.`,
    'Leia cada arquivo com a ferramenta Read, pelo caminho exato abaixo, antes de responder. Leia o PDF inteiro de uma vez; só use o parâmetro pages se a ferramenta recusar o arquivo inteiro (a leitura por páginas depende de um programa que nem todo computador tem). A Mesa só deixa ler as pastas Anexos e Fontes dela.',
    'Ao usar um trecho ou número de um anexo, diga de que arquivo e de que página do PDF ele veio (contando a partir da primeira página do arquivo); na imagem, diga que o valor foi lido do gráfico e com que precisão.',
    'Se um anexo não abrir ou estiver ilegível, diga qual e por quê, e não complete o conteúdo de memória. Se um anexo trouxer nome, CPF ou conta de cliente, não repita esses dados na resposta.',
    ...anexos.map((a) => `- ${a.original || a.nome} (${a.tipo === 'pdf' ? 'PDF' : 'imagem'}, ${a.kb} KB): ${a.caminho}`),
    '[Fim dos anexos]',
    '', '',
  ].join('\n');
}
