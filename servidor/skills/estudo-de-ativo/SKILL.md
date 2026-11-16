---
name: estudo-de-ativo
description: Monta estudo ou apresentação de um ativo (ação, FII, ETF, fundo) para o assessor usar com cliente, partindo dos dados da Análise de Ativo do CaptaMais (histórico, rentabilidade, comparação com índice) e completando com macro, fato relevante e o método. Entrega um resumo de uma página, um estudo em PDF ou os slides, sempre descritivo e com fonte e data; sem recomendação.
---

# Estudo e apresentação de ativo

## Objetivo
Dar ao assessor material que ele leva ao cliente: números certos, com fonte e data, explicados em linguagem simples, no formato que ele escolheu. Dados primeiro, texto depois.

## Entradas
- Ativo(s) (até 3): ticker, nome ou CNPJ do fundo.
- Perfil do cliente-alvo (sem nome), período a destacar e **formato**: resumo de uma página · estudo em PDF · apresentação (até 8 slides).
- Perfil do assessor (`mesa_perfil`) e a atuação (define a identificação e os avisos).

## Passos
1. **Dados**: chame `analise_ativo` para cada ativo. Use os números **exatamente** como vierem, com data-base e fonte. Se voltar `SEM_CONEXAO`/`SEM_ANALISE` ou o ativo não for achado, diga em uma frase, peça que o assessor cole os dados da tela (marque "fonte: informado pelo assessor") e **entregue mesmo assim** a estrutura com `[CONFERIR]` onde falta número. Nunca complete número de memória.
2. **Contexto**, só se agregar (carregue com `carregar_metodo`): `macro-brasil` (Selic, IPCA, câmbio); `resumo-de-fato-relevante` se houve comunicado recente; `analise-fii`, `fundamentalista-metodo` ou `comparativo-setorial` conforme o ativo.
3. **Escreva para o cliente do perfil informado**: conservador = foco em oscilação e liquidez; arrojado = foco em retorno e risco assumido; sem jargão, termo técnico explicado na primeira vez.
4. **Compliance**: identificação do profissional conforme a atuação, aviso de que desempenho passado não garante o futuro, fonte e data-base em todo número. Regra específica: `consultar_cofre` (tema `legislacao`) ou `[CONFERIR]`.

## Modelo de saída
**Resumo de uma página** (`relatorio`): 
1. *Em uma frase*: o que é o ativo e por que está na conversa.
2. *Números do período*: tabela (retorno 12 e 24 meses, ano, índice de referência, pior mês) — cada linha com data-base.
3. *Risco observado*: oscilação, concentração, liquidez (só o que há dado).
4. *Contexto de mercado*: 2 a 3 linhas, com fonte e data.
5. *O que observar*: eventos e datas, sem previsão.
6. *O que este material não diz*: não é recomendação; desempenho passado não garante o futuro.
7. *Fontes*: CaptaMais (data-base) e demais.

**Estudo em PDF**: a mesma estrutura, com os números em tabela e o comparativo com o índice; gere com `mesa_documento` e informe o caminho.

**Apresentação** (`slides`, até 8): cada slide tem um título-conclusão (a frase que o cliente deve levar) e 3 linhas no máximo. Sequência: 1 capa · 2 o ativo · 3 retorno acumulado · 4 tabela mensal · 5 risco · 6 contexto · 7 o que observar · 8 avisos e fontes. Entregue o texto de cada slide marcado "Slide N — título" e, se pedido PDF, gere com `mesa_documento`.

Em todos: ao final, uma mensagem curta de envio ao cliente (`whatsapp`, sem `**`) e a linha "Fontes: CaptaMais (data-base), <demais>".

## Exemplo (trecho do resumo)
"HGLG11 — fundo imobiliário de galpões logísticos. Retorno em 12 meses: X% contra Y% do IFIX (fonte: CaptaMais, data-base DD/MM/AAAA). Oscilação do período: ... Este material descreve o ativo e não é recomendação."

## Limites
- Nenhuma indicação de compra ou venda, preço-alvo próprio ou projeção de retorno.
- Número sem fonte e data não entra; cálculo derivado mostra os dados e a fórmula.
- Não envia nada ao cliente.
