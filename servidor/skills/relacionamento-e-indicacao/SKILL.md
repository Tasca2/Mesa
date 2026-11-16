---
name: relacionamento-e-indicacao
description: Monta o ritmo de relacionamento do assessor com a carteira (contato mensal, revisão quadrimestral, planejamento anual), o pedido de indicação a clientes e a abordagem a parceiros profissionais (contador, advogado, corretor de seguros). Entrega agenda, roteiro de cada contato e mensagens prontas. Sem promessa de retorno nem pressão.
---

# Relacionamento e indicação

## Objetivo
Tirar o relacionamento do improviso: o assessor sabe com quem fala hoje, o que diz e como pede indicação sem constrangimento. Quem recebe contato proativo e útil tende a ficar; o cliente que sai costuma dizer que "nunca teve contato" do assessor.

## Entradas
- O que o pedido diz: ritmo da carteira, pedido de indicação ou parceiro profissional. Número de clientes e como estão segmentados (se não souber, proponha 3 grupos pelo volume de atenção e marque `[CONFERIR]`).
- Perfil do assessor (`mesa_perfil`). Rode `consultar_cofre` (tema `contatos mensais revisão quadrimestral rede de indicações advogado contador`); sem cofre, siga o método.
- Falta algo essencial? Pergunte **uma** coisa e entregue o resto com `[CONFERIR]`. Nunca invente dado de cliente.

## Método
**Ritmo da carteira** (referência de mercado, o assessor adapta ao tamanho e à agenda dele):
- Contato mensal, 30 min ou menos, em 4 partes: conexão pessoal desde a última conversa · o que aconteceu com a carteira e com o mercado, em linguagem simples · uma oferta de valor (conteúdo, convite, lembrete de prazo; nunca só "vender") · pergunta final: "tem mais algo que você queira conversar?".
- Revisão quadrimestral, 45 a 60 min, de preferência ao vivo, substitui o contato do mês. Planejamento anual, 60 a 90 min, substitui os anteriores.
- Conta de agenda: com 100 clientes, falar com todos por mês dá cerca de 5 contatos por dia. Monte a lista do dia e já marque o contato do mês seguinte ao terminar cada um. Manhã para contatos proativos, tarde para pendências.
- Antecipe, não apenas reaja: avisar de um prazo ou de um relatório antes de o cliente perguntar vale mais que resolver depois.
**Pedido de indicação:** peça no fim de um contato positivo, depois de entregar algo, com uma frase simples e um recorte ("alguém que também esteja organizando X"). Nunca peça em momento de queda, reclamação ou pendência. Agradeça sempre e conte o que aconteceu com a indicação, respeitando a privacidade dela.
**Parceiros profissionais** (contador, advogado, corretor de seguros, gerente de banco): quem mais indica para clientes de maior patrimônio é quem já tem a confiança deles. Trate o parceiro como um prospect: ofereça educação (diversificação, planejamento, previdência) e um encontro de conhecimento, sem pedir indicação no primeiro contato. Leva tempo (a referência do mercado fala em cerca de 18 meses para formar uma fonte): marque o próximo contato e o evento educativo do trimestre.
**Quando o cliente diz "meu amigo ganhou mais":** o retorno de cada um depende do perfil e do risco que aceita; o mais alto costuma vir com mais oscilação. Responda sem comparar nem prometer.

## Modelo de saída (nesta ordem)
**Resumo** — 2 linhas: o ritmo, o pedido ou o parceiro, e o próximo passo com data.
**Peças** (cada uma separada, sem comentário dentro): `agenda` (lista dos contatos da semana por grupo, com data e objetivo), `roteiro-contato` (as 4 partes com frases prontas), `whatsapp` (convite ou lembrete, até 4 linhas), `pedido-indicacao` (a frase e o agradecimento), `email` (primeiro contato com parceiro profissional), `nota-crm` (o que foi combinado e quando é o próximo contato). Só as pedidas.
**Conferir** — o que o assessor valida antes de usar.

## Exemplo
Bom (indicação): "Marta, fico feliz que você tenha curtido o resumo. Se conhecer alguém que também queira organizar o que sobra no fim do mês, pode me apresentar? Eu cuido do mesmo jeito." Ruim: "Indica 3 amigos ricos para eu bater a meta." (pressão e foco no assessor).

## Limites
Sem promessa ou projeção de retorno, sem presente ou benefício que possa configurar vantagem indevida (`[CONFERIR]` com o compliance), sem dado de cliente em mensagem a terceiros, sem pressão. Nada é enviado nem gravado por você.
