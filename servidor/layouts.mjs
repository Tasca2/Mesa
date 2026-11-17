import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

export const W = 1920;
export const H = 1080;

const TEMAS = {
  escuro: { fundo: '#0E0E10', painel: '#17171A', tinta: '#F2EDE4', suave: '#9C9CA3', cor: '#C9A24B', linha: 'rgba(255,255,255,.15)' },
  claro: { fundo: '#F6F2EA', painel: '#ECE6D9', tinta: '#1A1A1C', suave: '#66666C', cor: '#8A6A2B', linha: 'rgba(0,0,0,.15)' },
  marinho: { fundo: '#0B1F33', painel: '#12304C', tinta: '#F1F4F7', suave: '#A3B3C4', cor: '#D8B26A', linha: 'rgba(255,255,255,.17)' },
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
const tamTexto = (s, g = 30) => { const n = String(s || '').length; return n <= 140 ? g : n <= 260 ? g - 3 : g - 6; };

export function css(t, est, cor) {
  return `@page{size:${W}px ${H}px;margin:0}*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${t.fundo}}body{font-family:${CORPO};-webkit-font-smoothing:antialiased;color:${t.tinta}}
.s{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${t.fundo};page-break-after:always;break-after:page}
.s::before{content:"";position:absolute;right:-380px;top:-380px;width:1000px;height:1000px;border-radius:50%;background:radial-gradient(circle,${cor}14 0%,${cor}00 68%)}
.c{position:absolute;left:140px;right:140px;top:96px;bottom:150px;display:flex;flex-direction:column}
.pe{position:absolute;left:140px;right:140px;bottom:52px;display:flex;justify-content:space-between;align-items:baseline;gap:40px;border-top:1px solid ${t.linha};padding-top:20px;font-size:19px;letter-spacing:.02em;color:${t.suave}}
.pe .a{flex:1;max-width:1480px;line-height:1.35;font-size:18px}.pe .n{font-family:${NUMS};font-size:22px;color:${cor};letter-spacing:.08em}
.et{font-size:19px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${cor};margin-bottom:30px;display:flex;align-items:center;gap:20px}
.et::after{content:"";width:72px;height:1px;background:${cor}}
span.cf{background:${cor}2e;color:${cor};padding:0 .3em;border-radius:3px;font-size:.82em;letter-spacing:.01em}
h2{font-family:${est.titulo};font-weight:${est.peso};letter-spacing:${est.espaco};line-height:1.12;max-width:1480px}
.sub{font-size:30px;line-height:1.45;color:${t.suave};margin-top:26px;max-width:1280px}
.fonte{font-size:19px;color:${t.suave};margin-top:auto;padding-top:20px;letter-spacing:.02em}
.corpo{flex:1;display:flex;flex-direction:column;justify-content:flex-start;min-height:0}
/* capa */
.capa .c{justify-content:space-between}.capa .topo{display:flex;justify-content:space-between;align-items:center;min-height:70px}.capa .topo img{max-height:70px;max-width:340px;object-fit:contain}
.capa .marca-t{font-size:20px;letter-spacing:.26em;text-transform:uppercase;color:${t.suave}}
.capa .meio{display:flex;flex-direction:column;justify-content:center;flex:1;max-width:1300px}.capa .com-foto .meio{max-width:980px}
.capa h2{font-size:92px;line-height:1.06;max-width:1280px}.capa .regua{width:96px;height:3px;background:${cor};margin:44px 0 36px}.capa .sub{margin-top:0;font-size:34px}
.capa .base{display:flex;gap:56px;font-size:22px;color:${t.suave};letter-spacing:.04em}.capa .base b{display:block;color:${t.tinta};font-weight:600;font-size:26px;margin-bottom:4px;letter-spacing:0}
.capa .foto{position:absolute;right:0;top:0;bottom:0;width:640px}.capa .foto img{width:100%;height:100%;object-fit:cover;filter:saturate(.9)}.capa .foto::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,${t.fundo} 0%,${t.fundo}00 38%)}
.capa .com-foto .c{right:720px}
/* perfil */
.perfil .cols{display:flex;gap:110px;flex:1;align-items:stretch;min-height:0}.perfil .fotoq{width:520px;flex:none;position:relative;margin:6px 0 34px 18px}
.perfil .fotoq img,.perfil .fotoq .ini{width:100%;height:100%;object-fit:cover;display:flex;align-items:center;justify-content:center}
.perfil .fotoq::before{content:"";position:absolute;left:-18px;top:18px;right:18px;bottom:-18px;border:1px solid ${cor};z-index:0}
.perfil .fotoq img,.perfil .fotoq .ini{position:relative;z-index:1}.perfil .ini{background:${t.painel};font-family:${est.titulo};font-size:190px;color:${cor};letter-spacing:.04em}
.perfil .dir{flex:1;display:flex;flex-direction:column;justify-content:center;min-width:0}
.fatos{margin-top:44px;border-top:1px solid ${t.linha}}.fato{display:flex;gap:40px;padding:22px 0;border-bottom:1px solid ${t.linha};align-items:baseline}
.fato .r{width:250px;flex:none;font-size:18px;letter-spacing:.2em;text-transform:uppercase;color:${t.suave}}.fato .v{font-size:33px;line-height:1.35}
/* números */
.nums{display:flex;margin-top:90px;border-top:1px solid ${t.linha}}.nums .n1{flex:1;padding:52px 44px 0 0}.nums .n1+.n1{padding-left:48px;border-left:1px solid ${t.linha}}
.nums .v{font-family:${NUMS};font-size:128px;line-height:1;color:${cor};letter-spacing:-.02em}.nums .l{font-size:29px;line-height:1.35;margin-top:22px}.nums .f{font-size:19px;color:${t.suave};margin-top:14px}
/* pilares */
.cols-p{display:flex;gap:64px;margin-top:90px}.cols-p .p{flex:1;border-top:1px solid ${t.linha};padding-top:34px;position:relative}.cols-p .p::before{content:"";position:absolute;left:0;top:-2px;width:72px;height:3px;background:${cor}}
.cols-p .nn{font-family:${NUMS};font-size:54px;color:${cor};line-height:1}.cols-p h3{font-family:${est.titulo};font-weight:${est.peso};font-size:46px;line-height:1.15;margin:26px 0 18px}.cols-p p{font-size:30px;line-height:1.5;color:${t.suave}}
/* etapas */
.et-l{position:relative;display:flex;gap:64px;margin-top:96px}.et-l::before{content:"";position:absolute;left:0;right:0;top:15px;height:1px;background:${t.linha}}
.et-l .e{flex:1;position:relative;padding-top:56px}.et-l .e::before{content:"";position:absolute;left:0;top:0;width:31px;height:31px;border-radius:50%;background:${t.fundo};border:2px solid ${cor}}
.et-l .e::after{content:"";position:absolute;left:10px;top:10px;width:11px;height:11px;border-radius:50%;background:${cor}}
.et-l .k{font-size:18px;letter-spacing:.22em;text-transform:uppercase;color:${cor};margin-bottom:16px}.et-l h3{font-family:${est.titulo};font-weight:${est.peso};font-size:46px;line-height:1.15;margin-bottom:18px}.et-l p{font-size:30px;line-height:1.5;color:${t.suave}}
/* tabela */
table{border-collapse:collapse;width:100%;margin-top:54px}th{font-size:18px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:${cor};text-align:left;padding:0 24px 20px 0;border-bottom:2px solid ${cor}}
td{font-size:30px;line-height:1.35;padding:28px 24px 28px 0;border-bottom:1px solid ${t.linha};vertical-align:top}td:first-child{font-weight:600;width:30%}
/* barras */
.bar{margin-top:48px;display:flex;flex-direction:column;gap:30px}.leg{display:flex;gap:36px;font-size:21px;color:${t.suave};margin-top:34px}.leg i{display:inline-block;width:26px;height:10px;margin-right:12px;vertical-align:middle}
.bl{display:grid;grid-template-columns:330px 1fr 120px;gap:30px;align-items:center}.bl .r{font-size:28px}.bl .t{display:flex;flex-direction:column;gap:8px}.bl .t div{height:22px;background:${t.painel};position:relative}.bl .t b{display:block;height:100%}
.bl .p{font-family:${NUMS};font-size:34px;text-align:right;color:${t.tinta}}
/* frase */
.frase .corpo{justify-content:center;padding-left:56px;border-left:3px solid ${cor}}.frase h2{font-size:84px;line-height:1.16;max-width:1500px}.frase .sub{font-size:32px}
/* lista */
.grade{display:grid;grid-template-columns:1fr 1fr;gap:0 96px;margin-top:56px}.grade .it{padding:28px 0;border-top:1px solid ${t.linha}}.grade h3{font-family:${est.titulo};font-weight:${est.peso};font-size:37px;line-height:1.2;margin-bottom:12px}.grade p{font-size:28px;line-height:1.5;color:${t.suave}}
.grade .it::before{content:"";display:block;width:40px;height:3px;background:${cor};margin:-30px 0 26px}
/* fechamento */
.fech .cols{display:flex;gap:110px;flex:1;min-height:0;align-items:center}.fech .esq{flex:1.25}.fech .dir{flex:1;border:1px solid ${cor};padding:56px 56px;background:${t.painel}}
.passos{margin-top:48px}.passo{display:flex;gap:34px;padding:22px 0;border-top:1px solid ${t.linha};align-items:baseline;font-size:32px;line-height:1.4}.passo i{font-style:normal;font-family:${NUMS};color:${cor};font-size:34px;width:48px;flex:none}
.dir .k{font-size:18px;letter-spacing:.24em;text-transform:uppercase;color:${cor};margin-bottom:26px}.dir .ln{font-size:29px;line-height:1.35;padding:13px 0;border-bottom:1px solid ${t.linha}}.dir .ln:first-of-type{font-family:${est.titulo};font-size:40px;padding-top:0}
.ctr .c{justify-content:center}.ctr .corpo{flex:none;margin-top:6px}.ctr .fonte{margin-top:36px;padding-top:0}
/* ícones */
.ico{height:60px;display:flex;align-items:center}.ico2{margin:4px 0 16px;height:46px}
.grade .it.ci{display:flex;gap:30px;align-items:flex-start;position:relative}.grade .it.ci::before{position:absolute;left:0;top:-1px;margin:0}.grade .it.ci .ico{flex:none;padding-top:4px;height:auto}
/* diagrama */
.nm{font-family:${NUMS};font-size:44px;color:${cor}}
.fluxo{display:flex;align-items:flex-start;justify-content:space-between}.fluxo .no{display:flex;flex-direction:column;align-items:center;text-align:center;flex:none}
.circ{width:136px;height:136px;border:1.5px solid ${cor};border-radius:50%;display:flex;align-items:center;justify-content:center;background:${t.painel}}.circ.s2{width:104px;height:104px;margin:0 auto}
.fluxo .no h3,.hn h3{font-family:${est.titulo};font-weight:${est.peso};font-size:35px;line-height:1.15;margin:26px 0 10px}.fluxo .no p,.hn p{font-size:27px;line-height:1.45;color:${t.suave}}
.fluxo .lig{flex:1;position:relative;height:136px;min-width:60px}.fluxo .lig::before{content:"";position:absolute;left:10px;right:16px;top:50%;height:1.5px;background:${cor};opacity:.6}
.fluxo .lig::after{content:"";position:absolute;right:10px;top:50%;width:11px;height:11px;border-top:1.5px solid ${cor};border-right:1.5px solid ${cor};transform:translateY(-50%) rotate(45deg);opacity:.9}
.fluxo .lig span{position:absolute;left:-30px;right:-30px;top:calc(50% - 40px);text-align:center;font-size:19px;color:${t.suave};letter-spacing:.04em}
.hub{position:relative;width:1640px;height:620px}.hub>svg{position:absolute;left:0;top:0}.hc{position:absolute;width:220px;height:220px;border-radius:50%;border:2px solid ${cor};background:${t.painel};display:flex;align-items:center;justify-content:center;text-align:center;padding:22px;font-family:${est.titulo};font-size:31px;line-height:1.15}
.hn{position:absolute;width:280px;text-align:center}.hn h3{font-size:29px;margin:16px 0 6px}.hn p{font-size:20px}
/* ilustração, templo, agenda, seção, ponte */
.ilu .ilbox{position:absolute;right:140px;top:200px;width:620px;height:620px;border-radius:50%;background:${t.painel};border:1px solid ${cor}55;padding:14px}.ilu .ilbox svg{width:100%;height:100%}.ilu .c{right:860px}.ilu .pe .a{max-width:none}
.templo{width:100%}.templo .front{position:relative;height:112px}.templo .front svg{position:absolute;inset:0;width:100%;height:100%}.templo .front span{position:absolute;left:0;right:0;bottom:26px;text-align:center;font-size:22px;letter-spacing:.3em;text-transform:uppercase;color:${cor}}
.templo .arq{height:22px;border:2px solid ${cor};background:${t.painel};margin-top:-1px}.templo .colunas{display:grid;margin-top:10px}.templo .col{display:flex;flex-direction:column;align-items:center}
.templo .cap,.templo .bas{width:150px;height:16px;border:2px solid ${cor};background:${t.painel}}.templo .fuste{width:110px;height:176px;border-left:2px solid ${cor};border-right:2px solid ${cor};background:repeating-linear-gradient(90deg,transparent 0 17px,${t.linha} 17px 19px)}
.templo .degraus{margin-top:8px}.templo .degraus i{display:block;height:13px;border:2px solid ${cor};background:${t.painel};margin:0 0 -2px}.templo .degraus i:first-child{margin:0 2.5%}
.templo .txts{display:grid;gap:40px;margin-top:34px}.templo .txts div{text-align:center;padding:0 12px}.templo .txts h3{font-family:${est.titulo};font-weight:${est.peso};font-size:37px;line-height:1.15;color:${cor};margin-bottom:12px}.templo .txts p{font-size:27px;line-height:1.5;color:${t.suave}}
.agenda{display:grid;grid-template-columns:1fr 1fr;gap:0 96px;margin-top:40px}.ag{display:flex;gap:30px;padding:26px 0;border-top:1px solid ${t.linha};align-items:baseline}.ag i{font-style:normal;font-family:${NUMS};font-size:40px;color:${cor};width:64px;flex:none}.ag h3{font-family:${est.titulo};font-weight:${est.peso};font-size:35px;line-height:1.2}.ag p{font-size:23px;line-height:1.45;color:${t.suave};margin-top:8px}
.secao .corpo{justify-content:center;padding-left:60px;border-left:3px solid ${cor}}.secao .gn{font-family:${NUMS};font-size:150px;line-height:1;color:${cor};margin-bottom:18px}
.ponte{position:absolute;left:140px;right:140px;bottom:110px;z-index:3;font-size:23px;color:${cor};letter-spacing:.02em;display:flex;gap:14px;align-items:center}.ponte::before{content:"→";font-size:30px;line-height:1}
/* imagem */
.metade .foto2{position:absolute;right:0;top:0;bottom:0;width:860px}.metade .foto2 img{width:100%;height:100%;object-fit:cover}.metade .foto2::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,${t.fundo} 0%,${t.fundo}00 30%)}
.metade .c{right:960px}.metade .pe{right:960px}.metade .pe .a{max-width:none}
.cheia .bg{position:absolute;inset:0}.cheia .bg img{width:100%;height:100%;object-fit:cover}.cheia .bg::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,${t.fundo}f2 6%,${t.fundo}b8 42%,${t.fundo}33 100%)}
.cheia .c{z-index:2}.cheia .corpo{justify-content:flex-end;padding-bottom:30px}.cheia .pe{z-index:2;border-top-color:${t.linha}}${galeriaCss(t, est, cor)}${est.pv ? pvCss(t, est, cor) : ''}`;
}
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixar = (a, b, p) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, k) => Math.round(v + (B[k] - v) * p).toString(16).padStart(2, '0')).join(''); };

