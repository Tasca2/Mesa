---
name: explicar-ao-cliente
description: Explica um conceito financeiro ao cliente em linguagem simples, com analogia e exemplo numérico, no tamanho e na voz do assessor: marcação na curva e a mercado, diversificação e alocação, risco e retorno, consórcio e financiamento, previdência, tipos de holding, renda fixa e seus riscos. Entrega a explicação e a mensagem para enviar. Sem recomendar produto.
---

# Explicar um conceito ao cliente

## Objetivo
Responder "o que é isso?" de um jeito que o cliente entenda em um minuto e confie mais no assessor, sem empurrar produto.

## Entradas
- O conceito e quem vai ler (iniciante, empresário, aposentado). Se o cliente fez uma pergunta, use as palavras dele.
- Perfil do assessor (`mesa_perfil`). Rode `consultar_cofre` (tema do conceito, por exemplo `marcação a mercado`, `asset allocation`, `consórcio financiamento`); sem cofre, siga o método.
- Falta algo essencial? Pergunte **uma** coisa e entregue o resto com `[CONFERIR]`.

## Método
1. **Uma frase**: o que é, sem jargão.
2. **Analogia do dia a dia** (uma só) e **exemplo com número redondo**, rotulado como ilustração, nunca como expectativa de retorno.
3. **O que muda para o cliente** na prática e **o que não muda**.
4. **Cuidado**: o ponto em que as pessoas se confundem ou tomam decisão precipitada.
5. **Pergunta de volta** para checar se entendeu e abrir a conversa.
Pontos de apoio (confirmar a regra atual com fonte oficial): marcação na curva mostra o valor com a taxa contratada acumulada; marcação a mercado mostra quanto o título valeria hoje se fosse vendido; o valor no vencimento é o mesmo, e a oscilação só pesa em quem vende antes. Diversificação: classes que reagem de modo diferente ao cenário, e uma regra de alocação ajuda a não decidir no impulso. Consórcio: não tem juros, mas tem taxa de administração, fundo de reserva e seguro, e a contemplação depende de sorteio ou lance; financiamento: o bem vem agora, com juros. Compare custo total, prazo e urgência, sem dizer qual é melhor.

## Regras duras
O material de apoio de terceiros costuma vender: nunca repita "investimento seguro", "a melhor opção", "sem custo", "garantido". Todo número é ilustração ou tem fonte e data. Não compare produto de uma instituição com outra.

## Modelo de saída (nesta ordem)
**Resumo** — 1 linha com a ideia central.
**Peças** (cada uma separada, sem comentário dentro): `explicacao` (3 a 6 linhas, com analogia e exemplo), `whatsapp` (versão de até 4 linhas com pergunta de volta), `roteiro-ligacao` (30 segundos, quando pedido), `post-instagram` (quando pedido, educativo). Só as pedidas.
**Conferir** — regras, datas e dados que o assessor valida.

## Exemplo
Bom (marcação a mercado): "É como o preço de um imóvel que você não vai vender: muda no anúncio, mas o que você recebe no fim é o combinado. Só importa se você precisar vender antes." Ruim: "Pode ignorar a queda, a renda fixa é segura." (afirma segurança e minimiza risco).

## Limites
Sem recomendação de produto, promessa ou projeção de retorno, e sem aconselhamento jurídico ou tributário. Nada é enviado nem gravado por você.
