---
name: resumo-de-fato-relevante
description: Resume comunicado oficial de companhia e relaciona seus fatos a uma tese fornecida, distinguindo impacto divulgado e interpretação. Use com fato relevante, comunicado ao mercado ou aviso aos acionistas; exige conteúdo integral para uma conclusão documental.
---

# Resumo de fato relevante

Revisão: 22/09/2026.

Explique o que a companhia comunicou e o que isso permite revisar, sem antecipar reação de preço ou orientar operação.

## Documento integral antes da conclusão

Use texto integral anexado, colado ou obtido na página oficial da companhia ou do regulador. Se o usuário fornecer só notícia, link inacessível ou trecho, localize o original quando pesquisa estiver no pedido ou peça o documento específico. Não reconstrua conteúdo de memória.

Documento truncado ou ilegível em pedido de resumo do comunicado: identifique o ponto do corte e peça o texto integral antes de resumir. Não preencha as cinco seções, nem avalie efeito sobre a tese ou urgência. Essa condição específica prevalece sobre a orientação geral de avançar com dados parciais. Se o pedido disser para interromper diante de um corte, cumpra essa interrupção.

Uma leitura parcial só cabe quando o usuário pedir explicitamente a análise do trecho disponível, delimitada a esse trecho e sem conclusão sobre o comunicado completo. Não substitua por iniciativa própria um resumo integral por um parcial. A parte faltante pode conter condições ou ressalvas que mudem a interpretação.

Identifique companhia, título, data/hora, versão, anexos e eventual retificação. Uma retificação não apaga a necessidade de explicar o que mudou.

## Leitura

1. Classifique a natureza do evento: operação, financiamento, gestão, resultado, evento societário, judicial, regulatório ou outro.
2. Extraia números com unidade, moeda, período e condições. Cálculo derivado deve vir separado do número textual e com fórmula.
3. Distinga intenção, aprovação, assinatura, condição precedente e conclusão efetiva. Não trate anúncio como fato consumado.
4. Impacto financeiro não quantificado recebe “a companhia não quantificou”; não estime.
5. Relacione à tese se fornecida. Sem tese, indique quais premissas uma análise poderia revisar, sem afirmar que “mudou a tese”.

## Entrega completa, quando solicitada

O padrão de resumo completo é cinco seções, em até 25 linhas, salvo profundidade diferente pedida pelo usuário:

1. **O que foi comunicado:** frase factual.
2. **Números do documento:** valores, unidades e períodos, ou ausência.
3. **Efeito sobre a tese:** relação com a tese recebida ou elementos a revisar.
4. **Urgência de revisão:** revisar hoje, acompanhar nos próximos dias ou registrar para consulta, com motivo documental.
5. **Verificar antes de concluir:** condição, documento ou informação ainda pendente e fonte.

Urgência se refere a ler, conferir e revisar a análise, nunca a comprar, vender ou “agir no mercado”. “Revisar hoje” exige prazo/evento documentado; não invente urgência. Pedido de uma frase pode receber uma frase com fonte/data e limitação relevante.

Mantenha valores na moeda original, salvo conversão solicitada e documentada.

## Limites

- Não produzir recomendação individual de compra, venda, manutenção ou alocação, nem promessa ou expectativa de retorno, mesmo em cenário hipotético.
- Dado de mercado exige fonte e data visíveis. Ausência é “não informado”; não é zero nem autorização para estimar. Cálculos derivados devem mostrar os dados e a fórmula.
- Usar rótulos genéricos e dados minimizados para pessoas; não solicitar identificadores, contas ou informações confidenciais. Não usar informação relevante ainda não pública nem dados obtidos no trabalho de assessoria. Não expor empregador ou clientes do operador.
- Esta skill prepara análise ou rascunho. Não envia mensagem, publica, movimenta carteira, contrata serviço nem gasta créditos.

## Na Mesa do Assessor (acrescentado)

- **Documento**: o texto colado pelo assessor é o documento. Com só o link ou só o nome da empresa, tente abrir o original; se o texto integral não abrir (o PDF do sistema Rad da CVM pode chegar ilegível pela leitura de página), não resuma por notícia: diga isso na primeira linha, entregue a ficha do que achou e peça o texto colado.
- **Formato**: dentro da Mesa vale a lista do pedido (ficha, o que foi divulgado, etapas, tamanho, o que muda, casas de research, sequência, cliente, monitorar e conferir), no lugar do resumo em cinco seções desta skill.
- **Trecho ao lado**: todo número da tabela "O que foi divulgado" tem o trecho do documento ao lado.
- **Tamanho**: o número do comunicado é sempre comparado com um número da empresa (receita, lucro, dívida líquida ou valor de mercado), com data-base e a conta. Os números da empresa vêm de `analise_ativo` com `pesquisa=true`.
- **Casas de research**: é opinião delas. Entra com a data e marcada como anterior ou posterior ao comunicado.
