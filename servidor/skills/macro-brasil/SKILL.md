---
name: macro-brasil
description: Consulta indicadores macroeconômicos brasileiros em fontes oficiais, com definição, unidade e data da observação. Use para Selic, inflação, câmbio, séries e comparação histórica; entrega só o indicador ou painel pedido, sem previsão ou sugestão de alocação.
---

# Indicadores macroeconômicos do Brasil

Revisão: 22/09/2026.

Valor atual exige consulta atual. Distingua a data da observação, a publicação e o horário da consulta.

## Escopo mínimo

“Qual a Selic hoje?” pede valor, definição, data e fonte, sem questionário nem painel completo. Para “o que mudou?”, aproveite a referência temporal fornecida; se ausente e material, pergunte contra qual data comparar. Não escolha período silenciosamente.

Confira nome, unidade, periodicidade e metodologia da série antes de consultar. Banco Central e IBGE são fontes primárias conforme o indicador. Em “dólar agora”, esclareça se precisa cotação de negociação em tempo real ou referência oficial diária; nunca apresente PTAX diária como cotação instantânea.

## Séries de partida no Banco Central

SGS é o Sistema Gerenciador de Séries Temporais do Banco Central. Confirme seus metadados ao usar:

| Indicador | Código SGS | Leitura |
|---|---|---|
| Meta da Selic | 432 | Taxa anual definida pelo comitê de política monetária; série diária |
| IPCA mensal | 433 | Variação mensal do índice oficial de preços ao consumidor |
| IPCA em doze meses | 13522 | Variação acumulada publicada |
| Dólar americano, venda | 1 | Referência PTAX diária; não é câmbio de varejo nem preço em tempo real |

