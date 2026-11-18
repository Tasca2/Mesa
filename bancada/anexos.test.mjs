// Passo 5 do plano de melhorias (Anexar arquivo): regras do anexo na janela, sem subir o motor.
// Nome seguro, tipo, tamanho, pasta de destino, regra de leitura do Claude e argumentos de cada pedido.
// Rodar: node --test bancada/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  TIPOS_ANEXO, MAX_ANEXOS, TERMINAL, ESCRITA, tipoDoAnexo, nomeSeguro, assinaturaConfere, erroDeTamanho,
  dentroDe, destinoDoAnexo, regraLeitura, argsDeFerramentas, blocoDeAnexos,
  pastaCofre, regrasNegarLeitura, regrasDaMesa, argsDeMelhorar, AVISO_ARQUIVOS,
} from '../janela/anexos.mjs';

const RAIZ = process.env.MESA_RAIZ || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MB = 1024 * 1024;
const PDF = Buffer.from('%PDF-1.7\n%âãÏÓ\n');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x24, 0, 0, 0]), Buffer.from('WEBPVP8 ')]);

test('aceita PDF e imagem (PNG, JPG, JPEG, WEBP), com extensão em maiúscula ou minúscula', () => {
  for (const n of ['a.pdf', 'b.PDF', 'c.png', 'd.jpg', 'e.JPEG', 'f.webp']) assert.ok(tipoDoAnexo(n), `${n} deveria ser aceito`);
  assert.equal(tipoDoAnexo('x.PDF').tipo, 'pdf');
  assert.equal(tipoDoAnexo('x.Png').tipo, 'imagem');
  assert.deepEqual(Object.keys(TIPOS_ANEXO).sort(), ['.jpeg', '.jpg', '.pdf', '.png', '.webp']);
});

test('recusa o que não é PDF nem imagem, inclusive extensão dupla e arquivo sem extensão', () => {
  for (const n of ['virus.exe', 'pagina.html', 'desenho.svg', 'planilha.xlsx', 'texto.txt', 'fato.pdf.exe', 'semextensao', '.pdf', '', null, undefined]) {
    assert.equal(tipoDoAnexo(n), null, `${n} deveria ser recusado`);
    assert.equal(nomeSeguro(n), '', `${n} não deveria ganhar nome`);
  }
});

test('nome seguro: sem acento, sem pasta, sem caractere especial e com a extensão em minúscula', () => {
  assert.equal(nomeSeguro('Fato Relevante — Petrobras (10.11).PDF'), 'Fato-Relevante-Petrobras-10.11.pdf');
  assert.equal(nomeSeguro('lâmina ação & câmbio.jpeg'), 'lamina-acao-cambio.jpeg');
  assert.equal(nomeSeguro('..\\..\\Windows\\System32\\x.pdf'), 'x.pdf');
  assert.equal(nomeSeguro('../../etc/passwd.png'), 'passwd.png');
  assert.equal(nomeSeguro('C:\\Users\\alguem\\Desktop\\print.png'), 'print.png');
  assert.equal(nomeSeguro('   ...pdf .pdf'), 'pdf.pdf');
  assert.equal(nomeSeguro('ação.pdf'), 'acao.pdf');
  assert.equal(nomeSeguro('ç.pdf'), 'c.pdf');
  assert.equal(nomeSeguro('😀.png'), 'anexo.png');
});

test('nome seguro: nomes reservados do Windows e nomes longos não viram problema', () => {
  assert.equal(nomeSeguro('CON.pdf'), 'arquivo-CON.pdf');
  assert.equal(nomeSeguro('nul.png'), 'arquivo-nul.png');
  assert.equal(nomeSeguro('com1.jpg'), 'arquivo-com1.jpg');
  const longo = nomeSeguro('a'.repeat(300) + '.pdf');
  assert.ok(longo.length <= 64, `nome com ${longo.length} caracteres`);
  assert.ok(longo.endsWith('.pdf'));
});