function galeriaCss(t, est, cor) {
  return `.galeria{display:grid;gap:52px;margin-top:60px}.galeria .gl{display:flex;flex-direction:column}
.galeria .arc{height:390px;border-radius:195px 195px 26px 26px;overflow:hidden;border:1px solid ${cor}77;position:relative;background:${t.painel};box-shadow:0 34px 70px -34px rgba(0,0,0,.7)}.galeria .arc img{width:100%;height:100%;object-fit:cover;display:block}
.galeria .arc.vazio{display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 28%,${cor}38,${cor}0a 70%),${t.painel}}
.galeria h3{font-family:${est.titulo};font-weight:${est.peso};font-size:40px;line-height:1.15;margin:30px 0 10px}.galeria p{font-size:27px;line-height:1.45;color:${t.suave}}`;
}

function pvCss(t, est, cor) {
  const c2 = mixar(cor, '#ffffff', 0.42);
  const tom = mixar(t.fundo, cor, 0.09);
  const cartao = `linear-gradient(165deg,${cor}33 0%,rgba(255,255,255,.025) 52%,rgba(255,255,255,0) 100%),${t.painel}`;
  return `
.s{background:radial-gradient(1200px 800px at 98% -8%,${cor}4a 0%,${cor}00 62%),radial-gradient(1000px 700px at -10% 110%,${cor}38 0%,${cor}00 60%),linear-gradient(155deg,${t.fundo} 0%,${tom} 100%)}
.s::before{right:-330px;top:-330px;width:900px;height:900px;background:none;border:1px solid ${cor}38;box-shadow:0 0 0 80px ${cor}0b,0 0 0 160px ${cor}07,0 0 0 240px ${cor}04}
.s::after{content:"";position:absolute;left:0;top:0;bottom:0;width:9px;background:linear-gradient(180deg,${cor} 0%,${c2} 46%,${cor}00 100%)}
.et{align-self:flex-start;padding:11px 24px;border:1px solid ${cor}77;border-radius:999px;background:${cor}1a;font-size:17px;letter-spacing:.22em;margin-bottom:34px}.et::after{display:none}
span.cf{background:${cor}33}
.pe{border-top-color:${cor}33}
.cols-p{gap:34px;margin-top:70px;align-items:stretch}
.cols-p .p{border:1px solid ${t.linha};border-radius:28px;padding:48px 40px 44px;background:${cartao};box-shadow:0 36px 70px -34px rgba(0,0,0,.75),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden;border-top:1px solid ${t.linha}}
.cols-p .p::before{left:0;top:0;width:100%;height:6px;background:linear-gradient(90deg,${cor},${c2})}
.cols-p .nn{font-size:92px;background:linear-gradient(180deg,${c2},${cor});-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-.02em}
.cols-p .ico{width:108px;height:108px;border-radius:50%;justify-content:center;background:radial-gradient(circle at 30% 28%,${cor}44,${cor}0f 72%);border:1px solid ${cor}77;box-shadow:0 0 50px ${cor}25}
.cols-p h3{font-size:44px;margin:30px 0 16px}.cols-p p{font-size:28px}
.et-l{gap:34px;margin-top:100px}.et-l::before{display:none}
.et-l .e{padding:64px 38px 40px;border:1px solid ${t.linha};border-radius:28px;background:${cartao};box-shadow:0 36px 70px -34px rgba(0,0,0,.75)}
.et-l .e::before{left:38px;top:-20px;width:40px;height:40px;border:0;background:linear-gradient(135deg,${c2},${cor});box-shadow:0 0 30px ${cor}66}.et-l .e::after{display:none}
.et-l .e .ico2{margin:6px 0 18px}.et-l h3{font-size:42px}.et-l p{font-size:28px}
.nums{border:0;gap:30px;margin-top:80px}.nums .n1,.nums .n1+.n1{padding:48px 42px 42px;border:1px solid ${t.linha};border-radius:28px;background:${cartao};box-shadow:0 36px 70px -34px rgba(0,0,0,.75)}
.nums .v{background:linear-gradient(180deg,${c2},${cor});-webkit-background-clip:text;background-clip:text;color:transparent;font-size:118px}
.grade{gap:28px 36px}.grade .it{padding:36px 36px 34px;border:1px solid ${t.linha};border-left:5px solid ${cor};border-radius:22px;background:${cartao}}.grade .it::before{display:none}
.grade .it.ci .ico{width:84px;height:84px;border-radius:50%;justify-content:center;align-items:center;padding:0;background:radial-gradient(circle at 30% 28%,${cor}44,${cor}0f 72%);border:1px solid ${cor}66}
.ag{padding:44px 38px;border:1px solid ${t.linha};border-radius:22px;background:${cartao};margin-bottom:22px;border-top:1px solid ${t.linha}}.agenda{gap:0 40px}.ag i{background:linear-gradient(180deg,${c2},${cor});-webkit-background-clip:text;background-clip:text;color:transparent}
.fech .dir{border-radius:30px;border:1px solid ${cor}77;background:${cartao};box-shadow:0 0 110px ${cor}22,0 36px 70px -34px rgba(0,0,0,.75)}
.frase .corpo{border-left:0;padding-left:30px;position:relative}.frase .corpo::before{content:"\\201C";position:absolute;left:-20px;top:calc(50% - 340px);font-family:Georgia,serif;font-size:420px;line-height:1;color:${cor}30}
.secao .corpo{border-left:0;padding-left:0}.secao .gn{font-size:190px;background:linear-gradient(180deg,${c2},${cor});-webkit-background-clip:text;background-clip:text;color:transparent}
.secao::before{right:-200px;top:50%;margin-top:-450px;width:900px;height:900px}
.fluxo .circ,.circ{border:1.5px solid ${cor}99;background:radial-gradient(circle at 32% 28%,${cor}3d,${cor}0d 72%),${t.painel};box-shadow:0 0 56px ${cor}2e}
.hc{border-color:${cor};background:radial-gradient(circle at 32% 28%,${cor}55,${cor}14 72%),${t.painel};box-shadow:0 0 90px ${cor}33}
.templo .txts h3{color:${c2}}
.metade .foto2{right:90px;top:92px;bottom:150px;width:780px;border-radius:390px 390px 30px 30px;overflow:hidden;border:1px solid ${cor}77;box-shadow:0 40px 90px -30px rgba(0,0,0,.8)}.metade .foto2::after{display:none}
.metade .c{right:1000px}.metade .pe{right:1000px}
.capa .foto{width:800px;clip-path:polygon(17% 0,100% 0,100% 100%,0 100%)}.capa .foto img{filter:saturate(1)}.capa .foto::after{background:linear-gradient(90deg,${t.fundo}cc 0%,${t.fundo}00 40%),linear-gradient(0deg,${cor}33 0%,${cor}00 40%)}
.capa .diag{position:absolute;left:0;top:0;pointer-events:none}.capa .orn{position:absolute;right:0;top:0;width:900px;height:1080px}.capa .orn svg{display:block}
.capa.pv .c{right:900px}.capa.pv .com-foto .c{right:900px}.capa.pv h2{font-size:84px}
.capa .regua{width:140px;height:5px;background:linear-gradient(90deg,${cor},${c2});border-radius:3px}
.perfil .fotoq{width:540px;margin:0 0 24px 0}.perfil .fotoq img,.perfil .fotoq .ini{border-radius:270px 270px 28px 28px;box-shadow:0 40px 90px -30px rgba(0,0,0,.8)}
.perfil .fotoq::before{left:-22px;top:22px;right:22px;bottom:-22px;border-radius:270px 270px 34px 34px;border:1px solid ${cor}88}
.perfil .ini{background:radial-gradient(circle at 50% 30%,${cor}55,${cor}12 70%),${t.painel};background-clip:border-box;font-size:200px}
.fatos{border:0;display:grid;gap:14px;margin-top:36px}.fato{border:1px solid ${t.linha};border-radius:18px;padding:20px 30px;background:${cartao}}.fato .r{width:230px}`;
}

