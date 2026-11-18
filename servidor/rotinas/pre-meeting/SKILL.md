---
name: pre-meeting
description: Prepara a reunião com cliente: contexto, pontos de atenção, roteiro minuto a minuto e perguntas de descoberta (SPIN), a partir da carteira e do histórico que o assessor informar. Use antes de reunião com quem já é cliente; não recomenda ativos nem promete retorno.
---

# Pré-reunião

## Objetivo
Chegar à reunião com um roteiro que cabe no tempo, perguntas que descobrem a necessidade e o que levar ou pedir, tudo apoiado no que o assessor realmente sabe do cliente.

## Entradas
- Cliente (apelido), data/hora e há quanto tempo é cliente.
- Resumo da carteira ou da situação.
- Histórico das últimas conversas e o que mudou desde então.
- Foco da reunião (revisão, aporte, resgate/liquidez, sucessão). Perfil do assessor via `mesa_perfil`; `consultar_cofre` com o tema `reunião SPIN descoberta` se houver.

**Dado que não veio**: não invente. Liste em "Pedir antes da reunião" e use `[CONFERIR]`. Cliente sem nenhum dado = primeira reunião: diga em uma linha que a tarefa Primeira reunião monta o roteiro e a apresentação, e entregue só a lista do que pedir.

## Passos
0. **Objetivo e avanço** (2 linhas, antes de tudo): o que esta reunião precisa resolver e qual é o avanço mínimo aceitável, isto é, o que precisa sair combinado com data (documento enviado, decisão tomada, próxima reunião marcada). Reunião que termina em "vamos nos falando" não avançou. O roteiro inteiro serve a esse avanço.
1. **Contexto em até 5 linhas**: quem é, o que já foi combinado, o que mudou. Só fatos informados.
2. **Pontos de atenção** (3 a 5): o que merece cuidado nesta conversa, com o motivo. Desvios da carteira só descritos, sem ordem de compra ou venda.
3. **Roteiro com tempo por bloco** para a duração informada (padrão 45 min): abertura e rapport (5) · retomada do combinado (5) · descoberta (15) · pontos do foco (15) · próximos passos (5). Ajuste os minutos à duração.
4. **Perguntas SPIN**: 2 de situação (só o que ainda não sabe), 2 de problema, 2 de implicação, 2 de necessidade de solução, ligadas ao foco e ao histórico. Nada de pergunta cuja resposta já está nos dados.
5. **Levar e pedir**: o que levar impresso/aberto e o que pedir ao cliente (documentos, decisões).
6. **Possíveis objeções** (1 ou 2) e a pergunta de resposta de cada uma.
7. **Fechamento da reunião**: a frase com que o assessor propõe o avanço do passo 0 e a alternativa menor se o cliente hesitar (ex.: em vez da decisão hoje, o envio do extrato até uma data).

## Modelo de saída (nesta ordem)
**Objetivo e avanço** · **Contexto** · **Pontos de atenção** · `roteiro-reuniao` (tabela: minuto · bloco · o que fazer/dizer) · **Perguntas de descoberta** (agrupadas por SPIN) · **Levar e pedir** · **Objeções prováveis** · **Fechamento** · **Conferir**.
O `roteiro-reuniao` é a peça principal: completa e autocontida, para o assessor copiar ou imprimir. Se o assessor quiser, ofereça uma `nota-crm` curta com o registro da preparação.

## Exemplo (trecho)
Foco: revisão de carteira; 55% renda fixa, 25% ações, 10% FIIs, 10% multimercado; última conversa: reclamou dos multimercados, quer pensar em imóvel.
- Pontos de atenção: R$ 300 mil parados na conta (informado); frustração com o multimercado; decisão do imóvel pode competir com novos aportes.
- 00–05 Abertura: "Como foi a venda da empresa para você?" (rapport + situação).
- Implicação: "Se esse dinheiro continuar parado mais seis meses, o que isso muda no plano do imóvel?"

## Limites
- Não recomenda compra, venda nem alocação; não promete retorno; números com fonte e data.
- Sem nome nem CPF de cliente; use apelido.
- Esta rotina prepara; não envia nada ao cliente.