test('o conteúdo precisa ser do tipo que o nome diz (PDF começa com %PDF, imagem com a marca dela)', () => {
  assert.equal(assinaturaConfere('.pdf', PDF), true);
  assert.equal(assinaturaConfere('.png', PNG), true);
  assert.equal(assinaturaConfere('.jpg', JPG), true);
  assert.equal(assinaturaConfere('.jpeg', JPG), true);
  assert.equal(assinaturaConfere('.webp', WEBP), true);
  assert.equal(assinaturaConfere('.pdf', PNG), false);
  assert.equal(assinaturaConfere('.png', PDF), false);
  assert.equal(assinaturaConfere('.jpg', PNG), false);
  assert.equal(assinaturaConfere('.webp', Buffer.from('RIFF\0\0\0\0WAVEfmt ')), false);
  assert.equal(assinaturaConfere('.pdf', Buffer.from('<html>%PDF')), false);
  assert.equal(assinaturaConfere('.pdf', Buffer.alloc(0)), false);
  assert.equal(assinaturaConfere('.exe', Buffer.from('MZ')), false);
});

test('tamanho: arquivo vazio é recusado; PDF até 20 MB e imagem até 10 MB', () => {
  assert.match(erroDeTamanho('.pdf', 0), /vazio/);
  assert.equal(erroDeTamanho('.pdf', 20 * MB), '');
  assert.match(erroDeTamanho('.pdf', 20 * MB + 1), /20 MB/);
  assert.equal(erroDeTamanho('.png', 10 * MB), '');
  assert.match(erroDeTamanho('.jpg', 10 * MB + 1), /10 MB/);
  assert.match(erroDeTamanho('.webp', 50 * MB), /10 MB/);
  assert.ok(MAX_ANEXOS >= 3 && MAX_ANEXOS <= 10, 'vários arquivos por mensagem, com um teto');
});

test('confinamento: só vale caminho dentro da pasta, sem ../ e sem caminho absoluto de fora', () => {
  const base = path.join(os.tmpdir(), 'mesa-teste-base', 'Anexos');
  assert.equal(dentroDe(base, path.join(base, '2026-11-18', 'a.pdf')), true);
  assert.equal(dentroDe(base, path.join(base, '..', 'Fontes', 'a.pdf')), false);
  assert.equal(dentroDe(base, path.join(base, '2026-11-18', '..', '..', 'x.pdf')), false);
  assert.equal(dentroDe(base, base), false);
  assert.equal(dentroDe(base, base + '-vizinha' + path.sep + 'a.pdf'), false);
  assert.equal(dentroDe(base, path.parse(base).root + 'Windows' + path.sep + 'a.pdf'), false);
  assert.equal(dentroDe(base, 'relativo/a.pdf'), false);
});

test('destino: pasta do dia dentro de Anexos, nome seguro, sem sobrescrever e sem fugir da pasta', () => {
  const raiz = mkdtempSync(path.join(os.tmpdir(), 'mesa-anexos-'));
  try {
    const base = path.join(raiz, 'Anexos');
    const quando = new Date(2026, 10, 18, 14, 5, 9);
    const d = destinoDoAnexo(base, 'Fato Relevante.PDF', quando);
    assert.equal(d.pasta, path.join(base, '2026-11-18'));
    assert.equal(d.nome, '140509-Fato-Relevante.pdf');
    assert.equal(d.arquivo, path.join(base, '2026-11-18', '140509-Fato-Relevante.pdf'));
    mkdirSync(d.pasta, { recursive: true }); writeFileSync(d.arquivo, 'x');
    const d2 = destinoDoAnexo(base, 'Fato Relevante.pdf', quando);
    assert.notEqual(d2.arquivo, d.arquivo, 'não pode sobrescrever o anexo anterior');
    assert.equal(path.dirname(d2.arquivo), d.pasta);
    for (const ruim of ['..\\..\\..\\fora.pdf', '../../fora.pdf', 'C:\\Windows\\fora.pdf', '/etc/fora.pdf', '\\\\servidor\\c$\\fora.pdf']) {
      const x = destinoDoAnexo(base, ruim, quando);
      assert.ok(x && dentroDe(base, x.arquivo), `${ruim} saiu da pasta: ${x && x.arquivo}`);
      assert.equal(path.dirname(x.arquivo), d.pasta);
    }
    assert.equal(destinoDoAnexo(base, 'programa.exe', quando), null);
  } finally { rmSync(raiz, { recursive: true, force: true }); }
});

