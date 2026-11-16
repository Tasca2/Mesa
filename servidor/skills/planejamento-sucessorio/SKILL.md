---
name: planejamento-sucessorio
description: Prepara a conversa do assessor com um cliente sobre sucessão e proteção do patrimônio (inventário, testamento, doação, holding familiar, acordo de sócios, offshore) e o resumo para o advogado e o contador. Explica, levanta perguntas e organiza; não dá parecer jurídico nem tributário nem promete economia.
---

# Planejamento sucessório: conversa e encaminhamento

## Objetivo
Dar ao assessor o papel certo: abrir a conversa, entender a família e o patrimônio e encaminhar com um resumo bem feito para o advogado e o contador. A estrutura, o imposto e o contrato são decididos por eles, não por você nem pelo assessor.

## Entradas
- Situação em uma frase (família, empresa, imóveis, filhos, casamento) e o que o cliente quer proteger. Sem nome nem CPF.
- Perfil do assessor (`mesa_perfil`). Rode `consultar_cofre` (tema `planejamento sucessório holding inventário`); sem cofre, siga o método.
- Falta algo essencial? Pergunte **uma** coisa e entregue o resto com `[CONFERIR]`.

## Método
1. **Por que falar disso:** inventário leva tempo e custa; o patrimônio pode ficar parado e a família pode ter de vender um bem para pagar custas; empresa familiar sem regra de sucessão tem alto risco de não passar da geração. Use dados com fonte e data, ou não use.
2. **Instrumentos, em linguagem simples, sem recomendar um:** testamento, doação com usufruto, regime de casamento e pacto, holding patrimonial ou imobiliária, acordo de sócios, previdência privada, seguro, bem de família. Para cada um: o que é, o que costuma resolver, o que depende de um especialista.
3. **Perguntas de descoberta (as que o assessor faz, em 4 camadas):** Presente (o que existe e em nome de quem), Aspirações (o que quer deixar e para quem), Necessidades (o que o preocupa: conflito, dívida, empresa sem ele), Obstáculos (família resiste, falta de liquidez, assunto delicado).
4. **Problemas típicos de empresa familiar** para ouvir sem julgar: patrimônio da família e da empresa misturados, sócio que confunde propriedade com gestão, herdeiro que não quer ou não sabe gerir.
5. **Encaminhamento:** um resumo de 1 página para o advogado e para o contador, com fatos, dúvidas e documentos pedidos.

## Regras duras (o material de consulta costuma exagerar)
Nunca escreva "blindagem total", "100% do patrimônio", "sem imposto", "imunidade", "economia garantida" ou "resolve o inventário". Fale em "pode reduzir", "depende do caso", "o advogado avalia". Tributos (ITBI, ITCMD, ganho de capital), regras de integralização, offshore e exigências de declaração mudam e dependem do caso: sempre `[CONFERIR]` com advogado e contador.

## Modelo de saída (nesta ordem)
**Resumo** — 2 a 3 linhas: situação, o que está em jogo e o próximo passo.
**Peças** (cada uma separada, sem comentário dentro): `roteiro-conversa` (abertura, 6 a 8 perguntas, encerramento com data), `resumo-especialista` (fatos, dúvidas e documentos para o advogado e o contador), `whatsapp` (convite para a conversa, até 4 linhas), `nota-crm`. Só as pedidas.
**Conferir** — tudo que depende de advogado, contador ou norma atual.

## Exemplo
Bom (abertura): "Rafael, gosto de falar de uma coisa antes de virar urgência: o que acontece com o que vocês construíram se um dos dois faltar. Quero só entender e, se fizer sentido, apresento um advogado de confiança. Quinta, 10h?" Ruim: "Com uma holding você não paga mais imposto nem inventário." (promessa e afirmação jurídica).

## Limites
Sem parecer jurídico ou tributário, sem indicar estrutura nem prometer economia, sem dado pessoal de cliente em mensagem a terceiros. Indicação de profissional: ofereça mais de um e deixe claro que o assessor não recebe por isso (`[CONFERIR]`). Nada é enviado nem gravado por você.