const rodapePagina = (rodape, escritorio, i, n) => `<div class="pe"><div class="a">${lim(rodape || escritorio || '')}</div><div class="n">${num(i)} / ${String(n).padStart(2, '0')}</div></div>`;
const etiqueta = (s) => (s.etiqueta ? `<div class="et">${lim(s.etiqueta)}</div>` : '');
const titulo = (s, g) => `<h2 style="font-size:${tamTitulo(s.titulo, g)}px">${lim(s.titulo)}</h2>`;
const subt = (s) => (s.subtitulo || s.texto ? `<div class="sub" style="font-size:${tamTexto(s.subtitulo || s.texto, 30)}px">${lim(s.subtitulo || s.texto, true)}</div>` : '');
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

const LAYOUTS = {
  capa(s, m) {
    if (m.pv) {
      const inicial = (m.nome || m.escritorio || '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
      const lado = m.foto
        ? `<div class="foto"><img src="${m.foto}"></div><svg class="diag" width="1920" height="1080" viewBox="0 0 1920 1080"><line x1="1297" y1="0" x2="1160" y2="1080" stroke="${m.cor}" stroke-width="3"/><line x1="1317" y1="0" x2="1180" y2="1080" stroke="${m.cor}" stroke-opacity=".35" stroke-width="1.5"/></svg>`
        : `<div class="orn"><svg viewBox="0 0 900 1080" width="900" height="1080"><defs><linearGradient id="gcp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.cor2}"/><stop offset="1" stop-color="${m.cor}"/></linearGradient></defs>${[440, 360, 280].map((r, k) => `<circle cx="470" cy="540" r="${r}" fill="none" stroke="${m.cor}" stroke-opacity="${(0.52 - k * 0.14).toFixed(2)}" stroke-width="${k ? 1.5 : 2}"/>`).join('')}<circle cx="470" cy="540" r="196" fill="url(#gcp)" fill-opacity=".16" stroke="${m.cor}" stroke-width="2"/><circle cx="880" cy="380" r="9" fill="${m.cor2}"/><circle cx="130" cy="780" r="6" fill="${m.cor}" fill-opacity=".7"/><circle cx="560" cy="120" r="5" fill="${m.cor2}" fill-opacity=".8"/><text x="470" y="596" text-anchor="middle" font-family="Georgia,serif" font-size="176" fill="url(#gcp)">${esc(inicial)}</text></svg></div>`;
      const logo = m.logo ? `<img src="${m.logo}">` : `<span class="marca-t">${lim(m.escritorio)}</span>`;
      return `<section class="s capa pv"><div class="${m.foto ? 'com-foto' : ''}">${lado}<div class="c">
      <div class="topo">${logo}</div>
      <div class="meio"><h2 style="font-size:${tamTitulo(s.titulo, 84)}px">${lim(s.titulo)}</h2><div class="regua"></div>${s.subtitulo ? `<div class="sub">${lim(s.subtitulo, true)}</div>` : ''}</div>
      <div class="base">${m.nome ? `<div><b>${lim(m.nome)}</b>${lim(m.cargo || '')}</div>` : ''}${m.escritorio && m.logo ? `<div><b>${lim(m.escritorio)}</b></div>` : ''}${s.texto ? `<div><b>${lim(s.texto)}</b></div>` : ''}</div>
    </div></div></section>`;
    }
    const foto = m.foto ? `<div class="foto"><img src="${m.foto}"></div>` : '';
    const logo = m.logo ? `<img src="${m.logo}">` : `<span class="marca-t">${lim(m.escritorio)}</span>`;
    return `<section class="s capa"><div class="${m.foto ? 'com-foto' : ''}">${foto}<div class="c">
      <div class="topo">${logo}</div>
      <div class="meio"><h2>${lim(s.titulo)}</h2><div class="regua"></div>${s.subtitulo ? `<div class="sub">${lim(s.subtitulo, true)}</div>` : ''}</div>
      <div class="base">${m.nome ? `<div><b>${lim(m.nome)}</b>${lim(m.cargo || '')}</div>` : ''}${m.escritorio && m.logo ? `<div><b>${lim(m.escritorio)}</b></div>` : ''}${s.texto ? `<div><b>${lim(s.texto)}</b></div>` : ''}</div>
    </div></div></section>`;
  },
  perfil(s, m, i, n) {
    const inicial = (m.nome || m.escritorio || '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
    const quadro = m.foto ? `<div class="fotoq"><img src="${m.foto}"></div>` : `<div class="fotoq"><div class="ini">${esc(inicial)}</div></div>`;
    const fatos = itensDe(s, 5).map((f) => `<div class="fato"><div class="r">${lim(f.rotulo)}</div><div class="v">${lim(f.texto || f.valor)}</div></div>`).join('');
    return `<section class="s perfil"><div class="c">${etiqueta(s)}<div class="cols">${quadro}<div class="dir">${titulo(s, 66)}<div class="fatos">${fatos}</div></div></div></div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  numeros(s, m, i, n) {
    const its = itensDe(s, 4).map((x) => `<div class="n1"><div class="v">${lim(x.valor)}</div><div class="l">${lim(x.rotulo || x.texto)}</div>${x.fonte ? `<div class="f">${lim(x.fonte)}</div>` : ''}</div>`).join('');
    return `<section class="s ctr"><div class="c">${etiqueta(s)}${titulo(s)}${subt(s)}<div class="corpo"><div class="nums">${its}</div></div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  pilares(s, m, i, n) {
    const its = itensDe(s, 4).map((x, k) => `<div class="p">${x.icone && icone(x.icone, m, 58) ? `<div class="ico">${icone(x.icone, m, 58)}</div>` : `<div class="nn">${num(k)}</div>`}<h3>${lim(x.titulo)}</h3><p>${lim(x.texto, true)}</p></div>`).join('');
    return `<section class="s ctr"><div class="c">${etiqueta(s)}${titulo(s)}<div class="corpo"><div class="cols-p">${its}</div></div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  etapas(s, m, i, n) {
    const its = itensDe(s, 4).map((x, k) => `<div class="e"><div class="k">Etapa ${k + 1}</div>${x.icone ? `<div class="ico2">${icone(x.icone, m, 46)}</div>` : ''}<h3>${lim(x.titulo)}</h3><p>${lim(x.texto, true)}</p></div>`).join('');
    return `<section class="s ctr"><div class="c">${etiqueta(s)}${titulo(s)}${subt(s)}<div class="corpo"><div class="et-l">${its}</div></div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  tabela(s, m, i, n) {
    const cab = (s.cabecalho || []).slice(0, 5);
    const lin = (s.linhas || []).slice(0, 8);
    const t = `<table>${cab.length ? `<tr>${cab.map((c) => `<th>${lim(c)}</th>`).join('')}</tr>` : ''}${lin.map((l) => `<tr>${(l || []).slice(0, 5).map((c) => `<td>${lim(c)}</td>`).join('')}</tr>`).join('')}</table>`;
    return `<section class="s"><div class="c">${etiqueta(s)}${titulo(s, 70)}<div class="corpo" style="justify-content:${lin.length <= 4 ? 'center' : 'flex-start'}">${t}</div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  barras(s, m, i, n) {
    const its = itensDe(s, 8);
    const duplo = its.some((x) => x.valor2 !== undefined && x.valor2 !== null);
    const cores = [m.cor, m.suave];
    const linhas = its.map((x) => {
      const a = Math.max(0, Math.min(100, Number(x.valor) || 0)), b = Math.max(0, Math.min(100, Number(x.valor2) || 0));
      return `<div class="bl"><div class="r">${lim(x.rotulo)}</div><div class="t"><div><b style="width:${a}%;background:${cores[0]}"></b></div>${duplo ? `<div><b style="width:${b}%;background:${cores[1]}"></b></div>` : ''}</div><div class="p">${a}%${duplo ? `<br><span style="font-size:24px;color:${m.suave}">${b}%</span>` : ''}</div></div>`;
    }).join('');
    const leg = duplo && Array.isArray(s.legenda) ? `<div class="leg">${s.legenda.slice(0, 2).map((l, k) => `<span><i style="background:${cores[k]}"></i>${lim(l)}</span>`).join('')}</div>` : '';
    return `<section class="s"><div class="c">${etiqueta(s)}${titulo(s, 70)}<div class="corpo" style="justify-content:flex-start"><div class="bar">${linhas}</div>${leg}</div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  frase(s, m, i, n) {
    return `<section class="s frase"><div class="c">${etiqueta(s)}<div class="corpo">${titulo(s, 84)}${subt(s)}</div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  lista(s, m, i, n) {
    const its = itensDe(s, 6).map((x) => { const ic = x.icone ? icone(x.icone, m, 52) : ''; return `<div class="it${ic ? ' ci' : ''}">${ic ? `<div class="ico">${ic}</div>` : ''}<div><h3>${lim(x.titulo)}</h3><p>${lim(x.texto, true)}</p></div></div>`; }).join('');
    return `<section class="s ctr"><div class="c">${etiqueta(s)}${titulo(s, 70)}<div class="corpo" style="justify-content:flex-start"><div class="grade">${its}</div></div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  ilustracao(s, m, i, n) {
    if (!ILUSTRACOES[s.ilustracao]) return LAYOUTS.frase(s, m, i, n);
    return `<section class="s ilu"><div class="ilbox">${svgIlustracao(s.ilustracao, m)}</div><div class="c">${etiqueta(s)}<div class="corpo">${titulo(s, 70)}${subt(s)}</div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  templo(s, m, i, n) {
    const its = itensDe(s, 4), k = Math.max(2, its.length);
    const colunas = its.map(() => '<div class="col"><div class="cap"></div><div class="fuste"></div><div class="bas"></div></div>').join('');
    const txts = its.map((x) => `<div><h3>${lim(x.titulo)}</h3><p>${lim(x.texto, true)}</p></div>`).join('');
    return `<section class="s ctr"><div class="c">${etiqueta(s)}${titulo(s, 62)}<div class="corpo"><div class="templo">
      <div class="front"><svg viewBox="0 0 1640 120" preserveAspectRatio="none"><polygon points="820,6 1634,114 6,114" fill="${m.painel}" stroke="${m.cor}" stroke-width="2"/></svg><span>${lim(s.subtitulo || m.escritorio || m.nome || '')}</span></div>
      <div class="arq"></div><div class="colunas" style="grid-template-columns:repeat(${k},1fr)">${colunas}</div><div class="degraus"><i></i><i></i></div>
      <div class="txts" style="grid-template-columns:repeat(${k},1fr)">${txts}</div></div></div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  agenda(s, m, i, n) {
    const its = itensDe(s, 8).map((x, k) => `<div class="ag"><i>${num(k)}</i><div><h3>${lim(x.titulo)}</h3>${x.texto ? `<p>${lim(x.texto)}</p>` : ''}</div></div>`).join('');
    return `<section class="s ctr"><div class="c">${etiqueta(s)}${titulo(s, 70)}${subt(s)}<div class="corpo"><div class="agenda">${its}</div></div></div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  secao(s, m, i, n) {
    return `<section class="s secao"><div class="c"><div class="corpo"><div class="gn">${lim(s.etiqueta || num(i))}</div>${titulo(s, 92)}${subt(s)}</div></div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
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
      const larg = its.length <= 3 ? 330 : its.length === 4 ? 290 : 250;
      corpo = `<div class="fluxo">${its.map((x, k) => `<div class="no" style="width:${larg}px"><div class="circ">${icone(x.icone, m, 58) || `<span class="nm">${num(k)}</span>`}</div><h3>${lim(x.titulo)}</h3>${x.texto ? `<p>${lim(x.texto, true)}</p>` : ''}</div>${k < its.length - 1 ? `<div class="lig">${x.ligacao ? `<span>${lim(x.ligacao)}</span>` : ''}</div>` : ''}`).join('')}</div>`;
    }
    return `<section class="s"><div class="c">${etiqueta(s)}${titulo(s, 70)}${subt(s)}<div class="corpo" style="justify-content:center;padding-bottom:20px">${corpo}</div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  imagem(s, m, i, n) {
    const src = s.imagem ? imagemDe(s.imagem, m) : '';
    if (!src) return s.ilustracao ? LAYOUTS.ilustracao(s, m, i, n) : LAYOUTS.frase(s, m, i, n);
    if (s.modelo === 'cheia') {
      return `<section class="s cheia"><div class="bg"><img src="${src}"></div><div class="c">${etiqueta(s)}<div class="corpo">${titulo(s, 78)}${subt(s)}</div></div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
    }
    return `<section class="s metade"><div class="foto2"><img src="${src}"></div><div class="c">${etiqueta(s)}<div class="corpo">${titulo(s, 70)}${subt(s)}</div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  galeria(s, m, i, n) {
    const its = itensDe(s, 3);
    const k = Math.max(2, its.length);
    const cartoes = its.map((x) => {
      const src = x.imagem ? imagemDe(x.imagem, m) : '';
      const vis = src ? `<div class="arc"><img src="${src}"></div>` : `<div class="arc vazio">${icone(x.icone || 'pessoa', m, 110)}</div>`;
      return `<div class="gl">${vis}<h3>${lim(x.titulo)}</h3>${x.texto ? `<p>${lim(x.texto, true)}</p>` : ''}</div>`;
    }).join('');
    return `<section class="s ctr"><div class="c">${etiqueta(s)}${titulo(s, 70)}${subt(s)}<div class="corpo"><div class="galeria" style="grid-template-columns:repeat(${k},1fr)">${cartoes}</div></div>${fonteTxt(s)}</div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
  fechamento(s, m, i, n) {
    const passos = (s.passos || []).slice(0, 5).map((p, k) => `<div class="passo"><i>${num(k)}</i><span>${lim(p)}</span></div>`).join('');
    const contato = (s.contato || []).slice(0, 5).map((l) => `<div class="ln">${lim(l)}</div>`).join('');
    return `<section class="s fech"><div class="c">${etiqueta(s)}<div class="cols"><div class="esq">${titulo(s, 76)}<div class="passos">${passos}</div></div><div class="dir"><div class="k">Contato</div>${contato}</div></div></div>${rodapePagina(m.rodape, m.escritorio, i, n)}</section>`;
  },
};

export const NOMES_LAYOUT = Object.keys(LAYOUTS);

export function montarPaginas(slides, marca, deslocamento = 0, total = slides.length) {
  const t = TEMAS[marca.tema] ?? TEMAS.escuro;
  const est = ESTILOS[marca.estilo] ?? ESTILOS.serifada;
  const cor = /^#[0-9a-fA-F]{6}$/.test(marca.cor || '') ? marca.cor : t.cor;
  const m = { ...marca, cor, suave: t.suave, pv: !!est.pv, cor2: mixar(cor, '#ffffff', 0.42) };
  const html = slides.map((s, i) => {
    const h = (LAYOUTS[s.layout] ?? LAYOUTS.frase)(s, m, i + deslocamento, total);
    return s.ponte ? h.replace(/<\/section>\s*$/, `<div class="ponte">${lim(s.ponte)}</div></section>`) : h;
  }).join('\n');
  return { css: css(t, est, cor), html };
}
