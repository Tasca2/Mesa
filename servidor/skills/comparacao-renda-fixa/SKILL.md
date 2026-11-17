---
name: comparacao-renda-fixa
description: Compara condições contratuais, impostos, custos, liquidez e riscos de títulos de renda fixa na mesma base. Calcula equivalências com convenções explícitas e dados suficientes, sem prever indexadores nem escolher aplicação para uma pessoa.
---

# Comparação de renda fixa

Revisão: 22/09/2026.

Compare os termos dos títulos e o mecanismo de remuneração. Uma taxa maior não torna riscos, prazos ou garantias equivalentes.

## Entradas proporcionais à pergunta

Extraia de cada oferta emissor, instrumento, indexador, taxa e unidade, data de cotação, datas de aplicação/vencimento, fluxos intermediários, carência, saída antecipada e custos. Pergunte apenas pelos campos que impedem a comparação pedida. Sem prazo, explique a dependência e peça a data relevante; não fabrique quatro resultados para faixas inteiras de prazo.

Para uma comparação de taxas, trabalhe por unidade de principal, sem pedir patrimônio pessoal. Para cobertura de garantia, agregue os saldos informados por instituição/conglomerado, com rótulos; se esse contexto faltar, informe elegibilidade do instrumento e deixe a cobertura individual inconclusiva.

## Regras que precisam de consulta atual

Confira imposto, eventual isenção, IOF (imposto sobre operações financeiras), custos, elegibilidade e limites de garantia nas fontes primárias. Considere tipo de titular e residência fiscal, instrumento, emissão, aquisição e data do fato tributável conforme a regra aplicável. Guarde link, dispositivo, vigência e data da consulta.

Fontes de partida:
- [Legislação federal consolidada](https://www4.planalto.gov.br/legislacao/portal-legis/busca-avancada) e [Receita Federal](https://www.gov.br/receitafederal/pt-br): tratamento tributário. Localize a norma do instrumento e suas alterações; medida provisória ou proposta não é regra permanente.
- [FGC, produtos e limites](https://www.fgc.org.br/sobre-garantia-fgc) e [pagamento de garantia](https://fgc.org.br/pagamento-de-garantia): Fundo Garantidor de Créditos, que cobre créditos elegíveis dentro de condições e limites.
- [Tesouro Direto, regras e regulamento](https://tesourodireto.com.br/sobre-o-tesouro/regras-e-regulamento): custos, condições de negociação, horários e particularidades de cada título.

Não trate listas de isentos, prazos mínimos e valores de cobertura desta ou de outra conversa como atualizados por padrão. Sem acesso verificável, entregue comparação bruta e marque líquido/cobertura como pendentes. Isenção não decorre de nome parecido.

## Cálculo

Antes de calcular, leia [references/calculos.md](references/calculos.md). Use [scripts/calculos.py](scripts/calculos.py) para os casos simples que ele cobre; não o adapte silenciosamente a cupons ou tributos mais complexos.

- Declare dias corridos para regra fiscal quando aplicável, dias úteis/calendário para indexação quando contratados, base anual e forma de capitalização. Data de vencimento não é duração em anos inteiros.
- Compare fatores acumulados líquidos no mesmo intervalo. Equivalência anual é derivada desses fatores; dividir uma taxa anual por um menos a alíquota é aproximação, não regra exata universal.
- Percentual do CDI (taxa de referência de operações interbancárias) deve seguir acumulação e arredondamentos contratuais. Multiplicar CDI anual por percentual do CDI não reproduz exatamente a aplicação diária.
- Não use CDI, Selic ou inflação atual como trajetória futura. Sem série realizada ou premissa expressamente fornecida para uma demonstração matemática, deixe a conta simbólica. Demonstração condicional não vira expectativa de recebimento.
- Em títulos com inflação, cupons, amortizações, preços de compra ou venda e custos variáveis, reconcilie cada fluxo nas datas. Não some taxa real e inflação como identidade exata.
- Taxa contratada descreve uma obrigação sujeita às condições e riscos; não garante efetivo pagamento.

## Risco e disponibilidade

Diferencie vencimento, carência, resgate contratual e venda em mercado secundário. A última depende de comprador e preço; negociação de título público também segue regras e pode ter suspensão. Taxa pós-fixada não significa preço estável ou liquidez diária.

Cobertura do FGC não elimina risco do emissor, espera pelo pagamento, incerteza documental ou parcela acima do limite. Não prometa prazo de ressarcimento. Garantia real em um título sem FGC exige análise de prioridade, documentação e recuperação; não é equivalente automático.

## Entrega completa, quando solicitada

1. Base e datas da comparação.
2. Mesma régua: fórmulas, dados, custos e fatores calculáveis.
3. Sensibilidade ao prazo, somente nos prazos definidos e com hipóteses rotuladas.
4. Risco de crédito e situação da garantia.
5. Condições de saída antecipada.
6. Lacunas que alteram a comparação.

Responda primeiro à dúvida solicitada. Não eleja título vencedor nem peça dados pessoais que não sejam necessários ao cálculo.

## Limites

- Não produzir recomendação individual de compra, venda, manutenção ou alocação, nem promessa ou expectativa de retorno, mesmo em cenário hipotético.
- Dado de mercado exige fonte e data visíveis. Ausência é “não informado”; não é zero nem autorização para estimar. Cálculos derivados devem mostrar os dados e a fórmula.
- Usar rótulos genéricos e dados minimizados para pessoas; não solicitar identificadores, contas ou informações confidenciais. Não usar informação relevante ainda não pública nem dados obtidos no trabalho de assessoria. Não expor empregador ou clientes do operador.
- Esta skill prepara análise ou rascunho. Não envia mensagem, publica, movimenta carteira, contrata serviço nem gasta créditos.

## Na Mesa do Assessor (acrescentado)

- **De onde vem cada dado**: taxas e preços do dia, no Tesouro Direto e na ANBIMA; imposto, IOF e limite do FGC, nas fontes primárias com a data da consulta; CDI, Selic e IPCA realizados, se precisar, por `analise_ativo` com tipo `indice` (CDI, IPCA). Não projete indexador.
- **Ordem da entrega**: uma frase · base e datas · tabela comparável · equivalência bruta e líquida · sensibilidade ao prazo informado · risco do emissor e FGC · saída antecipada · imposto conferido · onde desconfiar · pontos de atenção · o que monitorar · lacunas · leitura para o cliente.
- **Onde desconfiar** (encontrado, descartado ou sem dado): taxa muito acima do mercado para o risco; emissor sem histórico ou com crédito em deterioração; liquidez só no vencimento; concentração em um emissor acima do limite do FGC; percentual do CDI comparado com taxa prefixada ou com inflação sem converter na mesma base.
- **O que monitorar**: Selic e IPCA (efeito em cada indexador), crédito do emissor, datas de carência e vencimento, uso do limite do FGC por instituição. Cada item com o valor atual e a data do próximo dado.
- **Leitura para o cliente**: o que muda entre os títulos (prazo, risco, liquidez, imposto), nunca qual escolher. Inclua as 3 perguntas mais difíceis, com a resposta em uma frase.
