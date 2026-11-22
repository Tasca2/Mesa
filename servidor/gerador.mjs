import { mkdirSync, mkdtempSync, writeFileSync, existsSync, rmSync, statSync, readFileSync, copyFileSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { montarPaginas, imagemEmbutida, numeroDe, formatador, casasDe, problemasDosSlides, somaRuim, W, H } from './layouts.mjs';

export const ARQUIVO_GERACAO = path.join(os.tmpdir(), 'mesa-do-assessor-geracao.json');

const TAMANHOS = { feed: [1080, 1350], quadrado: [1080, 1080], stories: [1080, 1920] };
const TEMAS = {
  escuro: { fundo: '#101113', tinta: '#F3EEE6', suave: '#A7A7AB', cor: '#E8C88E' },
  claro: { fundo: '#F7F3EC', tinta: '#1B1B1D', suave: '#6B6B70', cor: '#A8741A' },
  marinho: { fundo: '#0B1F33', tinta: '#F1F4F7', suave: '#A3B3C4', cor: '#D8B26A' },
};
const FONTE = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

export function navegador() {
  const e = process.env;
  if (e.MESA_NAVEGADOR && existsSync(e.MESA_NAVEGADOR)) return e.MESA_NAVEGADOR;
  const lista = process.platform === 'win32'
    ? [`${e['ProgramFiles(x86)']}\\Microsoft\\Edge\\Application\\msedge.exe`, `${e.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
       `${e.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`, `${e['ProgramFiles(x86)']}\\Google\\Chrome\\Application\\chrome.exe`, `${e.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`]
    : process.platform === 'darwin'
      ? ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/microsoft-edge', '/usr/bin/google-chrome', '/usr/bin/chromium'];
  return lista.find((p) => p && existsSync(p));
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = (s) => String(s || 'peca').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'peca';
const carimbo = () => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

export function pastaBase() {
  const docs = path.join(os.homedir(), 'Documents');
  const base = path.join(existsSync(docs) ? docs : os.homedir(), 'Mesa do Assessor');
  mkdirSync(base, { recursive: true });
  return base;
}

function executar(bin, args) {
  return new Promise((ok, no) => execFile(bin, args, { timeout: 60000, windowsHide: true }, (e) => (e ? no(e) : ok())));
}

async function renderizar(html, saida, tipo, [w, h]) {
  const bin = navegador();
  if (!bin) throw new Error('Não encontrei o Microsoft Edge nem o Google Chrome neste computador.');
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'mesa-render-'));
  try {
    const arq = path.join(tmp, 'peca.html');
    writeFileSync(arq, html, 'utf8');
    const comum = ['--headless', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--force-device-scale-factor=1', `--user-data-dir=${path.join(tmp, 'perfil')}`];
    const args = tipo === 'png'
      ? [...comum, `--window-size=${w},${h}`, `--screenshot=${saida}`, pathToFileURL(arq).href]
      : [...comum, '--no-pdf-header-footer', `--print-to-pdf=${saida}`, pathToFileURL(arq).href];
    await executar(bin, args);
    let ultimo = -1;
    for (let k = 0; k < 120; k++) {
      if (existsSync(saida)) {
        const tamanho = statSync(saida).size;
        if (tamanho > 0 && tamanho === ultimo) break;
        ultimo = tamanho;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!existsSync(saida)) throw new Error('O navegador não gerou o arquivo.');
  } finally { try { rmSync(tmp, { recursive: true, force: true }); } catch {   } }
}


const TIPOS_SLIDE = ['capa', 'conteudo', 'numero', 'lista', 'comparacao', 'passos', 'citacao', 'fechamento'];

const linhasDe = (t, f, largura, em) => String(t ?? '').split('\n')
  .reduce((n, p) => n + Math.max(1, Math.ceil((p.length * 1.1) / Math.max(1, Math.floor(largura / (f * em))))), 0);
const caberLista = (textos, base, min, largura, altura, lh = 1.2, em = 0.55, gap = 0) => {
  const ts = textos.filter((t) => String(t ?? '').trim());
  for (let f = base; f > min; f -= 2) {
    const h = ts.reduce((s, t) => s + linhasDe(t, f, largura, em) * f * lh, 0) + gap * Math.max(0, ts.length - 1);
    if (h <= altura) return f;
  }
  return min;
};
const caber = (t, base, min, largura, altura, lh, em) => caberLista([t], base, min, largura, altura, lh, em);

const luminancia = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((s, c, k) => s + c * [0.2126, 0.7152, 0.0722][k], 0);
const contraste = (a, b) => { const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const iniciaisDe = (nome) => { const p = String(nome || '').trim().split(/\s+/).filter((w) => /^\p{L}/u.test(w)); return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };

function autorHtml(ctx, grande = false) {
  if (!ctx.foto && !ctx.nome) return '';
  const rosto = ctx.foto ? `<img class="rosto" src="${ctx.foto}" alt="">` : `<span class="rosto iniciais">${esc(iniciaisDe(ctx.nome))}</span>`;
  return `<div class="autor${grande ? ' grande' : ''}">${rosto}<div class="quem">${ctx.nome ? `<b>${esc(ctx.nome)}</b>` : ''}${ctx.cargo ? `<span>${esc(ctx.cargo)}</span>` : ''}</div></div>`;
}

const AJUSTAR = '<script>for (const c of document.querySelectorAll(".corpo")) { const el = [...c.querySelectorAll("[style*=font-size]")]; ' +
  'for (let k = 0; k < 24 && c.scrollHeight > c.clientHeight + 2; k++) for (const e of el) e.style.fontSize = Math.max(16, parseFloat(e.style.fontSize) * 0.94) + "px"; }</script>';

function slideHtml(s, i, n, ctx) {
  const { W, H } = ctx;
  const alt = ctx.altBase - (s.fonte ? 16 + linhasDe(s.fonte, 26, W - 176, 0.5) * 35 : 0);
  const tipo = TIPOS_SLIDE.includes(s.tipo) ? s.tipo : 'conteudo';
  const L = W - 176, ultimo = i === n - 1;
  const fs = (f) => `style="font-size:${f}px"`;
  const h1 = (base, min, h) => `<h1 ${fs(caber(s.titulo, base, min, L, h, 1.08, 0.56))}>${esc(s.titulo)}</h1>`;
  const p = (base, min, h) => (s.texto ? `<p ${fs(caber(s.texto, base, min, L, h, 1.42, 0.5))}>${esc(s.texto)}</p>` : '');
  const grande = (d, max, h) => Math.max(64, Math.min(max, Math.floor(L / (0.6 * Math.max(1, String(d).length))), Math.floor(h)));
  let corpo;
  if (tipo === 'capa') {
    corpo = `<div class="miolo"><div class="regua"></div>${h1(112, 54, alt * 0.55)}` +
      `${s.texto ? `<p class="sub" ${fs(caber(s.texto, 40, 28, L, alt * 0.16, 1.35, 0.5))}>${esc(s.texto)}</p>` : ''}</div>` +
      (ctx.nome || ctx.foto || n > 1 ? `<div class="assina">${autorHtml(ctx)}${n > 1 ? '<div class="arraste">Arraste para o lado <span>→</span></div>' : ''}</div>` : '');
  } else if (tipo === 'numero') {
    const d = String(s.destaque || '');
    corpo = `${h1(64, 40, alt * 0.22)}${d ? `<div class="gigante" ${fs(grande(d, 300, alt * 0.34))}>${esc(d)}</div>` : ''}${p(44, 30, alt * 0.3)}`;
  } else if (tipo === 'lista') {
    const itens = (s.itens || []).filter((x) => x && (x.titulo || x.texto)).slice(0, 4);
    const h = alt * 0.7 - 30 * Math.max(0, itens.length - 1);
    const ft = caberLista(itens.map((x) => x.titulo), 50, 26, L - 100, h * 0.45, 1.18, 0.56);
    const fx = caberLista(itens.map((x) => x.texto), 38, 22, L - 100, h * 0.55, 1.38, 0.5);
    corpo = `${h1(72, 44, alt * 0.22)}<ol class="itens">${itens.map((x, k) => `<li><span class="n">${k + 1}</span><div>` +
      `${x.titulo ? `<b ${fs(ft)}>${esc(x.titulo)}</b>` : ''}${x.texto ? `<span class="tx" ${fs(fx)}>${esc(x.texto)}</span>` : ''}</div></li>`).join('')}</ol>`;
  } else if (tipo === 'comparacao') {
    const cols = (s.colunas || []).filter((c) => c && (c.titulo || c.texto || c.itens?.length)).slice(0, 2);
    const lc = (L - 32) / Math.max(1, cols.length) - 68;
    const ftc = caberLista(cols.map((c) => c.titulo), 46, 28, lc, 110, 1.1, 0.56);
    const fc = Math.min(...cols.map((c) => caberLista(c.itens?.length ? c.itens : [c.texto], 40, 20, lc - 30, alt * 0.62 - 140, 1.35, 0.5, 18)));
    corpo = `${h1(72, 44, alt * 0.22)}<div class="lados">${cols.map((c, k) => `<div class="coluna ${k ? 'b' : 'a'}"><div class="ct" ${fs(ftc)}>${esc(c.titulo || '')}</div>` +
      (c.itens?.length ? `<ul>${c.itens.slice(0, 4).map((x) => `<li ${fs(fc)}>${esc(x)}</li>`).join('')}</ul>` : c.texto ? `<p ${fs(fc)}>${esc(c.texto)}</p>` : '') + '</div>').join('')}</div>`;
  } else if (tipo === 'passos') {
    const ps = (s.passos || []).filter((x) => String(x ?? '').trim()).slice(0, 5);
    const f = caberLista(ps, 46, 24, L - 102, alt * 0.66, 1.3, 0.52, 28);
    corpo = `${h1(72, 44, alt * 0.22)}<ol class="etapas">${ps.map((x, k) => `<li><span class="n">${k + 1}</span><span class="t" ${fs(f)}>${esc(x)}</span></li>`).join('')}</ol>`;
  } else if (tipo === 'citacao') {
    corpo = `${s.titulo ? `<div class="etiqueta">${esc(s.titulo)}</div>` : ''}<div class="aspas">“</div>` +
      `<blockquote ${fs(caber(s.texto || '', 62, 32, L, alt * 0.55, 1.3, 0.52))}>${esc(s.texto || '')}</blockquote>${s.autor ? `<div class="autoria">— ${esc(s.autor)}</div>` : ''}`;
  } else if (tipo === 'fechamento') {
    corpo = `${autorHtml(ctx, true)}${h1(88, 48, alt * 0.3)}${p(44, 30, alt * 0.22)}`;
  } else {
    const d = String(s.destaque || '');
    corpo = `${h1(78, 46, alt * 0.36)}${d ? `<div class="destaque" ${fs(grande(d, 170, alt * 0.22))}>${esc(d)}</div>` : ''}${p(46, 30, alt * 0.4)}`;
  }
  return `<section class="slide ${tipo}" style="width:${W}px;height:${H}px">
  <div class="topo"><span class="marca"></span><span class="cont">${n > 1 ? `${i + 1}/${n}` : ''}</span></div>
  <div class="corpo">${corpo}</div>
  <div class="pe">${s.fonte ? `<div class="fonte">Fonte: ${esc(s.fonte)}</div>` : ''}<div class="linha"><span>${esc(ctx.rodape)}</span>${!ultimo && n > 1 ? '<span class="seta">→</span>' : ''}</div></div>
</section>`;
}

function cssCarrossel({ t, cor, corTexto, sobreCor, formato }) {
  return `*{box-sizing:border-box;margin:0;padding:0}html,body{background:${t.fundo}}body{font-family:${FONTE};-webkit-font-smoothing:antialiased}
.slide{position:relative;overflow:hidden;background:${t.fundo};color:${t.tinta};padding:${formato === 'stories' ? '220px 88px 260px' : '84px 88px 72px'};display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;break-after:page}
.slide::before{content:"";position:absolute;right:-220px;top:-220px;width:620px;height:620px;border-radius:50%;background:${cor};opacity:.10}
.slide::after{content:"";position:absolute;left:0;bottom:0;width:100%;height:10px;background:${cor}}
.topo{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1}.marca{width:22px;height:22px;border-radius:50%;background:${cor}}
.cont{font-size:30px;font-weight:700;color:${t.suave};letter-spacing:.06em}
.corpo{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:safe center;gap:34px;flex:1;min-height:0;overflow:hidden;padding:30px 0}
.regua{width:120px;height:10px;background:${cor};border-radius:6px}
h1{font-weight:800;line-height:1.08;letter-spacing:-.01em;word-break:break-word}
p{line-height:1.42;color:${t.tinta};opacity:.88;white-space:pre-wrap;word-break:break-word}
.destaque,.gigante{font-weight:800;line-height:1;color:${corTexto};letter-spacing:-.02em;white-space:nowrap}
.gigante{line-height:.95;letter-spacing:-.03em}
.capa .corpo{justify-content:space-between}.miolo{display:flex;flex-direction:column;justify-content:safe center;gap:34px;flex:1}
.sub{color:${t.suave};opacity:1;line-height:1.35}
.assina{display:flex;align-items:center;justify-content:space-between;gap:28px}
.autor{display:flex;align-items:center;gap:24px;min-width:0}
.rosto{flex:none;width:124px;height:124px;border-radius:50%;object-fit:cover;border:4px solid ${cor}}
.iniciais{display:flex;align-items:center;justify-content:center;background:${cor};color:${sobreCor};font-weight:800;font-size:46px;letter-spacing:.02em}
.quem{display:flex;flex-direction:column;gap:6px;min-width:0}.quem b{font-size:34px;font-weight:700;line-height:1.2}.quem span{font-size:25px;color:${t.suave};line-height:1.3}
.autor.grande .rosto{width:210px;height:210px;border-width:6px}.autor.grande .iniciais{font-size:76px}.autor.grande .quem b{font-size:44px}.autor.grande .quem span{font-size:30px}
.arraste{flex:none;display:flex;align-items:center;gap:14px;font-size:28px;font-weight:700;border:2px solid ${corTexto};border-radius:999px;padding:14px 28px}
.arraste span{color:${corTexto};font-size:38px;line-height:1}
.n{flex:none;width:72px;height:72px;border-radius:50%;background:${cor};color:${sobreCor};font-weight:800;font-size:36px;display:flex;align-items:center;justify-content:center}
.itens,.etapas{list-style:none;display:flex;flex-direction:column;position:relative}.itens{gap:30px}.etapas{gap:28px}
.itens li{display:flex;gap:28px;align-items:flex-start}.itens b{display:block;font-weight:700;line-height:1.18}.itens .tx{display:block;margin-top:8px;line-height:1.38;color:${t.suave}}
.etapas::before{content:"";position:absolute;left:34px;top:36px;bottom:36px;width:4px;background:${cor};opacity:.45}
.etapas li{display:flex;gap:30px;align-items:center;position:relative}.etapas .t{line-height:1.3;font-weight:600}
.lados{display:flex;gap:32px}.coluna{flex:1;min-width:0;border:2px solid ${t.suave}66;border-radius:28px;padding:34px 32px;display:flex;flex-direction:column;gap:20px}
.coluna.b{border-color:${cor};background:${cor}14}.ct{font-weight:800;line-height:1.1}.coluna.b .ct{color:${corTexto}}
.coluna ul{list-style:none;display:flex;flex-direction:column;gap:18px}.coluna li{line-height:1.35;padding-left:30px;position:relative}
.coluna li::before{content:"";position:absolute;left:0;top:.5em;width:12px;height:12px;border-radius:50%;background:${cor}}.coluna p{line-height:1.4;opacity:1}
.etiqueta{font-size:28px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${corTexto}}
.aspas{font-family:Georgia,'Times New Roman',serif;font-size:220px;line-height:.62;height:110px;color:${cor}}
blockquote{font-weight:600;line-height:1.3;word-break:break-word}.autoria{font-size:32px;color:${t.suave}}
.pe{position:relative;z-index:1;display:flex;flex-direction:column;gap:16px}
.fonte{font-size:26px;color:${t.suave}}
.linha{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;font-size:26px;line-height:1.35;color:${t.suave};border-top:2px solid ${t.suave}55;padding-top:18px}
.seta{font-size:54px;color:${corTexto};line-height:1}`;
}

export function montarCarrossel(a, marcaBase = {}) {
  const slides = Array.isArray(a.slides) ? a.slides.slice(0, 10) : [];
  if (!slides.length) throw new Error('Envie pelo menos um slide.');
  const formato = TAMANHOS[a.formato] ? a.formato : 'feed';
  const [W, H] = TAMANHOS[formato];
  const t = TEMAS[a.tema] ?? TEMAS[marcaBase.tema] ?? TEMAS.escuro;
  const hex = (c) => /^#[0-9a-fA-F]{6}$/.test(c || '');
  const cor = hex(a.cor) ? a.cor : hex(marcaBase.cor) ? marcaBase.cor : t.cor;
  const avisos = [];
  const ctx = {
    t, cor, formato, W, H, rodape: a.rodape || '',
    corTexto: contraste(cor, t.fundo) >= 3 ? cor : t.cor,
    sobreCor: contraste(t.fundo, cor) >= contraste(t.tinta, cor) ? t.fundo : t.tinta,
    altBase: H - (formato === 'stories' ? 480 : 156) - 112 - (20 + linhasDe(a.rodape || '', 26, W - 260, 0.5) * 35),
    foto: imagemEmbutida(marcaBase.foto, avisos, 'foto'),
    nome: String(marcaBase.nome || '').trim(),
    cargo: [marcaBase.cargo, marcaBase.escritorio].map((x) => String(x || '').trim()).filter(Boolean).join(' · '),
  };
  return { W, H, css: cssCarrossel(ctx), slides: slides.map((s, i) => slideHtml(s, i, slides.length, ctx)), avisos };
}

const textosDoSlide = (s) => [s.titulo, s.texto, s.destaque, s.autor,
  ...(s.itens || []).flatMap((x) => (typeof x === 'string' ? [x] : [x?.titulo, x?.texto])),
  ...(s.colunas || []).flatMap((c) => [c?.titulo, c?.texto, ...(c?.itens || [])]),
  ...(s.passos || [])].filter((t) => typeof t === 'string' && t.trim());
export function revisarCarrossel(slides, termosConfirmados = [], rodape = '') {
  const ok = (Array.isArray(termosConfirmados) ? termosConfirmados : []).map(SEMACENTO);
  const liberado = (m) => ok.some((c) => c && (m.includes(c) || c.includes(m)));
  const achados = [];
  const lista = (onde, t) => {
    const n = SEMACENTO(t);
    for (const [nome, re] of TERMOS_RISCO_MERCADO) { const m = ocorrencia(n, nome, re); if (m && !liberado(m[0])) achados.push(`${onde}: "${t.trim().slice(0, 90)}" (${nome})`); }
  };
  if (typeof rodape === 'string' && rodape.trim()) lista('rodapé', rodape);
  (Array.isArray(slides) ? slides : []).forEach((s, k) => {
    const textos = textosDoSlide(s || {}), fonte = typeof s?.fonte === 'string' ? s.fonte : '';
    const comPeriodo = PERIODO.test(SEMACENTO([...textos, fonte].join(' · ')));
    for (const t of textos) {
      lista(`slide ${k + 1}`, t);
      const m = comPeriodo ? null : SEMACENTO(t).match(RETORNO);
      if (m && !liberado(m[0])) achados.push(`slide ${k + 1}: "${t.trim().slice(0, 90)}" (retorno sem período)`);
    }
    if (fonte.trim()) lista(`slide ${k + 1}, fonte`, fonte);
  });
  return achados;
}

const RESERVADOS = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
export function resolverPasta(base, pedido) {
  const partes = String(pedido ?? '').split(/[\\/]+/)
    .map((p) => p.normalize('NFC').replace(/[^\p{L}\p{N} _.-]/gu, '').replace(/\s+/g, ' ').replace(/^[\s.]+|[\s.]+$/g, '').slice(0, 60).replace(/[\s.]+$/g, ''))
    .filter(Boolean)
    .map((p) => (RESERVADOS.test(p.split('.')[0]) ? '_' + p : p));
  if (!partes.length) return null;
  const segs = partes.length > 3 ? [...partes.slice(0, 2), partes.slice(2).join('-').slice(0, 60)] : partes;
  const raiz = path.resolve(base);
  const dentro = (p) => { const r = path.relative(raiz, p); return !!r && !r.startsWith('..') && !path.isAbsolute(r); };
  const ocupada = (p) => { try { return existsSync(p) && (!statSync(p).isDirectory() || readdirSync(p).length > 0); } catch { return true; } };
  let alvo = path.join(raiz, ...segs);
  if (!dentro(alvo)) return null;
  for (let k = 2; ocupada(alvo); k++) alvo = path.join(raiz, ...segs.slice(0, -1), `${segs[segs.length - 1]} (${k})`);
  return alvo;
}

export async function gerarCarrossel(a, marcaBase = {}) {
  const slides = Array.isArray(a.slides) ? a.slides.slice(0, 10) : [];
  if (!slides.length) throw new Error('Envie pelo menos um slide.');
  const risco = revisarCarrossel(slides, a.termosConfirmados || [], a.rodape);
  if (risco.length) {
    throw Object.assign(new Error('estas frases afirmam algo que o assessor pode não ter dito: ' + risco.join(' | ') +
      '. Reescreva cada uma só com o que o assessor informou e chame de novo; se o assessor realmente afirmou o termo, repita a chamada com termosConfirmados (a lista dos termos).' +
      (risco.some((x) => x.endsWith('(retorno sem período)')) ? ' Rentabilidade e retorno precisam do período no mesmo slide (ex.: "em 12 meses até out/2026").' : '')), { trava: true });
  }
  const m = montarCarrossel({ ...a, slides }, marcaBase);
  const base = pastaBase();
  const pasta = (a.pasta && resolverPasta(base, a.pasta)) || path.join(base, `${slug(a.titulo)}-${carimbo()}`);
  mkdirSync(pasta, { recursive: true });
  const imagens = [];
  for (let i = 0; i < m.slides.length; i++) {
    const saida = path.join(pasta, `slide-${String(i + 1).padStart(2, '0')}.png`);
    await renderizar(`<!doctype html><meta charset="utf-8"><style>${m.css}</style>${m.slides[i]}${AJUSTAR}`, saida, 'png', [m.W, m.H]);
    imagens.push(saida);
  }
  const pdf = path.join(pasta, `${slug(a.titulo)}.pdf`);
  await renderizar(`<!doctype html><meta charset="utf-8"><style>@page{size:${m.W}px ${m.H}px;margin:0}${m.css}</style>${m.slides.join('')}${AJUSTAR}`, pdf, 'pdf', [m.W, m.H]);
  const r = { tipo: 'carrossel', titulo: a.titulo, pasta, imagens, pdf, avisos: m.avisos, em: Date.now() };
  writeFileSync(ARQUIVO_GERACAO, JSON.stringify({ ...r, avisos: undefined }));
  return r;
}

export const TIPOS_MATERIAL = ['reuniao', 'carteira', 'relatorio', 'proposta', 'diagnostico', 'estudo', 'mercado', 'geral'];

const SEMACENTO = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const TERMOS_RISCO = [
  ['independên', /independen/], ['sem custo / gratuito', /sem custo|custo zero|gratuit|sem cobranca|sem taxa/], ['sem surpresa', /sem surpresa/],
  ['custo embutido / como o cliente é informado', /embutid|voce sabe|sabe como|desde o (primeiro dia|inicio|comeco)|direito de perguntar|informado antes|declarado antes|totalmente transparente|transparencia total|transparentes?\b|sem letras miudas/],
  ['regulação ou supervisão', /regulad|regulat|supervisionad|fiscalizad|autorizad[oa] (pelo|pela)|banco central|\bcvm\b/],
  ['generalização sobre o mercado', /modelo padrao|padrao do (mercado|setor|assessor)|pratica (comum|de mercado)|comum no mercado|como todo|seguranca para (o|a|os|as) /],
  ['plataforma ou aplicativo de acompanhamento', /plataforma|aplicativo|\bapp\b/], ['garantia', /garantia|garantid[oa]|garantimos|\bgarante\b|garantir (retorno|rentab|resultado)/],
  ['superlativo', /\b(o|a|os|as) melhor(es)?\b|\bmelhor (assessor|escritorio|opcao|carteira|solucao|do mercado)|visibilidade total|boas maos|equipe completa|multidisciplinar|\bunic[oa]s?\b|exclusiv|\blider|premiad|referencia (do|no) mercado/],
  ['risco', /sem risco|risco zero|seguranca total/], ['retorno', /rentabilidade|retorno (de|acima)|\brende\b|\brendimento (de|acima)/],
];
const TERMOS_RISCO_MERCADO = [
  ['promessa de retorno', /garantia de (retorno|rentabilidade|resultado|lucro|ganho|rendimento)|(retorno|rentabilidade|resultado|lucro|ganho|rendimento)s? (garantid|cert[oa]s?\b|assegurad)|garantimos|\bgarante (o |a )?(retorno|rentabilidade|resultado|lucro|ganho)|\bvai render\b|\brendera\b|\b(acao|acoes|papel|papeis|ativo|ativos|fundo|fundos|cota|cotas|carteira|bolsa|ibovespa|investimento|investimentos|aplicacao|aplicacoes|titulo|titulos|preco|precos|patrimonio|dinheiro|[a-z]{4}\d{1,2})\b[^.;:!?]{0,40}?\b(vai (subir|disparar|valorizar|dobrar)|subira|valorizara|disparara|dobrara)\b|valorizacao (garantida|certa)|nao tem como perder|dinheiro facil|ganho facil/],
  ['risco', /sem risco|risco zero|zero risco|seguranca total|100% segur/],
  ['superlativo', /\b(o|a|os|as) melhor(es)?(?= (acao|acoes|investimento|investimentos|opcao|opcoes|fundo|fundos|aplicacao|aplicacoes|ativo|ativos|carteira|carteiras|momento|hora|oportunidade|escolha|escolhas|relacao|alternativa|alternativas|papel|papeis|empresa|empresas|aposta|apostas|compra|entrada|produto|produtos|titulo|titulos)\b| (do|da|dos|das|de)\b|\s*[.,;:!?)]|\s*$)|melhor do mercado|imperdivel|oportunidade unica|unica chance|\bimbativel|retorno extraordinario|(^|[.!?:;]\s*)melhor(es)? (acao|acoes|investimento|investimentos|opcao|opcoes|fundo|fundos|aplicacao|aplicacoes|ativo|ativos|carteira|carteiras|escolha|alternativa|alternativas|produto|produtos|titulo|titulos)\b/],
];
const RETORNO = /\b(rentabilidade|retorno|rendimento|rende)\b/;
const NEGACAO = /\b(nao|nem|nenhum|nenhuma|sem|jamais|nunca)\b/;
const PERGUNTA = /\b(qual|quais)\b/;
function ocorrencia(n, nome, re) {
  for (const m of n.matchAll(new RegExp(re.source, 'g'))) {
    const antes = n.slice(0, m.index).split(/[.;:!?,]/).pop().trim().split(/\s+/).slice(-4).join(' ');
    if (NEGACAO.test(antes) || (nome === 'superlativo' && PERGUNTA.test(antes))) continue;
    return m;
  }
  return null;
}
const MESES = 'jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez';
const PERIODO = new RegExp([
  String.raw`\b\d+\s*(m|meses|mes|anos?|dias?|semanas?|trimestres?|semestres?)\b`, String.raw`\bao (ano|mes|dia)\b`, String.raw`\bno (ano|mes|trimestre|semestre|periodo)\b`,
  String.raw`\bnos ultimos\b`, String.raw`\bna semana\b`, String.raw`\bdesde\b`, String.raw`\bacumulad`, String.raw`\b(19|20)\d{2}\b`, String.raw`\b\d{1,2}\/(19|20)?\d{2}\b`,
  String.raw`\b(${MESES})[a-z]*\.?\/?\s?(de\s)?((19|20)?\d{2})\b`, String.raw`\bjanela\b`, String.raw`\bytd\b`, String.raw`\bdata-base\b`,
].join('|'));

function textosDaPagina(s) {
  const out = [];
  const add = (t) => { if (typeof t === 'string' && t.trim()) out.push(t); };
  [s.titulo, s.subtitulo, s.texto, s.etiqueta, s.ponte].forEach(add);
  (s.itens || []).forEach((x) => [x.titulo, x.texto, x.rotulo, x.ligacao].forEach(add));
  [...(s.passos || []), ...(s.contato || []), ...(s.cabecalho || []), ...(s.legenda || [])].forEach(add);
  (s.linhas || []).forEach((l) => (l || []).forEach(add));
  (s.series || []).forEach((x) => add(x?.nome));
  return out;
}
const fontesDaPagina = (s) => [s.fonte, s.inicio, ...(s.itens || []).flatMap((x) => [x?.fonte, x?.valor, x?.valor2]), ...(s.rotulos || [])].filter((t) => typeof t === 'string' && t.trim());

const liberador = (termosConfirmados) => {
  const ok = (Array.isArray(termosConfirmados) ? termosConfirmados : []).map(SEMACENTO);
  return (m) => ok.some((c) => c && (m.includes(c) || c.includes(m)));
};
function travaMenor(onde, textos, liberado, achados) {
  for (const t of textos) {
    if (typeof t !== 'string' || !t.trim() || /\[CONFERIR/i.test(t)) continue;
    const n = SEMACENTO(t);
    for (const [nome, re] of TERMOS_RISCO_MERCADO) {
      const m = ocorrencia(n, nome, re);
      if (m && !liberado(m[0])) achados.push(`${onde}: "${t.trim().slice(0, 90)}" (${nome})`);
    }
  }
}
const mensagemDaTrava = (risco, onde = 'página') => 'o PDF não foi gerado porque estas frases afirmam algo que o assessor pode não ter dito: ' + risco.join(' | ') +
  '. Reescreva cada uma só com o que o assessor informou, ou acrescente [CONFERIR] no texto; se o assessor realmente afirmou o termo, repita a chamada com termosConfirmados (a lista dos termos).' +
  (risco.some((x) => x.endsWith('(retorno sem período)')) ? ` Rentabilidade e retorno precisam do período na mesma ${onde} (ex.: "em 12 meses até out/2026").` : '');

export function revisarApresentacao(slides, termosConfirmados = [], tipo, geral = {}) {
  const mercado = tipo === 'mercado' || tipo === 'estudo';
  const lista = mercado ? TERMOS_RISCO_MERCADO : TERMOS_RISCO;
  const liberado = liberador(termosConfirmados);
  const achados = [];
  for (const [nome, t] of [['título', geral.titulo], ['rodapé', geral.rodape], ['cliente', geral.cliente]]) travaMenor(nome, [t], liberado, achados);
  slides.forEach((s, k) => {
    const textos = textosDaPagina(s), fontes = fontesDaPagina(s);
    const comPeriodo = PERIODO.test(SEMACENTO([...textos, ...fontes].join(' · ')));
    for (const t of textos) {
      if (/\[CONFERIR/i.test(t)) continue;
      const n = SEMACENTO(t);
      for (const [nome, re] of lista) {
        const m = lista === TERMOS_RISCO_MERCADO ? ocorrencia(n, nome, re) : n.match(re);
        if (m && !liberado(m[0])) achados.push(`página ${k + 1}: "${t.slice(0, 90)}" (${nome})`);
      }
      if (mercado && !comPeriodo) {
        const m = n.match(RETORNO);
        if (m && !liberado(m[0])) achados.push(`página ${k + 1}: "${t.slice(0, 90)}" (retorno sem período)`);
      }
    }
    travaMenor(`página ${k + 1}`, fontes, liberado, achados);
  });
  return achados;
}

export function revisarDocumento(a, termosConfirmados = a?.termosConfirmados) {
  const mercado = a?.tipo === 'mercado' || a?.tipo === 'estudo';
  const liberado = liberador(termosConfirmados);
  const achados = [];
  const linhas = (xs) => xs.filter((t) => typeof t === 'string').flatMap((t) => t.split('\n')).map((t) => t.trim()).filter(Boolean);
  const unidade = (onde, afirmacoes, referencias) => {
    const af = linhas(afirmacoes), ref = linhas(referencias);
    travaMenor(onde, [...af, ...ref], liberado, achados);
    if (!mercado || PERIODO.test(SEMACENTO([...af, ...ref].join(' · ')))) return;
    for (const t of af) {
      if (/\[CONFERIR/i.test(t)) continue;
      const m = SEMACENTO(t).match(RETORNO);
      if (m && !liberado(m[0])) achados.push(`${onde}: "${t.slice(0, 90)}" (retorno sem período)`);
    }
  };
  const lista = (x) => (Array.isArray(x) ? x : []);
  unidade('cabeçalho', [a?.titulo, a?.subtitulo], [a?.cliente, a?.dataBase, a?.rodape]);
  lista(a?.secoes).slice(0, 30).forEach((s, i) => {
    const g = s?.grafico || {};
    const cartoes = i === 0 ? lista(a?.destaques).flatMap((x) => [x?.rotulo, x?.valor, x?.nota]) : [];
    unidade(`seção ${i + 1}${s?.titulo ? ` (${String(s.titulo).slice(0, 40)})` : ''}`, [s?.titulo, s?.texto, g.titulo, ...cartoes],
      [g.fonte, g.categoria, g.inicio, ...lista(g.rotulos), ...lista(g.series).map((x) => x?.nome)]);
  });
  return achados;
}

export async function gerarApresentacao(a, marcaBase = {}) {
  const slides = Array.isArray(a.slides) ? a.slides.slice(0, 18) : [];
  if (!slides.length) throw new Error('Envie pelo menos um slide.');
  const graficos = problemasDosSlides(slides);
  if (graficos.length) throw new Error('o PDF não foi gerado porque um gráfico está com número faltando ou que não é número: ' + graficos.join(' | ') + '. Corrija os valores e chame de novo.');
  const risco = revisarApresentacao(slides, a.termosConfirmados || [], a.tipo, { titulo: a.titulo, rodape: a.rodape, cliente: a.cliente });
  if (risco.length) throw new Error(mensagemDaTrava(risco));
  const avisos = [];
  const marca = {
    ...marcaBase,
    ...Object.fromEntries(['tema', 'estilo', 'cor', 'rodape', 'nome', 'cargo', 'escritorio', 'cliente'].filter((k) => a[k]).map((k) => [k, a[k]])),
  };
  marca.pastaImagens = path.join(pastaBase(), 'Minhas imagens');
  mkdirSync(marca.pastaImagens, { recursive: true });
  marca.avisos = avisos;
  marca.logo = imagemEmbutida(a.logo || marcaBase.logo, avisos, 'logo');
  marca.foto = imagemEmbutida(a.foto || marcaBase.foto, avisos, 'foto');
  const { css: estilo, html } = montarPaginas(slides, marca);
  const doc = `<!doctype html><meta charset="utf-8"><title>${esc(a.titulo)}</title><style>${estilo}</style>${html}`;
  const pasta = path.join(pastaBase(), `${slug(a.titulo)}-${carimbo()}`);
  mkdirSync(pasta, { recursive: true });
  const pdf = path.join(pasta, `${slug(a.titulo)}.pdf`);
  await renderizar(doc, pdf, 'pdf', [W, H]);
  const imagens = [];
  if (a.previas) {
    for (let i = 0; i < slides.length; i++) {
      const um = montarPaginas([slides[i]], marca, i, slides.length);
      const saida = path.join(pasta, `pagina-${String(i + 1).padStart(2, '0')}.png`);
      await renderizar(`<!doctype html><meta charset="utf-8"><style>${um.css}</style>${um.html}`, saida, 'png', [W, H]);
      imagens.push(saida);
    }
  }
  const pendencias = (JSON.stringify(slides).match(/\[CONFERIR/g) || []).length;
  if (pendencias) avisos.push(`${pendencias} trecho(s) marcados com [CONFERIR] aparecem destacados nas páginas: o assessor precisa validar ou preencher antes de usar.`);
  let pptx = '';
  if (a.pptx !== false) {
    try {
      const { gerarPptx } = await import('./pptx.mjs');
      const p = await gerarPptx({ titulo: a.titulo, slides }, { ...marca, logoArquivo: a.logo || marcaBase.logo, fotoArquivo: a.foto || marcaBase.foto }, path.join(pasta, `${slug(a.titulo)}.pptx`));
      pptx = p.pptx; avisos.push(...p.avisos);
    } catch { avisos.push('O PowerPoint editável não foi gerado nesta vez; o PDF está pronto.'); }
  }
  const r = { tipo: 'apresentacao', titulo: a.titulo, pasta, imagens, pdf, pptx, avisos, pendencias, minhasImagens: marca.pastaImagens, em: Date.now() };
  writeFileSync(ARQUIVO_GERACAO, JSON.stringify({ ...r, avisos: undefined }));
  return r;
}


const CELULA_NUMERO = /^([▲▼●✓]\s*)?[+\-−–]?\s*(R\$|US\$|€)?\s*[+\-−–]?\d[\d.,]*\s*(%|p\.p\.|x|bi|mi|mil|pts?)?$|^[–—-]$/i;
const textoPuro = (h) => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

export function mdParaHtml(texto) {
  const linhas = esc(texto).split('\n');
  const inl = (s) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  let out = '', lista = null, tab = [];
  const fechaLista = () => { if (lista) { out += `</${lista}>`; lista = null; } };
  const abreLista = (tipo, inicio = 1) => {
    if (lista === tipo) return;
    fechaLista();
    out += tipo === 'ol' && inicio !== 1 ? `<ol start="${inicio}">` : `<${tipo}>`;
    lista = tipo;
  };
  const fechaTab = () => {
    if (!tab.length) return;
    const linhasTab = tab.filter((l) => !/^\|?\s*:?-{2,}/.test(l.replace(/\s/g, ''))).map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => inl(c.trim())));
    tab = [];
    if (!linhasTab.length) return;
    const [cab, ...corpo] = linhasTab;
    const numerica = cab.map((_, c) => {
      if (c === 0) return false;
      const cel = corpo.map((l) => textoPuro(l[c] ?? '')).filter(Boolean);
      return cel.length > 0 && cel.filter((x) => CELULA_NUMERO.test(x)).length / cel.length >= 0.6;
    });
    const classe = (c, txt) => {
      const k = [numerica[c] ? 'n' : '', /^[▲✓]/.test(txt) ? 'up' : /^▼/.test(txt) ? 'down' : /^●/.test(txt) ? 'mid' : ''].filter(Boolean).join(' ');
      return k ? ` class="${k}"` : '';
    };
    const curta = corpo.length <= 12;
    out += `<table${curta ? ' class="curta"' : ''}><thead><tr>${cab.map((h, c) => `<th${numerica[c] ? ' class="n"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>` +
      corpo.map((l) => `<tr${/^total\b/i.test(textoPuro(l[0] ?? '')) ? ' class="total"' : ''}>${l.map((h, c) => `<td${classe(c, textoPuro(h))}>${h}</td>`).join('')}</tr>`).join('') +
      '</tbody></table>';
  };
  for (const l of linhas) {
    if (/^\s*\|.*\|\s*$/.test(l)) { fechaLista(); tab.push(l.trim()); continue; }
    fechaTab();
    const num = l.match(/^\s*(\d{1,2})[.)]\s+(.*)$/);
    if (num) { abreLista('ol', Number(num[1])); out += `<li>${inl(num[2])}</li>`; continue; }
    const mar = l.match(/^\s*[-*•]\s+(.*)$/);
    if (mar) { abreLista('ul'); out += `<li>${inl(mar[1])}</li>`; continue; }
    fechaLista();
    if (/^#{1,4} /.test(l)) out += `<h3>${inl(l.replace(/^#{1,4} /, ''))}</h3>`;
    else if (l.trim()) out += `<p>${inl(l)}</p>`;
  }
  fechaLista(); fechaTab();
  return out;
}

const AQUI_GERADOR = path.dirname(fileURLToPath(import.meta.url));
const logoCaptaMais = () => {
  try {
    const f = path.join(AQUI_GERADOR, 'assets', 'captamais.png');
    return existsSync(f) ? `data:image/png;base64,${readFileSync(f).toString('base64')}` : '';
  } catch { return ''; }
};
const AVISO_CURTO = 'Material informativo e educacional. Não é recomendação de compra, venda ou alocação de ativos, nem promessa de retorno.';
const AVISO_TIPO = {
  geral: 'Não constitui oferta nem solicitação de investimento. Rentabilidade passada não garante resultado futuro. Confira os dados nas fontes citadas e avalie qualquer decisão à luz do perfil, dos objetivos e do prazo de cada pessoa.',
  carteira: 'As carteiras comparadas foram informadas pelo assessor, na data-base indicada. A comparação não considera impostos nem custos de uma troca; a adequação ao perfil, aos objetivos e ao prazo do cliente é avaliada à parte.',
  relatorio: 'Números da carteira informados pelo assessor; índices e dados de mercado com fonte e data no próprio texto. Rentabilidade passada não garante resultado futuro.',
  proposta: 'Condições descritas conforme informadas pelo escritório. Esta proposta não é oferta de valor mobiliário nem promessa de resultado.',
  diagnostico: 'Retrato montado com os números informados pelo cliente, na data indicada. Serve para organizar a conversa: não é plano financeiro nem indicação de produto.',
  estudo: 'Rentabilidade passada não garante resultado futuro. Preços-alvo e recomendações citados são opiniões das próprias casas de research. Confira os dados nas fontes citadas.',
  mercado: 'Dados públicos com fonte e data no próprio texto, sujeitos a revisão pelas próprias fontes. Expectativas de mercado não são previsão nem garantia.',
};
const AVISO_RESEARCH = 'Preços-alvo e recomendações de casas de research são opiniões das próprias casas.';
const CITA_RESEARCH = /pre[çc]os?[- ]alvo|research|recomenda[çc](ão|ões) (de|das) casas/i;

const TEMAS_A4 = {
  marinho: { forte: '#12202b', acento: '#A8741A', cab: '#12202b', cabTx: '#ffffff', zebra: '#f6f7f9', linha: '#d9dbe0', suave: '#6b6b70', texto: '#1b1b1d', sub: '#555a63', total: '#eef0f3' },
  escuro: { forte: '#1d1d20', acento: '#A8741A', cab: '#1d1d20', cabTx: '#ffffff', zebra: '#f5f5f4', linha: '#dadad8', suave: '#68686d', texto: '#1b1b1d', sub: '#535358', total: '#ececea' },
  claro: { forte: '#3d3529', acento: '#8A6A2B', cab: '#ECE6D9', cabTx: '#2b261e', zebra: '#faf7f1', linha: '#e4ddcf', suave: '#6f695e', texto: '#2b261e', sub: '#5f584c', total: '#f1ebdf' },
};
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, p) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, k) => Math.round(v + (B[k] - v) * p).toString(16).padStart(2, '0')).join(''); };

function dadosDoGrafico(g, onde) {
  const tipo = g?.tipo;
  if (!['barras', 'barras-duplas', 'rosca', 'linha'].includes(tipo)) throw new Error(`${onde}: tipo de gráfico desconhecido (use barras, barras-duplas, rosca ou linha).`);
  let rotulos = (Array.isArray(g.rotulos) ? g.rotulos : []).map((r) => String(r ?? ''));
  const max = tipo === 'linha' ? 3 : 2;
  let series = (Array.isArray(g.series) ? g.series : []).slice(0, max).map((s, k) => ({ nome: String(s?.nome || (k ? `Série ${k + 1}` : 'Valor')), valores: (s?.valores || []).map(numeroDe) }));
  if (!rotulos.length || !series.length) throw new Error(`${onde}: o gráfico precisa de rótulos e de pelo menos uma série.`);
  if (tipo === 'rosca' && rotulos.length > 8) throw new Error(`${onde}: a rosca aceita até 8 fatias.`);
  for (const s of series) {
    if (s.valores.length !== rotulos.length || s.valores.some((v) => !Number.isFinite(v))) throw new Error(`${onde}: a série "${s.nome}" precisa de um valor para cada rótulo (${rotulos.length}), só números.`);
  }
  if (tipo === 'rosca' && series.some((s) => s.valores.some((v) => v < 0))) throw new Error(`${onde}: a rosca só aceita valores positivos.`);
  let unidade = String(g.unidade ?? '').trim(), casas;
  if (tipo === 'rosca' && series.length === 2 && unidade !== '%') throw new Error(`${onde}: a rosca com duas séries (ex.: política × atual) compara participações: mande as duas séries em %, cada uma somando 100%.`);
  let bandas = null;
  if (g.bandas !== undefined && g.bandas !== null) {
    if (tipo === 'linha' || series.length !== 2) throw new Error(`${onde}: bandas só valem com duas séries (alvo e atual), em barras-duplas ou rosca.`);
    bandas = (Array.isArray(g.bandas) ? g.bandas : []).map(numeroDe);
    if (bandas.length !== rotulos.length || bandas.some((b) => !Number.isFinite(b) || b < 0)) throw new Error(`${onde}: mande uma banda para cada rótulo (${rotulos.length}), em números a partir de zero.`);
  }
  if (tipo === 'rosca' && unidade === '%') {
    for (const s of series) { const soma = s.valores.reduce((a, v) => a + v, 0); if (Math.abs(soma - 100) > 1) throw new Error(`${onde}: ${somaRuim(soma)}.`); }
  }
  if (tipo === 'linha' && (g.retornos || g.base100)) {
    if (g.retornos) {
      rotulos = [String(g.inicio || 'Início'), ...rotulos];
      series = series.map((s) => { let v = 100; return { ...s, valores: [100, ...s.valores.map((r) => (v *= 1 + r / 100))] }; });
    } else {
      if (series.some((s) => !(s.valores[0] > 0))) throw new Error(`${onde}: para base 100, o primeiro valor de cada série precisa ser maior que zero.`);
      series = series.map((s) => ({ ...s, valores: s.valores.map((v) => (v / s.valores[0]) * 100) }));
    }
    unidade = ''; casas = 2;
  }
  if (casas === undefined) {
    const dec = Math.max(0, ...(g.casas !== undefined ? [] : series.flatMap((s) => s.valores.map(casasDe))));
    casas = g.casas !== undefined ? Math.max(0, Math.min(4, Math.round(g.casas))) : /^(R\$|US\$|€)/.test(unidade) ? (dec > 0 ? 2 : 0) : Math.min(2, dec);
  }
  const fmt = formatador(unidade, casas);
  const unidadeDif = unidade === '%' ? 'p.p.' : unidade;
  return { tipo, rotulos, series, unidade, fmt, fmtDif: formatador(unidadeDif, casas), unidadeDif, bandas, base100: tipo === 'linha' && !!(g.retornos || g.base100) };
}

const svgTexto = (x, y, txt, attrs = '') => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}"${attrs}>${esc(txt)}</text>`;

