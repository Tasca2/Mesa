import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

export const W = 1920;
export const H = 1080;

const TEMAS = {
  escuro: { fundo: '#0E0E10', painel: '#17171A', tinta: '#F2EDE4', suave: '#9C9CA3', cor: '#C9A24B', linha: 'rgba(255,255,255,.15)', neg: '#E07A62' },
  claro: { fundo: '#F6F2EA', painel: '#ECE6D9', tinta: '#1A1A1C', suave: '#66666C', cor: '#8A6A2B', linha: 'rgba(0,0,0,.15)', neg: '#B0432B' },
  marinho: { fundo: '#0B1F33', painel: '#12304C', tinta: '#F1F4F7', suave: '#A3B3C4', cor: '#D8B26A', linha: 'rgba(255,255,255,.17)', neg: '#E8836A' },
};
const ESTILOS = {
  serifada: { titulo: "Georgia,'Times New Roman',serif", peso: 400, espaco: '-0.012em', pv: true },
  moderna: { titulo: "'Segoe UI','Helvetica Neue',Arial,sans-serif", peso: 600, espaco: '-0.02em', pv: true },
  minimo: { titulo: "Georgia,'Times New Roman',serif", peso: 400, espaco: '-0.012em' },
};
const CORPO = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const NUMS = "Cambria,'Times New Roman',Palatino,serif";

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lim = (s, quebra = false) => {
  const t = String(s ?? '').replace(/\p{Extended_Pictographic}/gu, '').replace(/️/g, '');
  const u = quebra ? t.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n') : t.replace(/\s+/g, ' ').trim();
  return esc(u).replace(/\[CONFERIR[^\]]*\]/g, (m) => `<span class="cf">${m}</span>`).replace(/\n/g, '<br>');
};
const num = (i) => String(i + 1).padStart(2, '0');

