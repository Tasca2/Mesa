---
name: fundamentalista-metodo
description: Analisa uma empresa por critérios financeiros declarados, registra evidências e lacunas e ajuda o usuário a explicitar seu método. Use para leitura de fundamentos ou avaliação de uma companhia; não para recomendar investimentos, comparar pares ou filtrar uma lista.
---

# Análise fundamentalista com método declarado

Revisão: 22/09/2026.

Avalie qualidade do negócio, solidez e execução dos critérios escolhidos antes de ver o resultado. Um critério aprovado significa apenas atendimento àquela régua.

## Definir a base e o método

Identifique empresa, setor, períodos e objetivo. Use documentos anexados; se o pedido incluir pesquisa ou atualização, consulte demonstrações, divulgação de resultados e relações com investidores oficiais. Não substitua documento por memória. Sem fonte, avance no desenho do método e indique o que falta para aplicá-lo.

Se o usuário já possui método, preserve indicadores, sinais de comparação, faixas e ordem. Se não possui, converse sobre a pergunta central: capacidade de pagar dívidas, consistência de caixa, qualidade operacional ou outra. Explique dois ou três critérios pertinentes e peça que ele escolha/adote as faixas quando elas forem necessárias a um placar. Não exija edição do arquivo, nem atribua números sugeridos à autoria dele.

Sem faixas adotadas, faça leitura descritiva e apresente uma proposta de critérios sem aprovar/reprovar. Não imponha custo de capital a análise que não o utiliza. Quando a comparação depender dele, solicite taxa, moeda, base e origem; sem isso, aquela comparação fica pendente.

Os antigos exemplos de dívida de 3 ou 4 vezes o resultado operacional, retorno acima do custo de capital e conversão de caixa de 70% não são padrões universais. Não os aplique automaticamente. Instituições financeiras exigem métricas de capital e crédito, não dívida líquida sobre EBITDA (resultado antes de juros, tributos, depreciação e amortização).

## Aplicar sem alterar a régua

- Identifique cada definição: lucro contábil ou ajustado, período anual ou últimos doze meses, caixa operacional antes/depois de juros, capital médio ou final. Não combine definições diferentes.
- Para conversão de lucro em caixa, declare se usa soma dos fluxos dividida pela soma dos lucros ou média de razões. Lucro zero/negativo exige interpretação e pode tornar a razão não significativa.
- Observe vencimentos, cobertura de juros, moeda da dívida, itens não recorrentes e notas contábeis. Crescimento por preço/volume só é separado quando a fonte permitir.
- Preço e múltiplos só entram se forem parte do pedido e houver cotação datada. Múltiplo com denominador negativo pode ser não significativo; não o chame de barato.
- Placar: critério, valor/período/fonte, faixa adotada e resultado aprovado/reprovado/inconclusivo/não aplicável. “Não aplicável” exige motivo.
- Régua incompatível: mostre o conflito; preserve o resultado original e discuta a alternativa antes de recalcular. Nunca afrouxe critério para melhorar o placar.

## Entrega completa, quando solicitada

1. Enquadramento do negócio.
2. Qualidade: retorno, margens e caixa, se aplicáveis.
3. Solidez financeira.
4. Crescimento e suas fontes.
5. Preço, apenas com dados pertinentes disponíveis.
6. Placar por critério.
7. Lacunas e evidências que resolveriam cada uma.

Um pedido pontual recebe a conclusão e evidência pertinentes. Várias empresas no pedido não autorizam escolher a primeira silenciosamente: aplique o método individualmente ou use formato comparativo conforme a intenção. Preserve moeda original, salvo conversão solicitada com fonte e data.

## Limites

- Não produzir recomendação individual de compra, venda, manutenção ou alocação, nem promessa ou expectativa de retorno, mesmo em cenário hipotético.
- Dado de mercado exige fonte e data visíveis. Ausência é “não informado”; não é zero nem autorização para estimar. Cálculos derivados devem mostrar os dados e a fórmula.
- Usar rótulos genéricos e dados minimizados para pessoas; não solicitar identificadores, contas ou informações confidenciais. Não usar informação relevante ainda não pública nem dados obtidos no trabalho de assessoria. Não expor empregador ou clientes do operador.
- Esta skill prepara análise ou rascunho. Não envia mensagem, publica, movimenta carteira, contrata serviço nem gasta créditos.

