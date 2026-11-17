import { mkdirSync, mkdtempSync, writeFileSync, existsSync, rmSync, statSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { montarPaginas, imagemEmbutida, W, H } from './layouts.mjs';

export const ARQUIVO_GERACAO = path.join(os.tmpdir(), 'mesa-do-assessor-geracao.json');

const TAMANHOS = { feed: [1080, 1350], quadrado: [1080, 1080], stories: [1080, 1920] };
const TEMAS = {
  escuro: { fundo: '#101113', tinta: '#F3EEE6', suave: '#A7A7AB', cor: '#E8C88E' },
  claro: { fundo: '#F7F3EC', tinta: '#1B1B1D', suave: '#6B6B70', cor: '#A8741A' },
};
const FONTE = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

export function navegador() {
  const e = process.env;
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

const tam = (texto, base, min, passo = 0.18) => Math.max(min, Math.round(base - Math.max(0, String(texto || '').length - 28) * passo));

function slideHtml(s, i, n, ctx) {
  const { t, cor, rodape, W, H } = ctx;
  const tipo = s.tipo || 'conteudo';
  const titulo = esc(s.titulo), texto = esc(s.texto || ''), destaque = esc(s.destaque || ''), fonte = esc(s.fonte || '');
  const tamTitulo = tipo === 'capa' ? tam(s.titulo, 118, 62) : tam(s.titulo, 76, 46);
  const tamTexto = tam(s.texto, 46, 32, 0.07);
  const ultimo = i === n - 1;
  return `<section class="slide ${tipo}" style="width:${W}px;height:${H}px">
  <div class="topo"><span class="marca"></span><span class="cont">${n > 1 ? `${i + 1} / ${n}` : ''}</span></div>
  <div class="corpo">
    ${tipo === 'capa' ? '<div class="regua"></div>' : ''}
    <h1 style="font-size:${tamTitulo}px">${titulo}</h1>
    ${destaque ? `<div class="destaque">${destaque}</div>` : ''}
    ${texto ? `<p style="font-size:${tamTexto}px">${texto}</p>` : ''}
  </div>
  <div class="pe">
    ${fonte ? `<div class="fonte">Fonte: ${fonte}</div>` : ''}
    <div class="linha"><span>${esc(rodape)}</span><span class="seta">${!ultimo && n > 1 ? '→' : ''}</span></div>
  </div>
</section>`;
}

function cssCarrossel({ t, cor, W, H }) {
  return `*{box-sizing:border-box;margin:0}html,body{background:${t.fundo}}body{font-family:${FONTE};-webkit-font-smoothing:antialiased}
.slide{position:relative;overflow:hidden;background:${t.fundo};color:${t.tinta};padding:84px 88px 72px;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;break-after:page}
.slide::before{content:"";position:absolute;right:-220px;top:-220px;width:620px;height:620px;border-radius:50%;background:${cor};opacity:.10}
.slide::after{content:"";position:absolute;left:0;bottom:0;width:100%;height:10px;background:${cor}}
.topo{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1}.marca{width:22px;height:22px;border-radius:50%;background:${cor}}
.cont{font-size:30px;color:${t.suave};letter-spacing:.06em}
.corpo{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:center;gap:34px;flex:1;overflow:hidden;padding:30px 0}
.regua{width:120px;height:10px;background:${cor};border-radius:6px}
h1{font-weight:800;line-height:1.08;letter-spacing:-.01em;word-break:break-word}
.capa h1{color:${t.tinta}}
.destaque{font-size:170px;font-weight:800;line-height:1;color:${cor};letter-spacing:-.02em}
p{line-height:1.42;color:${t.tinta};opacity:.88;white-space:pre-wrap;word-break:break-word}
.pe{position:relative;z-index:1;display:flex;flex-direction:column;gap:16px}
.fonte{font-size:26px;color:${t.suave}}
.linha{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;font-size:26px;line-height:1.35;color:${t.suave};border-top:2px solid ${t.suave}55;padding-top:18px}
.seta{font-size:54px;color:${cor};line-height:1}`;
}

export async function gerarCarrossel(a) {
  const slides = Array.isArray(a.slides) ? a.slides.slice(0, 10) : [];
  if (!slides.length) throw new Error('Envie pelo menos um slide.');
  const [W, H] = TAMANHOS[a.formato] ?? TAMANHOS.feed;
  const t = TEMAS[a.tema] ?? TEMAS.escuro;
  const cor = /^#[0-9a-fA-F]{6}$/.test(a.cor || '') ? a.cor : t.cor;
  const ctx = { t, cor, rodape: a.rodape || '', W, H };
  const pasta = path.join(pastaBase(), `${slug(a.titulo)}-${carimbo()}`);
  mkdirSync(pasta, { recursive: true });
  const imagens = [];
  for (let i = 0; i < slides.length; i++) {
    const html = `<!doctype html><meta charset="utf-8"><style>${cssCarrossel(ctx)}</style>${slideHtml(slides[i], i, slides.length, ctx)}`;
    const saida = path.join(pasta, `slide-${String(i + 1).padStart(2, '0')}.png`);
    await renderizar(html, saida, 'png', [W, H]);
    imagens.push(saida);
  }
  const pdf = path.join(pasta, `${slug(a.titulo)}.pdf`);
  const tudo = `<!doctype html><meta charset="utf-8"><style>@page{size:${W}px ${H}px;margin:0}${cssCarrossel(ctx)}</style>${slides.map((s, i) => slideHtml(s, i, slides.length, ctx)).join('')}`;
  await renderizar(tudo, pdf, 'pdf', [W, H]);
  const r = { tipo: 'carrossel', titulo: a.titulo, pasta, imagens, pdf, em: Date.now() };
  writeFileSync(ARQUIVO_GERACAO, JSON.stringify(r));
  return r;
}

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
function textosDos(slides) {
  const out = [];
  slides.forEach((s, i) => {
    const add = (t) => { if (typeof t === 'string' && t.trim()) out.push([i + 1, t]); };
    [s.titulo, s.subtitulo, s.texto, s.etiqueta, s.fonte].forEach(add);
    (s.itens || []).forEach((x) => [x.titulo, x.texto, x.rotulo, x.ligacao].forEach(add));
    [...(s.passos || []), ...(s.contato || []), ...(s.cabecalho || [])].forEach(add);
    (s.linhas || []).forEach((l) => (l || []).forEach(add));
  });
  return out;
}
export function revisarApresentacao(slides, termosConfirmados = []) {
  const ok = termosConfirmados.map(SEMACENTO);
  const achados = [];
  for (const [pag, t] of textosDos(slides)) {
    if (/\[CONFERIR/i.test(t)) continue;
    const n = SEMACENTO(t);
    for (const [nome, re] of TERMOS_RISCO) {
      const m = n.match(re);
      if (m && !ok.some((c) => c && (m[0].includes(c) || c.includes(m[0])))) achados.push(`página ${pag}: "${t.slice(0, 90)}" (${nome})`);
    }
  }
  return achados;
}
export async function gerarApresentacao(a, marcaBase = {}) {
  const slides = Array.isArray(a.slides) ? a.slides.slice(0, 18) : [];
  if (!slides.length) throw new Error('Envie pelo menos um slide.');
  const risco = revisarApresentacao(slides, a.termosConfirmados || []);
  if (risco.length) {
    throw new Error('o PDF não foi gerado porque estas frases afirmam algo que o assessor pode não ter dito: ' + risco.join(' | ') +
      '. Reescreva cada uma só com o que o assessor informou, ou acrescente [CONFERIR] no texto; se o assessor realmente afirmou o termo, repita a chamada com termosConfirmados (a lista dos termos).');
  }
  const avisos = [];
  const marca = {
    ...marcaBase,
    ...Object.fromEntries(['tema', 'estilo', 'cor', 'rodape', 'nome', 'cargo', 'escritorio'].filter((k) => a[k]).map((k) => [k, a[k]])),
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
  const r = { tipo: 'apresentacao', titulo: a.titulo, pasta, imagens, pdf, avisos, pendencias, minhasImagens: marca.pastaImagens, em: Date.now() };
  writeFileSync(ARQUIVO_GERACAO, JSON.stringify({ ...r, avisos: undefined }));
  return r;
}

function mdParaHtml(texto) {
  const linhas = esc(texto).split('\n');
  const inl = (s) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  let out = '', lista = false, tab = [];
  const fechaLista = () => { if (lista) { out += '</ul>'; lista = false; } };
  const fechaTab = () => {
    if (!tab.length) return;
    const linhasTab = tab.filter((l) => !/^\|?\s*:?-{2,}/.test(l.replace(/\s/g, '')));
    out += '<table>' + linhasTab.map((l, k) => '<tr>' + l.replace(/^\||\|$/g, '').split('|').map((c) => `<${k === 0 ? 'th' : 'td'}>${inl(c.trim())}</${k === 0 ? 'th' : 'td'}>`).join('') + '</tr>').join('') + '</table>';
    tab = [];
  };
  for (const l of linhas) {
    if (/^\s*\|.*\|\s*$/.test(l)) { fechaLista(); tab.push(l.trim()); continue; }
    fechaTab();
    if (/^\s*([-*•]|\d+[.)]) /.test(l)) { if (!lista) { out += '<ul>'; lista = true; } out += `<li>${inl(l.replace(/^\s*([-*•]|\d+[.)]) /, ''))}</li>`; continue; }
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
const AVISO_LONGO = 'Este material tem caráter informativo e educacional. Não constitui recomendação, oferta ou solicitação de compra, venda ou alocação de ativos, nem promessa ou garantia de retorno. Rentabilidade passada não garante resultado futuro. Preços-alvo e recomendações de casas de research são opiniões das próprias casas. Confira os dados nas fontes citadas e avalie qualquer decisão à luz do perfil, dos objetivos e do prazo de cada pessoa.';

export async function gerarDocumento(a, marcaBase = {}) {
  const secoes = Array.isArray(a.secoes) ? a.secoes.slice(0, 30) : [];
  if (!secoes.length) throw new Error('Envie pelo menos uma seção.');
  const cor = /^#[0-9a-fA-F]{6}$/.test(a.cor || '') ? a.cor : /^#[0-9a-fA-F]{6}$/.test(marcaBase.cor || '') ? marcaBase.cor : '#A8741A';
  const logo = imagemEmbutida(marcaBase.logo, [], 'logo');
  const cm = logoCaptaMais();
  const quem = [marcaBase.escritorio, marcaBase.nome].filter(Boolean).map(esc).join(' · ');
  const dono = (logo ? `<img class="logo" src="${logo}">` : '') + (quem ? `<span>${quem}</span>` : '');
  const mesa = '<span class="mesa">Mesa<i></i><small>do Assessor</small></span>';
  const destaque = (h) => h.replace(/\[CONFERIR[^\]]*\]/g, (m) => `<mark>${m}</mark>`);
  const estado = (h) => h
    .replace(/<td>(▲|✓)/g, (m, s) => `<td class="up">${s}`)
    .replace(/<td>▼/g, '<td class="down">▼')
    .replace(/<td>●/g, '<td class="mid">●')
    .replace(/<h3>\+\s+/g, '<h3>');
  const corpo = secoes.map((s, i) => {
    let h = estado(destaque(mdParaHtml(s.texto || '')));
    if (i === 0) h = h.replace(/^<p><b>(.*?)<\/b><\/p>/, '<p class="resumo"><b>$1</b></p>');
    return `<section${/^\s*conferir/i.test(s.titulo || '') ? ' class="conferir"' : ''}>${s.titulo ? `<h2>${esc(s.titulo)}</h2>` : ''}${h}</section>`;
  }).join('\n');
  const hoje = new Date().toLocaleDateString('pt-BR');
  const html = `<!doctype html><meta charset="utf-8"><title>${esc(a.titulo)}</title><style>
@page{size:A4;margin:12mm 15mm 14mm}*{box-sizing:border-box}body{font-family:${FONTE};font-size:10.3pt;line-height:1.5;color:#1b1b1d;margin:0}
.faixa{height:6px;background:linear-gradient(90deg,${cor},#12202b);border-radius:3px;margin-bottom:12px}
.topo{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.dono{display:flex;align-items:center;gap:10px;font-size:8.5pt;letter-spacing:.14em;text-transform:uppercase;color:#6b6b70}.dono .logo{height:28px;width:auto}
.mesa{font-weight:800;font-size:15pt;letter-spacing:-.02em;color:#12202b;display:inline-flex;align-items:baseline;gap:1px}.mesa i{display:inline-block;width:6px;height:6px;border-radius:50%;background:${cor};margin-left:1px}.mesa small{font-weight:600;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:#6b6b70;margin-left:8px}
header{padding-bottom:14px;margin-bottom:18px;border-bottom:1px solid #d9dbe0}.eyebrow{font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:${cor};font-weight:700;margin-bottom:6px}h1{font-size:23pt;line-height:1.12;margin:0 0 6px;color:#12202b;letter-spacing:-.01em}.sub{color:#555a63;font-size:11pt}
h2{font-size:9pt;letter-spacing:.16em;text-transform:uppercase;margin:20px 0 8px;color:#12202b;break-after:avoid;display:flex;align-items:center;gap:8px}h2::before{content:"";width:16px;height:3px;background:${cor};border-radius:2px}
h3{font-size:11pt;margin:12px 0 4px;break-after:avoid;color:#12202b}p{margin:0 0 8px}ul{margin:0 0 8px;padding-left:20px}li{margin-bottom:3px}li::marker{color:${cor}}
.resumo{font-size:12pt;line-height:1.4;padding:11px 15px;margin:0 0 14px;background:${cor}14;border-left:4px solid ${cor};border-radius:0 8px 8px 0;color:#12202b}
table{border-collapse:separate;border-spacing:0;width:100%;margin:6px 0 14px;font-size:9pt;break-inside:avoid;border:1px solid #d9dbe0;border-radius:8px;overflow:hidden}th,td{padding:6px 9px;text-align:left;vertical-align:top;border-bottom:1px solid #e6e8ec}tr:last-child td{border-bottom:0}th{background:#12202b;color:#fff;font-size:7.8pt;letter-spacing:.08em;text-transform:uppercase;font-weight:700}tr:nth-child(even) td{background:#f6f7f9}
td.up{color:#1f7a3a;font-weight:600}td.down{color:#b3261e;font-weight:600}td.mid{color:#a86a00;font-weight:600}
mark{background:#fff1c2;color:#6a4b00;padding:0 4px;border-radius:3px;font-size:.92em}
.aviso{margin-top:22px;padding:10px 14px;border:1px solid #d9dbe0;border-radius:8px;background:#f6f7f9;color:#555a63;font-size:8.3pt;line-height:1.45;break-inside:avoid}.aviso b{color:#12202b}
.ident{margin-top:10px;color:#6b6b70;font-size:8.6pt}
table.mold{border:0;border-radius:0;margin:0;font-size:inherit;overflow:visible;break-inside:auto}.mold>tbody>tr>td,.mold>tfoot>tr>td{padding:0;border:0;background:none}
.conferir{margin-top:6px;color:#6b6b70;font-size:8.8pt}.conferir h2{color:#6b6b70;font-size:8pt}.conferir h2::before{display:none}.conferir li::marker{color:#9a9aa0}
.fixo{display:flex;align-items:center;justify-content:space-between;gap:14px;border-top:1px solid #d9dbe0;padding-top:6px;margin-top:10px;font-size:7.3pt;color:#6b6b70}.fixo .m{display:flex;align-items:center;gap:10px;white-space:nowrap}.fixo img{height:26px;width:auto}.fixo .mesa{font-size:10pt}.fixo .mesa small{display:none}</style>
<table class="mold"><tbody><tr><td>
<div class="faixa"></div><div class="topo"><div class="dono">${dono}</div>${mesa}</div>
<header><div class="eyebrow">Material de apoio ao atendimento · ${hoje}</div><h1>${esc(a.titulo)}</h1>${a.subtitulo ? `<div class="sub">${destaque(esc(a.subtitulo))}</div>` : ''}</header>
${corpo}
<div class="aviso"><b>Aviso importante.</b> ${AVISO_LONGO}${a.rodape ? `<div class="ident">${esc(a.rodape)}</div>` : ''}</div>
</td></tr></tbody><tfoot><tr><td><div class="fixo"><span>${AVISO_CURTO}</span><span class="m">${mesa}${cm ? `<img src="${cm}">` : ''}</span></div></td></tr></tfoot></table>`;
  const pdf = path.join(pastaBase(), `${slug(a.titulo)}-${carimbo()}.pdf`);
  await renderizar(html, pdf, 'pdf', [794, 1123]);
  const r = { tipo: 'pdf', titulo: a.titulo, pasta: path.dirname(pdf), imagens: [], pdf, em: Date.now() };
  writeFileSync(ARQUIVO_GERACAO, JSON.stringify(r));
  return r;
}