// ---------- Números no padrão brasileiro: os mesmos para o gráfico, a legenda e a tabela ----------
const MULTIPLICADOR = { mil: 1e3, mi: 1e6, milhao: 1e6, milhoes: 1e6, bi: 1e9, bilhao: 1e9, bilhoes: 1e9 };
export const casasDe = (v) => {
  if (!Number.isFinite(v)) return 0;
  const s = String(Math.abs(v));
  if (s.includes('e')) { const [b, e] = s.split('e'); return Math.max(0, (b.split('.')[1] || '').length - Number(e)); }
  return (s.split('.')[1] || '').length;
};
// "70%", "R$ 1.234,56", "-0,5 p.p.", "1,2 mi", "0,5% a.a.", "110% do CDI", 12.5 -> { v, unidade, casas, base, escala, escritas };
// texto que não é número -> null. base: "aa", "am" ou "cdi" depois do %; escala: mil, mi ou bi; escritas: casas como escritas.
export function lerNumero(x) {
  if (typeof x === 'number') return Number.isFinite(x) ? { v: x, unidade: '', casas: casasDe(x), base: '', escala: '', escritas: casasDe(x) } : null;
  const s = String(x ?? '').replace(/ /g, ' ').trim();
  const m = s.match(/^([+\-−–])?\s*(R\$|US\$|€)?\s*([+\-−–])?\s*(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?|\d+\.\d+)\s*(%|p\.\s?p\.|x|mil|mi|milh[aã]o|milh[oõ]es|bi|bilh[aã]o|bilh[oõ]es|pts?)?(?:\s*(a\.?\s?a\.?|a\.?\s?m\.?|ao ano|ao m[eê]s|do cdi|cdi))?$/i);
  if (!m) return null;
  const [, s1, moeda, s2, corpo, suf, qual] = m;
  let txt = corpo, casas;
  if (corpo.includes(',')) { casas = corpo.split(',')[1].length; txt = corpo.replace(/\./g, '').replace(',', '.'); }
  else if (/^\d{1,3}(\.\d{3})+$/.test(corpo)) { casas = 0; txt = corpo.replace(/\./g, ''); }
  else casas = (corpo.split('.')[1] || '').length;
  let v = Number(txt);
  const escritas = casas;
  const sufixo = String(suf || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s/g, '');
  if (qual && sufixo !== '%') return null;
  const escala = !MULTIPLICADOR[sufixo] ? '' : sufixo.startsWith('bi') ? 'bi' : sufixo === 'mil' ? 'mil' : 'mi';
  if (MULTIPLICADOR[sufixo]) { v *= MULTIPLICADOR[sufixo]; casas = casasDe(v); }
  if ([s1, s2].some((c) => c && c !== '+')) v = -v;
  const unidade = moeda || (sufixo === '%' ? '%' : sufixo === 'p.p.' ? 'p.p.' : sufixo === 'x' ? 'x' : /^pts?$/.test(sufixo) ? 'pts' : '');
  const q = String(qual || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s.]/g, '');
  const base = !q ? '' : q.includes('cdi') ? 'cdi' : q === 'aa' || q === 'aoano' ? 'aa' : 'am';
  return { v, unidade, casas, base, escala, escritas };
}
export const numeroDe = (x) => lerNumero(x)?.v ?? NaN;
export function formatador(unidade = '', casas = 0) {
  const u = String(unidade || '').trim();
  return (v) => {
    const n = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
    const sinal = v < 0 && /[1-9]/.test(n) ? '−' : '';
    if (/^(R\$|US\$|€)$/.test(u)) return `${sinal}${u} ${n}`;
    if (u === '%' || u.toLowerCase() === 'x') return `${sinal}${n}${u}`;
    return u ? `${sinal}${n} ${u}` : `${sinal}${n}`;
  };
}
// Diferença B − A, calculada pelo código. Valores que não são número (ex.: "D+0") usam o texto do item.
// Percentual vira p.p. (também "% a.a." e "% do CDI", quando A e B têm a mesma base); "mil", "mi" e "bi" ficam na escala escrita.
function diferenca(a, b, texto) {
  const A = lerNumero(a), B = lerNumero(b);
  if (A && B && (!A.unidade || !B.unidade)) A.unidade = B.unidade = A.unidade || B.unidade;
  if (!A || !B || A.unidade !== B.unidade || A.base !== B.base) return { txt: String(texto || '—'), num: false };
  const escala = A.escala && A.escala === B.escala ? A.escala : '';
  const casas = Math.min(2, escala ? Math.max(A.escritas, B.escritas) : Math.max(A.casas, B.casas));
  const d = (B.v - A.v) / (escala ? MULTIPLICADOR[escala] : 1), f = formatador(A.unidade === '%' ? 'p.p.' : A.unidade, casas), e = escala ? ` ${escala}` : '';
  if (Math.abs(d) < 0.5 * 10 ** -casas) return { txt: f(0) + e, num: true };
  return { txt: (d > 0 ? '+' : '') + f(d) + e, num: true };
}
const passoBonito = (bruto) => { const p = 10 ** Math.floor(Math.log10(bruto || 1)), f = bruto / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
// Tamanho conforme a quantidade de itens: menos itens, letra maior.
const porQtd = (n, ...faixas) => (faixas.find(([ate]) => n <= ate) ?? faixas[faixas.length - 1])[1];

export function imagemEmbutida(caminho, avisos, nome) {
  if (!caminho) return '';
  try {
    const ext = path.extname(String(caminho)).toLowerCase();
    const tipos = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
    if (!tipos[ext]) { avisos.push(`${nome}: formato não aceito (use PNG, JPG, WEBP ou SVG).`); return ''; }
    if (!existsSync(caminho)) { avisos.push(`${nome}: não achei o arquivo ${caminho}.`); return ''; }
    if (statSync(caminho).size > 6 * 1024 * 1024) { avisos.push(`${nome}: arquivo maior que 6 MB.`); return ''; }
    return `data:${tipos[ext]};base64,${readFileSync(caminho).toString('base64')}`;
  } catch { avisos.push(`${nome}: não consegui ler o arquivo.`); return ''; }
}

const tamTitulo = (s, g = 78) => { const n = String(s || '').length; return n <= 38 ? g : n <= 64 ? Math.round(g * 0.85) : n <= 95 ? Math.round(g * 0.72) : Math.round(g * 0.62); };
const tamTexto = (s, g = 32) => { const n = String(s || '').length; return Math.max(28, n <= 140 ? g : n <= 260 ? g - 3 : g - 5); };

export function css(t, est, cor) {
  return `@page{size:${W}px ${H}px;margin:0}*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${t.fundo}}body{font-family:${CORPO};-webkit-font-smoothing:antialiased;color:${t.tinta}}
.s{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${t.fundo};page-break-after:always;break-after:page}
.s::before{content:"";position:absolute;right:-380px;top:-380px;width:1000px;height:1000px;border-radius:50%;background:radial-gradient(circle,${cor}14 0%,${cor}00 68%)}
.c{position:absolute;left:140px;right:140px;top:96px;bottom:150px;display:flex;flex-direction:column}
.pe{position:absolute;left:140px;right:140px;bottom:46px;display:flex;justify-content:space-between;align-items:baseline;gap:40px;border-top:1px solid ${t.linha};padding-top:18px;font-size:22px;letter-spacing:.02em;color:${t.suave}}
.pe .a{flex:1;max-width:1480px;line-height:1.35;font-size:22px}.pe .n{font-family:${NUMS};font-size:24px;color:${cor};letter-spacing:.08em}
.et{font-size:20px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${cor};margin-bottom:28px;display:flex;align-items:center;gap:20px}
.et::after{content:"";width:72px;height:1px;background:${cor}}
span.cf{background:${cor}2e;color:${cor};padding:0 .3em;border-radius:3px;font-size:max(.82em,min(1em,28px));letter-spacing:.01em}
h2{font-family:${est.titulo};font-weight:${est.peso};letter-spacing:${est.espaco};line-height:1.12;max-width:1480px}
.sub{font-size:32px;line-height:1.45;color:${t.suave};margin-top:24px;max-width:1360px}
.fonte{font-size:22px;color:${t.suave};margin-top:auto;padding-top:18px;letter-spacing:.02em}
.corpo{flex:1;display:flex;flex-direction:column;justify-content:center;min-height:0}
/* capa */
.capa .c{justify-content:space-between}.capa .topo{display:flex;justify-content:space-between;align-items:center;min-height:70px}.capa .topo img{max-height:70px;max-width:340px;object-fit:contain}
.capa .marca-t{font-size:22px;letter-spacing:.26em;text-transform:uppercase;color:${t.suave}}
.capa .meio{display:flex;flex-direction:column;justify-content:center;flex:1;max-width:1300px}.capa .com-foto .meio{max-width:980px}
.capa h2{font-size:92px;line-height:1.06;max-width:1280px}.capa .regua{width:96px;height:3px;background:${cor};margin:44px 0 36px}.capa .sub{margin-top:0;font-size:34px}
.capa .base{display:flex;gap:64px;align-items:flex-end;font-size:28px;color:${t.suave};letter-spacing:.02em;line-height:1.3}.capa .base b{display:block;color:${t.tinta};font-weight:600;font-size:32px;margin-bottom:4px;letter-spacing:0}
.capa .base .r{display:block;font-size:20px;letter-spacing:.22em;text-transform:uppercase;color:${cor};margin-bottom:8px}
.capa .foto{position:absolute;right:0;top:0;bottom:0;width:640px}.capa .foto img{width:100%;height:100%;object-fit:cover;filter:saturate(.9)}.capa .foto::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,${t.fundo} 0%,${t.fundo}00 38%)}
.capa .com-foto .c{right:720px}
/* perfil */
.perfil .cols{display:flex;gap:110px;flex:1;align-items:stretch;min-height:0}.perfil .fotoq{width:520px;flex:none;position:relative;margin:6px 0 34px 18px}
.perfil .fotoq img,.perfil .fotoq .ini{width:100%;height:100%;object-fit:cover;display:flex;align-items:center;justify-content:center}
.perfil .fotoq::before{content:"";position:absolute;left:-18px;top:18px;right:18px;bottom:-18px;border:1px solid ${cor};z-index:0}
.perfil .fotoq img,.perfil .fotoq .ini{position:relative;z-index:1}.perfil .ini{background:${t.painel};font-family:${est.titulo};font-size:190px;color:${cor};letter-spacing:.04em}
.perfil .dir{flex:1;display:flex;flex-direction:column;justify-content:center;min-width:0}
.fatos{margin-top:44px;border-top:1px solid ${t.linha}}.fato{display:flex;gap:40px;padding:24px 0;border-bottom:1px solid ${t.linha};align-items:baseline}
.fato .r{width:250px;flex:none;font-size:20px;letter-spacing:.2em;text-transform:uppercase;color:${t.suave}}.fato .v{font-size:34px;line-height:1.35}
/* números */
.nums{display:flex;margin-top:24px;border-top:1px solid ${t.linha}}.nums .n1{flex:1;padding:52px 44px 0 0;display:flex;flex-direction:column;justify-content:center}.nums .n1+.n1{padding-left:48px;border-left:1px solid ${t.linha}}
.nums .v{font-family:${NUMS};font-size:128px;line-height:1;color:${cor};letter-spacing:-.02em}.nums .l{font-size:32px;line-height:1.35;margin-top:24px}.nums .f{font-size:22px;color:${t.suave};margin-top:16px}
/* pilares */
.cols-p{display:flex;gap:64px;margin-top:24px}.cols-p .p{flex:1;border-top:1px solid ${t.linha};padding-top:34px;position:relative;display:flex;flex-direction:column;justify-content:center}.cols-p .p::before{content:"";position:absolute;left:0;top:-2px;width:72px;height:3px;background:${cor}}
.cols-p .nn{font-family:${NUMS};font-size:54px;color:${cor};line-height:1}.cols-p h3{font-family:${est.titulo};font-weight:${est.peso};font-size:46px;line-height:1.15;margin:26px 0 18px}.cols-p p{font-size:30px;line-height:1.5;color:${t.suave}}
/* etapas */
.et-l{position:relative;display:flex;gap:64px;margin-top:56px}.et-l::before{content:"";position:absolute;left:0;right:0;top:15px;height:1px;background:${t.linha}}
.et-l .e{flex:1;position:relative;padding-top:56px;display:flex;flex-direction:column;justify-content:center}.et-l .e::before{content:"";position:absolute;left:0;top:0;width:31px;height:31px;border-radius:50%;background:${t.fundo};border:2px solid ${cor}}
.et-l .e::after{content:"";position:absolute;left:10px;top:10px;width:11px;height:11px;border-radius:50%;background:${cor}}
.et-l .k{font-size:20px;letter-spacing:.22em;text-transform:uppercase;color:${cor};margin-bottom:16px}.et-l h3{font-family:${est.titulo};font-weight:${est.peso};font-size:46px;line-height:1.15;margin-bottom:18px}.et-l p{font-size:30px;line-height:1.5;color:${t.suave}}
/* tabela */
table{border-collapse:collapse;width:100%;margin-top:24px}.tb{display:flex;flex-direction:column}.tb table{flex:1}th{font-size:22px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${cor};text-align:left;padding:0 24px 20px 0;border-bottom:2px solid ${cor}}
td{font-size:30px;line-height:1.35;padding:28px 24px 28px 0;border-bottom:1px solid ${t.linha};vertical-align:middle}td:first-child{font-weight:600;width:30%}
th.n,td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}th.n:last-child,td.n:last-child{padding-right:0}
/* barras */
.bar{margin-top:24px;display:flex;flex-direction:column;justify-content:space-around;gap:30px}.leg{display:flex;gap:44px;font-size:28px;color:${t.suave};margin-top:36px}.leg i{display:inline-block;width:30px;height:12px;margin-right:14px;vertical-align:middle}
.bl{display:grid;grid-template-columns:400px 1fr 200px;gap:34px;align-items:center}.bl .r{font-size:30px;line-height:1.25}.bl .t{display:flex;flex-direction:column;gap:8px}.bl .t div{height:24px;background:${t.painel};position:relative}.bl .t b{position:absolute;top:0;height:100%}.bl .t i.zero{position:absolute;top:-8px;bottom:-8px;width:2px;margin-left:-1px;background:${t.tinta};opacity:.6}
.bl .p{font-family:${NUMS};font-size:38px;line-height:1.15;text-align:right;color:${t.tinta}}.bl .p span{display:block;color:${t.suave}}
/* frase */
.frase .corpo{justify-content:center;padding-left:56px;border-left:3px solid ${cor}}.frase h2{font-size:84px;line-height:1.16;max-width:1500px}.frase .sub{font-size:34px}
/* lista */
.grade{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:0 96px;margin-top:28px}.grade .it{padding:var(--py,28px) 0;border-top:1px solid ${t.linha};display:flex;flex-direction:column;justify-content:center}.grade h3{font-family:${est.titulo};font-weight:${est.peso};font-size:37px;line-height:1.2;margin-bottom:12px}.grade p{font-size:28px;line-height:1.5;color:${t.suave}}
.grade .it::before{content:"";display:block;width:40px;height:3px;background:${cor};margin:-30px 0 26px}
/* fechamento */
.fech .cols{display:flex;gap:110px;flex:1;min-height:0;align-items:stretch}.fech .esq{flex:1.25;display:flex;flex-direction:column;justify-content:center}.fech .dir{flex:1;border:1px solid ${cor};padding:56px 56px;background:${t.painel};display:flex;flex-direction:column;justify-content:center}
.passos{margin-top:48px}.passo{display:flex;gap:34px;padding:30px 0;border-top:1px solid ${t.linha};align-items:baseline;font-size:34px;line-height:1.4}.passo i{font-style:normal;font-family:${NUMS};color:${cor};font-size:36px;width:52px;flex:none}
.dir .k{font-size:20px;letter-spacing:.24em;text-transform:uppercase;color:${cor};margin-bottom:26px}.dir .ln{font-size:30px;line-height:1.35;padding:14px 0;border-bottom:1px solid ${t.linha}}.dir .ln:first-of-type{font-family:${est.titulo};font-size:42px;padding-top:0}
.ctr .c{justify-content:center}.ctr .corpo{flex:none;margin-top:6px}.ctr .fonte{margin-top:36px;padding-top:0}
.enche .corpo{margin-top:12px}.alto{flex:1;min-height:0;max-height:var(--mx,none)}
/* ícones */
.ico{height:60px;display:flex;align-items:center}.ico2{margin:4px 0 16px;height:46px}
.grade .it.ci{display:flex;flex-direction:row;justify-content:start;gap:30px;align-items:center;position:relative}.grade .it.ci::before{position:absolute;left:0;top:-1px;margin:0}.grade .it.ci .ico{flex:none;padding-top:4px;height:auto}
/* diagrama */
.nm{font-family:${NUMS};font-size:46px;color:${cor}}
.palco{display:flex;flex-direction:column;justify-content:center;padding:48px 56px;border:1px solid ${t.linha};border-radius:28px;background:${t.painel}}.fluxo{display:flex;align-items:flex-start;justify-content:space-between}.fluxo .no{display:flex;flex-direction:column;align-items:center;text-align:center;flex:none}
.circ{width:var(--cd,136px);height:var(--cd,136px);border:1.5px solid ${cor};border-radius:50%;display:flex;align-items:center;justify-content:center;background:${t.painel}}.circ.s2{width:104px;height:104px;margin:0 auto}
.fluxo .no h3,.hn h3{font-family:${est.titulo};font-weight:${est.peso};font-size:36px;line-height:1.15;margin:28px 0 12px}.fluxo .no p,.hn p{font-size:28px;line-height:1.45;color:${t.suave}}
.fluxo .lig{flex:1;position:relative;height:var(--cd,136px);min-width:60px}.fluxo .lig::before{content:"";position:absolute;left:10px;right:16px;top:50%;height:1.5px;background:${cor};opacity:.6}
.fluxo .lig::after{content:"";position:absolute;right:10px;top:50%;width:11px;height:11px;border-top:1.5px solid ${cor};border-right:1.5px solid ${cor};transform:translateY(-50%) rotate(45deg);opacity:.9}
.fluxo .lig span{position:absolute;left:-30px;right:-30px;bottom:calc(50% + 14px);text-align:center;font-size:28px;line-height:1.2;color:${t.suave};letter-spacing:.01em}
.hub{position:relative;width:1640px;height:620px}.hub>svg{position:absolute;left:0;top:0}.hc{position:absolute;width:220px;height:220px;border-radius:50%;border:2px solid ${cor};background:${t.painel};display:flex;align-items:center;justify-content:center;text-align:center;padding:22px;font-family:${est.titulo};font-size:31px;line-height:1.15}
.hn{position:absolute;width:280px;text-align:center}.hn h3{font-size:30px;margin:14px 0 6px}.hn p{font-size:28px;line-height:1.3}
/* ilustração, templo, agenda, seção, ponte */
.ilu .ilbox{position:absolute;right:140px;top:200px;width:620px;height:620px;border-radius:50%;background:${t.painel};border:1px solid ${cor}55;padding:14px}.ilu .ilbox svg{width:100%;height:100%}.ilu .c{right:860px}.ilu .pe .a{max-width:none}
.templo{width:100%}.templo .front{position:relative;height:112px}.templo .front svg{position:absolute;inset:0;width:100%;height:100%}.templo .front span{position:absolute;left:0;right:0;bottom:26px;text-align:center;font-size:22px;letter-spacing:.3em;text-transform:uppercase;color:${cor}}
.templo .arq{height:22px;border:2px solid ${cor};background:${t.painel};margin-top:-1px}.templo .colunas{display:grid;margin-top:10px}.templo .col{display:flex;flex-direction:column;align-items:center}
.templo .cap,.templo .bas{width:150px;height:16px;border:2px solid ${cor};background:${t.painel}}.templo .fuste{width:110px;height:200px;border-left:2px solid ${cor};border-right:2px solid ${cor};background:repeating-linear-gradient(90deg,transparent 0 17px,${t.linha} 17px 19px)}
.templo .degraus{margin-top:8px}.templo .degraus i{display:block;height:13px;border:2px solid ${cor};background:${t.painel};margin:0 0 -2px}.templo .degraus i:first-child{margin:0 2.5%}
.templo .txts{display:grid;gap:40px;margin-top:36px}.templo .txts div{text-align:center;padding:0 12px}.templo .txts h3{font-family:${est.titulo};font-weight:${est.peso};font-size:40px;line-height:1.15;color:${cor};margin-bottom:12px}.templo .txts p{font-size:30px;line-height:1.45;color:${t.suave}}
.agenda{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:0 96px;margin-top:28px}.ag{display:flex;gap:30px;padding:var(--py,26px) 0;border-top:1px solid ${t.linha};align-items:center}.ag i{font-style:normal;font-family:${NUMS};font-size:40px;color:${cor};width:64px;flex:none}.ag h3{font-family:${est.titulo};font-weight:${est.peso};font-size:35px;line-height:1.2}.ag p{font-size:28px;line-height:1.45;color:${t.suave};margin-top:8px}
.secao .corpo{justify-content:center;padding-left:60px;border-left:3px solid ${cor}}.secao .gn{font-family:${NUMS};font-size:150px;line-height:1;color:${cor};margin-bottom:18px}
.ponte{position:absolute;left:140px;right:140px;bottom:106px;z-index:3;font-size:28px;color:${cor};letter-spacing:.01em;display:flex;gap:14px;align-items:center}.ponte::before{content:"→";font-size:32px;line-height:1}.c>.ponte{position:relative;left:auto;right:auto;bottom:auto;margin-top:20px;flex:none}
/* rosca */
.ros{display:flex;align-items:center;gap:110px;margin-top:20px}.ros svg{flex:none;display:block}.ros .lgs{flex:1;min-width:0}
.ros .li{display:grid;grid-template-columns:28px 1fr auto;gap:0 28px;align-items:baseline;padding:var(--py,18px) 0;border-top:1px solid ${t.linha}}.ros .li:last-child{border-bottom:1px solid ${t.linha}}
.ros .li i{width:26px;height:26px;border-radius:7px;align-self:center}.ros .lr{font-size:34px;line-height:1.25}.ros .lv{font-family:${NUMS};font-size:44px;line-height:1.1;text-align:right;white-space:nowrap}
.ros .lp{font-size:28px;color:${t.suave};margin-left:16px;font-family:${CORPO}}.ros .lt{grid-column:2/4;font-size:28px;line-height:1.4;color:${t.suave};margin-top:6px}
/* linha */
.lin{margin-top:16px}.lin svg{display:block;overflow:visible}.lin .lg{display:flex;flex-wrap:wrap;gap:12px 48px;font-size:30px;margin-bottom:26px}.lin .lg i{display:inline-block;width:40px;height:7px;border-radius:4px;margin-right:16px;vertical-align:middle}
.eixo{font-size:22px;fill:${t.suave};font-family:${CORPO}}.fim{font-size:34px;font-family:${NUMS}}
/* comparativo */
.cmp{display:grid;grid-template-columns:1fr 290px 300px 290px;grid-template-rows:auto;grid-auto-rows:1fr;align-items:stretch;margin-top:24px}.cmp>div{display:flex;flex-direction:column;justify-content:center;padding:var(--py,24px) 0;border-bottom:1px solid ${t.linha}}
.cmp .h{font-size:24px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${cor};padding:0 0 20px;border-bottom:2px solid ${cor};text-align:center}.cmp .h:first-child{text-align:left}
.cmp .r{font-size:36px;line-height:1.25;padding-right:24px}.cmp .r .nt{display:block;font-size:28px;color:${t.suave};margin-top:6px}
.cmp .v{font-family:${NUMS};font-size:50px;line-height:1.1;text-align:center;white-space:nowrap}.cmp .dc{align-items:center}
.dif{font-size:30px;line-height:1.2;padding:10px 24px;border-radius:999px;border:1px solid ${cor}88;color:${cor};background:${cor}1a;white-space:nowrap;text-align:center}.dif.tx{white-space:normal;font-size:28px;border-radius:24px}
/* imagem */
.metade .foto2{position:absolute;right:0;top:0;bottom:0;width:860px}.metade .foto2 img{width:100%;height:100%;object-fit:cover}.metade .foto2::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,${t.fundo} 0%,${t.fundo}00 30%)}
.metade .c{right:960px}.metade .pe{right:960px}.metade .pe .a{max-width:none}
.cheia .bg{position:absolute;inset:0}.cheia .bg img{width:100%;height:100%;object-fit:cover}.cheia .bg::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,${t.fundo}f2 6%,${t.fundo}b8 42%,${t.fundo}33 100%)}
.cheia .c{z-index:2}.cheia .corpo{justify-content:flex-end;padding-bottom:30px}.cheia .pe{z-index:2;border-top-color:${t.linha}}${galeriaCss(t, est, cor)}${est.pv ? pvCss(t, est, cor) : ''}`;
}
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixar = (a, b, p) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, k) => Math.round(v + (B[k] - v) * p).toString(16).padStart(2, '0')).join(''); };

