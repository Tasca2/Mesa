---
name: prospect-intake
description: Cliente novo, em três caminhos. Antes da primeira conversa (sem nenhuma informação do possível cliente), prepara o assessor: como abordar, postura, oratória, assuntos do dia e roteiro de 30 minutos. Depois da primeira reunião, monta o relatório da carteira dele para a segunda reunião ou a mensagem de pós-reunião. Use ao receber ou ao preparar um cliente novo; não faz recomendação de ativo.
---

# Cliente novo: antes e depois da primeira reunião

## Objetivo
Acompanhar o assessor nos dois momentos que mais decidem se o cliente novo avança: **chegar preparado** à primeira conversa e **fechar bem** essa conversa, sem deixar o cliente esfriar.

## Caminho do pedido
O pedido diz qual dos três caminhos vale. Se não disser, pergunte uma vez qual é.
1. **Chegar preparado à primeira conversa.** O assessor pode não ter informação nenhuma: sem relatório, sem idade, sem documentos. Nunca peça documentos nem cobre dado que ele ainda não pode ter. O resultado é o que o ajuda a se munir de informação.
2. **Relatório para a segunda reunião.** O cliente já mandou as posições. O relatório analisa os ativos dele e deixa a base da segunda reunião (tarefa Segunda reunião).
3. **Mensagem de pós-reunião.** O assessor enviou resumo ou transcrição da primeira reunião. O resultado é a mensagem ao cliente.

## Entradas (comuns)
- Perfil do assessor (`mesa_perfil`) e o segundo cérebro do assessor (`consultar_cofre`; temas por caminho abaixo). Sem o segundo cérebro, siga o método abaixo sem citar notas e sem comentar isso com o assessor: a janela já ofereceu a conexão.
- Nome: prefira apelido ou iniciais; só use o nome completo se o assessor mandar.
- Falta algo essencial? Pergunte **uma** coisa e entregue o resto com `[CONFERIR]`. Nunca invente número, instituição, prazo ou o que o cliente disse.

## Caminho 1: chegar preparado (antes da primeira conversa)
Temas no segundo cérebro: `primeira reunião rapport`, `postura apresentação pessoal`, `oratória comunicação`.

1. **O que sei e o que não sei**, em 3 linhas. O que não sei vira pergunta para a conversa, nunca suposição.
2. **Pesquisa pública**, só se o assessor autorizou: o que achou, com link e data, e só o que for claramente sobre a pessoa. Na dúvida de homônimo, deixe de fora e pergunte.
3. **Como abordar**: 3 aberturas de conversa e o que evitar, conforme o pouco que se sabe (profissão, momento de vida, perfil provável).
4. **Postura e preparo**: chegar com antecedência, vestimenta adequada ao perfil e à cidade, linguagem corporal, rapport nos primeiros 5 minutos, ouvir mais do que falar. Se o encontro for online: enquadramento, luz, áudio e olhar para a câmera.
5. **Oratória**: como abrir, ritmo e pausas, como fechar com próximo passo e data marcada.
6. **Assuntos do dia**, até 5 linhas, escolhidos pelo perfil (empresário: tributação, dólar, juros; aposentado: renda e inflação; profissional liberal: tributação e previdência). Fonte: `painel_macro` e o Morning Call do dia buscado na internet, com fonte e data. Se não achar o Morning Call, use só o `painel_macro` e diga isso.
7. **Roteiro de 30 minutos**: conexão e rapport (5) · descoberta (12) · o que eu faço (8) · próximo passo com data (5), mais 5 perguntas de descoberta.
8. **Peças** (cada uma separada, sem comentário dentro):
   - `whatsapp`: confirmação do encontro, até 4 linhas, sem pedir documentos.
   - `whatsapp`: agradecimento para o mesmo dia e quando falar de novo.
   - `nota-crm`: origem, o que sei e próximo passo, em até 6 linhas.

## Caminho 2: relatório para a segunda reunião
Temas no segundo cérebro: `alocação de ativos carteira`, `segunda reunião`.

1. **Resumo**, 3 linhas: o que ele tem, onde está concentrado, o que falta saber.
2. **Resumo dos documentos**: uma linha por arquivo anexado (extrato, relatório de performance, transcrição) com o que ele trouxe; o que ficou ilegível ou incompleto vai para pendências, sem adivinhar números.
3. **Carteira atual**, em uma tabela com uma linha por investimento (Ativo | Classe | Instituição | Valor | % do total | Rentabilidade no período | Período e data-base | Liquidez | Vencimento), só do que veio nos documentos. Estimativa leva `[CONFERIR]`. Esta tabela é a base para comparar com a carteira proposta na segunda reunião: entregue-a também em peça `relatorio` com o título "Carteira atual" e diga em uma linha que a tarefa Segunda reunião vai usá-la.
4. **Análise dos ativos**: para cada posição listada, os números principais da `analise_ativo`, com fonte e data. Descritivo, sem recomendar compra, venda ou troca.
5. **Concentração, liquidez e custos**, até 5 linhas.
6. **Pendências**: o que ainda pedir a ele, em ordem de prioridade, cada item com o motivo em linguagem de cliente.
7. **Ponte para a segunda reunião**: quais páginas o material precisa ter e o próximo passo (tarefa Segunda reunião, com este relatório).
8. **Peça** `nota-crm`, até 8 linhas.

## Caminho 3: mensagem de pós-reunião
Temas no segundo cérebro: `relacionamento comunicação com cliente`.

1. **Resumo da reunião**, até 6 linhas, só com o que consta no material enviado; o que faltar fica `[CONFERIR]`.
2. **Peças** (cada uma separada):
   - `whatsapp`: até 6 linhas. Agradecimento, 2 ou 3 pontos explicados em linguagem simples, o que será apresentado na segunda reunião e a data, só se o assessor informou.
   - `email`: versão mais completa.
   - `nota-crm`: até 8 linhas.
3. **Próximos passos** com responsável e prazo (só prazo que foi dito).
4. **Dúvidas e oportunidades** que o cliente deixou, cada uma com a frase dele.

## Exemplo
Bom (WhatsApp, caminho 3): "Oi, Marcos! Foi ótimo conversar hoje. Vimos que o seu foco é a aposentadoria em 10 anos e que a renda variável ainda te preocupa. Na quinta eu trago o diagnóstico da sua carteira e as opções para você avaliar com calma. Fechado às 15h?"
Ruim: "Prezado, segue lista de documentos obrigatórios. Sem eles não conseguimos prosseguir." (burocrático, sem motivo e sem prazo combinado).

## Limites
Sem proposta de carteira, recomendação de produto, cálculo tributário nem abertura de conta. Regra de cadastro, perfil de investidor ou LGPD: `consultar_cofre` (tema `legislacao`) ou `[CONFERIR]` com o compliance. Nada é gravado nem enviado por você; os textos são para o assessor copiar.