Para indicador diferente, localize a série no [catálogo oficial](https://dadosabertos.bcb.gov.br/) ou [SGS](https://www3.bcb.gov.br/sgspub/), confirme sua definição e documente a escolha. Não peça ao usuário que faça busca que a ferramenta disponível permite realizar.

## Consulta e validação

Use períodos explícitos para séries diárias:

    https://api.bcb.gov.br/dados/serie/bcdata.sgs.CODIGO/dados?formato=json&dataInicial=DD/MM/AAAA&dataFinal=DD/MM/AAAA

Substitua os campos pela série e pelo intervalo necessário. O [catálogo da série 1](https://dadosabertos.bcb.gov.br/dataset/1-taxa-de-cambio---livre---dolar-americano-venda---diario) documenta filtros e limite de dez anos por intervalo desde 26/03/2025; confirme restrições atuais. Divida consulta extensa em janelas sem duplicar fronteiras.

Últimas N observações não são N meses, salvo periodicidade mensal. Confira datas mínima/máxima, lacunas, unidades e duplicidades na resposta. Na agregação mensal, declare fim de mês, média ou acumulação conforme pergunta e conceito. Não some taxas compostas.

Se o serviço falhar, verifique parâmetros e tente a página oficial do indicador ou outro formato oficial. Persistindo, informe qual série ficou indisponível; entregue as demais sem completar por memória. Resultado antigo é “último dado disponível”, não “dado de hoje”.

## Interpretação

- Diferença entre taxas: pontos percentuais. Variação do câmbio: valor final / inicial - 1.
- Para juro real realizado, use rendimento nominal e inflação do mesmo período: (1+nominal)/(1+inflação)-1, em decimal.
- Selic meta anual atual dividida pelo IPCA dos últimos doze meses mistura horizontes. Se o usuário pedir esse indicador, rotule-o como comparação indicativa de horizontes distintos, não rendimento real realizado nem futuro.
- Separe dado observado, comparação histórica e interpretação. Relações de juros com preços dependem de prazo, expectativas e risco; não afirme que uma classe ficou necessariamente mais atraente.
- Calendários e comunicados só entram se pertinentes e consultados em BCB/IBGE. Não use data de memória.

## Entrega completa, quando solicitada

1. Quadro atual.
2. Mudança contra referência declarada.
3. Contexto documentado da decisão ou divulgação.
4. Mecanismos econômicos pertinentes, sem sugestão de investimento.
5. Calendário oficial relevante.
6. Fontes, códigos, unidade, data de observação e consulta.

Se não houver referência anterior, omita comparação ou registre a falta; não deixe seção vazia. Projeções de terceiros, caso solicitadas fora desta leitura observada, exigem origem, data e identificação como expectativas, nunca previsão própria.

## Formato da entrega no chat

Abra com o painel pronto, e só depois as observações. Uma linha por indicador, sem tabela (o assessor copia para WhatsApp):

- *Selic meta:* X% ao ano, vigente desde DD/MM/AAAA (BCB, SGS 432, consulta DD/MM/AAAA)
- *IPCA do mês:* X% em MM/AAAA; *12 meses:* Y% (IBGE/BCB, SGS 433 e 13522)
- *Dólar (PTAX venda):* R$ X,XX em DD/MM/AAAA (BCB, SGS 1)

Depois: o que mudou contra a referência declarada, em 2 ou 3 linhas; por fim, "Para conferir" com no máximo 2 itens objetivos. Valor que não veio da fonte entra como "não informado", nunca de memória.

Se o IPCA do último mês ainda não aparece no SGS (433), consulte o IBGE (SIDRA, tabela 1737, variável 63 para a variação mensal e 2265 para 12 meses: https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/-3/variaveis/63|2265?localidades=N1[all]) e diga qual fonte entregou cada número.

## Limites

- Não produzir recomendação individual de compra, venda, manutenção ou alocação, nem promessa ou expectativa de retorno, mesmo em cenário hipotético.
- Dado de mercado exige fonte e data visíveis. Ausência é “não informado”; não é zero nem autorização para estimar. Cálculos derivados devem mostrar os dados e a fórmula.
- Usar rótulos genéricos e dados minimizados para pessoas; não solicitar identificadores, contas ou informações confidenciais. Não usar informação relevante ainda não pública nem dados obtidos no trabalho de assessoria. Não expor empregador ou clientes do operador.
- Esta skill prepara análise ou rascunho. Não envia mensagem, publica, movimenta carteira, contrata serviço nem gasta créditos.

## Na Mesa do Assessor (acrescentado)

1. Chame `painel_macro` antes de qualquer busca, com o recorte e a referência do pedido. As séries do Banco Central e do IBGE são a reserva: só para o bloco que vier vazio ou que estiver em `lacunas`, buscadas por código (o código vem em cada indicador e, se a série falhou, na própria lacuna). O que não achar fica marcado, sem estimar.
2. Use as variações que vêm prontas. Não recalcule nem arredonde diferente da fonte.
3. Focus é a mediana do mercado: escreva "o mercado espera", com a data do relatório (`focus.data`, a data da estatística no serviço de Expectativas do Banco Central). Em Conversa de WhatsApp, essa data vai para as duas linhas finais (item 5).
4. Juro real: mostre a conta e diga qual inflação usou (a de 12 meses ou a esperada).
5. Em Conversa de WhatsApp, fonte e data ficam fora da mensagem, nas duas linhas finais para o assessor. Nas mensagens (a principal, a versão curta e as respostas prontas), nenhuma data, nem entre parênteses, e nenhuma fonte citada ("Focus", "Focus do BC", código de série): escreva "hoje", "há um mês" e "o mercado espera". Nessas mensagens, a regra do pedido "todo número com fonte e data" se cumpre nas duas linhas finais.
6. Formato: dentro da Mesa vale o formato do pedido, o painel em tabela com as colunas que o pedido escreve. A regra "uma linha por indicador, sem tabela" desta skill fica para o uso fora da Mesa.
7. Copom: a data da próxima reunião não tem endereço de dados oficial e vem em `lacunas`. Só escreva a data com fonte oficial; sem ela, "a confirmar". Não deduza a data pela série 432.
