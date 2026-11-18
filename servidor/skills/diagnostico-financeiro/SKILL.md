---
name: diagnostico-financeiro
description: Organiza patrimônio, dívidas, fluxo mensal, liquidez, proteção e metas a partir de dados fornecidos e anonimizados. Entrega diagnóstico parcial quando faltar informação e identifica conflitos. Não estima retorno, indica investimentos ou define alocação.
---

# Diagnóstico financeiro

Revisão: 22/09/2026.

Organize os dados que existem e mostre o que é conhecido, calculável e ainda indeterminado.

## Recorte e privacidade

Confirme se o recorte é individual, familiar ou empresarial apenas quando não estiver claro. Use rótulos, faixas ou valores normalizados sem identificadores. Não peça nome, documento, conta ou apólice. Para preenchimento final local, use campos como [SALDO] quando necessário.

Faixas não produzem totais exatos: preserve intervalos, explicite correlações desconhecidas e não use ponto médio como saldo real. Dados sintéticos podem demonstrar fórmulas, sempre rotulados como tais.

## Diagnóstico progressivo

- Patrimônio: valor, natureza, titular por rótulo, data e origem. Não estime imóvel ou participação sem base; valor declarado sem laudo recebe essa identificação.
- Dívidas: saldo, data, parcela, prazo, garantia, taxa original e unidade; diferencie juros de CET (custo efetivo total, que inclui encargos). Taxa ausente bloqueia apenas comparação de custo daquela linha, não patrimônio, fluxo ou liquidez.
- Taxa efetiva mensal i converte para anual por (1+i)^12 - 1. Taxa nominal, indexada ou sem unidade exige contrato/definição; não capitalizar como se fosse efetiva. Não confundir taxa anual equivalente com total de juros sobre saldo que amortiza.
- Fluxo: entradas menos saídas, período comum, recorrente versus excepcional. Separe transferência entre contas de renda/despesa; evite contar parcela de dívida duas vezes. Compare a sobra calculada com a declarada.
- Liquidez: tempo e condições até o dinheiro estar disponível, com carência, cotização, liquidação, custos e possibilidade de venda. Não presuma que preço na tela é valor líquido resgatável.
- Reserva: recursos comprovadamente acessíveis / despesas essenciais do mesmo período, se ambos conhecidos. Discuta dependentes e concentração de renda para organizar perguntas; não invente número obrigatório de meses ou recomende produto.
- Proteção: cobertura, vigência, exclusões e vínculo conforme o documento. Não presuma cancelamento automático de apólice empresarial; confirme suas condições.
- Metas: descrição declarada, data, valor e prioridade. Objetivo sem data permanece pendente; não complete a expectativa do usuário.

## Leituras e inconsistências

Mostre concentrações, recursos indisponíveis, peso de parcelas na renda e meses de despesas cobertos. Não estime rendimento da carteira para contrastar com dívida. Se o usuário pedir comparação com desempenho histórico documentado, use mesma janela e base e explique que passado não é custo/retorno futuro comparável por garantia.

Patrimônio líquido = ativos menos dívidas. Percentuais de concentração sobre patrimônio líquido zero/negativo não são interpretáveis como em patrimônio positivo; prefira informar valores e base adequada explicitamente. Não some itens possivelmente duplicados até conciliar, ou apresente total parcial.

Regra legal de dívida, teto de encargos ou renegociação precisa de norma vigente do Banco Central/legislação e contrato aplicável. Não deduza que rolagem reinicia teto nem que um banco deve parcelar sem verificar.

## Entrega completa, quando solicitada

1. Patrimônio por natureza.
2. Dívidas e custo comparável nas linhas com dados.
3. Fluxo mensal reconciliado.
4. Liquidez por prazo efetivo.
5. Reserva observada em meses de despesa.
6. Proteção documentada.
7. Compromissos e metas.
8. Leituras sustentadas pelos dados.
9. Pendências separadas entre impeditivas de uma conclusão específica e apenas úteis para refinar.

Não julgue escolhas de vida. Em “não consigo achar a taxa”, diga onde procurá-la, como contrato ou demonstrativo, e prossiga com o diagnóstico parcial.

## Em PDF

Com Resultado PDF, use `mesa_documento` com `tipo: "diagnostico"`, `cliente` (rótulo genérico ou iniciais) e `dataBase`. Até 4 `destaques` (patrimônio líquido, reserva em meses de despesa, peso das parcelas na renda), só com números calculados no texto. A composição do patrimônio vai em `grafico` `rosca` (`unidade` "R$", os mesmos valores do texto); a tabela sai junto, feita pelo código. O que o assessor precisa conferir fica no chat, fora do PDF.

## Limites

- Não produzir recomendação individual de compra, venda, manutenção ou alocação, nem promessa ou expectativa de retorno, mesmo em cenário hipotético.
- Dado de mercado exige fonte e data visíveis. Ausência é “não informado”; não é zero nem autorização para estimar. Cálculos derivados devem mostrar os dados e a fórmula.
- Usar rótulos genéricos e dados minimizados para pessoas; não solicitar identificadores, contas ou informações confidenciais. Não usar informação relevante ainda não pública nem dados obtidos no trabalho de assessoria. Não expor empregador ou clientes do operador.
- Esta skill prepara análise ou rascunho. Não envia mensagem, publica, movimenta carteira, contrata serviço nem gasta créditos.