function svgBarras(d, cores) {
  const LARG = 680, nS = d.series.length, barra = nS > 1 ? 12 : 16, entre = 4, linha = nS * barra + (nS - 1) * entre + 13;
  const todos = d.series.flatMap((s) => s.valores), min = Math.min(0, ...todos), max = Math.max(0, ...todos);
  const rotulo = Math.max(90, Math.min(250, 10 + Math.max(...d.rotulos.map((r) => r.length)) * 6.6));
  const ini = rotulo + (min < 0 ? 64 : 0), fim = LARG - 70, x = (v) => ini + ((v - min) / ((max - min) || 1)) * (fim - ini), x0 = x(0);
  const alto = d.rotulos.length * linha + 6;
  let o = '';
  d.rotulos.forEach((r, i) => {
    const y = 4 + i * linha;
    o += svgTexto(0, y + (nS * barra + (nS - 1) * entre) / 2 + 4.5, r, ' class="cat"');
    d.series.forEach((s, k) => {
      const v = s.valores[i], yb = y + k * (barra + entre), xv = x(v), xa = Math.min(x0, xv), w = Math.max(1.5, Math.abs(xv - x0));
      o += `<rect x="${xa.toFixed(1)}" y="${yb.toFixed(1)}" width="${w.toFixed(1)}" height="${barra}" rx="2.5" fill="${cores[k]}"/>`;
      o += svgTexto(v >= 0 ? xa + w + 6 : xa - 6, yb + barra - 3, d.fmt(v), ` class="gv" data-s="${k}" data-i="${i}" text-anchor="${v >= 0 ? 'start' : 'end'}"`);
    });
  });
  if (min < 0) o += `<line x1="${x0.toFixed(1)}" y1="0" x2="${x0.toFixed(1)}" y2="${alto}" stroke="#9aa0a8" stroke-width="1"/>`;
  return `<svg viewBox="0 0 ${LARG} ${alto}" width="100%" role="img">${o}</svg>`;
}