function galeriaCss(t, est, cor) {
  return `.galeria{display:grid;gap:52px;margin-top:56px}.galeria .gl{display:flex;flex-direction:column}
.galeria .arc{height:400px;border-radius:200px 200px 26px 26px;overflow:hidden;border:1px solid ${cor}77;position:relative;background:${t.painel};box-shadow:0 34px 70px -34px rgba(0,0,0,.7)}.galeria .arc img{width:100%;height:100%;object-fit:cover;display:block}
.galeria .arc.vazio{display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 28%,${cor}38,${cor}0a 70%),${t.painel}}
.galeria h3{font-family:${est.titulo};font-weight:${est.peso};font-size:42px;line-height:1.15;margin:30px 0 10px}.galeria p{font-size:28px;line-height:1.45;color:${t.suave}}`;
}

function pvCss(t, est, cor) {
  const c2 = mixar(cor, '#ffffff', 0.42);
  // Número grande em cor sólida: o texto com gradiente recortado deixa um fio em volta do número em leitores de PDF (MuPDF e Poppler).
  const c3 = mixar(cor, '#ffffff', 0.2);
  const tom = mixar(t.fundo, cor, 0.09);
  const cartao = `linear-gradient(165deg,${cor}33 0%,rgba(255,255,255,.025) 52%,rgba(255,255,255,0) 100%),${t.painel}`;
  return `
.s{background:radial-gradient(1200px 800px at 98% -8%,${cor}4a 0%,${cor}00 62%),radial-gradient(1000px 700px at -10% 110%,${cor}38 0%,${cor}00 60%),linear-gradient(155deg,${t.fundo} 0%,${tom} 100%)}
.s::before{right:-330px;top:-330px;width:900px;height:900px;background:none;border:1px solid ${cor}38;box-shadow:0 0 0 80px ${cor}0b,0 0 0 160px ${cor}07,0 0 0 240px ${cor}04}
.s::after{content:"";position:absolute;left:0;top:0;bottom:0;width:9px;background:linear-gradient(180deg,${cor} 0%,${c2} 46%,${cor}00 100%)}
.et{align-self:flex-start;padding:11px 24px;border:1px solid ${cor}77;border-radius:999px;background:${cor}1a;font-size:20px;letter-spacing:.2em;margin-bottom:32px}.et::after{display:none}
span.cf{background:${cor}33}
.pe{border-top-color:${cor}33}
.cols-p{gap:34px;margin-top:24px;align-items:stretch}
.cols-p .p{border:1px solid ${t.linha};border-radius:28px;padding:var(--py,48px) 40px var(--py,44px);background:${cartao};box-shadow:0 36px 70px -34px rgba(0,0,0,.75),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden;border-top:1px solid ${t.linha}}
.cols-p .p::before{left:0;top:0;width:100%;height:6px;background:linear-gradient(90deg,${cor},${c2})}
.cols-p .nn{font-size:92px;color:${c3};letter-spacing:-.02em}
.cols-p .ico{width:108px;height:108px;border-radius:50%;justify-content:center;background:radial-gradient(circle at 30% 28%,${cor}44,${cor}0f 72%);border:1px solid ${cor}77;box-shadow:0 0 50px ${cor}25}
.cols-p h3{margin:30px 0 16px}
.et-l{gap:34px;margin-top:44px}.et-l::before{display:none}
.et-l .e{padding:64px 38px var(--py,40px);border:1px solid ${t.linha};border-radius:28px;background:${cartao};box-shadow:0 36px 70px -34px rgba(0,0,0,.75)}
.et-l .e::before{left:38px;top:-20px;width:40px;height:40px;border:0;background:linear-gradient(135deg,${c2},${cor});box-shadow:0 0 30px ${cor}66}.et-l .e::after{display:none}
.et-l .e .ico2{margin:6px 0 18px}
.nums{border:0;gap:30px;margin-top:24px}.nums .n1,.nums .n1+.n1{padding:48px 42px 42px;border:1px solid ${t.linha};border-radius:28px;background:${cartao};box-shadow:0 36px 70px -34px rgba(0,0,0,.75)}
.nums .v{color:${c3};font-size:118px}
.grade{gap:28px 36px}.grade .it{padding:var(--py,36px) 36px;border:1px solid ${t.linha};border-left:5px solid ${cor};border-radius:22px;background:${cartao}}.grade .it::before{display:none}
.grade .it.ci .ico{width:84px;height:84px;border-radius:50%;justify-content:center;align-items:center;padding:0;background:radial-gradient(circle at 30% 28%,${cor}44,${cor}0f 72%);border:1px solid ${cor}66}
.ag{padding:var(--py,44px) 38px;border:1px solid ${t.linha};border-radius:22px;background:${cartao};margin-bottom:0;border-top:1px solid ${t.linha}}.agenda{gap:22px 40px}.ag i{color:${c3}}
.palco{background:${cartao};box-shadow:0 36px 70px -34px rgba(0,0,0,.75)}
.fech .dir{border-radius:30px;border:1px solid ${cor}77;background:${cartao};box-shadow:0 0 110px ${cor}22,0 36px 70px -34px rgba(0,0,0,.75)}
.frase .corpo{border-left:0;padding-left:30px;position:relative}.frase .corpo::before{content:"\\201C";position:absolute;left:-20px;top:calc(50% - 340px);font-family:Georgia,serif;font-size:420px;line-height:1;color:${cor}30}
.secao .corpo{border-left:0;padding-left:0}.secao .gn{font-size:190px;color:${c3}}
.secao::before{right:-200px;top:50%;margin-top:-450px;width:900px;height:900px}
.fluxo .circ,.circ{border:1.5px solid ${cor}99;background:radial-gradient(circle at 32% 28%,${cor}3d,${cor}0d 72%),${t.painel};box-shadow:0 0 56px ${cor}2e}
.hc{border-color:${cor};background:radial-gradient(circle at 32% 28%,${cor}55,${cor}14 72%),${t.painel};box-shadow:0 0 90px ${cor}33}
.templo .txts h3{color:${hexRgb(t.fundo).reduce((a, v) => a + v, 0) > 600 ? cor : c2}}
.ros .li,.cmp>div{border-color:${t.linha}}.dif{background:linear-gradient(165deg,${cor}33,${cor}12);border-color:${cor}99}
.metade .foto2{right:90px;top:92px;bottom:150px;width:780px;border-radius:390px 390px 30px 30px;overflow:hidden;border:1px solid ${cor}77;box-shadow:0 40px 90px -30px rgba(0,0,0,.8)}.metade .foto2::after{display:none}
.metade .c{right:1000px}.metade .pe{right:1000px}
.capa .foto{width:800px;clip-path:polygon(17% 0,100% 0,100% 100%,0 100%)}.capa .foto img{filter:saturate(1)}.capa .foto::after{background:linear-gradient(90deg,${t.fundo}cc 0%,${t.fundo}00 40%),linear-gradient(0deg,${cor}33 0%,${cor}00 40%)}
.capa .diag{position:absolute;left:0;top:0;pointer-events:none}.capa .orn{position:absolute;right:0;top:0;width:900px;height:1080px}.capa .orn svg{display:block}
.capa.pv .c{right:900px}.capa.pv .com-foto .c{right:900px}.capa.pv h2{font-size:84px}
.capa .regua{width:140px;height:5px;background:linear-gradient(90deg,${cor},${c2});border-radius:3px}
.perfil .fotoq{width:540px;margin:0 0 24px 0}.perfil .fotoq img,.perfil .fotoq .ini{border-radius:270px 270px 28px 28px;box-shadow:0 40px 90px -30px rgba(0,0,0,.8)}
.perfil .fotoq::before{left:-22px;top:22px;right:22px;bottom:-22px;border-radius:270px 270px 34px 34px;border:1px solid ${cor}88}
.perfil .ini{background:radial-gradient(circle at 50% 30%,${cor}55,${cor}12 70%),${t.painel};background-clip:border-box;font-size:200px}
.fatos{border:0;display:grid;gap:14px;margin-top:36px}.fato{border:1px solid ${t.linha};border-radius:18px;padding:22px 30px;background:${cartao}}.fato .r{width:230px}`;
}