// Sintaxe conferida com o Claude Code 2.1.325 em modo -p no Windows, em 18/11/2026: //c/... libera a leitura;
// //C:/... não libera. O teste está descrito no relatório do passo 5 (antes-depois-passo-5.md).
test('regra de leitura do Claude: caminho absoluto no formato //c/... no Windows e //... no Mac', () => {
  assert.equal(regraLeitura('C:\\Users\\Ana\\Documents\\Mesa do Assessor\\Anexos', 'win32'), 'Read(//c/Users/Ana/Documents/Mesa do Assessor/Anexos/**)');
  assert.equal(regraLeitura('D:\\Dados\\Mesa do Assessor\\Fontes\\', 'win32'), 'Read(//d/Dados/Mesa do Assessor/Fontes/**)');
  assert.equal(regraLeitura('/Users/ana/Documents/Mesa do Assessor/Anexos', 'darwin'), 'Read(//Users/ana/Documents/Mesa do Assessor/Anexos/**)');
});

const VIDEO_1_13 = {
  pastasVideo: ['C:\\Users\\Ana\\Documents\\Mesa do Assessor\\Videos\\clipe-abc', 'C:\\Users\\Ana\\.claude\\skills\\edvid\\helpers'],
  permitidasVideo: ['Skill', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash(ffmpeg:*)', 'Bash(python:*)'],
  negadasVideo: ['Read(**/.env)', 'Write(**/.env)'],
};
const LEITURA = ['C:\\Users\\Ana\\Documents\\Mesa do Assessor\\Anexos', 'C:\\Users\\Ana\\Documents\\Mesa do Assessor\\Fontes'];
const WEB = ['WebSearch', 'WebFetch(domain:api.bcb.gov.br)'];
const valor = (args, opcao) => { const i = args.indexOf(opcao); return i < 0 ? null : args[i + 1]; };
const pastasDe = (args) => { const i = args.indexOf('--add-dir'); if (i < 0) return []; const r = []; for (let k = i + 1; k < args.length && !args[k].startsWith('--'); k++) r.push(args[k]); return r; };

const CASA = 'C:\\Users\\Ana';
const PROIBIDAS = [`${CASA}\\.mesa-do-assessor`, `${CASA}\\.claude`, `${CASA}\\Desktop\\AppCaptaMais\\knowledge`];
const REGRAS = 'C:\\Users\\Ana\\AppData\\Local\\Temp\\mesa-janela\\regras-mesa.json';

test('pedido que não é de vídeo: esconde o terminal e só libera a leitura das pastas Anexos e Fontes', () => {
  const args = argsDeFerramentas({ video: false, permitidasWeb: WEB, pastasLeitura: LEITURA, pastasProibidas: PROIBIDAS, casa: CASA, arquivoRegras: REGRAS, plataforma: 'win32' });
  assert.deepEqual(TERMINAL, ['Bash', 'PowerShell']);
  assert.deepEqual(ESCRITA, ['Write', 'Edit', 'NotebookEdit']);
  assert.equal(valor(args, '--permission-mode'), 'default', 'o modo do usuário (bypass, auto) não vale na Mesa');
  assert.equal(valor(args, '--settings'), REGRAS);
  const negadas = valor(args, '--disallowedTools').split(',');
  assert.deepEqual(negadas.slice(0, 5), ['Bash', 'PowerShell', 'Write', 'Edit', 'NotebookEdit'], 'sem terminal e sem gravar arquivo');
  for (const r of ['Read(//c/Users/Ana/.mesa-do-assessor/**)', 'Read(~/.mesa-do-assessor/**)', 'Read(//c/Users/Ana/.claude/**)', 'Read(~/.claude/**)',
    'Read(//c/Users/Ana/Desktop/AppCaptaMais/knowledge/**)', 'Read(~/Desktop/AppCaptaMais/knowledge/**)']) assert.ok(negadas.includes(r), `falta negar ${r}`);
  assert.deepEqual(pastasDe(args), LEITURA);
  const permitidas = valor(args, '--allowedTools').split(',');
  assert.deepEqual(permitidas, ['mcp__mesa', ...WEB, 'Read(//c/Users/Ana/Documents/Mesa do Assessor/Anexos/**)', 'Read(//c/Users/Ana/Documents/Mesa do Assessor/Fontes/**)']);
  assert.ok(!permitidas.some((f) => /^(Bash|PowerShell|Write|Edit)\b/.test(f)), 'não libera terminal nem escrita');
  assert.ok(!permitidas.includes('Read'), 'não libera leitura sem pasta');
});

test('pasta com vírgula ou parêntese não vira regra na linha de comando (quebraria a lista): a leitura fica pelo --add-dir e a proibição, pelo arquivo de regras', () => {
  const estranhas = ['C:\\Users\\Silva, Ana\\Documents\\Mesa do Assessor\\Anexos', 'C:\\Users\\Ana (Pessoal)\\Documents\\Mesa do Assessor\\Fontes'];
  const proibidas = ['C:\\Users\\Silva, Ana\\.mesa-do-assessor', 'C:\\Users\\Silva, Ana\\.claude'];
  const args = argsDeFerramentas({ video: false, permitidasWeb: WEB, pastasLeitura: estranhas, pastasProibidas: proibidas, casa: 'C:\\Users\\Silva, Ana', arquivoRegras: REGRAS, plataforma: 'win32' });
  assert.deepEqual(pastasDe(args), estranhas);
  assert.equal(valor(args, '--allowedTools'), ['mcp__mesa', ...WEB].join(','));
  assert.equal(valor(args, '--disallowedTools'), 'Bash,PowerShell,Write,Edit,NotebookEdit,Read(~/.mesa-do-assessor/**),Read(~/.claude/**)');
  const r = regrasDaMesa({ pastasProibidas: proibidas, casa: 'C:\\Users\\Silva, Ana', plataforma: 'win32' });
  for (const x of ['Read(//c/Users/Silva, Ana/.mesa-do-assessor/**)', 'Read(//c/Users/Silva, Ana/.claude/**)', 'Read(~/.claude/**)']) assert.ok(r.permissions.deny.includes(x), x);
});

test('arquivo de regras da Mesa: nega terminal, gravação e as leituras proibidas, e bloqueia leitura fora das pastas de trabalho', () => {
  const r = regrasDaMesa({ pastasProibidas: PROIBIDAS, casa: CASA, plataforma: 'win32' });
  assert.deepEqual(Object.keys(r), ['permissions']);
  assert.equal(r.permissions.blockReadsOutsideWorkingDirectories, true);
  assert.deepEqual(r.permissions.deny, ['Bash', 'PowerShell', 'Write', 'Edit', 'NotebookEdit', ...regrasNegarLeitura(PROIBIDAS, { casa: CASA, plataforma: 'win32' })]);
  assert.equal(r.permissions.allow, undefined, 'o arquivo da Mesa não libera nada');
  assert.equal(r.permissions.defaultMode, undefined);
});

test('regra que nega a leitura: caminho absoluto e, dentro da pasta do usuário, também ~/; no Mac, //Users/...', () => {
  assert.deepEqual(regrasNegarLeitura(['C:\\Users\\Ana\\.claude\\'], { casa: CASA, plataforma: 'win32' }), ['Read(//c/Users/Ana/.claude/**)', 'Read(~/.claude/**)']);
  assert.deepEqual(regrasNegarLeitura(['D:\\Cofre de notas'], { casa: CASA, plataforma: 'win32' }), ['Read(//d/Cofre de notas/**)'], 'fora da pasta do usuário, só o caminho absoluto');
  assert.deepEqual(regrasNegarLeitura(['/Users/ana/.claude'], { casa: '/Users/ana', plataforma: 'darwin' }), ['Read(//Users/ana/.claude/**)', 'Read(~/.claude/**)']);
  assert.deepEqual(regrasNegarLeitura([CASA], { casa: CASA, plataforma: 'win32' }), ['Read(//c/Users/Ana/**)'], 'a própria pasta do usuário não vira ~/');
  assert.deepEqual(regrasNegarLeitura(['', null], { casa: CASA, plataforma: 'win32' }), []);
});

test('o cofre negado ao Claude é a mesma pasta que o servidor da Mesa lê', () => {
  assert.equal(pastaCofre({}, CASA), path.join(CASA, 'Desktop', 'AppCaptaMais', 'knowledge'));
  assert.equal(pastaCofre({ MESA_COFRE: 'D:\\Cofre' }, CASA), 'D:\\Cofre');
  const servidor = readFileSync(path.join(RAIZ, 'servidor', 'server.mjs'), 'utf8');
  assert.ok(servidor.includes("const PASTA_COFRE = process.env.MESA_COFRE || path.join(os.homedir(), 'Desktop', 'AppCaptaMais', 'knowledge');"), 'o servidor mudou a pasta do cofre: mude também em anexos.mjs');
});

test('melhorar o pedido: só a web, no modo padrão, sem ler, gravar nem terminal e sem os conectores do usuário', () => {
  const a = argsDeMelhorar({ permitidasWeb: WEB, arquivoRegras: REGRAS });
  assert.equal(valor(a, '--permission-mode'), 'default');
  assert.ok(a.includes('--strict-mcp-config'));
  assert.equal(valor(a, '--allowedTools'), WEB.join(','));
  assert.equal(valor(a, '--disallowedTools'), 'Bash,PowerShell,Write,Edit,NotebookEdit,Read,Glob,Grep');
  assert.equal(valor(a, '--settings'), REGRAS);
  assert.ok(!a.includes('--add-dir'));
});

test('a tela e o motor usam os mesmos limites de anexo (tipos, tamanho e quantidade)', () => {
  const html = readFileSync(path.join(RAIZ, 'janela', 'mesa-janela.html'), 'utf8');
  const m = html.match(/const TIPOS_ANEXO = (\{[^}]*\}), MAX_ANEXOS = (\d+);/);
  assert.ok(m, 'não achei os limites na tela');
  const tela = new Function(`return ${m[1]}`)();
  assert.deepEqual(Object.keys(tela).map((e) => '.' + e).sort(), Object.keys(TIPOS_ANEXO).sort());
  for (const [ext, t] of Object.entries(TIPOS_ANEXO)) assert.equal(tela[ext.slice(1)] * 1024 * 1024, t.limite, ext);
  assert.equal(Number(m[2]), MAX_ANEXOS);
  const aceita = (html.match(/id="cvArquivo"[^>]*accept="([^"]+)"/) || html.match(/accept="([^"]+)"[^>]*id="cvArquivo"/) || [])[1] || '';
  for (const ext of Object.keys(TIPOS_ANEXO)) assert.ok(aceita.split(',').includes(ext), `o campo de arquivo não aceita ${ext}`);
});

