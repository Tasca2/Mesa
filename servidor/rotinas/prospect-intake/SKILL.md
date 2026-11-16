---
name: prospect-intake
description: Abre a ficha de um cliente novo ou prospect, com ou sem documentos em mãos. Organiza o que chegou (extratos, IR, carteira), aponta o que falta pedir e entrega a nota para o CRM, a nota ao analista, a mensagem de WhatsApp pedindo os documentos e o roteiro da primeira reunião. Use ao receber um cliente novo; não faz recomendação de ativo.
---

# Cliente novo: ficha de entrada

## Objetivo
Transformar o primeiro contato em ficha, lista de pendências e próximo passo, para o assessor não começar nada do zero e não deixar o cliente esfriar (transferência de custódia e portabilidade morrem por documento que ninguém cobrou).

## Entradas
- Momento: **antes da primeira conversa** (sem documentos) ou **já tenho material** (extratos, IR, carteira). Se o pedido já disser, não pergunte.
- Origem do contato (indicação, conteúdo, evento, prospecção ativa) e como ele prefere ser tratado.
- Nome: prefira apelido ou iniciais; só use o nome completo se o assessor mandar.
- Perfil do assessor (`mesa_perfil`) e `consultar_cofre` (tema `primeira reunião rapport mapear instituições`); sem cofre, siga o método abaixo.

Falta algo essencial? Pergunte **uma** coisa e entregue o resto com `[CONFERIR]`. Nunca invente número, instituição ou prazo.

## Passos
1. **Inventário**: o que chegou, de qual instituição, em qual período. Arquivo ilegível ou incompleto vai para pendências, sem adivinhar números.
2. **Mapa financeiro** (só do que está nos documentos): instituições, saldo por instituição, renda fixa x variável, concentração, liquidez. Estimativa leva `[CONFERIR]`.
3. **Pendências**: o que falta para avançar (extrato de cada instituição, declaração do IR, dados cadastrais, perfil de investidor). Cada item com uma frase de motivo, em linguagem de cliente.
4. **Sem documentos ainda**: monte o roteiro da primeira reunião de 30 minutos (quebra-gelo e conexão 5 min, apresentação 3 min, descoberta 15 min, próximos passos 5 min) com 5 perguntas abertas de objetivo e de problema, na lógica do SPIN. Quem fala menos de 30% do tempo conduz melhor: o roteiro deve devolver a palavra ao cliente.
5. **Próximo passo** com dono e data (data só se o assessor informou; senão "a combinar" + `[CONFERIR]`).

## Modelo de saída (nesta ordem)
**Resumo do que chegou** — 3 linhas: quem é, o que veio, o que falta.
**Peças** (cada uma separada, sem comentário dentro):
- `nota-crm` — ficha em até 12 linhas: origem, objetivo nas palavras do cliente, patrimônio mapeado, o que ele tem em outras instituições, lacunas, pontos de atenção, próximo passo e data.
- `whatsapp` — pedido dos documentos e "o que esperar": até 5 linhas, uma pergunta de resposta fácil, nome do contato e prazo **só se o assessor informou**.
- `relatorio` (título "Nota ao analista") — o que o analista precisa para montar a proposta, o que falta e o prazo pedido.
- `roteiro-reuniao` — só quando ainda não há documentos.
**Conferir** — o que o assessor valida antes de enviar.

## Exemplo
Bom (WhatsApp): "Oi, Marcos! Foi ótimo conversar hoje. Para eu montar o seu diagnóstico sem retrabalho, preciso do extrato atual de cada banco onde você investe e do IR do ano passado. Consegue me mandar até quinta? Qualquer dúvida, é só chamar."
Ruim: "Prezado, segue lista de documentos obrigatórios. Sem eles não conseguimos prosseguir." (burocrático, sem motivo, sem prazo combinado).

## Limites
Sem proposta de carteira, recomendação de produto, cálculo tributário nem abertura de conta. Regra de cadastro, perfil de investidor ou LGPD: `consultar_cofre` (tema `legislacao`) ou `[CONFERIR]` com o compliance. Nada é gravado nem enviado por você; o texto da `nota-crm` é para o assessor colar no CRM.