// Rodapé: o cliente (quando há) e a identificação do profissional; número da página à direita.
const rodapePagina = (m, i, n) => `<div class="pe"><div class="a">${[m.cliente, m.rodape || m.escritorio].filter(Boolean).map((x) => lim(x)).join(' · ')}</div><div class="n">${num(i)} / ${String(n).padStart(2, '0')}</div></div>`;
const etiqueta = (s) => (s.etiqueta ? `<div class="et">${lim(s.etiqueta)}</div>` : '');
const titulo = (s, g) => `<h2 style="font-size:${tamTitulo(s.titulo, g)}px">${lim(s.titulo)}</h2>`;
const subt = (s) => (s.subtitulo || s.texto ? `<div class="sub" style="font-size:${tamTexto(s.subtitulo || s.texto, 32)}px">${lim(s.subtitulo || s.texto, true)}</div>` : '');
const fonteTxt = (s) => (s.fonte ? `<div class="fonte">Fonte: ${lim(s.fonte)}</div>` : '');
const itensDe = (s, max) => (Array.isArray(s.itens) ? s.itens.slice(0, max) : []);

const ICONES = {
  investimentos: '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
  alocacao: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15.5 3.4A9 9 0 0 1 20.6 8.5H15.5z"/>',
  cambio: '<path d="M7 7h13"/><path d="M16 3l4 4-4 4"/><path d="M17 17H4"/><path d="M8 13l-4 4 4 4"/>',
  previdencia: '<path d="M6 2h12v4l-6 6 6 6v4H6v-4l6-6-6-6z"/>',
  sucessao: '<circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M12 7.5v4"/><path d="M12 11.5H6v5"/><path d="M12 11.5h6v5"/>',
  credito: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>',
  planejamento: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  juridico: '<path d="M12 3v18"/><path d="M5 21h14"/><path d="M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0z"/><path d="M19 7l-3 7a3 3 0 0 0 6 0z"/>',
  equipe: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c3 .2 5 2.3 5 5.3"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/>',
  empresa: '<rect x="4" y="3" width="10" height="18"/><rect x="14" y="9" width="6" height="12"/><path d="M7 7h4"/><path d="M7 11h4"/><path d="M7 15h4"/>',
  imovel: '<path d="M3 11l9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M10 21v-6h4v6"/>',
  exterior: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18"/><path d="M12 3c-3 3-3 15 0 18"/>',
  carteira: '<path d="M3 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l2-3h12"/><path d="M16 14h3"/>',
  protecao: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  documento: '<path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5"/><path d="M9 13h7"/><path d="M9 17h7"/>',
  prazo: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  conversa: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8"/><path d="M8 12.5h5"/>',
  custodia: '<rect x="4" y="10" width="16" height="11" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/>',
  instituicao: '<path d="M3 9l9-6 9 6"/><path d="M5 9v9"/><path d="M10 9v9"/><path d="M14 9v9"/><path d="M19 9v9"/><path d="M3 21h18"/>',
  confirmar: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  seta: '<path d="M4 12h16"/><path d="M14 6l6 6-6 6"/>',
};
export const NOMES_ICONE = Object.keys(ICONES);
const svgIcone = (nome, cor, px) => `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${ICONES[nome]}</svg>`;
const resolverCaminho = (ref, m) => (/^([a-zA-Z]:[\\/]|\/|\\\\)/.test(String(ref)) ? String(ref) : path.join(m.pastaImagens || '', String(ref)));
function icone(ref, m, px) {
  if (!ref) return '';
  const k = String(ref).trim().toLowerCase();
  if (ICONES[k]) return svgIcone(k, m.cor, px);
  const src = imagemEmbutida(resolverCaminho(ref, m), m.avisos || [], `ícone ${ref}`);
  return src ? `<img src="${src}" style="width:${px}px;height:${px}px;object-fit:contain">` : '';
}
const imagemDe = (ref, m) => imagemEmbutida(resolverCaminho(ref, m), m.avisos || [], `imagem ${ref}`);

