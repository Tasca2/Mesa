---
name: comparativo-setorial
description: Compara empresas por indicadores adequados ao setor e evidencia diferenças de período, moeda e definição. Use para análise lado a lado e seleção fundamentada de pares; não elege investimento vencedor nem recomenda alocação.
---

# Comparativo setorial

Revisão: 22/09/2026.

Torne comparáveis as informações antes de interpretar diferenças. A pergunta do usuário determina as métricas e a profundidade.

## Escopo e evidência

Identifique empresas, período e aspecto que se quer comparar. Leia os documentos disponíveis; busque fontes oficiais quando pesquisa ou atualização fizer parte do pedido. Sem documentos suficientes, prepare a comparação parcial e peça somente as fontes que faltam.

Verifique modelo de receita, país, norma contábil, escala, consolidação, moeda, exercício fiscal e eventos societários. Setor nominal igual não torna modelos iguais. Empresas de setores diferentes podem ter uma comparação transversal, com a limitação explícita e sem misturar razões incompatíveis.

## Escolha de indicadores

Use critérios já escolhidos pelo usuário. Se não houver, selecione um conjunto pequeno pertinente à pergunta e declare a seleção; não crie corte numérico nem nota geral.

| Negócio | Indicadores a considerar, conforme dados e pergunta |
|---|---|
| Industrial, varejo e serviços não financeiros | Receita, crescimento, margens, geração de caixa, capital de giro, investimento, dívida e retorno sobre capital |
| Bancos | Margem financeira, qualidade do crédito, inadimplência por definição, provisões, eficiência, capital regulatório e retorno sobre patrimônio |
| Seguradoras | Sinistralidade, despesas, índice combinado quando aplicável, reservas, solvência e retorno sobre patrimônio |
| Concessões e utilidades | Base regulatória, volumes, revisões tarifárias, investimentos, dívida e caixa por vencimento |
| Incorporadoras | Vendas, distratos, estoque, recebíveis, geração de caixa e reconhecimento de receita |
| Negócios pré-lucro | Receita, retenção ou unidades econômicas divulgadas, caixa disponível e consumo de caixa; múltiplo de lucro pode não ser significativo |

EBITDA (resultado antes de juros, tributos, depreciação e amortização) e dívida líquida/EBITDA não são régua universal. Explique cada termo usado e a definição específica da fonte.

## Comparabilidade

- Mesma janela e conceito antes de ordenar números. Últimos doze meses podem ser reconstruídos apenas com trimestres completos e não sobrepostos, mostrando a conta.
- Não anualize trimestre sazonal para preencher exercício. Resultado ajustado deve ser reconciliado com o contábil quando houver abertura.
- Preserve moeda original; conversão solicitada exige taxa, data e método adequados a estoque ou fluxo. Diferença cambial não é crescimento operacional.
- Indique fonte, período e unidade em cada tabela ou cabeçalho comum inequívoco. Dado ausente e indicador não aplicável são distintos.
- Explique a divergência numérica pelo negócio apenas quando a evidência sustentar a relação; causalidade não comprovada fica como hipótese.

## Entrega completa, quando solicitada

1. Escopo e comparabilidade.
2. Ficha breve de cada empresa.
3. Tabela de métricas escolhidas com definições.
4. Diferenças que respondem à pergunta.
5. Limitações da comparação.
6. Lacunas e verificações necessárias.

Pode apontar qual empresa tem valor maior/menor em determinada métrica. Isso não é vencedora geral. Não faça índice composto com pesos arbitrários.

## Limites

- Não produzir recomendação individual de compra, venda, manutenção ou alocação, nem promessa ou expectativa de retorno, mesmo em cenário hipotético.
- Dado de mercado exige fonte e data visíveis. Ausência é “não informado”; não é zero nem autorização para estimar. Cálculos derivados devem mostrar os dados e a fórmula.
- Usar rótulos genéricos e dados minimizados para pessoas; não solicitar identificadores, contas ou informações confidenciais. Não usar informação relevante ainda não pública nem dados obtidos no trabalho de assessoria. Não expor empregador ou clientes do operador.
- Esta skill prepara análise ou rascunho. Não envia mensagem, publica, movimenta carteira, contrata serviço nem gasta créditos.

## Na Mesa do Assessor (acrescentado)

- **De onde vem cada dado**: com o CaptaMais conectado, chame `analise_ativo` uma vez por empresa (com `pesquisa: true`), para a rentabilidade no mesmo período e os múltiplos e balanços na mesma base. Os indicadores do negócio vêm dos documentos oficiais de cada companhia. As consultas têm limite: se o pedido trouxer só o setor, proponha de 3 a 4 empresas e confirme com o assessor antes de consultar.
- **Mesma base ou nada**: se uma empresa não tiver o dado no mesmo período e definição, a célula fica "não informado" com o motivo. Não complete com período diferente.
- **Ordem da entrega**: uma frase · escopo e comparabilidade · tabela lado a lado (indicador, definição, período, fonte) · múltiplos lado a lado · rentabilidade contra o IBOV · último balanço de cada uma · casas de research · ponto forte e fraco de cada uma · onde desconfiar · diferenças de período, moeda e definição · leitura das diferenças · o que monitorar no setor · lacunas · leitura para o cliente.
- **Múltiplos lado a lado**: P/L, P/VP, EV/EBITDA e dividend yield com a data da cotação; denominador negativo é não significativo. Mostre a diferença, nunca chame uma de barata e outra de cara.
- **Último balanço**: variação contra o trimestre anterior e contra o mesmo trimestre do ano passado, na mesma base para todas.
- **Onde desconfiar em cada empresa**: lucro que não vira caixa, dívida curta ou em moeda estrangeira, item não recorrente, queda de margem com receita subindo. Diga encontrado, descartado ou sem dado.
- **O que monitorar no setor**: de 4 a 6 variáveis (as do setor, como juros, câmbio, preço de commodity, tarifa ou inadimplência) com o valor atual, o que mudaria a leitura e a data do próximo dado.
- **Leitura para o cliente**: diga em que cada empresa difere ("uma cresce mais, a outra deve menos"), nunca qual é a melhor. Se o cliente perguntar "qual você escolheria?", a resposta pronta devolve ao objetivo e à política de investimento dele.
