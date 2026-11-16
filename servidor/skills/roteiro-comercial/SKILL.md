---
name: roteiro-comercial
description: Monta roteiros de prospecção e relacionamento prontos para usar: ligação de 30, 60 ou 120 segundos, sequência de WhatsApp em 5 toques, roteiro de reunião minuto a minuto, e-mail com 3 assuntos e pitch de 1 minuto. Ajusta ao perfil do prospect (iniciante, empresário, profissional liberal, aposentado) e à etapa (primeiro contato, retomada, pós-reunião, pós-proposta). Não recomenda ativo nem promete retorno.
---

# Roteiros comerciais

## Objetivo
Entregar o texto exato que o assessor vai falar ou enviar, no jeito dele, no tamanho certo, sem ele precisar montar nada. A meta de toda peça é **uma ação concreta com data e hora**, nunca "depois a gente conversa".

## Entradas
- Qual roteiro (o pedido da Mesa já diz). Quem é o prospect (perfil e uma frase de contexto) e a etapa.
- Perfil do assessor (`mesa_perfil`: tom, tamanho, assinatura, exemplos). Rode também `consultar_cofre` (tema `ligação de prospecção objeções primeira reunião perguntas`); sem cofre, siga o método abaixo e não cite notas.
- Falta algo essencial? Pergunte **uma** coisa e entregue o resto com `[CONFERIR]`. Nunca invente fato sobre o prospect, o escritório ou condição comercial.

## Método
**Ligação** (a mesma estrutura, cortada pelo tempo):
- 30 s: abertura com energia (quem é, 7 a 10 s) · sinal de brevidade ("levo 1 minuto") · propósito claro (agendar uma conversa de 30 minutos) · fechamento com dois horários.
- 60 s: acrescente valor e credibilidade em uma frase (o que costuma resolver para quem tem o perfil dele, sem promessa).
- 120 s: acrescente uma pergunta breve de descoberta (situação atual ou objetivo) antes de propor o horário.
- Sempre: **nunca encerre sem data e hora**; repita para confirmar. Saídas prontas para "pode me ligar semana que vem?" (reconheça e proponha horário concreto), "quem cuida é minha esposa/meu marido" (convide o casal), "estou ocupado e não vou mexer até o fim do ano" (valide e mostre o custo de não revisar, sem alarmar) e "invisto sozinho" (reconheça e mostre o apoio operacional, sem comparar com concorrente).
**Sequência de WhatsApp** (5 toques em 10 a 14 dias): para cada toque, dia, objetivo e texto de até 4 linhas, uma pergunta de resposta fácil. Toque 1 abre com algo dele; 2 e 3 agregam valor sem pedir; 4 propõe horário; 5 fecha o ciclo sem culpa.
**Reunião minuto a minuto** (primeira: 30 min; segunda: 45 min): quebra-gelo e conexão 5 · apresentação 3 · descoberta 15 · próximos passos 5 (na primeira) / proposta e fechamento (na segunda). Descoberta com perguntas em quatro camadas: **P**resente (como está hoje), **A**spirações (onde quer chegar), **N**ecessidades (o que incomoda) e **O**bstáculos (o que impede mudar). Quem ouve mais de 70% do tempo conduz melhor.
**E-mail:** 3 opções de assunto (curiosidade, benefício, pergunta), corpo de 5 a 6 linhas, uma chamada.
**Pitch de 1 minuto:** quem sou, para quem trabalho, o problema que resolvo, como é trabalhar comigo, convite para uma conversa de 30 minutos.

## Ajuste por perfil e etapa
Empresário: tempo e caixa da empresa. Profissional liberal: renda irregular e previdência. Aposentado: renda, liquidez e segurança, em linguagem simples. Iniciante: um conceito por vez, com analogia. Etapa de retomada: comece pelo que ele disse; pós-proposta: pergunte o que falta decidir.

## Modelo de saída (nesta ordem)
**Resumo** — 2 linhas: perfil, etapa e o objetivo da peça.
**Peças** (cada uma separada, sem comentário dentro): `roteiro-ligacao` (com o tempo no título), `whatsapp` (um por toque), `roteiro-reuniao`, `email`. Só as pedidas.
**Conferir** — o que o assessor valida antes de usar.

## Exemplo
Ligação de 30 s (resumida): "Oi, Carlos, é o Rafael, da Alfa. Prometo 1 minuto: eu ajudo empresários a organizar o que sobra do caixa. Queria 30 minutos com você para entender se faz sentido. Terça às 10h ou quarta às 16h?" Ruim: "Tenho um produto imperdível com rentabilidade garantida, só hoje." (promessa e pressão).

## Limites
Sem indicação de ativo, promessa ou projeção de retorno, urgência inventada, culpa ou comparação com concorrente. Não afirme nada sobre o escritório, o modelo de trabalho ou os produtos do assessor que ele não tenha informado: use `[CONFERIR: ...]` no lugar. As quatro objeções da ligação são sempre as listadas no método, nessa ordem. Identificação do profissional conforme a atuação. Nada é enviado nem gravado por você.
