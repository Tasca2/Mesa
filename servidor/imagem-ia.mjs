import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export const PROVEDORES = { gemini: 'Gemini (Google)', openai: 'OpenAI' };
const PROPORCAO = { horizontal: '16:9', vertical: '9:16', quadrada: '1:1' };
const TAMANHO_OPENAI = { horizontal: '1536x1024', vertical: '1024x1536', quadrada: '1024x1024' };
const GUARDA = ' Sem texto, sem letras, sem números, sem logotipos, sem marca d\'água. Sem rosto reconhecível de pessoa real. Composição limpa, com espaço livre, adequada a uma apresentação profissional.';
const BASE_GEMINI = 'https://generativelanguage.googleapis.com/v1beta';

const semChave = (t) => String(t || '').replace(/(key|bearer|sk-|AIza)[^\s"']{6,}/gi, '$1…').slice(0, 220);

export async function validarChave(provedor, chave) {
  if (!PROVEDORES[provedor]) return { ok: false, mensagem: 'Escolha Gemini ou OpenAI.' };
  const c = String(chave || '').trim();
  if (c.length < 20 || /\s/.test(c)) return { ok: false, mensagem: 'A chave parece incompleta. Copie ela inteira, sem espaços.' };
  try {
    const r = provedor === 'gemini'
      ? await fetch(BASE_GEMINI + '/models?pageSize=1', { headers: { 'x-goog-api-key': c }, signal: AbortSignal.timeout(15000) })
      : await fetch('https://api.openai.com/v1/models', { headers: { authorization: 'Bearer ' + c }, signal: AbortSignal.timeout(15000) });
    if (r.ok) return { ok: true };
    if ([400, 401, 403].includes(r.status)) return { ok: false, mensagem: 'O ' + PROVEDORES[provedor] + ' não aceitou essa chave. Confira se copiou inteira e se é do serviço escolhido.' };
    return { ok: false, mensagem: 'O ' + PROVEDORES[provedor] + ' não respondeu direito agora (' + r.status + '). Tente de novo em instantes.' };
  } catch {
    return { ok: false, mensagem: 'Não consegui falar com o ' + PROVEDORES[provedor] + ' agora. Confira a internet e tente de novo.' };
  }
}

let modeloGeminiCache = { chave: '', nome: '' };
async function modeloGemini(chave) {
  if (modeloGeminiCache.chave === chave && modeloGeminiCache.nome) return modeloGeminiCache.nome;
  let nome = 'gemini-2.5-flash-image';
  try {
    const r = await fetch(BASE_GEMINI + '/models?pageSize=200', { headers: { 'x-goog-api-key': chave }, signal: AbortSignal.timeout(15000) });
    const j = await r.json();
    const nomes = (j.models || [])
      .filter((m) => /image/i.test(m.name) && !/imagen|vision/i.test(m.name) && (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name).replace(/^models\//, ''));
    nome = nomes.find((n) => /flash-image/.test(n) && !/preview|exp/.test(n)) || nomes.find((n) => /flash-image/.test(n)) || nomes[0] || nome;
  } catch {   }
  modeloGeminiCache = { chave, nome };
  return nome;
}

async function gerarGemini(chave, prompt, orientacao) {
  const modelo = await modeloGemini(chave);
  const chamar = async (extra) => fetch(BASE_GEMINI + '/models/' + modelo + ':generateContent', {
    method: 'POST', signal: AbortSignal.timeout(120000),
    headers: { 'x-goog-api-key': chave, 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'], ...extra } }),
  });
  let r = await chamar({ imageConfig: { aspectRatio: PROPORCAO[orientacao] || '16:9' } });
  if (r.status === 400) r = await chamar({});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(semChave(j?.error?.message) || 'erro ' + r.status), { status: r.status });
  const partes = (j.candidates || []).flatMap((c) => c?.content?.parts || []);
  const img = partes.map((p) => p.inlineData || p.inline_data).find((x) => x?.data);
  if (!img) throw new Error('O Gemini não devolveu imagem para esse pedido (pode ter recusado o assunto). Reescreva a descrição.');
  return { bytes: Buffer.from(img.data, 'base64'), mime: String(img.mimeType || img.mime_type || 'image/png'), modelo };
}

async function gerarOpenAI(chave, prompt, orientacao) {
  const modelo = 'gpt-image-1';
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST', signal: AbortSignal.timeout(180000),
    headers: { authorization: 'Bearer ' + chave, 'content-type': 'application/json' },
    body: JSON.stringify({ model: modelo, prompt, size: TAMANHO_OPENAI[orientacao] || '1536x1024', n: 1 }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(semChave(j?.error?.message) || 'erro ' + r.status), { status: r.status });
  const d = j.data?.[0];
  if (d?.b64_json) return { bytes: Buffer.from(d.b64_json, 'base64'), mime: 'image/png', modelo };
  if (d?.url && /^https:\/\//.test(d.url)) {
    const x = await fetch(d.url, { signal: AbortSignal.timeout(30000) });
    if (x.ok) return { bytes: Buffer.from(await x.arrayBuffer()), mime: String(x.headers.get('content-type') || 'image/png'), modelo };
  }
  throw new Error('A OpenAI não devolveu imagem para esse pedido.');
}

export async function gerarImagemIA({ provedor, chave, descricao, orientacao, pasta }) {
  const texto = String(descricao || '').trim().slice(0, 700);
  if (texto.length < 8) throw new Error('Descreva a imagem com mais detalhe.');
  const ori = PROPORCAO[orientacao] ? orientacao : 'horizontal';
  const prompt = texto + GUARDA;
  let r;
  try {
    r = provedor === 'gemini' ? await gerarGemini(chave, prompt, ori) : await gerarOpenAI(chave, prompt, ori);
  } catch (e) {
    const s = e?.status;
    if (s === 401 || s === 403) throw Object.assign(new Error('A chave de imagem foi recusada. Peça ao assessor para colar uma chave válida.'), { chaveRecusada: true });
    if (s === 429) throw new Error('O limite ou o saldo da conta de imagem acabou por agora. Use imagens livres da internet.');
    if (e?.name === 'TimeoutError') throw new Error('A geração demorou demais. Tente de novo ou use imagens livres da internet.');
    throw new Error(e?.message || 'Falha ao gerar a imagem.');
  }
  const ext = /jpe?g/i.test(r.mime) ? '.jpg' : '.png';
  if (r.bytes.length < 5000) throw new Error('A imagem veio vazia. Tente de novo.');
  mkdirSync(pasta, { recursive: true });
  const base = texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'imagem';
  const nome = 'ia-' + base + '-' + Date.now().toString(36).slice(-4) + ext;
  writeFileSync(path.join(pasta, nome), r.bytes);
  return { arquivo: nome, provedor: PROVEDORES[provedor], modelo: r.modelo, kb: Math.round(r.bytes.length / 1024) };
}
