---
name: portfolio-rebalance-review
description: Revisa a carteira de um cliente frente à política de investimento dele, mostrando desvios por classe, concentração e liquidez em tabela e resumo. Só análise do desvio: não gera ordem de compra, venda, troca nem cálculo de imposto.
---

# Revisão de carteira (análise de desvio)

## Objetivo
Deixar pronta a conversa de revisão: o desvio medido, o que merece pergunta ao cliente e a mensagem de convite, sem dizer o que comprar ou vender.

## Entradas
- Posição atual (ativo, classe, valor, data-base), por arquivo ou colagem. Se o cliente estiver no CaptaMais Consolidador, aceite o relatório dele.
- **Base de comparação**: a política de investimento do cliente, com as bandas de tolerância. Sem política, entregue só a fotografia (composição e concentração) e avise que não há desvio a medir. Sem banda, pergunte; não invente tolerância.
- Perfil do assessor (`mesa_perfil`). Para ativos listados, `analise_ativo` quando o pedido disser que o CaptaMais está conectado. Rode `consultar_cofre` (tema `alocação de ativos finanças comportamentais perfil de risco`); sem cofre, siga o método.
- Quer comparar com outra carteira, inclusive a carteira modelo do escritório? Isso é a tarefa Comparador de carteira (skill `comparador-de-carteira`); aqui a referência é sempre a política do cliente.

Falta algo essencial? Pergunte **uma** coisa e entregue o resto com `[CONFERIR]`.

## Passos
1. **Fotografia** na data-base: composição por classe, instituição, emissor e liquidez. Confira os totais; soma que não fecha leva `[CONFERIR]`.
2. **Desvio**: classe x alvo x atual x diferença em pontos percentuais, dentro ou fora da banda.
3. **Concentração e liquidez**: maiores posições, prazo de resgate e vencimentos dos próximos 12 meses. Só descritivo.
4. **Performance**, se o assessor mandar histórico: período, base de comparação e fonte.
5. **Leitura simples**: 3 a 5 frases sobre o que a tabela mostra, sem dizer o que fazer.
6. **Perguntas para a conversa**: 3 perguntas que o desvio sugere (o objetivo mudou? o horizonte mudou? precisa de liquidez?). Inclua uma sobre comportamento, pois a decisão de mexer ou não na carteira costuma ser emocional: "como você se sentiu na última queda?", "alguma posição que você tem dificuldade de enxergar com frieza?" (aversão à perda e ancoragem no preço de compra aparecem aqui). Pergunta, nunca diagnóstico do cliente.
7. **Desvio por crescimento do ativo**: se um ativo valorizou e passou a pesar mais que o alvo, descreva o peso atual e o alvo, sem dizer que é hora de vender.
8. **Perfil**: compare a composição com o perfil de risco que consta no cadastro do cliente e aponte, em frase neutra, se há descompasso para o assessor tratar com o compliance (`[CONFERIR]`).

## Modelo de saída (nesta ordem)
**Resumo** — 3 linhas: o maior desvio, a maior concentração, o que vence nos próximos 12 meses.
**Peças** (cada uma separada, sem comentário dentro):
- `relatorio` — fotografia e tabela de desvio, com fonte e data-base.
- `roteiro-reuniao` — leitura simples + 3 perguntas, em tópicos para o assessor conduzir em até 30 minutos.
- `whatsapp` — convite curto para a revisão (até 4 linhas, uma pergunta de resposta fácil, sem alarmar nem prometer).
- `nota-crm` — o que foi medido e o próximo passo, em até 6 linhas.
**Conferir** — dados, banda e data-base que o assessor valida.

**Em PDF** (Resultado PDF): gere a peça `relatorio` com `mesa_documento`, `tipo: "carteira"`, `cliente` (apelido ou iniciais) e `dataBase`. O desvio vai em `grafico` `rosca` com duas séries em % (`Política` e `Atual`, nesta ordem, cada uma somando 100%), `categoria` "Classe", `bandas` com a tolerância de cada classe em pontos percentuais e `fonte` com a data-base: o código desenha as duas roscas e, embaixo, a tabela com a diferença, a banda e a situação (dentro ou fora), então não repita essa tabela no texto. Sem banda informada, mande o gráfico sem `bandas` e deixe a banda no Conferir. Concentração e liquidez seguem em tabelas curtas no texto. Roteiro, WhatsApp, nota de CRM e Conferir ficam no chat, fora do PDF.

## Exemplo
Bom (convite): "Oi, Paula! Fiz a revisão trimestral da sua carteira e tem dois pontos que quero conversar com você: a parte em renda variável e o que vence ano que vem. Consegue 20 minutos na quinta ou na sexta?"
Ruim: "Sua carteira está desbalanceada, precisamos vender renda variável urgente." (ordem de venda e pressão).

## Limites
Nenhuma ordem de compra, venda ou troca; nenhuma sugestão de ativo; nenhum cálculo de imposto ou de custo de transação. Regra de enquadramento ou suitability: `consultar_cofre` (tema `legislacao`) ou `[CONFERIR]` com o compliance.