const estrela = (cx, cy, R, r) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, d = i % 2 ? r : R; p.push(`${(cx + d * Math.cos(a)).toFixed(1)},${(cy + d * Math.sin(a)).toFixed(1)}`); } return p.join(' '); };
const figura = (cx, base, e, c) => {
  const hy = base - 172 * e, r = 32 * e, f = (v) => (v * e).toFixed(1);
  return `<circle cx="${cx}" cy="${hy.toFixed(1)}" r="${r.toFixed(1)}"/><path d="M${(cx - 13 * e).toFixed(1)} ${(hy + 8 * e).toFixed(1)}q${f(13)} ${f(14)} ${f(26)} 0"/>` +
    `<circle cx="${(cx - 11 * e).toFixed(1)}" cy="${(hy - 6 * e).toFixed(1)}" r="${f(2.4)}" fill="${c}" stroke="none"/><circle cx="${(cx + 11 * e).toFixed(1)}" cy="${(hy - 6 * e).toFixed(1)}" r="${f(2.4)}" fill="${c}" stroke="none"/>` +
    `<path d="M${(cx - 48 * e).toFixed(1)} ${base}V${(base - 66 * e).toFixed(1)}q0 ${f(-44)} ${f(48)} ${f(-44)}t${f(48)} ${f(44)}V${base}"/>` +
    `<path d="M${(cx - 42 * e).toFixed(1)} ${(base - 92 * e).toFixed(1)}L${(cx - 76 * e).toFixed(1)} ${(base - 160 * e).toFixed(1)}M${(cx + 42 * e).toFixed(1)} ${(base - 92 * e).toFixed(1)}L${(cx + 76 * e).toFixed(1)} ${(base - 160 * e).toFixed(1)}"/>`;
};
const janelas = (x, y, w, h, cols, rows, s) => { let o = ''; const gw = w / cols, gh = h / rows; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) o += `<rect x="${(x + i * gw + gw * 0.28).toFixed(1)}" y="${(y + j * gh + gh * 0.25).toFixed(1)}" width="${(gw * 0.44).toFixed(1)}" height="${(gh * 0.4).toFixed(1)}" stroke="${s}" stroke-width="2"/>`; return o; };
const ILUSTRACOES = {
  conquista: (c, s) => `<path d="M210 130h180v85a90 90 0 0 1-180 0z"/><path d="M210 158h-50a50 50 0 0 0 52 84"/><path d="M390 158h50a50 50 0 0 1-52 84"/><path d="M300 305v62"/><path d="M236 367h128"/><rect x="214" y="367" width="172" height="40" rx="5"/><rect x="190" y="407" width="220" height="30" rx="5" stroke="${s}"/><polygon points="${estrela(300, 202, 38, 16)}" fill="${c}" fill-opacity=".25"/><path d="M300 86v-32M230 100l-16-26M370 100l16-26M178 150l-26-10M422 150l26-10" stroke="${s}"/><path d="M150 480q150 44 300 0" stroke="${s}"/>`,
  pessoas: (c, s) => `<path d="M40 524H560" stroke="${s}"/>${figura(100, 500, 1.2, c)}${figura(300, 520, 1.42, c)}${figura(500, 500, 1.2, c)}<polygon points="${estrela(120, 150, 16, 7)}" fill="${c}" fill-opacity=".3" stroke="none"/><polygon points="${estrela(485, 120, 12, 5)}" fill="${c}" fill-opacity=".3" stroke="none"/><polygon points="${estrela(300, 64, 14, 6)}" fill="${c}" fill-opacity=".3" stroke="none"/>`,
  escritorio: (c, s) => `<path d="M70 500H530" stroke="${s}"/><rect x="90" y="250" width="110" height="250"/>${janelas(90, 250, 110, 250, 3, 6, s)}<rect x="210" y="150" width="140" height="350" fill="${c}" fill-opacity=".1"/>${janelas(210, 150, 140, 350, 3, 8, s)}<rect x="360" y="290" width="100" height="210"/>${janelas(360, 290, 100, 210, 3, 5, s)}<rect x="470" y="220" width="64" height="280"/>${janelas(470, 220, 64, 280, 2, 6, s)}<path d="M280 150V92"/><path d="M280 92h46l-12 14 12 14h-46" fill="${c}" fill-opacity=".3"/>`,
  crescimento: (c, s) => `<path d="M80 500H520" stroke="${s}"/><rect x="110" y="390" width="70" height="110" fill="${c}" fill-opacity=".1"/><rect x="210" y="330" width="70" height="170" fill="${c}" fill-opacity=".14"/><rect x="310" y="260" width="70" height="240" fill="${c}" fill-opacity=".18"/><rect x="410" y="190" width="70" height="310" fill="${c}" fill-opacity=".22"/><path d="M100 350C230 340 340 250 484 118"/><path d="M438 122l46-4-6 46"/>`,
  parceria: (c, s) => `<clipPath id="lente"><circle cx="235" cy="300" r="140"/></clipPath><circle cx="235" cy="300" r="140"/><circle cx="365" cy="300" r="140" stroke="${s}"/><circle cx="365" cy="300" r="140" fill="${c}" fill-opacity=".16" clip-path="url(#lente)" stroke="none"/><path d="M272 304l24 26 46-54"/><circle cx="165" cy="262" r="20"/><path d="M130 332q0-36 35-36t35 36"/><circle cx="435" cy="262" r="20" stroke="${s}"/><path d="M400 332q0-36 35-36t35 36" stroke="${s}"/>`,
  bussola: (c, s) => `<circle cx="300" cy="300" r="190"/><circle cx="300" cy="300" r="160" stroke="${s}"/>${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<path d="M${(300 + 172 * Math.cos(a)).toFixed(1)} ${(300 + 172 * Math.sin(a)).toFixed(1)}L${(300 + 190 * Math.cos(a)).toFixed(1)} ${(300 + 190 * Math.sin(a)).toFixed(1)}" stroke="${s}"/>`; }).join('')}<g transform="rotate(35 300 300)"><path d="M300 150L330 300L300 450L270 300z"/><path d="M300 150L330 300L270 300z" fill="${c}" fill-opacity=".4"/></g><circle cx="300" cy="300" r="10" fill="${c}"/>`,
  protecao: (c, s) => `<path d="M300 70L470 132V300C470 410 400 480 300 520C200 480 130 410 130 300V132Z"/><path d="M300 102L444 154V298C444 392 386 454 300 490C214 454 156 392 156 298V154Z" stroke="${s}"/><path d="M215 322L300 246L385 322"/><path d="M236 306V398H364V306"/><rect x="280" y="342" width="40" height="56" fill="${c}" fill-opacity=".25"/>`,
};
export const NOMES_ILUSTRACAO = Object.keys(ILUSTRACOES);
const svgIlustracao = (nome, m) => `<svg viewBox="0 0 600 600" fill="none" stroke="${m.cor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${ILUSTRACOES[nome](m.cor, m.suave)}</svg>`;

// Cores das fatias e das linhas, a partir da cor de destaque e do tema.
const paleta = (m) => [m.cor, mixar(m.cor, m.tinta, 0.5), m.suave, mixar(m.cor, m.fundo, 0.45), mixar(m.tinta, m.fundo, 0.35), mixar(m.cor, m.tinta, 0.82), mixar(m.suave, m.fundo, 0.4), mixar(m.cor, m.fundo, 0.7)];
const CEL_NUMERO = /^([▲▼●✓]\s*)?[+\-−–]?\s*(R\$|US\$|€)?\s*[+\-−–]?\d[\d.,]*\s*(%|p\.p\.|x|bi|mi|mil|pts?)?$|^[–—-]$/i;

// Base 100 feita pelo código: a partir de níveis (preço, cota, patrimônio) ou de retornos do período (retornos: true).
function serieLinha(s) {
  const rot = (Array.isArray(s.rotulos) ? s.rotulos : []).map((r) => String(r ?? ''));
  const ser = (Array.isArray(s.series) ? s.series : []).slice(0, 3).map((x, k) => ({ nome: String(x?.nome || `Série ${k + 1}`), valores: (Array.isArray(x?.valores) ? x.valores : []).map(numeroDe) }));
  if (!rot.length || !ser.length) throw new Error('a linha precisa de rotulos e de pelo menos uma série');
  for (const x of ser) if (x.valores.length !== rot.length || x.valores.some((v) => !Number.isFinite(v))) throw new Error(`a série "${x.nome}" precisa de um número para cada rótulo (${rot.length})`);
  if (s.retornos) return { rotulos: [String(s.inicio || 'Início'), ...rot], series: ser.map((x) => { let v = 100; return { ...x, valores: [100, ...x.valores.map((r) => (v *= 1 + r / 100))] }; }) };
  if (ser.some((x) => !(x.valores[0] > 0))) throw new Error('para a base 100, o primeiro valor de cada série precisa ser maior que zero');
  return { rotulos: rot, series: ser.map((x) => ({ ...x, valores: x.valores.map((v) => (v / x.valores[0]) * 100) })) };
}

// Rosca em % mostra a parte de cada fatia no total: se a soma não fecha 100 (folga de 1 p.p. de arredondamento), o anel mentiria.
export const somaRuim = (soma) => `a rosca em % soma ${formatador('%', 1)(soma).replace(',0%', '%')}, e precisa somar 100%: acrescente a fatia que falta (ex.: "Outros") ou mande os valores em R$`;
const temValor = (v) => v !== undefined && v !== null && String(v).trim() !== '';
// Gráficos com número que não é número viram erro antes do PDF, com o motivo.
export function problemasDosSlides(slides) {
  const out = [];
  (slides || []).forEach((s, k) => {
    const onde = `página ${k + 1} (${s.layout})`;
    if (s.layout === 'rosca') {
      const its = itensDe(s, 8);
      if (its.length < 2) out.push(`${onde}: a rosca precisa de pelo menos 2 itens`);
      for (const x of its) if (!(numeroDe(x.valor) >= 0)) out.push(`${onde}: o valor de "${x.rotulo || x.titulo || '?'}" precisa ser um número positivo (ex.: 70% ou R$ 1.000)`);
      if (its.length >= 2 && its.every((x) => numeroDe(x.valor) === 0)) out.push(`${onde}: todos os valores da rosca são zero`);
      const soma = its.reduce((a, x) => a + (numeroDe(x.valor) || 0), 0);
      if (its.length >= 2 && its.every((x) => lerNumero(x.valor)?.unidade === '%') && Math.abs(soma - 100) > 1) out.push(`${onde}: ${somaRuim(soma)}`);
    }
    if (s.layout === 'linha') { try { serieLinha(s); } catch (e) { out.push(`${onde}: ${e.message}`); } }
    if (s.layout === 'barras') {
      const its = itensDe(s, 8), duplo = its.some((x) => temValor(x.valor2));
      if (!its.length) out.push(`${onde}: as barras precisam de pelo menos 1 item`);
      for (const x of its) {
        const nome = String(x.rotulo || x.titulo || '').trim();
        if (!nome) out.push(`${onde}: cada barra precisa de um rótulo (rotulo)`);
        for (const [campo, v] of [['valor', x.valor], ...(duplo ? [['segundo valor (valor2)', x.valor2]] : [])]) {
          const l = temValor(v) ? lerNumero(v) : null;
          if (!temValor(v)) out.push(`${onde}: "${nome || '?'}": falta o ${campo}, que as outras barras têm`);
          else if (!l) out.push(`${onde}: "${nome || '?'}": o ${campo} precisa ser um número em % (ex.: 12,5% ou -3,2%), não "${v}"`);
          else if (l.unidade && l.unidade !== '%') out.push(`${onde}: "${nome || '?'}": as barras mostram valores em %, e "${v}" tem outra unidade (para R$ ou múltiplos, use numeros, tabela ou rosca)`);
        }
      }
    }
  });
  return out;
}

