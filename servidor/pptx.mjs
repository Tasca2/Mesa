import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const TEMAS = {
  escuro: { fundo: '0E0E10', painel: '17171A', tinta: 'F2EDE4', suave: '9C9CA3', cor: 'C9A24B', linha: '2E2E33' },
  claro: { fundo: 'F6F2EA', painel: 'ECE6D9', tinta: '1A1A1C', suave: '66666C', cor: '8A6A2B', linha: 'D5CDBC' },
  marinho: { fundo: '0B1F33', painel: '12304C', tinta: 'F1F4F7', suave: 'A3B3C4', cor: 'D8B26A', linha: '2A4763' },
};
const LARG = 13.333, ALT = 7.5, MX = 0.75, UTIL = LARG - 2 * MX;
const IMAGEM_OK = ['.png', '.jpg', '.jpeg', '.gif'];
function dimensoes(arq) {
  try {
    const b = readFileSync(arq);
    if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
    if (b.subarray(0, 3).toString('latin1') === 'GIF') return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  } catch {   }
  return null;
}
const caber = (arq, bw, bh) => { const d = dimensoes(arq); if (!d || !d.w || !d.h) return { w: bw, h: bh }; const k = Math.min(bw / d.w, bh / d.h); return { w: d.w * k, h: d.h * k }; };
const txt = (x) => String(x ?? '').trim();
const num2 = (i) => String(i + 1).padStart(2, '0');

async function biblioteca() {
  const m = await import('pptxgenjs');
  const P = m.default?.default ?? m.default ?? m;
  if (typeof P !== 'function') throw new Error('biblioteca do PowerPoint indisponível');
  return P;
}

function imagemUsavel(ref, pastaImagens, avisos, nome) {
  const r = txt(ref);
  if (!r) return null;
  const arq = /^([a-zA-Z]:[\\/]|\/|\\\\)/.test(r) ? r : path.join(pastaImagens || '', r);
  if (!existsSync(arq)) return null;
  if (!IMAGEM_OK.includes(path.extname(arq).toLowerCase())) { avisos.push(`${nome}: o PowerPoint só recebe PNG ou JPG; no arquivo editável essa imagem ficou de fora.`); return null; }
  return arq;
}