function svgRosca(d, cores) {
  if (d.series.length === 2) return svgRoscaDupla(d, cores);
  const LARG = 680, R = 88, r = 54, cx = 100, vals = d.series[0].valores, total = vals.reduce((a, v) => a + v, 0) || 1;
  const linhaLeg = 25, alto = Math.max(200, d.rotulos.length * linhaLeg + 12);
  const ponto = (ang, raio) => [cx + raio * Math.cos(ang), (alto / 2) + raio * Math.sin(ang)];
  let o = '', ang = -Math.PI / 2;
  vals.forEach((v, k) => {
    const f = v / total;
    if (f <= 0) return;
    if (f >= 0.9999) { o += `<circle cx="${cx}" cy="${alto / 2}" r="${(R + r) / 2}" fill="none" stroke="${cores[k]}" stroke-width="${R - r}"/>`; return; }
    const a2 = ang + f * 2 * Math.PI, g = f > 0.5 ? 1 : 0;
    const [x1, y1] = ponto(ang, R), [x2, y2] = ponto(a2, R), [x3, y3] = ponto(a2, r), [x4, y4] = ponto(ang, r);
    o += `<path class="fatia" d="M${x1.toFixed(2)} ${y1.toFixed(2)}A${R} ${R} 0 ${g} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}L${x3.toFixed(2)} ${y3.toFixed(2)}A${r} ${r} 0 ${g} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}Z" fill="${cores[k]}" stroke="#fff" stroke-width="1.5"/>`;
    ang = a2;
  });
  const y0 = (alto - d.rotulos.length * linhaLeg) / 2 + 17;
  d.rotulos.forEach((rot, k) => {
    const y = y0 + k * linhaLeg;
    o += `<rect x="236" y="${(y - 10).toFixed(1)}" width="11" height="11" rx="2" fill="${cores[k]}"/>` + svgTexto(256, y, rot, ' class="cat"');
    o += svgTexto(LARG - (d.unidade === '%' ? 4 : 64), y, d.fmt(vals[k]), ` class="gv" data-s="0" data-i="${k}" text-anchor="end"`);
    if (d.unidade !== '%') o += svgTexto(LARG - 4, y, `${((vals[k] / total) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`, ' class="gp" text-anchor="end"');
  });
  return `<svg viewBox="0 0 ${LARG} ${alto}" width="100%" role="img">${o}</svg>`;
}

