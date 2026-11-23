import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const requerer = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'servidor', 'package.json'));
const MAX_DESCOMPRIMIDO = 40 * 1024 * 1024;
const MAX_TEXTO = 400000;

const decodificar = (s) => String(s)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(Number(n), 0x10ffff)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Math.min(parseInt(n, 16), 0x10ffff)))
  .replace(/&amp;/g, '&');

const textoDe = (xml) => {
  const partes = [];
  for (const m of xml.matchAll(/<(?:w:t|t)(?:\s[^>]*)?>([\s\S]*?)<\/(?:w:t|t)>/g)) partes.push(decodificar(m[1]));
  return partes.join('');
};

function docx(xml) {
  const linhas = [];
  const corpo = xml.replace(/<w:tab\/>/g, '\t').replace(/<\/w:p>\s*<\/w:tc>/g, '\t').replace(/<\/w:tc>/g, '\t').replace(/<\/w:tr>/g, '\n').replace(/<\/w:p>/g, '\n').replace(/<w:br\/>/g, '\n');
  for (const l of corpo.split('\n')) {
    const t = decodificar([...l.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|(\t)/g)].map((m) => (m[2] ? '\t' : m[1])).join(''));
    linhas.push(t.replace(/\t+$/g, ''));
  }
  return linhas.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const colunaParaIndice = (ref) => { let n = 0; for (const c of ref.replace(/[0-9]/g, '')) n = n * 26 + (c.charCodeAt(0) - 64); return n - 1; };

async function xlsx(zip) {
  const ler = async (nome) => { const f = zip.file(nome); return f ? await f.async('string') : ''; };
  const compartilhadas = [];
  for (const si of (await ler('xl/sharedStrings.xml')).matchAll(/<si>([\s\S]*?)<\/si>/g)) compartilhadas.push(textoDe(si[1]));
  const livro = await ler('xl/workbook.xml');
  const rels = await ler('xl/_rels/workbook.xml.rels');
  const alvos = new Map([...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => [(/\bId="([^"]+)"/.exec(m[0]) || [])[1], (/\bTarget="([^"]+)"/.exec(m[0]) || [])[1]]));
  const folhas = [...livro.matchAll(/<sheet\b[^>]*>/g)].map((m) => ({ nome: decodificar((/\bname="([^"]*)"/.exec(m[0]) || [])[1] || 'Planilha'), alvo: alvos.get((/\br:id="([^"]+)"/.exec(m[0]) || [])[1]) }));
  const saida = [];
  for (const [i, f] of folhas.entries()) {
    const caminho = f.alvo ? 'xl/' + f.alvo.replace(/^\/?(xl\/)?/, '') : `xl/worksheets/sheet${i + 1}.xml`;
    const xml = await ler(caminho);
    if (!xml) continue;
    saida.push(`## Planilha: ${f.nome}`);
    for (const linha of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const celulas = [];
      for (const c of linha[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = (/\br="([A-Z]+)\d+"/.exec(c[1]) || [])[1];
        if (!ref) continue;
        const tipo = (/\bt="([^"]+)"/.exec(c[1]) || [])[1];
        const corpo = c[2] || '';
        let v = '';
        if (tipo === 'inlineStr') v = textoDe(corpo);
        else {
          const bruto = (/<v>([\s\S]*?)<\/v>/.exec(corpo) || [])[1];
          if (bruto != null) v = tipo === 's' ? (compartilhadas[Number(bruto)] ?? '') : decodificar(bruto);
        }
        celulas[colunaParaIndice(ref)] = v;
      }
      if (celulas.some((x) => x !== undefined && x !== '')) saida.push(Array.from(celulas, (x) => x ?? '').join('\t'));
    }
    saida.push('');
  }
  return saida.join('\n').trim();
}

export async function converterParaTexto(arquivo, ext, nomeOriginal) {
  const JSZip = requerer('jszip');
  const zip = await JSZip.loadAsync(readFileSync(arquivo));
  let total = 0;
  for (const f of Object.values(zip.files)) total += (f._data && f._data.uncompressedSize) || 0;
  if (total > MAX_DESCOMPRIMIDO) throw new Error('O arquivo é grande demais depois de aberto.');
  let corpo = '';
  if (ext === '.docx') {
    const f = zip.file('word/document.xml');
    if (!f) throw new Error('Não encontrei o texto dentro do arquivo Word.');
    corpo = docx(await f.async('string'));
  } else if (ext === '.xlsx') {
    corpo = await xlsx(zip);
  } else throw new Error('Tipo não suportado.');
  if (!corpo) throw new Error('O arquivo não tem texto legível.');
  const nota = ext === '.xlsx'
    ? 'Valores como estão nas células: percentuais aparecem como decimais (0,0123 = 1,23%) e datas como número de série do Excel.'
    : 'Texto extraído do arquivo Word; tabelas aparecem separadas por tabulação.';
  const cab = `[Convertido de "${nomeOriginal || 'arquivo'}" para leitura. ${nota}]\n\n`;
  return (cab + corpo).slice(0, MAX_TEXTO);
}