function svgRosca(vals, cores, D, fundo) {
  const R = D / 2, r = R * 0.6, total = vals.reduce((a, v) => a + v, 0) || 1;
  const pt = (a, raio) => `${(R + raio * Math.cos(a)).toFixed(2)} ${(R + raio * Math.sin(a)).toFixed(2)}`;
  let ang = -Math.PI / 2, o = '';
  vals.forEach((v, k) => {
    const f = v / total;
    if (f <= 0) return;
    if (f >= 0.99999) { o += `<path class="fatia" d="M${pt(-Math.PI / 2, R)}A${R} ${R} 0 1 1 ${pt(Math.PI / 2, R)}A${R} ${R} 0 1 1 ${pt(-Math.PI / 2, R)}ZM${pt(-Math.PI / 2, r)}A${r} ${r} 0 1 0 ${pt(Math.PI / 2, r)}A${r} ${r} 0 1 0 ${pt(-Math.PI / 2, r)}Z" fill="${cores[k]}" fill-rule="evenodd"/>`; return; }
    const a2 = ang + f * 2 * Math.PI, g = f > 0.5 ? 1 : 0;
    o += `<path class="fatia" d="M${pt(ang, R)}A${R} ${R} 0 ${g} 1 ${pt(a2, R)}L${pt(a2, r)}A${r} ${r} 0 ${g} 0 ${pt(ang, r)}Z" fill="${cores[k]}" stroke="${fundo}" stroke-width="4" stroke-linejoin="round"/>`;
    ang = a2;
  });
  return `<svg width="${D}" height="${D}" viewBox="0 0 ${D} ${D}">${o}</svg>`;
}

function svgLinhaSlide(d, cores, m, LARG, ALTO) {
  const E = 92, Dd = 176, T = 22, B = 58, n = d.rotulos.length;
  const todos = [...d.series.flatMap((s) => s.valores), 100];
  let min = Math.min(...todos), max = Math.max(...todos);
  const passo = passoBonito((max - min) / 4 || 1);
  min = Math.floor(min / passo) * passo; max = Math.ceil(max / passo) * passo;
  if (max === min) max = min + passo;
  const x = (i) => E + (n > 1 ? i / (n - 1) : 0.5) * (LARG - E - Dd), y = (v) => T + (1 - (v - min) / (max - min)) * (ALTO - T - B);
  const fEixo = formatador('', passo < 1 ? 1 : 0), fFim = formatador('', 1);
  let o = '';
  for (let v = min; v <= max + passo / 2; v += passo) {
    const base = Math.abs(v - 100) < 1e-9;
    o += `<line x1="${E}" y1="${y(v).toFixed(1)}" x2="${LARG - Dd + 10}" y2="${y(v).toFixed(1)}" stroke="${base ? m.suave : m.linha}" stroke-width="${base ? 1.5 : 1}"${base ? ' stroke-dasharray="8 7"' : ''}/>`;
    o += `<text class="eixo" x="${E - 16}" y="${(y(v) + 8).toFixed(1)}" text-anchor="end">${fEixo(v)}</text>`;
  }
  const cada = Math.max(1, Math.ceil(n / 12));
  d.rotulos.forEach((r, i) => { if (i % cada === 0 || i === n - 1) o += `<text class="eixo" x="${x(i).toFixed(1)}" y="${ALTO - 14}" text-anchor="${i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'}">${esc(r)}</text>`; });
  const fins = d.series.map((s, k) => ({ k, y: y(s.valores[n - 1]) })).sort((a, b) => a.y - b.y);
  for (let j = 1; j < fins.length; j++) if (fins[j].y - fins[j - 1].y < 42) fins[j].y = fins[j - 1].y + 42;
  d.series.forEach((s, k) => {
    o += `<polyline class="serie" points="${s.valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${cores[k]}" stroke-width="${k ? 4 : 6}" stroke-linejoin="round" stroke-linecap="round"${k === 2 ? ' stroke-dasharray="14 10"' : ''}/>`;
    o += `<circle cx="${x(n - 1).toFixed(1)}" cy="${y(s.valores[n - 1]).toFixed(1)}" r="8" fill="${cores[k]}"/>`;
    o += `<text class="fim" x="${(x(n - 1) + 22).toFixed(1)}" y="${(fins.find((f) => f.k === k).y + 12).toFixed(1)}" fill="${cores[k]}">${fFim(s.valores[n - 1])}</text>`;
  });
  return `<svg width="${LARG}" height="${ALTO}" viewBox="0 0 ${LARG} ${ALTO}">${o}</svg>`;
}