function fatiasRosca(vals, cores, cx, cy, R, r) {
  const total = vals.reduce((a, v) => a + v, 0) || 1, ponto = (ang, raio) => [cx + raio * Math.cos(ang), cy + raio * Math.sin(ang)];
  let o = '', ang = -Math.PI / 2;
  vals.forEach((v, k) => {
    const f = v / total;
    if (f <= 0) return;
    if (f >= 0.9999) { o += `<circle class="fatia" cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="${cores[k]}" stroke-width="${R - r}"/>`; return; }
    const a2 = ang + f * 2 * Math.PI, g = f > 0.5 ? 1 : 0;
    const [x1, y1] = ponto(ang, R), [x2, y2] = ponto(a2, R), [x3, y3] = ponto(a2, r), [x4, y4] = ponto(ang, r);
    o += `<path class="fatia" d="M${x1.toFixed(2)} ${y1.toFixed(2)}A${R} ${R} 0 ${g} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}L${x3.toFixed(2)} ${y3.toFixed(2)}A${r} ${r} 0 ${g} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}Z" fill="${cores[k]}" stroke="#fff" stroke-width="1.5"/>`;
    ang = a2;
  });
  return o;
}

function svgRoscaDupla(d, cores) {
  const LARG = 680, R = 62, r = 38, linhaLeg = 25, n = d.rotulos.length;
  const alto = Math.max(186, n * linhaLeg + 40), cy = (alto - 22) / 2;
  let o = '';
  d.series.forEach((s, k) => {
    const cx = 70 + k * 150;
    o += fatiasRosca(s.valores, cores, cx, cy, R, r) + svgTexto(cx, cy + R + 18, s.nome, ' class="cat" text-anchor="middle"');
  });
  const y0 = (alto - n * linhaLeg) / 2 + 20, colunas = [604, LARG - 4];
  d.series.forEach((s, k) => { o += svgTexto(colunas[k], y0 - 22, s.nome, ' class="gp" text-anchor="end"'); });
  d.rotulos.forEach((rot, i) => {
    const y = y0 + i * linhaLeg;
    o += `<rect x="300" y="${(y - 10).toFixed(1)}" width="11" height="11" rx="2" fill="${cores[i]}"/>` + svgTexto(320, y, rot, ' class="cat"');
    d.series.forEach((s, k) => { o += svgTexto(colunas[k], y, d.fmt(s.valores[i]), ` class="gv" data-s="${k}" data-i="${i}" text-anchor="end"`); });
  });
  return `<svg viewBox="0 0 ${LARG} ${alto}" width="100%" role="img">${o}</svg>`;
}