export async function gerarPptx(a, marca, destino) {
  const P = await biblioteca();
  const avisos = [];
  const t = TEMAS[marca.tema] ?? TEMAS.escuro;
  const cor = /^#[0-9a-fA-F]{6}$/.test(marca.cor || '') ? marca.cor.slice(1).toUpperCase() : t.cor;
  const fTitulo = marca.estilo === 'moderna' ? 'Segoe UI' : 'Georgia', fCorpo = 'Segoe UI';
  const logo = imagemUsavel(marca.logoArquivo, '', avisos, 'logo'), foto = imagemUsavel(marca.fotoArquivo, '', avisos, 'foto');
  const slides = a.slides, n = slides.length;
  const pptx = new P();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = txt(a.titulo);
  pptx.author = txt(marca.nome);
  pptx.company = txt(marca.escritorio);

  const cartao = (sl, x, y, w, h) => sl.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: t.painel }, line: { color: t.linha, width: 0.75 } });
  const cabecalho = (sl, s, tam = 30) => {
    let y = 0.6;
    if (txt(s.etiqueta)) { sl.addText(txt(s.etiqueta).toUpperCase(), { x: MX, y, w: UTIL, h: 0.35, fontFace: fCorpo, fontSize: 12, bold: true, color: cor, charSpacing: 3 }); y += 0.42; }
    sl.addText(txt(s.titulo), { x: MX, y, w: UTIL, h: 1.2, fontFace: fTitulo, fontSize: tam, color: t.tinta, valign: 'top', fit: 'shrink' });
    y += 1.25;
    const sub = txt(s.subtitulo) || txt(s.texto);
    if (sub) { sl.addText(sub, { x: MX, y, w: UTIL, h: 0.75, fontFace: fCorpo, fontSize: 16, color: t.suave, valign: 'top', fit: 'shrink' }); y += 0.85; }
    return y;
  };
  const rodape = (sl, s, i) => {
    if (txt(s.ponte)) sl.addText(txt(s.ponte), { x: MX, y: 6.35, w: UTIL, h: 0.4, fontFace: fTitulo, fontSize: 13, italic: true, color: cor });
    if (txt(s.fonte)) sl.addText('Fonte: ' + txt(s.fonte), { x: MX, y: 6.0, w: UTIL, h: 0.3, fontFace: fCorpo, fontSize: 10, color: t.suave });
    sl.addShape(pptx.ShapeType.line, { x: MX, y: 6.85, w: UTIL, h: 0, line: { color: t.linha, width: 0.75 } });
    sl.addText([marca.cliente, marca.rodape || marca.escritorio].map(txt).filter(Boolean).join(' · '), { x: MX, y: 6.9, w: UTIL - 1.2, h: 0.4, fontFace: fCorpo, fontSize: 9, color: t.suave, fit: 'shrink' });
    sl.addText(`${i + 1} / ${n}`, { x: LARG - MX - 1.1, y: 6.9, w: 1.1, h: 0.4, fontFace: fCorpo, fontSize: 9, color: t.suave, align: 'right' });
  };
  const itensDe = (s) => (Array.isArray(s.itens) ? s.itens : []).map((x) => ({ titulo: txt(x.titulo) || txt(x.rotulo), texto: txt(x.texto), valor: txt(x.valor), valor2: txt(x.valor2), fonte: txt(x.fonte), rotulo: txt(x.rotulo) }));
  const grade = (sl, itens, y0, opc = {}) => {
    const x0 = opc.x ?? MX, larg = opc.w ?? UTIL, q = itens.length;
    if (!q) return;
    const cols = opc.cols ?? (q <= 4 ? q : Math.ceil(q / 2)), lins = Math.ceil(q / cols), gap = 0.22;
    const w = (larg - gap * (cols - 1)) / cols, h = Math.min(2.9, (6.2 - y0 - gap * (lins - 1)) / lins);
    itens.forEach((it, k) => {
      const x = x0 + (k % cols) * (w + gap), y = y0 + Math.floor(k / cols) * (h + gap);
      cartao(sl, x, y, w, h);
      const partes = [];
      if (opc.numerar) partes.push({ text: num2(k), options: { fontFace: fTitulo, fontSize: 13, color: cor, breakLine: true } });
      if (opc.valor && it.valor) partes.push({ text: it.valor, options: { fontFace: fTitulo, fontSize: 30, color: cor, breakLine: true } });
      if (it.titulo) partes.push({ text: it.titulo, options: { fontFace: fCorpo, fontSize: 15, bold: true, color: t.tinta, breakLine: true } });
      if (it.texto) partes.push({ text: it.texto, options: { fontFace: fCorpo, fontSize: 12, color: t.suave, breakLine: true } });
      if (opc.valor && it.fonte) partes.push({ text: 'Fonte: ' + it.fonte, options: { fontFace: fCorpo, fontSize: 9, color: t.suave } });
      if (partes.length) sl.addText(partes, { x: x + 0.18, y: y + 0.12, w: w - 0.36, h: h - 0.24, valign: 'top', fit: 'shrink', paraSpaceAfter: 4 });
    });
  };
  const tabela = (sl, cab, linhas, y0) => {
    const borda = { type: 'solid', color: t.linha, pt: 0.75 };
    const rows = [];
    if (cab.length) rows.push(cab.map((c) => ({ text: txt(c), options: { bold: true, color: cor, fill: { color: t.painel }, border: borda } })));
    for (const l of linhas) rows.push(l.map((c) => ({ text: txt(c), options: { color: t.tinta, border: borda } })));
    if (rows.length) sl.addTable(rows, { x: MX, y: y0, w: UTIL, fontFace: fCorpo, fontSize: 13, valign: 'middle', margin: 0.08 });
  };
  const figura = (sl, arq, x, y, w, h) => {
    const d = dimensoes(arq);
    if (!d) return sl.addImage({ path: arq, x, y, w, h });
    const k = Math.max(w / d.w, h / d.h), iw = d.w * k, ih = d.h * k;
    return sl.addImage({ path: arq, x, y, w: iw, h: ih, sizing: { type: 'crop', x: (iw - w) / 2, y: (ih - h) / 2, w, h } });
  };

  slides.forEach((s, i) => {
    const sl = pptx.addSlide();
    sl.background = { color: t.fundo };
    const itens = itensDe(s);
    switch (s.layout) {
      case 'capa': {
        if (logo) { const d = caber(logo, 2.2, 0.9); sl.addImage({ path: logo, x: MX, y: 0.55 + (0.9 - d.h) / 2, w: d.w, h: d.h }); }
        const larg = foto ? 7.4 : UTIL;
        if (txt(s.etiqueta)) sl.addText(txt(s.etiqueta).toUpperCase(), { x: MX, y: 2.0, w: larg, h: 0.35, fontFace: fCorpo, fontSize: 12, bold: true, color: cor, charSpacing: 3 });
        sl.addText(txt(s.titulo), { x: MX, y: 2.4, w: larg, h: 1.9, fontFace: fTitulo, fontSize: 44, color: t.tinta, valign: 'top', fit: 'shrink' });
        if (txt(s.subtitulo) || txt(s.texto)) sl.addText(txt(s.subtitulo) || txt(s.texto), { x: MX, y: 4.35, w: larg, h: 0.9, fontFace: fCorpo, fontSize: 18, color: t.suave, valign: 'top', fit: 'shrink' });
        const quem = [marca.nome, marca.cargo, logo ? '' : marca.escritorio].map(txt).filter(Boolean).join(' · ');
        if (quem) sl.addText(quem, { x: MX, y: 5.6, w: larg, h: 0.4, fontFace: fCorpo, fontSize: 14, color: cor });
        if (foto) figura(sl, foto, 8.9, 1.2, 3.7, 4.9);
        break;
      }
      case 'secao': {
        if (txt(s.etiqueta)) sl.addText(txt(s.etiqueta), { x: MX, y: 1.7, w: UTIL, h: 1.0, fontFace: fTitulo, fontSize: 54, color: cor });
        sl.addText(txt(s.titulo), { x: MX, y: 2.8, w: UTIL, h: 1.5, fontFace: fTitulo, fontSize: 40, color: t.tinta, valign: 'top', fit: 'shrink' });
        if (txt(s.subtitulo) || txt(s.texto)) sl.addText(txt(s.subtitulo) || txt(s.texto), { x: MX, y: 4.35, w: UTIL, h: 0.9, fontFace: fCorpo, fontSize: 18, color: t.suave, valign: 'top' });
        break;
      }
      case 'frase': {
        if (txt(s.etiqueta)) sl.addText(txt(s.etiqueta).toUpperCase(), { x: MX, y: 1.6, w: UTIL, h: 0.35, fontFace: fCorpo, fontSize: 12, bold: true, color: cor, charSpacing: 3 });
        sl.addText(txt(s.titulo), { x: MX, y: 2.0, w: UTIL, h: 2.6, fontFace: fTitulo, fontSize: 36, color: t.tinta, valign: 'middle', fit: 'shrink' });
        if (txt(s.subtitulo) || txt(s.texto)) sl.addText(txt(s.subtitulo) || txt(s.texto), { x: MX, y: 4.7, w: UTIL, h: 0.9, fontFace: fCorpo, fontSize: 16, color: t.suave, valign: 'top' });
        break;
      }
      case 'fechamento': {
        const y = cabecalho(sl, s, 34);
        const passos = (s.passos || []).map(txt).filter(Boolean), contato = (s.contato || []).map(txt).filter(Boolean);
        if (passos.length) sl.addText(passos.map((p, k) => ({ text: `${k + 1}. ${p}`, options: { breakLine: true } })), { x: MX, y, w: 7.2, h: 6.2 - y, fontFace: fCorpo, fontSize: 16, color: t.tinta, valign: 'top', paraSpaceAfter: 8, fit: 'shrink' });
        if (contato.length) { cartao(sl, 8.5, y, LARG - MX - 8.5, Math.min(2.6, 6.2 - y)); sl.addText(contato.map((c) => ({ text: c, options: { breakLine: true } })), { x: 8.7, y: y + 0.12, w: LARG - MX - 8.9, h: Math.min(2.36, 5.96 - y), fontFace: fCorpo, fontSize: 14, color: t.tinta, valign: 'top', paraSpaceAfter: 6, fit: 'shrink' }); }
        break;
      }
      case 'tabela': { const y = cabecalho(sl, s); tabela(sl, s.cabecalho || [], s.linhas || [], y); break; }
      case 'barras': case 'rosca': case 'comparativo': {
        const y = cabecalho(sl, s), leg = (s.legenda || []).map(txt), dois = itens.some((x) => x.valor2);
        tabela(sl, dois ? ['', leg[0] || 'A', leg[1] || 'B'] : [], itens.map((x) => (dois ? [x.titulo, x.valor, x.valor2] : [x.titulo, x.valor])), y);
        break;
      }
      case 'linha': {
        const y = cabecalho(sl, s), rot = (s.rotulos || []).map(txt), series = Array.isArray(s.series) ? s.series : [];
        tabela(sl, ['', ...series.map((x) => txt(x.nome))], rot.map((r, k) => [r, ...series.map((x) => txt(x.valores?.[k]))]), y);
        break;
      }
      case 'numeros': { const y = cabecalho(sl, s); grade(sl, itens.map((x) => ({ ...x, titulo: x.rotulo || x.titulo })), y, { valor: true }); break; }
      case 'imagem': {
        const arq = imagemUsavel(s.imagem, marca.pastaImagens, avisos, `imagem da página ${i + 1}`) || foto;
        if (arq) {
          if (txt(s.etiqueta)) sl.addText(txt(s.etiqueta).toUpperCase(), { x: MX, y: 1.2, w: 5.6, h: 0.35, fontFace: fCorpo, fontSize: 12, bold: true, color: cor, charSpacing: 3 });
          sl.addText(txt(s.titulo), { x: MX, y: 1.65, w: 5.6, h: 2.2, fontFace: fTitulo, fontSize: 30, color: t.tinta, valign: 'top', fit: 'shrink' });
          if (txt(s.subtitulo) || txt(s.texto)) sl.addText(txt(s.subtitulo) || txt(s.texto), { x: MX, y: 3.95, w: 5.6, h: 1.8, fontFace: fCorpo, fontSize: 16, color: t.suave, valign: 'top', fit: 'shrink' });
          figura(sl, arq, 6.9, 0.8, LARG - MX - 6.9, 5.4);
        } else cabecalho(sl, s, 34);
        break;
      }
      case 'perfil': {
        const y = cabecalho(sl, s);
        if (foto) { figura(sl, foto, MX, y, 3.0, 6.2 - y); grade(sl, itens, y, { x: MX + 3.3, w: UTIL - 3.3, cols: itens.length > 3 ? 2 : 1 }); }
        else grade(sl, itens, y);
        break;
      }
      default: {
        const y = cabecalho(sl, s);
        grade(sl, itens, y, { numerar: ['etapas', 'agenda'].includes(s.layout) });
      }
    }
    if (s.layout !== 'capa') rodape(sl, s, i);
  });
  await pptx.writeFile({ fileName: destino });
  return { pptx: destino, avisos };
}