## Na Mesa do Assessor (acrescentado)

- **De onde vem cada dado**: com o CaptaMais conectado, `analise_ativo` (tipo `acoes`, com `pesquisa: true`) traz histórico de preço, rentabilidade, volatilidade, múltiplos e indicadores, preço-alvo e recomendação das casas (opinião delas: cite casa e data, sem recomendar), números declarados nos relatórios, resumo dos relatórios e balanços trimestrais da CVM. Receita, margens, dívida e caixa vêm dos documentos da companhia (ITR, DFP, release) que o assessor enviar ou que você buscar na página oficial de relações com investidores. Preço não substitui fundamento, nem o contrário.
- **Campo "Meu método" em branco**: não trave. Entregue a leitura descritiva e, ao final, proponha de 3 a 5 critérios ligados à pergunta central (capacidade de pagar dívida, consistência de caixa, qualidade operacional), sem faixa numérica. Pergunte quais ele adota e com que faixa; só então monte o placar. Quando ele adotar, sugira **Salvar como meu modelo** para a tarefa já abrir com o método dele.
- **Ordem da entrega**: uma frase · negócio em 2 linhas · ficha única (rentabilidade, múltiplos, margens, solidez) · último balanço · casas · fortes e fracos · atenção · monitorar · cliente · método · conferir. Cada número aparece uma vez; tabelas curtas; o resto, em seções recolhidas.
- **Múltiplos**: tabela com valor, referência (histórico da própria empresa, setor ou índice) e leitura de uma linha. Cite o período e a data da cotação. Múltiplo sem referência não conclui nada. Nunca chame de barato ou caro; descreva o que ele diz sobre o que o mercado está pagando e o que precisaria acontecer para mudar.
- **Último balanço**: use `balancosTrimestrais` e mostre pelo menos 5 trimestres. Calcule e mostre a variação contra o trimestre anterior e contra o mesmo trimestre do ano passado (o segundo evita a distorção sazonal). Diga o que é recorrente e o que não é.
- **Casas de research**: tabela com casa, data, recomendação, preço-alvo e premissa; some os ajustes de alvo dos últimos 30 dias e diga se as casas concordam ou divergem. É opinião delas, nunca a sua.
- **Pontos fortes e fracos**: até 4 de cada, todos com número, período e fonte; sem adjetivo solto. Ponto sem dado fica como hipótese.
- **Onde desconfiar** (confira um a um e diga "encontrado", "descartado" ou "sem dado"): lucro que não vira caixa; resultado inflado por item não recorrente; dívida de curto prazo alta ou em moeda estrangeira; queda de margem com receita subindo; receita concentrada em poucos clientes, produtos ou contratos; endividamento subindo para pagar dividendo; casas muito divergentes; divergência entre o release e o ITR/DFP.
- **Solidez**: dívida líquida sobre resultado operacional (com a definição usada), cobertura de juros, caixa contra dívida de curto prazo e vencimentos. Entra na ficha, sem seção própria, sem nota e sem recomendação. Banco e seguradora não usam dívida sobre EBITDA: use capital e qualidade de crédito.
- **O que monitorar**: de 5 a 7 indicadores. Para cada um: valor atual, o nível ou a mudança que alteraria a leitura, e a data do próximo dado (calendário de resultados da empresa; se não achar, `[CONFERIR]`). Prefira os que já apareceram como ponto fraco ou sinal de alerta.
- **Exemplo de leitura para o cliente**: "A WEG fabrica motores e equipamentos elétricos e vende no Brasil e fora. No último balanço (período e fonte), a receita foi de R$ X e a dívida, de Y vezes o resultado operacional. O que acompanhar: o próximo resultado, em [data divulgada]. Isso descreve a empresa; não é indicação."
