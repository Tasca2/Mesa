---
name: comparador-de-carteira
description: Compara duas carteiras lado a lado (a atual do cliente com a de outra instituição, com a carteira modelo do escritório ou com um cenário em estudo; ou duas datas da mesma carteira). Mostra composição, concentração, liquidez, vencimentos e custos informados, sem dizer qual é melhor, sem ordem de compra ou venda e sem promessa de retorno.
---

# Comparador de carteira

## Objetivo
Dar ao cliente e ao assessor uma leitura clara das diferenças entre duas carteiras, para a conversa sobre o que mudar ou manter. O comparador descreve; quem decide é o cliente, com base no objetivo, no horizonte e no perfil dele.

## Entradas
- **Carteira A e carteira B**, cada uma por ativo ou por classe, com valor e data-base. Pode vir por colagem, planilha ou relatório do CaptaMais Consolidador. As duas na **mesma data-base**; se forem de datas diferentes, avise e marque `[CONFERIR]`.
- **O que se compara**: atual × modelo do escritório · atual × cenário em estudo · atual × carteira de outra instituição · a mesma carteira em duas datas.
- Custos, taxas e prazos de resgate, **só os que o assessor informar**. Sem eles, a comparação de custo fica como lacuna, não como estimativa.
- Para ativos listados, `analise_ativo` quando o pedido disser que o CaptaMais está conectado. Perfil do assessor (`mesa_perfil`). Rode `consultar_cofre` (tema `alocação de ativos diversificação risco liquidez`); sem cofre, siga o método.
- Falta algo essencial? Pergunte **uma** coisa e entregue o resto com `[CONFERIR]`.

## Método
1. **Confira os totais** de cada carteira; soma que não fecha leva `[CONFERIR]`. Cliente sem nome e sem CPF: use apelido.
2. **Composição**: por classe (renda fixa pós, pré e inflação; ações; fundos imobiliários; multimercado; exterior; outros), em R$ e em %, A × B × diferença em pontos percentuais.
3. **Concentração**: as 5 maiores posições de cada uma, peso do maior emissor e da maior instituição. Risco de crédito em renda fixa privada só descrito (emissor, prazo, existência de garantia como o ativo informa).
4. **Liquidez e prazo**: quanto pode ser resgatado em D+0, D+30 e depois; vencimentos dos próximos 12 meses.
5. **Custos informados**: taxas e custos de cada uma, quando o assessor passou; diferença anual em R$ só se os dois lados estiverem completos.
6. **Diferenças que importam à conversa**: 3 a 5 observações em frase simples ("a carteira B tem 18 pontos a mais em renda variável e o dobro da oscilação histórica"). Sempre como fato, nunca como "A é melhor" ou "B é melhor".
7. **Perguntas para o cliente**: 3 perguntas ligadas ao objetivo dele (o horizonte mudou? precisa de liquidez? como reagiria a uma queda do tamanho da maior já vista na carteira?).
8. **Comparação de retorno passado**, só se o assessor passou os dois históricos no mesmo período e com a mesma base: mostre período, fonte e o aviso "rentabilidade passada não garante resultado futuro". Sem projeção.

**Cenário em estudo:** é uma hipótese para a conversa, não uma recomendação. Rotule assim e marque `[CONFERIR]` com o compliance quando virar sugestão ao cliente. Não calcule imposto nem custo de transação de uma mudança: diga que isso é para conferir com o contador e a mesa.

## Modelo de saída (nesta ordem)
**Resumo** — 3 linhas: a maior diferença de composição, a de concentração e a de liquidez.
**Peças** (cada uma separada, sem comentário dentro): `relatorio` (tabelas A × B com fonte e data-base, e as observações), `roteiro-reuniao` (leitura simples + 3 perguntas, para até 30 minutos), `whatsapp` (convite para a conversa, até 4 linhas, sem alarmar), `nota-crm`.
**Conferir** — datas-base, totais, custos e qualquer dado sem fonte.

## Exemplo
Bom (observação): "A carteira atual concentra 42% no maior banco emissor; a carteira modelo limita cada emissor a 20%. Vale conversar sobre o quanto essa concentração faz sentido para você." Ruim: "A sua carteira está ruim, a modelo rende mais." (juízo, promessa e comparação sem base).

## Limites
Descritivo, nunca prescritivo: nenhuma ordem de compra, venda ou troca, nenhuma indicação de ativo, nenhuma projeção, nenhum cálculo de imposto ou de custo de transação. Carteira de outra instituição só com autorização do cliente e sem nomear a concorrente de forma pejorativa. Regra de adequação ao perfil (suitability): `consultar_cofre` (tema `legislacao`) ou `[CONFERIR]` com o compliance. Nada é enviado nem gravado por você.