const passoBonito = (bruto) => { const p = 10 ** Math.floor(Math.log10(bruto || 1)), f = bruto / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };

function svgLinha(d, cores) {
  const LARG = 680, ALTO = 230, E = 44, Dd = 74, T = 12, B = 26, n = d.rotulos.length;
  const todos = d.series.flatMap((s) => s.valores);
  let min = Math.min(...todos), max = Math.max(...todos);
  if (d.base100) { min = Math.min(min, 100); max = Math.max(max, 100); }
  const passo = passoBonito((max - min) / 4 || 1);
  min = Math.floor(min / passo) * passo; max = Math.ceil(max / passo) * passo;
  const x = (i) => E + (n > 1 ? (i / (n - 1)) * (LARG - E - Dd) : (LARG - E - Dd) / 2), y = (v) => T + (1 - (v - min) / ((max - min) || 1)) * (ALTO - T - B);
  const fmtEixo = formatador('', passo < 1 ? 1 : 0);
  let o = '';
  for (let v = min; v <= max + passo / 2; v += passo) o += `<line x1="${E}" y1="${y(v).toFixed(1)}" x2="${LARG - Dd}" y2="${y(v).toFixed(1)}" stroke="#e3e5e9" stroke-width="1"${d.base100 && Math.abs(v - 100) < 1e-9 ? ' stroke-dasharray="4 3" stroke="#9aa0a8"' : ''}/>` + svgTexto(E - 6, y(v) + 3.5, fmtEixo(v), ' class="eixo" text-anchor="end"');
  const cada = Math.max(1, Math.ceil(n / 8));
  d.rotulos.forEach((r, i) => { if (i % cada === 0 || i === n - 1) o += svgTexto(x(i), ALTO - 8, r, ' class="eixo" text-anchor="middle"'); });
  const finais = d.series.map((s, k) => ({ k, y: y(s.valores[n - 1]) })).sort((a, b) => a.y - b.y);
  for (let j = 1; j < finais.length; j++) if (finais[j].y - finais[j - 1].y < 13) finais[j].y = finais[j - 1].y + 13;
  d.series.forEach((s, k) => {
    o += `<polyline points="${s.valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${cores[k]}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    o += `<circle cx="${x(n - 1).toFixed(1)}" cy="${y(s.valores[n - 1]).toFixed(1)}" r="3.2" fill="${cores[k]}"/>`;
    o += svgTexto(x(n - 1) + 8, finais.find((f) => f.k === k).y + 4, d.fmt(s.valores[n - 1]), ` class="gv" data-s="${k}" data-i="${n - 1}" fill="${cores[k]}"`);
  });
  return `<svg viewBox="0 0 ${LARG} ${ALTO}" width="100%" role="img">${o}</svg>`;
}

function blocoGrafico(g, t, onde) {
  const d = dadosDoGrafico(g, onde);
  const cores = d.tipo === 'rosca'
    ? [t.forte, t.acento, mix(t.forte, '#ffffff', 0.4), mix(t.acento, '#ffffff', 0.45), mix(t.forte, '#ffffff', 0.68), mix(t.acento, '#ffffff', 0.72), '#9aa0a8', '#cfd2d7']
    : [t.forte, t.acento, '#9aa0a8'];
  const svg = d.tipo === 'rosca' ? svgRosca(d, cores) : d.tipo === 'linha' ? svgLinha(d, cores) : svgBarras(d, cores);
  const leg = d.tipo === 'rosca' || d.series.length < 2 ? '' : `<span class="leg">${d.series.map((s, k) => `<span><i style="background:${cores[k]}"></i>${esc(s.nome)}</span>`).join('')}</span>`;
  const base = d.base100 ? `<span class="b100">Base 100${g.retornos ? ' no início do período' : ' no primeiro valor'}</span>` : '';
  const fonte = g.fonte ? `<span class="fonte">Fonte: ${esc(g.fonte)}</span>` : '';
  const legenda = leg || base || fonte ? `<figcaption>${leg}${base}${fonte}</figcaption>` : '';
  const figura = `<figure class="graf">${g.titulo ? `<div class="cap">${esc(g.titulo)}</div>` : ''}${svg}${legenda}</figure>`;
  if (g.tabela === false) return `<div class="bloco-graf">${figura}</div>`;
  const dois = d.tipo !== 'linha' && d.series.length === 2;
  const cab = [esc(g.categoria || (d.tipo === 'linha' ? 'Período' : 'Item')), ...d.series.map((s) => esc(s.nome)), ...(dois ? ['Diferença'] : []), ...(d.bandas ? ['Banda', 'Situação'] : []), ...(d.tipo === 'rosca' && d.unidade !== '%' ? ['Participação'] : [])];
  const banda = (i) => {
    const b = d.bandas[i], fora = Math.abs(d.series[1].valores[i] - d.series[0].valores[i]) > b + 1e-9;
    return `<td class="n">±${formatador(d.unidadeDif, Math.min(2, casasDe(b)))(b)}</td><td class="sit${fora ? ' fora' : ''}">${fora ? 'Fora' : 'Dentro'}</td>`;
  };
  const total = d.tipo === 'rosca' ? g.total !== false : g.total === true && d.tipo !== 'linha';
  const somaRosca = d.series[0].valores.reduce((a, v) => a + v, 0) || 1;
  const dif = (a, b) => { const v = b - a; return v > 0 ? ['n up', `▲ ${d.fmtDif(v)}`] : v < 0 ? ['n down', `▼ ${d.fmtDif(-v)}`] : ['n', d.fmtDif(0)]; };
  const linhas = d.rotulos.map((r, i) => `<tr><td>${esc(r)}</td>${d.series.map((s, k) => `<td class="n" data-s="${k}" data-i="${i}">${d.fmt(s.valores[i])}</td>`).join('')}` +
    (dois ? (([c, txt]) => `<td class="${c}">${txt}</td>`)(dif(d.series[0].valores[i], d.series[1].valores[i])) : '') + (d.bandas ? banda(i) : '') +
    (d.tipo === 'rosca' && d.unidade !== '%' ? `<td class="n">${((d.series[0].valores[i] / somaRosca) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td>` : '') + '</tr>').join('');
  const somas = d.series.map((s) => s.valores.reduce((a, v) => a + v, 0));
  const linhaTotal = total ? `<tr class="total"><td>Total</td>${somas.map((v) => `<td class="n">${d.fmt(v)}</td>`).join('')}${dois ? '<td class="n"></td>' : ''}${d.bandas ? '<td class="n"></td><td></td>' : ''}${d.tipo === 'rosca' && d.unidade !== '%' ? '<td class="n">100,0%</td>' : ''}</tr>` : '';
  const nLinhas = d.rotulos.length + (total ? 1 : 0);
  const tabela = `<table class="tg${nLinhas <= 12 ? ' curta' : ''}"><thead><tr>${cab.map((h, c) => `<th${c ? ' class="n"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${linhas}${linhaTotal}</tbody></table>`;
  return `<div class="bloco-graf">${figura}${tabela}</div>`;
}

function logosRodape(t) {
  const cm = logoCaptaMais();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cm ? 92 : 50}" height="22" viewBox="0 0 ${cm ? 92 : 50} 22"><text x="0" y="15" font-family="Segoe UI,Helvetica Neue,Arial,sans-serif" font-weight="800" font-size="13" letter-spacing="-0.3" fill="${t.forte}">Mesa</text><circle cx="39.5" cy="12.5" r="2.6" fill="${t.acento}"/>${cm ? `<image x="56" y="0" width="36" height="22" preserveAspectRatio="xMidYMid meet" href="${cm}"/>` : ''}</svg>`;
  return `url("data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}")`;
}

const DO_ASSESSOR = /^\s*(o que |para )?conferir\b|^\s*pr[óo]ximos? passos?\b/i;
export function secoesDoCliente(secoes) {
  const ficam = [], saem = [];
  for (const s of secoes) { if (DO_ASSESSOR.test(String(s?.titulo || ''))) saem.push(String(s.titulo).trim()); else ficam.push(s); }
  return { ficam, saem };
}

export function montarDocumento(a, marcaBase = {}) {
  const { ficam: secoes } = secoesDoCliente(Array.isArray(a.secoes) ? a.secoes.slice(0, 30) : []);
  if (!secoes.length) throw new Error('Envie pelo menos uma seção.');
  const risco = revisarDocumento({ ...a, secoes });
  if (risco.length) throw new Error(mensagemDaTrava(risco, 'seção'));
  const t = { ...(TEMAS_A4[a.tema] ?? TEMAS_A4.marinho) };
  const corEscolhida = [a.cor, marcaBase.cor].find((c) => /^#[0-9a-fA-F]{6}$/.test(c || ''));
  if (corEscolhida) t.acento = corEscolhida;
  const cor = t.acento;
  const logo = imagemEmbutida(marcaBase.logo, [], 'logo');
  const quem = [marcaBase.escritorio, marcaBase.nome].filter(Boolean).map(esc).join(' · ');
  const dono = (logo ? `<img class="logo" src="${logo}">` : '') + (quem ? `<span>${quem}</span>` : '');
  const mesa = '<span class="mesa">Mesa<i></i><small>do Assessor</small></span>';
  const conferir = (h) => h.replace(/\[CONFERIR[^\]]*\]/g, (m) => `<mark>${m}</mark>`);
  const hoje = new Date().toLocaleDateString('pt-BR');
  const cliente = String(a.cliente || '').trim(), dataBase = String(a.dataBase || '').trim();
  const eyebrow = [cliente ? `Preparado para ${esc(cliente)}` : 'Material de apoio ao atendimento', dataBase ? `Data-base ${esc(dataBase)}` : hoje].join(' · ');

  const cartoes = (Array.isArray(a.destaques) ? a.destaques : []).filter((x) => x && (x.valor || x.rotulo)).slice(0, 4);
  const blocoCartoes = cartoes.length ? `<div class="destaques n${cartoes.length}">${cartoes.map((x) => `<div class="card"><div class="r">${esc(x.rotulo)}</div><div class="v">${esc(x.valor).replace(/→/g, '<i>→</i>')}</div>${x.nota ? `<div class="nt">${esc(x.nota)}</div>` : ''}</div>`).join('')}</div>` : '';

  const corpo = secoes.map((s, i) => {
    let h = conferir(mdParaHtml(s.texto || '')).replace(/<h3>\+\s+/g, '<h3>');
    if (i === 0) h = h.replace(/^<p><b>(.*?)<\/b><\/p>/, '<p class="resumo"><b>$1</b></p>');
    if (i === 0 && blocoCartoes) h = /^<p class="resumo">/.test(h) ? h.replace(/^<p class="resumo">.*?<\/p>/, (m) => m + blocoCartoes) : blocoCartoes + h;
    const graf = s.grafico ? blocoGrafico(s.grafico, t, `seção ${i + 1}${s.titulo ? ` (${s.titulo})` : ''}`) : '';
    return `<section${/^\s*conferir/i.test(s.titulo || '') ? ' class="conferir"' : ''}>${s.titulo ? `<h2>${esc(s.titulo)}</h2>` : ''}${graf}${h}</section>`;
  }).join('\n');

  const tipo = AVISO_TIPO[a.tipo] ? a.tipo : 'geral';
  const citaResearch = tipo === 'geral' && CITA_RESEARCH.test(JSON.stringify(secoes) + (a.subtitulo || ''));
  const aviso = `<div class="aviso"><b>Aviso importante.</b> ${AVISO_TIPO[tipo]}${citaResearch ? ` ${AVISO_RESEARCH}` : ''}${a.rodape ? `<span class="ident">${esc(a.rodape)}</span>` : ''}</div>`;

  let capa = '';
  if (a.capa) {
    const foto = imagemEmbutida(marcaBase.foto, [], 'foto');
    const iniciais = String(marcaBase.nome || marcaBase.escritorio || '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
    const ROTULO = { proposta: 'Proposta', estudo: 'Estudo', relatorio: 'Relatório', carteira: 'Carteira', diagnostico: 'Diagnóstico', mercado: 'Mercado' };
    capa = `<section class="capa"><div class="cfaixa"></div><div class="orn"></div>
<div class="ctopo">${logo ? `<img src="${logo}">` : `<span class="marca">${esc(marcaBase.escritorio || '')}</span>`}${mesa}</div>
<div class="cmeio">${ROTULO[a.tipo] ? `<div class="eyebrow">${ROTULO[a.tipo]}</div>` : ''}<h1>${esc(a.titulo)}</h1><div class="regua"></div>${a.subtitulo ? `<div class="sub">${conferir(esc(a.subtitulo))}</div>` : ''}</div>
<div class="cpara">${cliente ? `<div><small>Preparado para</small><b>${esc(cliente)}</b></div>` : ''}<div><small>${dataBase ? 'Data-base' : 'Data'}</small><b>${esc(dataBase || hoje)}</b></div></div>
<div class="cquem">${foto ? `<img src="${foto}">` : `<div class="ini">${esc(iniciais)}</div>`}<div>${marcaBase.nome ? `<b>${esc(marcaBase.nome)}</b>` : ''}${marcaBase.cargo ? `<span>${esc(marcaBase.cargo)}</span>` : ''}${marcaBase.escritorio ? `<span>${esc(marcaBase.escritorio)}</span>` : ''}</div></div>
</section>`;
  }

  const css = `:root{--forte:${t.forte};--acento:${cor}}
@page{size:A4;margin:12mm 15mm 15mm;@bottom-left{content:"${AVISO_CURTO}";width:128mm;font:7.2pt/1.35 ${FONTE};color:${t.suave};vertical-align:middle;border-top:1px solid ${t.linha}}@bottom-right{content:${logosRodape({ ...t, acento: cor })} "    " counter(page) " de " counter(pages);width:52mm;text-align:right;font:600 7.6pt ${FONTE};color:${t.forte};vertical-align:middle;border-top:1px solid ${t.linha}}}
@page capa{margin:0;@bottom-left{content:none;border:0}@bottom-right{content:none;border:0}}
*{box-sizing:border-box}html,body{margin:0}body{font-family:${FONTE};font-size:10.3pt;line-height:1.5;color:${t.texto};-webkit-print-color-adjust:exact;print-color-adjust:exact}
.faixa{height:6px;background:linear-gradient(90deg,${cor},${t.forte});border-radius:3px;margin-bottom:12px}
.topo{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.dono{display:flex;align-items:center;gap:10px;font-size:8.5pt;letter-spacing:.14em;text-transform:uppercase;color:${t.suave}}.dono .logo{height:28px;width:auto}
.mesa{font-weight:800;font-size:15pt;letter-spacing:-.02em;color:${t.forte};display:inline-flex;align-items:baseline;gap:1px}.mesa i{display:inline-block;width:6px;height:6px;border-radius:50%;background:${cor};margin-left:1px}.mesa small{font-weight:600;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:${t.suave};margin-left:8px}
header{padding-bottom:10px;margin-bottom:12px;border-bottom:1px solid ${t.linha}}.eyebrow{font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:${cor};font-weight:700;margin-bottom:6px}h1{font-size:23pt;line-height:1.12;margin:0 0 6px;color:${t.forte};letter-spacing:-.01em}.sub{color:${t.sub};font-size:11pt}
h2{font-size:9pt;letter-spacing:.16em;text-transform:uppercase;margin:15px 0 7px;color:${t.forte};break-after:avoid;page-break-after:avoid;display:flex;align-items:center;gap:8px}h2::before{content:"";width:16px;height:3px;background:${cor};border-radius:2px}
h3{font-size:11pt;margin:12px 0 4px;break-after:avoid;color:${t.forte}}p{margin:0 0 8px;orphans:2;widows:2}ul,ol{margin:0 0 8px;padding-left:22px}li{margin-bottom:3px;break-inside:avoid}li::marker{color:${cor};font-weight:700}
.resumo{font-size:12pt;line-height:1.4;padding:10px 14px;margin:0 0 10px;background:${cor}14;border-left:4px solid ${cor};border-radius:0 8px 8px 0;color:${t.forte}}
.destaques{display:grid;gap:10px;margin:2px 0 12px;break-inside:avoid}.destaques.n1{grid-template-columns:1fr}.destaques.n2{grid-template-columns:repeat(2,1fr)}.destaques.n3{grid-template-columns:repeat(3,1fr)}.destaques.n4{grid-template-columns:repeat(4,1fr)}
.card{border:1px solid ${t.linha};border-radius:10px;padding:10px 13px 11px;break-inside:avoid}.card .r{font-size:7.4pt;letter-spacing:.14em;text-transform:uppercase;color:${t.suave};font-weight:600}
.card .v{font-size:19pt;font-weight:800;color:${t.forte};line-height:1.15;margin:5px 0 3px;letter-spacing:-.01em}.n4 .card .v{font-size:15pt}.n1 .card .v,.n2 .card .v{font-size:21pt}.card .v i{font-style:normal;color:${cor};font-weight:600;margin:0 2px}.card .nt{font-size:8.6pt;color:${t.sub};line-height:1.3}
table{border-collapse:separate;border-spacing:0;width:100%;margin:5px 0 12px;font-size:9pt;border:1px solid ${t.linha};border-radius:8px}thead{display:table-header-group}
th,td{padding:5px 9px;text-align:left;vertical-align:top;border-bottom:1px solid #e6e8ec}th{background:${t.cab};color:${t.cabTx};font-size:7.8pt;letter-spacing:.08em;text-transform:uppercase;font-weight:700}
th:first-child{border-top-left-radius:7px}th:last-child{border-top-right-radius:7px}tbody tr:last-child td{border-bottom:0}tbody tr:nth-child(even) td{background:${t.zebra}}tr{break-inside:avoid}
th.n,td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}tr.total td{font-weight:700;background:${t.total};border-top:1.5px solid ${t.forte}}table.curta{break-inside:avoid}
td.up{color:#1f7a3a;font-weight:600}td.down{color:#b3261e;font-weight:600}td.sit{color:${t.sub}}td.sit.fora{color:${t.forte};font-weight:700}td.mid{color:#a86a00;font-weight:600}
mark{background:#fff1c2;color:#6a4b00;padding:0 4px;border-radius:3px;font-size:.92em}
.bloco-graf{margin:2px 0 6px}figure.graf{margin:0 0 6px;padding:10px 14px 8px;border:1px solid ${t.linha};border-radius:10px;break-inside:avoid}figure.graf svg{display:block;width:100%;height:auto}
figure.graf .cap{font-size:8.6pt;font-weight:700;color:${t.forte};margin-bottom:8px}figcaption{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 14px;align-items:center;font-size:8pt;color:${t.suave};margin-top:6px}
figcaption .leg>span{margin-right:14px;white-space:nowrap}figcaption .leg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}figcaption .fonte{margin-left:auto}
svg text{font-family:${FONTE}}svg .cat{font-size:12px;fill:${t.texto}}svg .gv{font-size:11.5px;font-weight:700;fill:${t.forte}}svg .eixo{font-size:10px;fill:${t.suave}}svg .gp{font-size:10.5px;fill:${t.suave}}
.aviso{margin-top:12px;padding:7px 11px;border-left:3px solid ${cor};background:${t.zebra};color:${t.sub};font-size:7.8pt;line-height:1.45;border-radius:0 6px 6px 0;break-inside:avoid;break-before:avoid;page-break-before:avoid}.aviso b{color:${t.forte}}.aviso .ident{display:block;margin-top:3px;color:${t.suave}}
.conferir{margin-top:6px;color:${t.suave};font-size:8.8pt}.conferir h2{color:${t.suave};font-size:8pt}.conferir h2::before{display:none}.conferir li::marker{color:#9a9aa0}
section.capa{page:capa;break-after:page;position:relative;overflow:hidden;height:296mm;padding:24mm 22mm 22mm;display:flex;flex-direction:column}
.capa .cfaixa{position:absolute;left:0;top:0;right:0;height:7mm;background:linear-gradient(90deg,${cor},${t.forte})}
.capa .orn{position:absolute;right:-70mm;top:52mm;width:165mm;height:165mm;border-radius:50%;border:1px solid ${cor}66;box-shadow:0 0 0 13mm ${cor}0d,0 0 0 26mm ${cor}08,inset 0 0 0 22mm ${cor}0a}
.capa .ctopo{display:flex;justify-content:space-between;align-items:center;min-height:15mm;position:relative}.capa .ctopo img{max-height:15mm;max-width:70mm;object-fit:contain}.capa .marca{font-size:9pt;letter-spacing:.24em;text-transform:uppercase;color:${t.suave}}
.capa .cmeio{flex:1;display:flex;flex-direction:column;justify-content:center;max-width:135mm;position:relative}.capa h1{font-size:34pt;line-height:1.08;margin:0}.capa .regua{width:26mm;height:4px;background:${cor};border-radius:2px;margin:9mm 0 7mm}.capa .sub{font-size:13pt}
.capa .cpara{display:flex;gap:16mm;padding:6mm 0;margin-bottom:12mm;border-top:1px solid ${t.linha};border-bottom:1px solid ${t.linha};position:relative}.capa .cpara small{display:block;font-size:7.6pt;letter-spacing:.16em;text-transform:uppercase;color:${t.suave};margin-bottom:1.5mm}.capa .cpara b{font-size:13pt;color:${t.forte}}
.capa .cquem{display:flex;align-items:center;gap:6mm;position:relative}.capa .cquem img,.capa .cquem .ini{width:24mm;height:24mm;border-radius:50%;object-fit:cover;border:2px solid ${cor}}
.capa .cquem .ini{display:flex;align-items:center;justify-content:center;font-size:18pt;font-weight:700;color:${cor};background:${t.zebra}}.capa .cquem b{display:block;font-size:12pt;color:${t.forte}}.capa .cquem span{display:block;font-size:9.5pt;color:${t.suave}}`;

  return `<!doctype html><meta charset="utf-8"><title>${esc(a.titulo)}</title><style>${css}</style>
${capa}<div class="faixa"></div><div class="topo"><div class="dono">${dono}</div>${mesa}</div>
<header><div class="eyebrow">${eyebrow}</div><h1>${esc(a.titulo)}</h1>${a.subtitulo ? `<div class="sub">${conferir(esc(a.subtitulo))}</div>` : ''}</header>
${corpo}
${aviso}`;
}

export function paginasDoPdf(arq) {
  try {
    const n = [...readFileSync(arq, 'latin1').matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
    return n.length ? Math.max(...n) : 0;
  } catch { return 0; }
}

const CSS_JUSTO = 'body{line-height:1.42}.topo{margin-bottom:9px}header{padding-bottom:8px;margin-bottom:9px}h2{margin:10px 0 5px}h3{margin:9px 0 3px}'
  + 'p,ul,ol{margin-bottom:6px}li{margin-bottom:2px}.resumo{padding:8px 12px;margin-bottom:8px}.destaques{margin-bottom:9px}table{margin:4px 0 9px}'
  + 'th,td{padding-top:4px;padding-bottom:4px}figure.graf{padding:8px 12px 6px}.aviso{margin-top:8px}';

async function justoSeEconomiza(html, pdf) {
  const n = paginasDoPdf(pdf);
  if (n < 2) return false;
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'mesa-justo-'));
  try {
    const justo = path.join(tmp, 'justo.pdf');
    await renderizar(html.replace('</style>', () => CSS_JUSTO + '</style>'), justo, 'pdf', [794, 1123]);
    const m = paginasDoPdf(justo);
    if (m < 1 || m >= n) return false;
    copyFileSync(justo, pdf);
    return true;
  } catch { return false; } finally { try { rmSync(tmp, { recursive: true, force: true }); } catch { } }
}

export async function gerarDocumento(a, marcaBase = {}) {
  const html = montarDocumento(a, marcaBase);
  const pdf = path.join(pastaBase(), `${slug(a.titulo)}-${carimbo()}.pdf`);
  await renderizar(html, pdf, 'pdf', [794, 1123]);
  const justo = await justoSeEconomiza(html, pdf);
  const { saem } = secoesDoCliente(Array.isArray(a.secoes) ? a.secoes.slice(0, 30) : []);
  const r = { tipo: 'pdf', titulo: a.titulo, pasta: path.dirname(pdf), imagens: [], pdf, em: Date.now(), ...(justo ? { justo: true } : {}), ...(saem.length ? { foraDoPdf: saem } : {}) };
  writeFileSync(ARQUIVO_GERACAO, JSON.stringify(r));
  return r;
}