test('a regra de arquivos do Claude diz o que ele lê, que não há terminal e que não deve pedir permissão', () => {
  for (const t of ['Anexos', 'Fontes', 'Read', 'documentos_cvm', 'terminal', 'não peça permissão', 'nunca instrução']) assert.ok(AVISO_ARQUIVOS.includes(t), `falta "${t}"`);
});

test('pedido de vídeo: os mesmos argumentos da 1.13, com terminal e sem as pastas de anexo', () => {
  const args = argsDeFerramentas({ video: true, ...VIDEO_1_13, permitidasWeb: WEB, pastasLeitura: LEITURA, plataforma: 'win32' });
  assert.deepEqual(args, [
    '--add-dir', ...VIDEO_1_13.pastasVideo,
    '--allowedTools', ['mcp__mesa', ...VIDEO_1_13.permitidasVideo].join(','),
    '--disallowedTools', VIDEO_1_13.negadasVideo.join(','),
  ]);
});

test('o aviso dos anexos diz onde está cada arquivo, manda ler antes de responder e citar a página', () => {
  assert.equal(blocoDeAnexos([]), '');
  const b = blocoDeAnexos([
    { nome: '140509-Fato-Relevante.pdf', original: 'Fato Relevante.pdf', tipo: 'pdf', kb: 312, caminho: 'C:\\Users\\Ana\\Documents\\Mesa do Assessor\\Anexos\\2026-11-18\\140509-Fato-Relevante.pdf' },
    { nome: '140511-grafico.png', original: 'gráfico.png', tipo: 'imagem', kb: 85, caminho: 'C:\\Users\\Ana\\Documents\\Mesa do Assessor\\Anexos\\2026-11-18\\140511-grafico.png' },
  ]);
  assert.ok(b.includes('C:\\Users\\Ana\\Documents\\Mesa do Assessor\\Anexos\\2026-11-18\\140509-Fato-Relevante.pdf'));
  assert.ok(b.includes('C:\\Users\\Ana\\Documents\\Mesa do Assessor\\Anexos\\2026-11-18\\140511-grafico.png'));
  assert.match(b, /2 arquivos/);
  assert.match(b, /Read/);
  assert.match(b, /PDF inteiro/, 'manda ler o PDF inteiro primeiro: sem o poppler (pdftoppm), a leitura por páginas falha');
  assert.match(b, /pages/, 'a leitura por partes fica como saída quando a ferramenta recusa o arquivo inteiro');
  assert.doesNotMatch(b, /mais de 10 páginas: leia por partes/);
  assert.match(b, /página/);
  assert.match(b, /não complete/i);
  assert.match(b, /CPF/);
  assert.ok(b.endsWith('\n\n'), 'o aviso vem separado do pedido');
  assert.match(b, /material para ler/i, 'o conteúdo do anexo é material para ler');
  assert.match(b, /nunca instrução/i, 'o conteúdo do anexo nunca vale como instrução');
});