const LAYOUTS = {
  capa(s, m) {
    const para = m.cliente ? `<div><span class="r">Preparado para</span><b>${lim(m.cliente)}</b></div>` : '';
    const base = `<div class="base">${m.nome ? `<div><b>${lim(m.nome)}</b>${lim(m.cargo || '')}</div>` : ''}${m.escritorio && m.logo ? `<div><b>${lim(m.escritorio)}</b></div>` : ''}${para}${s.texto ? `<div><b>${lim(s.texto)}</b></div>` : ''}</div>`;
    if (m.pv) {
      const inicial = (m.nome || m.escritorio || '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
      const lado = m.foto
        ? `<div class="foto"><img src="${m.foto}"></div><svg class="diag" width="1920" height="1080" viewBox="0 0 1920 1080"><line x1="1297" y1="0" x2="1160" y2="1080" stroke="${m.cor}" stroke-width="3"/><line x1="1317" y1="0" x2="1180" y2="1080" stroke="${m.cor}" stroke-opacity=".35" stroke-width="1.5"/></svg>`
        : `<div class="orn"><svg viewBox="0 0 900 1080" width="900" height="1080"><defs><linearGradient id="gcp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.cor2}"/><stop offset="1" stop-color="${m.cor}"/></linearGradient></defs>${[440, 360, 280].map((r, k) => `<circle cx="470" cy="540" r="${r}" fill="none" stroke="${m.cor}" stroke-opacity="${(0.52 - k * 0.14).toFixed(2)}" stroke-width="${k ? 1.5 : 2}"/>`).join('')}<circle cx="470" cy="540" r="196" fill="url(#gcp)" fill-opacity=".16" stroke="${m.cor}" stroke-width="2"/><circle cx="880" cy="380" r="9" fill="${m.cor2}"/><circle cx="130" cy="780" r="6" fill="${m.cor}" fill-opacity=".7"/><circle cx="560" cy="120" r="5" fill="${m.cor2}" fill-opacity=".8"/><text x="470" y="596" text-anchor="middle" font-family="Georgia,serif" font-size="176" fill="url(#gcp)">${esc(inicial)}</text></svg></div>`;
      const logo = m.logo ? `<img src="${m.logo}">` : `<span class="marca-t">${lim(m.escritorio)}</span>`;
      return `<section class="s capa pv"><div class="${m.foto ? 'com-foto' : ''}">${lado}<div class="c">
      <div class="topo">${logo}</div>
      <div class="meio"><h2 style="font-size:${tamTitulo(s.titulo, 84)}px">${lim(s.titulo)}</h2><div class="regua"></div>${s.subtitulo ? `<div class="sub">${lim(s.subtitulo, true)}</div>` : ''}</div>
      ${base}
    </div></div></section>`;
    }
    const foto = m.foto ? `<div class="foto"><img src="${m.foto}"></div>` : '';
    const logo = m.logo ? `<img src="${m.logo}">` : `<span class="marca-t">${lim(m.escritorio)}</span>`;
    return `<section class="s capa"><div class="${m.foto ? 'com-foto' : ''}">${foto}<div class="c">
      <div class="topo">${logo}</div>
      <div class="meio"><h2>${lim(s.titulo)}</h2><div class="regua"></div>${s.subtitulo ? `<div class="sub">${lim(s.subtitulo, true)}</div>` : ''}</div>
      ${base}
    </div></div></section>`;
  },
  perfil(s, m, i, n) {
    const inicial = (m.nome || m.escritorio || '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
    const quadro = m.foto ? `<div class="fotoq"><img src="${m.foto}"></div>` : `<div class="fotoq"><div class="ini">${esc(inicial)}</div></div>`;
    const fatos = itensDe(s, 5).map((f) => `<div class="fato"><div class="r">${lim(f.rotulo)}</div><div class="v">${lim(f.texto || f.valor)}</div></div>`).join('');
    return `<section class="s perfil"><div class="c">${etiqueta(s)}<div class="cols">${quadro}<div class="dir">${titulo(s, 66)}<div class="fatos">${fatos}</div></div></div></div>${rodapePagina(m, i, n)}</section>`;
  },
  numeros(s, m, i, n) {
    const lista = itensDe(s, 4), k = lista.length;
    const fv = porQtd(k, [2, 150], [3, 128], [4, 112]), fl = porQtd(k, [2, 36], [4, 32]);
    const its = lista.map((x) => `<div class="n1"><div class="v" style="font-size:${fv}px">${lim(x.valor)}</div><div class="l" style="font-size:${fl}px">${lim(x.rotulo || x.texto)}</div>${x.fonte ? `<div class="f">${lim(x.fonte)}</div>` : ''}</div>`).join('');
    return `<section class="s enche"><div class="c">${etiqueta(s)}${titulo(s)}${subt(s)}<div class="corpo"><div class="nums alto">${its}</div></div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  pilares(s, m, i, n) {
    const lista = itensDe(s, 4), k = lista.length;
    const fh = porQtd(k, [2, 60], [3, 54], [4, 46]), fp = porQtd(k, [2, 38], [3, 34], [4, 31]), py = porQtd(k, [2, 60], [3, 54], [4, 48]);
    const its = lista.map((x, j) => `<div class="p" style="--py:${py}px">${x.icone && icone(x.icone, m, 58) ? `<div class="ico">${icone(x.icone, m, 58)}</div>` : `<div class="nn">${num(j)}</div>`}<h3 style="font-size:${fh}px">${lim(x.titulo)}</h3><p style="font-size:${fp}px">${lim(x.texto, true)}</p></div>`).join('');
    return `<section class="s enche"><div class="c">${etiqueta(s)}${titulo(s)}<div class="corpo"><div class="cols-p alto">${its}</div></div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  etapas(s, m, i, n) {
    const lista = itensDe(s, 4), k = lista.length;
    const fh = porQtd(k, [2, 60], [3, 54], [4, 46]), fp = porQtd(k, [2, 38], [3, 34], [4, 31]), py = porQtd(k, [2, 56], [3, 50], [4, 44]);
    const its = lista.map((x, j) => `<div class="e" style="--py:${py}px"><div class="k">Etapa ${j + 1}</div>${x.icone ? `<div class="ico2">${icone(x.icone, m, 52)}</div>` : ''}<h3 style="font-size:${fh}px">${lim(x.titulo)}</h3><p style="font-size:${fp}px">${lim(x.texto, true)}</p></div>`).join('');
    return `<section class="s enche"><div class="c">${etiqueta(s)}${titulo(s)}${subt(s)}<div class="corpo"><div class="et-l alto">${its}</div></div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  tabela(s, m, i, n) {
    const cab = (s.cabecalho || []).slice(0, 5);
    const lin = (s.linhas || []).slice(0, 8), k = lin.length;
    const fd = porQtd(k, [3, 40], [4, 38], [6, 32], [8, 28]), py = porQtd(k, [3, 36], [4, 32], [6, 24], [8, 16]);
    const colunas = Math.max(cab.length, ...lin.map((l) => (l || []).length), 0);
    const numerica = Array.from({ length: colunas }, (_, c) => {
      if (c === 0) return false;
      const cel = lin.map((l) => String((l || [])[c] ?? '').trim()).filter(Boolean);
      return cel.length > 0 && cel.filter((x) => CEL_NUMERO.test(x)).length / cel.length >= 0.6;
    });
    const cls = (c) => (numerica[c] ? ' class="n"' : '');
    const t = `<table>${cab.length ? `<tr>${cab.map((c, j) => `<th${cls(j)}>${lim(c)}</th>`).join('')}</tr>` : ''}${lin.map((l) => `<tr>${(l || []).slice(0, 5).map((c, j) => `<td style="font-size:${fd}px;padding-top:${py}px;padding-bottom:${py}px"${cls(j)}>${lim(c)}</td>`).join('')}</tr>`).join('')}</table>`;
    return `<section class="s enche"><div class="c">${etiqueta(s)}${titulo(s, 70)}<div class="corpo"><div class="tb alto" style="--mx:${110 + k * 170}px">${t}</div></div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  barras(s, m, i, n) {
    const its = itensDe(s, 8), k = its.length;
    const duplo = its.some((x) => x.valor2 !== undefined && x.valor2 !== null && x.valor2 !== '');
    const fr = porQtd(k, [4, 40], [6, 34], [8, 30]), fv = porQtd(k, [4, 50], [6, 42], [8, duplo ? 32 : 34]), alt = porQtd(k, [4, duplo ? 40 : 64], [6, duplo ? 30 : 48], [8, duplo ? 22 : 36]);
    const gap = porQtd(k, [4, 44], [6, 30], [8, duplo ? 14 : 22]);
    const cores = [m.cor, m.suave], negs = [m.neg || '#E07A62', mixar(m.neg || '#E07A62', m.fundo, 0.35)];
    // O número escrito é o enviado (com sinal e as casas dele, até 2). A trilha vai de min(0, valores) a max(100, valores):
    // negativo sai à esquerda da linha do zero, em outra cor; acima de 100 a escala cresce e a barra nunca sai da trilha.
    const vals = its.flatMap((x) => [numeroDe(x.valor), ...(duplo ? [numeroDe(x.valor2)] : [])]).filter(Number.isFinite);
    const lo = Math.min(0, ...vals), hi = Math.max(100, ...vals), pos = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo || 1)) * 100)), zero = pos(0);
    const casas = Math.min(2, Math.max(0, ...its.flatMap((x) => [x.valor, x.valor2]).map((v) => lerNumero(v)?.casas ?? 0)));
    const pct = formatador('%', casas);
    const trilha = (v, j) => {
      const b = Number.isFinite(v) ? `<b class="${v < 0 ? 'neg' : 'pos'}" style="left:${Math.min(pos(v), zero).toFixed(2)}%;width:${Math.abs(pos(v) - zero).toFixed(2)}%;background:${v < 0 ? negs[j] : cores[j]}"></b>` : '';
      return `<div style="height:${alt}px">${lo < 0 ? `<i class="zero" style="left:${zero.toFixed(2)}%"></i>` : ''}${b}</div>`;
    };
    const linhas = its.map((x) => {
      const a = numeroDe(x.valor), b = numeroDe(x.valor2);
      return `<div class="bl"><div class="r" style="font-size:${fr}px">${lim(x.rotulo)}</div><div class="t">${trilha(a, 0)}${duplo ? trilha(b, 1) : ''}</div><div class="p" style="font-size:${fv}px">${pct(a)}${duplo ? `<span style="font-size:${Math.max(28, fv - 6)}px">${pct(b)}</span>` : ''}</div></div>`;
    }).join('');
    const leg = duplo && Array.isArray(s.legenda) ? `<div class="leg">${s.legenda.slice(0, 2).map((l, j) => `<span><i style="background:${cores[j]}"></i>${lim(l)}</span>`).join('')}</div>` : '';
    return `<section class="s enche"><div class="c">${etiqueta(s)}${titulo(s, 70)}<div class="corpo"><div class="bar alto" style="gap:${gap}px">${linhas}</div>${leg}</div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  rosca(s, m, i, n) {
    const its = itensDe(s, 8), k = its.length, cores = paleta(m);
    const vals = its.map((x) => Math.max(0, numeroDe(x.valor) || 0)), total = vals.reduce((a, v) => a + v, 0) || 1;
    const pct = its.some((x) => lerNumero(x.valor)?.unidade !== '%');
    const fr = porQtd(k, [4, 36], [6, 32], [8, 30]), fv = porQtd(k, [4, 46], [6, 40], [8, 34]), py = porQtd(k, [4, 22], [6, 14], [8, 8]);
    const D = porQtd(k, [4, 640], [8, 600]);
    const leg = its.map((x, j) => `<div class="li" style="--py:${py}px"><i style="background:${cores[j]}"></i><span class="lr" style="font-size:${fr}px">${lim(x.rotulo || x.titulo)}</span><span><span style="font-size:${fv}px" class="lv">${lim(x.valor)}</span>${pct ? `<span class="lp">${formatador('%', 1)((vals[j] / total) * 100)}</span>` : ''}</span>${x.texto ? `<span class="lt">${lim(x.texto)}</span>` : ''}</div>`).join('');
    return `<section class="s"><div class="c">${etiqueta(s)}${titulo(s, 70)}<div class="corpo"><div class="ros">${svgRosca(vals, cores, D, m.fundo)}<div class="lgs">${leg}</div></div></div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  linha(s, m, i, n) {
    const d = serieLinha(s), cores = [m.cor, mixar(m.tinta, m.fundo, 0.08), m.suave];
    const leg = `<div class="lg">${d.series.map((x, k) => `<span><i style="background:${cores[k]}"></i>${lim(x.nome)}</span>`).join('')}</div>`;
    const nota = `Base 100 em ${lim(d.rotulos[0])}${s.retornos ? ', com os retornos de cada período compostos' : ''}${s.fonte ? ` · Fonte: ${lim(s.fonte)}` : ''}`;
    return `<section class="s"><div class="c">${etiqueta(s)}${titulo(s, 70)}<div class="corpo"><div class="lin">${leg}${svgLinhaSlide(d, cores, m, 1640, s.subtitulo ? 500 : 560)}</div></div><div class="fonte">${nota}</div></div>${rodapePagina(m, i, n)}</section>`;
  },
  comparativo(s, m, i, n) {
    const its = itensDe(s, 7), k = its.length;
    const [la, lb] = [s.legenda?.[0] || 'Atual', s.legenda?.[1] || 'Proposta'];
    const fr = porQtd(k, [3, 42], [5, 36], [7, 32]), fv = porQtd(k, [3, 60], [5, 50], [7, 42]), fd = porQtd(k, [3, 34], [5, 31], [7, 28]), py = porQtd(k, [3, 36], [5, 24], [7, 14]);
    const cab = `<div class="h"></div><div class="h">${lim(la)}</div><div class="h">Diferença</div><div class="h">${lim(lb)}</div>`;
    const linhas = its.map((x) => {
      const d = diferenca(x.valor, x.valor2, x.texto);
      return `<div class="r" style="--py:${py}px;font-size:${fr}px">${lim(x.rotulo || x.titulo)}${d.num && x.texto ? `<span class="nt">${lim(x.texto)}</span>` : ''}</div>` +
        `<div class="v" style="--py:${py}px;font-size:${fv}px">${lim(x.valor)}</div>` +
        `<div class="dc" style="--py:${py}px"><div style="font-size:${fd}px" class="dif${d.num ? '' : ' tx'}">${esc(d.txt)}</div></div>` +
        `<div class="v" style="--py:${py}px;font-size:${fv}px">${lim(x.valor2)}</div>`;
    }).join('');
    return `<section class="s enche"><div class="c">${etiqueta(s)}${titulo(s, 70)}${subt(s)}<div class="corpo"><div class="cmp alto" style="--mx:${100 + k * 160}px">${cab}${linhas}</div></div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  frase(s, m, i, n) {
    return `<section class="s frase"><div class="c">${etiqueta(s)}<div class="corpo">${titulo(s, 92)}${subt(s)}</div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  lista(s, m, i, n) {
    const lista = itensDe(s, 6), k = lista.length;
    const fh = porQtd(k, [2, 54], [3, 50], [4, 46], [6, 40]), fp = porQtd(k, [3, 36], [4, 34], [6, 30]), py = porQtd(k, [3, 40], [4, 36], [6, 28]);
    const its = lista.map((x) => { const ic = x.icone ? icone(x.icone, m, 56) : ''; return `<div class="it${ic ? ' ci' : ''}" style="--py:${py}px">${ic ? `<div class="ico">${ic}</div>` : ''}<div><h3 style="font-size:${fh}px">${lim(x.titulo)}</h3><p style="font-size:${fp}px">${lim(x.texto, true)}</p></div></div>`; }).join('');
    return `<section class="s enche"><div class="c">${etiqueta(s)}${titulo(s, 70)}<div class="corpo"><div class="grade alto"${k <= 3 ? ' style="grid-template-columns:1fr"' : ''}>${its}</div></div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  ilustracao(s, m, i, n) {
    if (!ILUSTRACOES[s.ilustracao]) return LAYOUTS.frase(s, m, i, n);
    return `<section class="s ilu"><div class="ilbox">${svgIlustracao(s.ilustracao, m)}</div><div class="c">${etiqueta(s)}<div class="corpo">${titulo(s, 76)}${subt(s)}</div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  templo(s, m, i, n) {
    const its = itensDe(s, 4), k = Math.max(2, its.length);
    const colunas = its.map(() => '<div class="col"><div class="cap"></div><div class="fuste"></div><div class="bas"></div></div>').join('');
    const txts = its.map((x) => `<div><h3>${lim(x.titulo)}</h3><p>${lim(x.texto, true)}</p></div>`).join('');
    return `<section class="s ctr"><div class="c">${etiqueta(s)}${titulo(s, 62)}<div class="corpo"><div class="templo">
      <div class="front"><svg viewBox="0 0 1640 120" preserveAspectRatio="none"><polygon points="820,6 1634,114 6,114" fill="${m.painel}" stroke="${m.cor}" stroke-width="2"/></svg><span>${lim(s.subtitulo || m.escritorio || m.nome || '')}</span></div>
      <div class="arq"></div><div class="colunas" style="grid-template-columns:repeat(${k},1fr)">${colunas}</div><div class="degraus"><i></i><i></i></div>
      <div class="txts" style="grid-template-columns:repeat(${k},1fr)">${txts}</div></div></div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  agenda(s, m, i, n) {
    const lista = itensDe(s, 8), k = lista.length;
    const fh = porQtd(k, [3, 56], [4, 50], [6, 42], [8, 36]), fp = porQtd(k, [3, 36], [4, 34], [6, 30], [8, 28]), py = porQtd(k, [3, 40], [4, 38], [6, 28], [8, 20]);
    const its = lista.map((x, j) => `<div class="ag" style="--py:${py}px"><i style="font-size:${fh + 6}px">${num(j)}</i><div><h3 style="font-size:${fh}px">${lim(x.titulo)}</h3>${x.texto ? `<p style="font-size:${fp}px">${lim(x.texto)}</p>` : ''}</div></div>`).join('');
    return `<section class="s enche"><div class="c">${etiqueta(s)}${titulo(s, 70)}${subt(s)}<div class="corpo"><div class="agenda alto"${k <= 3 ? ' style="grid-template-columns:1fr"' : ''}>${its}</div></div></div>${rodapePagina(m, i, n)}</section>`;
  },
  secao(s, m, i, n) {
    return `<section class="s secao"><div class="c"><div class="corpo"><div class="gn">${lim(s.etiqueta || num(i))}</div>${titulo(s, 96)}${subt(s)}</div></div>${rodapePagina(m, i, n)}</section>`;
  },
  diagrama(s, m, i, n) {
    const its = itensDe(s, s.modelo === 'hub' ? 7 : 5);
    let corpo = '';
    if (s.modelo === 'hub' && its.length > 1) {
      const sat = its.slice(1), cx = 820, cy = 270, rx = 620, ry = 195;
      const pts = sat.map((_, k) => { const a = (-90 + (360 * (k + 0.5)) / sat.length) * (Math.PI / 180); return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
      const linhas = pts.map(([x, y]) => `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(0)}" y2="${y.toFixed(0)}" stroke="${m.cor}" stroke-opacity=".45" stroke-width="1.5"/>`).join('');
      const nos = sat.map((x, k) => `<div class="hn" style="left:${(pts[k][0] - 140).toFixed(0)}px;top:${(pts[k][1] - 56).toFixed(0)}px"><div class="circ s2">${icone(x.icone, m, 48) || `<span class="nm">${num(k + 1)}</span>`}</div><h3>${lim(x.titulo)}</h3>${x.texto ? `<p>${lim(x.texto)}</p>` : ''}</div>`).join('');
      corpo = `<div class="hub"><svg width="1640" height="620" viewBox="0 0 1640 620">${linhas}</svg><div class="hc" style="left:${cx - 110}px;top:${cy - 110}px">${lim(its[0].titulo)}</div>${nos}</div>`;
    } else {
      const k = its.length;
      const larg = porQtd(k, [3, 420], [4, 330], [5, 250]), cd = porQtd(k, [3, 240], [4, 200], [5, 168]), ic = porQtd(k, [3, 96], [4, 84], [5, 72]);
      const fh = porQtd(k, [3, 50], [4, 44], [5, 38]), fp = porQtd(k, [3, 36], [4, 32], [5, 29]);
      corpo = `<div class="palco alto"><div class="fluxo" style="--cd:${cd}px">${its.map((x, j) => `<div class="no" style="width:${larg}px"><div class="circ">${icone(x.icone, m, ic) || `<span class="nm">${num(j)}</span>`}</div><h3 style="font-size:${fh}px">${lim(x.titulo)}</h3>${x.texto ? `<p style="font-size:${fp}px">${lim(x.texto, true)}</p>` : ''}</div>${j < k - 1 ? `<div class="lig">${x.ligacao ? `<span>${lim(x.ligacao)}</span>` : ''}</div>` : ''}`).join('')}</div></div>`;
    }
    return `<section class="s${corpo.startsWith('<div class="palco') ? ' enche' : ''}"><div class="c">${etiqueta(s)}${titulo(s, 70)}${subt(s)}<div class="corpo" style="padding-bottom:20px">${corpo}</div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  imagem(s, m, i, n) {
    const src = s.imagem ? imagemDe(s.imagem, m) : '';
    if (!src) return s.ilustracao ? LAYOUTS.ilustracao(s, m, i, n) : LAYOUTS.frase(s, m, i, n);
    if (s.modelo === 'cheia') {
      return `<section class="s cheia"><div class="bg"><img src="${src}"></div><div class="c">${etiqueta(s)}<div class="corpo">${titulo(s, 78)}${subt(s)}</div></div>${rodapePagina(m, i, n)}</section>`;
    }
    return `<section class="s metade"><div class="foto2"><img src="${src}"></div><div class="c">${etiqueta(s)}<div class="corpo">${titulo(s, 70)}${subt(s)}</div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  galeria(s, m, i, n) {
    const its = itensDe(s, 3);
    const k = Math.max(2, its.length);
    const cartoes = its.map((x) => {
      const src = x.imagem ? imagemDe(x.imagem, m) : '';
      const vis = src ? `<div class="arc"><img src="${src}"></div>` : `<div class="arc vazio">${icone(x.icone || 'pessoa', m, 110)}</div>`;
      return `<div class="gl">${vis}<h3>${lim(x.titulo)}</h3>${x.texto ? `<p>${lim(x.texto, true)}</p>` : ''}</div>`;
    }).join('');
    return `<section class="s ctr"><div class="c">${etiqueta(s)}${titulo(s, 70)}${subt(s)}<div class="corpo"><div class="galeria" style="grid-template-columns:repeat(${k},1fr)">${cartoes}</div></div>${fonteTxt(s)}</div>${rodapePagina(m, i, n)}</section>`;
  },
  fechamento(s, m, i, n) {
    const lp = (s.passos || []).slice(0, 5), fpp = porQtd(lp.length, [3, 40], [4, 37], [5, 34]);
    const passos = lp.map((p, k) => `<div class="passo" style="font-size:${fpp}px"><i>${num(k)}</i><span>${lim(p)}</span></div>`).join('');
    const contato = (s.contato || []).slice(0, 5).map((l) => `<div class="ln">${lim(l)}</div>`).join('');
    return `<section class="s fech"><div class="c">${etiqueta(s)}<div class="cols"><div class="esq">${titulo(s, 76)}<div class="passos">${passos}</div></div><div class="dir"><div class="k">Contato</div>${contato}</div></div></div>${rodapePagina(m, i, n)}</section>`;
  },
};

export const NOMES_LAYOUT = Object.keys(LAYOUTS);

export function montarPaginas(slides, marca, deslocamento = 0, total = slides.length) {
  const t = TEMAS[marca.tema] ?? TEMAS.escuro;
  const est = ESTILOS[marca.estilo] ?? ESTILOS.serifada;
  const cor = /^#[0-9a-fA-F]{6}$/.test(marca.cor || '') ? marca.cor : t.cor;
  const m = { ...marca, cor, suave: t.suave, fundo: t.fundo, tinta: t.tinta, painel: t.painel, linha: t.linha, neg: t.neg, pv: !!est.pv, cor2: mixar(cor, '#ffffff', 0.42) };
  const html = slides.map((s, i) => {
    const h = (LAYOUTS[s.layout] ?? LAYOUTS.frase)(s, m, i + deslocamento, total);
    if (!s.ponte) return h;
    // A frase-ponte fecha a área de conteúdo, para nunca encostar no rodapé (que pode ter duas linhas com o nome do cliente).
    const ponte = `<div class="ponte">${lim(s.ponte)}</div>`;
    return h.includes('</div><div class="pe">') ? h.replace('</div><div class="pe">', `${ponte}</div><div class="pe">`) : h.replace(/<\/section>\s*$/, `${ponte}</section>`);
  }).join('\n');
  return { css: css(t, est, cor), html };
}
