// Cortes do que a janela manda ao Claude. Nenhum corte é calado: quem corta devolve "cortado" e um "aviso" que a tela
// mostra. Na conversa, o fim (a mensagem do assessor e as instruções da Mesa) nunca é cortado: sai o miolo (o contexto e
// o pedido que está na tela) e fica uma marca no lugar, dizendo quantos caracteres saíram. Se só o fim já passa do
// limite, nada vai: volta o erro, para o assessor encurtar.
const milhar = (n) => n.toLocaleString('pt-BR');
const marca = (n) => `\n\n[… ${milhar(n)} caracteres do meio cortados pela Mesa para caber no limite de envio …]\n\n`;
// Não deixa um corte no meio de um caractere que ocupa duas posições (emoji, por exemplo).
const alto = (s, i) => i > 0 && i < s.length && s.charCodeAt(i - 1) >= 0xd800 && s.charCodeAt(i - 1) <= 0xdbff;

export function cortarMensagem(texto, limite, fimProtegido = 0) {
  const t = String(texto ?? '');
  if (t.length <= limite) return { texto: t, cortado: false };
  const fp = Math.max(0, Math.min(t.length, Math.floor(Number(fimProtegido) || 0)));
  const fim = t.slice(t.length - fp), corpo = t.slice(0, t.length - fp);
  // A reserva usa a marca com o maior número possível: a marca de verdade nunca fica maior que ela.
  const cabe = limite - fim.length - marca(t.length).length;
  if (cabe < 0) return { cortado: true, erro: `A mensagem e as instruções da Mesa somam ${milhar(fim.length)} caracteres e o envio vai até ${milhar(limite)}. Encurte a mensagem ou divida em duas.` };
  let ini = Math.ceil(cabe / 2), volta = corpo.length - (cabe - ini);
  if (alto(corpo, ini)) ini--;
  if (alto(corpo, volta)) volta++;
  const tirados = volta - ini;
  return {
    texto: corpo.slice(0, ini) + marca(tirados) + corpo.slice(volta) + fim, cortado: true, tirados,
    aviso: `O texto enviado tinha ${milhar(t.length)} caracteres e o envio vai até ${milhar(limite)}: a Mesa tirou ${milhar(tirados)} do meio${fp ? ' (do contexto e do pedido que está na tela)' : ''} e marcou o lugar.` +
      (fp ? ' A sua mensagem e as instruções da Mesa foram inteiras.' : ''),
  };
}

// Corte simples do fim, avisado. "oQue" abre a frase do aviso, no plural (ex.: "As instruções da tarefa").
export function cortarFim(texto, limite, oQue) {
  const t = String(texto ?? '');
  if (t.length <= limite) return { texto: t, cortado: false };
  return { texto: t.slice(0, limite), cortado: true, aviso: `${oQue} tinham ${milhar(t.length)} caracteres e vão até ${milhar(limite)}: os últimos ${milhar(t.length - limite)} ficaram de fora.` };
}

// O que aparece na conversa como fala do assessor. Só a tela encurta; o Claude recebe a mensagem inteira.
export function paraExibir(texto, limite) {
  const t = String(texto ?? '');
  if (t.length <= limite) return t;
  const nota = '… [mensagem longa: aqui aparece só o começo; o Claude recebeu inteira]';
  return t.slice(0, limite - nota.length) + nota;
}
