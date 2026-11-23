# Mercado e ativos

> Nota para o ChatGPT: este material foi escrito para outro programa. Onde ele mencionar ferramentas, faça o equivalente: dados de mercado, indicadores, CVM, Tesouro e RI = busque na web em fontes oficiais e cite fonte e data (o que não achar, peça ao assessor ou marque [CONFERIR]); PDF, PowerPoint e planilhas = use o interpretador de código e entregue o arquivo para baixar; imagens = use a geração de imagem; perfil e histórico do cliente = o que o assessor colar, anexar ou estiver no arquivo de perfil.

## Rotina: macro-brasil
_Consulta indicadores macroeconômicos brasileiros em fontes oficiais, com definição, unidade e data da observação. Use para Selic, inflação, câmbio, séries e comparação histórica; entrega só o indicador ou painel pedido, sem previsão ou sugestão de alocação._


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

1. Chame indicadores do Banco Central e do IBGE antes de qualquer busca, com o recorte e a referência do pedido. As séries do Banco Central e do IBGE são a reserva: só para o bloco que vier vazio ou que estiver em `lacunas`, buscadas por código (o código vem em cada indicador e, se a série falhou, na própria lacuna). O que não achar fica marcado, sem estimar.
2. Use as variações que vêm prontas. Não recalcule nem arredonde diferente da fonte.
3. Focus é a mediana do mercado: escreva "o mercado espera", com a data do relatório (`focus.data`, a data da estatística no serviço de Expectativas do Banco Central). Em Conversa de WhatsApp, essa data vai para as duas linhas finais (item 5).
4. Juro real: mostre a conta e diga qual inflação usou (a de 12 meses ou a esperada).
5. Em Conversa de WhatsApp, fonte e data ficam fora da mensagem, nas duas linhas finais para o assessor. Nas mensagens (a principal, a versão curta e as respostas prontas), nenhuma data, nem entre parênteses, e nenhuma fonte citada ("Focus", "Focus do BC", código de série): escreva "hoje", "há um mês" e "o mercado espera". Nessas mensagens, a regra do pedido "todo número com fonte e data" se cumpre nas duas linhas finais.
6. Formato: dentro da Mesa vale o formato do pedido, o painel em tabela com as colunas que o pedido escreve. A regra "uma linha por indicador, sem tabela" desta skill fica para o uso fora da Mesa.
7. Copom: a data da próxima reunião não tem endereço de dados oficial e vem em `lacunas`. Só escreva a data com fonte oficial; sem ela, "a confirmar". Não deduza a data pela série 432.
8. Segunda opinião dos dados do ativo: quando houver dados do ativo e o painel trouxer CDI ou IPCA de 12 meses, chame dados do ativo com tipo `indice` e o código (CDI, IPCA; DOLAR, sem acento, se o pedido trouxer câmbio) e compare o retorno de 12 meses com o do painel. O dados do ativo traz o fechamento do último mês completo (`dataBase`), então só compare no mesmo período e nunca com o valor do dia. Cada código conta como uma consulta no limite. O número que vai para o assessor continua sendo o do Banco Central ou do IBGE. Se a diferença passar de 0,05 ponto percentual, ou se os meses de referência forem outros, escreva em "Para conferir" os dois números, cada um com a sua fonte e o seu mês, sem escolher o certo. Se concordarem, diga só "conferido também nos dados do ativo". Se os dados do ativo não responder, der `LIMITE` ou não estiver conectado, siga sem ele, sem avisar o assessor. Selic e Focus ficam fora: os dados do ativo devolve a Selic acumulada em 12 meses, que não é a taxa meta do painel, e não traz o Focus. Em Conversa de WhatsApp, isso fica nas duas linhas finais, nunca nas mensagens.


---

## Rotina: resumo-de-fato-relevante
_Resume comunicado oficial de companhia e relaciona seus fatos a uma tese fornecida, distinguindo impacto divulgado e interpretação. Use com fato relevante, comunicado ao mercado ou aviso aos acionistas; exige conteúdo integral para uma conclusão documental._


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

1. Sem texto colado nem PDF anexado, chame documentos da CVM com o nome ou o CNPJ da companhia (pelo ticker, a dados do ativo traz os dois). Para o texto integral, chame de novo com o `protocolo` do documento escolhido: o PDF vai para a pasta Mesa do Assessor/Fontes.
2. A base da CVM é semanal (o campo `aviso` diz até que dia ela vai). Se o comunicado for de hoje, peça o texto, o link ou o PDF.
3. Se o texto integral não abrir, não resuma por notícia: diga isso na primeira linha, entregue a ficha do que achou e peça o texto colado.
4. Todo número da tabela "O que foi divulgado" tem o trecho do documento ao lado.
5. O tamanho do anúncio é sempre comparado com um número da empresa (receita, lucro, dívida líquida ou valor de mercado), com data-base e a conta. Os números da empresa vêm de dados do ativo com `pesquisa=true`.
6. Opinião das casas de research entra com a data e marcada como anterior ou posterior ao comunicado.
7. Formato: dentro da Mesa vale a lista do pedido (ficha, o que foi divulgado, etapas, tamanho, o que muda, casas de research, sequência, cliente, monitorar e conferir), no lugar do resumo em cinco seções desta skill.


---

## Rotina: leitura-grafica
_Descreve estrutura de preços, níveis observados e indicadores solicitados a partir de série, imagem ou descrição fornecida. Use para análise gráfica com condições e invalidação, sem previsão, probabilidade inventada, preço-alvo ou sinal de operação._


# Leitura gráfica

Revisão: 22/09/2026.

Descreva o comportamento observado e as condições que alterariam a leitura. Padrão visual não demonstra probabilidade futura.

## Qualidade da entrada

Identifique ativo, fonte, janela, periodicidade e tipo de preço. Use série anexada, imagem efetivamente acessível ou descrição; pesquisa de preços só quando incluída no pedido e com fonte adequada.

- **Série:** abertura, máxima, mínima, fechamento e volume por período. Verifique ordem temporal, duplicidades, falhas, desdobramentos, ajustes por proventos, moeda e fuso quando relevantes. Não misture preço ajustado com não ajustado.
- **Imagem:** examine somente os elementos visíveis; valores lidos pela escala são aproximados. Se escala ou rótulos não permitem número confiável, omita o número e peça recorte/dados.
- **Descrição:** atribua observações ao usuário, sem afirmar confirmação visual independente.

Uma imagem ilegível pode impedir níveis numéricos sem impedir explicar o indicador perguntado. Série incompleta não deve ser interpolada; restrinja o cálculo a trecho válido e explicite a cobertura. Peça apenas o elemento que afeta a conclusão.

## Método

- Tendência observada: sequência de topos e fundos na janela, com critério explícito. Não a transforme em direção futura.
- Suporte/resistência: regiões de referência extraídas do histórico, com toques, datas ou outro critério visível. Não forneça precisão maior do que a entrada.
- Indicadores: só os solicitados ou pertinentes ao escopo aceito, com parâmetros e método. Média móvel é uma média dos preços de certo número de períodos; índice de força relativa é um indicador de variações de preço. Explique antes de usar a sigla.
- Sem parâmetro, explique a escolha necessária e peça-o quando mudar o cálculo. Enquanto isso, descreva preço sem o indicador. Não presuma que “padrão da plataforma” é conhecido.
- Dados insuficientes para o aquecimento de um indicador deixam o cálculo pendente; não invente valores iniciais.
- Padrões: mostre os pontos que os formam e clareza nítida/discutível/insuficiente. Não procure um nome para cada oscilação.

## Condições e invalidação

Use “se o fechamento superar a região X, a classificação de estrutura adotada será reavaliada pelo critério Y”. Não escreva “então subir fica mais provável” sem estudo estatístico específico, aplicável e documentado. Esta skill não produz esse tipo de previsão.

Indique qual observação faria a leitura deixar de valer. Não traduza nível em entrada, saída, alvo, stop (ordem para limitar perda) ou tamanho de posição.

## Entrega completa, quando solicitada

1. Base e limites da entrada.
2. Estrutura observada.
3. Níveis e critérios.
4. Indicadores e parâmetros.
5. Padrões sustentados pela entrada.
6. Condições para reavaliar a leitura.
7. Invalidação.
8. Limite da conclusão: observação histórica não é previsão nem recomendação.

Pedido pontual recebe o trecho pertinente e a limitação necessária. Se fundamento e gráfico forem solicitados juntos, distinga as bases e janelas; não rejeite o pedido combinado.

## Limites

- Não produzir recomendação individual de compra, venda, manutenção ou alocação, nem promessa ou expectativa de retorno, mesmo em cenário hipotético.
- Dado de mercado exige fonte e data visíveis. Ausência é “não informado”; não é zero nem autorização para estimar. Cálculos derivados devem mostrar os dados e a fórmula.
- Usar rótulos genéricos e dados minimizados para pessoas; não solicitar identificadores, contas ou informações confidenciais. Não usar informação relevante ainda não pública nem dados obtidos no trabalho de assessoria. Não expor empregador ou clientes do operador.
- Esta skill prepara análise ou rascunho. Não envia mensagem, publica, movimenta carteira, contrata serviço nem gasta créditos.

## Na Mesa do Assessor (acrescentado)

- **Sem imagem nem série**: com os dados do ativo disponíveis, dados do ativo traz o histórico do ativo. Confira a periodicidade que veio antes de calcular. Se for mensal, a leitura é mensal: indicador que o assessor pediu em outra escala (ex.: IFR de 14 dias no gráfico diário) fica pendente, com o pedido da série ou do print na escala certa. Não converta mensal em diário.
- **Escala declarada**: toda leitura abre dizendo ativo, período, escala e fonte. Se o campo Escala veio em branco, use a escala que os dados permitem e diga qual foi, sem perguntar.
- **Ordem da entrega**: a do pedido da Mesa: frase · base · medidas · estrutura · níveis com o critério · indicadores pedidos, com parâmetros · o que distorce o gráfico · condições e o que invalidaria a leitura · leitura para o cliente · conferir.
- **Leitura para o cliente**: descreva o que o preço fez no período ("oscilou entre X e Y, com fonte e data"), sem dizer para onde vai. Se ele perguntar "vai subir?", a resposta pronta é que gráfico descreve o passado e que a decisão volta ao objetivo e ao prazo dele.


---

## Rotina: fundamentalista-metodo
_Analisa uma empresa por critérios financeiros declarados, registra evidências e lacunas e ajuda o usuário a explicitar seu método. Use para leitura de fundamentos ou avaliação de uma companhia; não para recomendar investimentos, comparar pares ou filtrar uma lista._


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

- **De onde vem cada dado**: com os dados do ativo disponíveis, dados do ativo (tipo `acoes`, com `pesquisa: true`) traz histórico de preço, rentabilidade, volatilidade, múltiplos e indicadores, preço-alvo e recomendação das casas (opinião delas: cite casa e data, sem recomendar), números declarados nos relatórios, resumo dos relatórios e balanços trimestrais da CVM. Receita, margens, dívida e caixa vêm dos documentos da companhia (ITR, DFP, release) que o assessor enviar ou que você buscar na página oficial de relações com investidores. Preço não substitui fundamento, nem o contrário.
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


---

## Rotina: comparativo-setorial
_Compara empresas por indicadores adequados ao setor e evidencia diferenças de período, moeda e definição. Use para análise lado a lado e seleção fundamentada de pares; não elege investimento vencedor nem recomenda alocação._


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

- **De onde vem cada dado**: com os dados do ativo disponíveis, chame dados do ativo uma vez por empresa (com `pesquisa: true`), para a rentabilidade no mesmo período e os múltiplos e balanços na mesma base. Os indicadores do negócio vêm dos documentos oficiais de cada companhia. As consultas têm limite: se o pedido trouxer só o setor, proponha de 3 a 4 empresas e confirme com o assessor antes de consultar.
- **Mesma base ou nada**: se uma empresa não tiver o dado no mesmo período e definição, a célula fica "não informado" com o motivo. Não complete com período diferente.
- **Ordem da entrega**: uma frase · comparabilidade em 2 linhas · tabela lado a lado única · casas · forte e fraco de cada · atenção por empresa · monitorar no setor · cliente · conferir. Cada número aparece uma vez; tabelas curtas.
- **Múltiplos lado a lado**: P/L, P/VP, EV/EBITDA e dividend yield com a data da cotação; denominador negativo é não significativo. Mostre a diferença, nunca chame uma de barata e outra de cara.
- **Último balanço**: variação contra o trimestre anterior e contra o mesmo trimestre do ano passado, na mesma base para todas.
- **Onde desconfiar em cada empresa**: lucro que não vira caixa, dívida curta ou em moeda estrangeira, item não recorrente, queda de margem com receita subindo. Diga encontrado, descartado ou sem dado.
- **O que monitorar no setor**: de 4 a 6 variáveis (as do setor, como juros, câmbio, preço de commodity, tarifa ou inadimplência) com o valor atual, o que mudaria a leitura e a data do próximo dado.
- **Leitura para o cliente**: diga em que cada empresa difere ("uma cresce mais, a outra deve menos"), nunca qual é a melhor. Se o cliente perguntar "qual você escolheria?", a resposta pronta devolve ao objetivo e à política de investimento dele.


---

## Rotina: analise-fii
_Analisa relatórios e distribuições de fundos imobiliários, separando imóveis, crédito imobiliário, fundos de fundos e carteiras híbridas. Use para entender composição, concentração, preço patrimonial e origem de distribuições; não projeta rendimento nem indica compra ou venda._


# Análise de fundo imobiliário

Revisão: 22/09/2026.

Identifique o segmento do FII (fundo de investimento imobiliário) e a pergunta antes de escolher os indicadores.

## Base documental

Leia relatório gerencial, demonstrações e fatos relevantes disponíveis, com data e período. Se a tarefa incluir pesquisa, obtenha os documentos oficiais do administrador, gestor ou regulador. Uma notícia não substitui a composição da carteira.

Preço de cota só é necessário para indicador que o utiliza. Sem cotação datada, ainda é possível analisar carteira, distribuições realizadas e riscos documentados. O número de meses limita a interpretação: não há histórico mínimo que transforme distribuição futura em previsível.

## Ler por segmento

| Segmento | O que examinar |
|---|---|
| Imóveis físicos | Imóveis, regiões, concentração por receita e inquilino, vencimentos, carências, inadimplência, vacância física e financeira, investimentos e dívida |
| Crédito imobiliário | Devedores, operações, indexadores, atrasos, renegociações, provisões, garantias, posição na ordem de pagamento, concentração e vencimentos |
| Fundos de fundos | Fundos investidos, concentração direta e indireta quando divulgada, custos em cada camada, distribuições recebidas e ganhos/perdas com cotas |
| Híbrido | Cada segmento separadamente; consolidação somente de grandezas compatíveis |

Vacância física é proporção da área desocupada; financeira compara a receita potencial da área vaga à receita potencial total, conforme metodologia publicada. Explique divergências sem supor aluguéis que não foram divulgados. Vacância não se aplica diretamente a carteira de crédito.

Em crédito, não trate juros apropriados e não recebidos como caixa disponível. Garantia e posição subordinada (que absorve perdas antes de outra classe) alteram exposição, sem eliminar risco de recuperação. Provisão crescente é sinal para investigar, não prova automática de perda definitiva.

Contratos típicos e atípicos devem ser descritos pelas cláusulas documentadas. Não deduza multa, revisão ou segurança jurídica só pelo nome.

## Preço e distribuição

- P/VP é preço da cota dividido pelo valor patrimonial por cota. Informe as duas datas; desconto não é prova de oportunidade.
- Taxa de capitalização de imóvel: receita operacional líquida do imóvel / valor correspondente do imóvel, com janela e data da avaliação. Não use distribuição da cota como receita do imóvel, nem valor de mercado do fundo como denominador sem conciliar dívida, caixa e ativos. Não calcular para segmento sem imóveis.
- Separe resultado recorrente, ganhos não repetíveis e uso de reservas **apenas até onde a documentação permitir**. Se não reconciliar resultado, caixa e distribuição, exponha a diferença.
- Mostre distribuição efetivamente realizada no período. Não multiplique um único mês por doze como expectativa. Se o usuário pedir um indicador anualizado, explique a convenção e a limitação; priorize soma dos últimos doze meses disponíveis dividida pelo preço datado, rotulada como distribuição histórica, não retorno total.
- Histórico curto ou sem composição recebe análise parcial, com o número de meses e o que ficou indeterminado. Não invente “parcela sustentável”.
- Liste eventos futuros já divulgados, com datas e fonte: vencimentos, obras, carências, emissões ou amortizações. Não projete pagamentos.

## Entrega completa, quando solicitada

1. Identificação e segmento.
2. Carteira e concentração.
3. Operação pertinente: ocupação para imóveis; crédito para papel; exposição dos fundos investidos para fundos de fundos.
4. Preço e valor, apenas com dados adequados.
5. Origem das distribuições observadas.
6. Eventos divulgados para acompanhamento.
7. O que não está documentado.

Comparações entre segmentos podem explicar diferenças, mas não ranquear vacância contra crédito ou usar uma régua comum inadequada. Tributação só entra se necessária: consulte a legislação consolidada e orientação atual da Receita Federal, identifique categoria do cotista, condições e data da consulta. Não aplique listas de isenção de memória.

## Limites

- Não produzir recomendação individual de compra, venda, manutenção ou alocação, nem promessa ou expectativa de retorno, mesmo em cenário hipotético.
- Dado de mercado exige fonte e data visíveis. Ausência é “não informado”; não é zero nem autorização para estimar. Cálculos derivados devem mostrar os dados e a fórmula.
- Usar rótulos genéricos e dados minimizados para pessoas; não solicitar identificadores, contas ou informações confidenciais. Não usar informação relevante ainda não pública nem dados obtidos no trabalho de assessoria. Não expor empregador ou clientes do operador.
- Esta skill prepara análise ou rascunho. Não envia mensagem, publica, movimenta carteira, contrata serviço nem gasta créditos.

## Na Mesa do Assessor (acrescentado)

- **De onde vem cada dado**: com os dados do ativo disponíveis, dados do ativo (tipo `fii`, com `pesquisa: true`) traz histórico, rentabilidade, indicadores do fundo (P/VP, dividend yield, patrimônio), preço-alvo e recomendação das casas (opinião delas: cite casa e data, sem recomendar) e relatórios resumidos. Composição da carteira, vacância, inadimplência, valor patrimonial e origem das distribuições vêm do relatório gerencial que o assessor colar ou anexar. Não preencha uma parte com a outra.
- **Sem relatório gerencial**: entregue histórico e rentabilidade, liste em "O que falta" as seções que dependem do relatório (composição, concentração, P/VP, origem das distribuições) e diga onde achá-lo (site do administrador ou do gestor). Não deixe a seção em branco nem estime.
- **Ordem da entrega**: uma frase · ficha única (segmento, P/VP, distribuição, patrimônio, liquidez, rentabilidade contra o IFIX) · carteira · operação do segmento · distribuições · casas · fortes e fracos · atenção · monitorar · cliente · conferir. Cada número aparece uma vez; tabelas curtas.
- **Indicadores**: tabela com P/VP (duas datas), distribuição dos últimos 12 meses sobre o preço datado (rotulada como histórica), patrimônio e liquidez, cada um com referência (IFIX, histórico do fundo, pares do segmento). Não chame desconto de oportunidade.
- **Onde desconfiar** (diga encontrado, descartado ou sem dado): distribuição acima do resultado; vacância ou inadimplência subindo; provisão crescente; concentração em poucos imóveis, inquilinos ou devedores; alavancagem; rendimento sustentado por ganho não recorrente ou reserva; desconto grande sem explicação; emissão de cotas que dilui.
- **Casas de research**: casa, data, recomendação, preço-alvo e premissa. Opinião delas, nunca a sua.
- **O que monitorar**: de 5 a 7 itens, cada um com valor atual, o nível que mudaria a leitura e a data do próximo dado (relatório gerencial mensal, vencimentos de contratos e de operações). Prefira o que apareceu como ponto fraco.
- **Pergunta do cliente como fio**: se o assessor informou para que cliente ou pergunta está olhando (ex.: "cliente quer renda mensal"), abra respondendo a ela em 2 linhas descritivas (o que o fundo distribuiu, de onde veio, o que pode mudar), antes da análise completa.
- **Exemplo de leitura para o cliente**: "O HGLG11 é um fundo que compra galpões logísticos e distribui o aluguel aos cotistas. Nos últimos 12 meses distribuiu R$ X por cota (fonte e data). O ponto a acompanhar é o vencimento de contratos em [ano], que está no relatório de [mês]. Isso descreve o fundo; não é indicação."


---

## Rotina: estudo-de-ativo
_Monta estudo ou apresentação de um ativo (ação, FII, ETF, fundo) para o assessor usar com cliente, partindo dos dados da dados do ativo (histórico, rentabilidade, comparação com índice) e completando com macro, fato relevante e o método. Entrega um resumo de uma página, um estudo em PDF ou os slides, sempre descritivo e com fonte e data; sem recomendação._


# Estudo e apresentação de ativo

## Objetivo
Dar ao assessor material que ele leva ao cliente: números certos, com fonte e data, explicados em linguagem simples, no formato que ele escolheu. Dados primeiro, texto depois.

## Entradas
- Ativo(s) (até 3): ticker, nome ou CNPJ do fundo.
- Perfil do cliente-alvo (sem nome), período a destacar e **formato**: resumo de uma página · estudo em PDF · apresentação (até 8 slides).
- perfil do assessor e a atuação (define a identificação e os avisos).

## Passos
1. **Dados**: chame dados do ativo para cada ativo (para ação, com `pesquisa: true`: traz também múltiplos, preço-alvo das casas, relatórios resumidos e balanços; use como opinião das casas, com casa e data, nunca como recomendação sua). Use os números **exatamente** como vierem, com data-base e fonte. Se voltar `SEM_CONEXAO`/`SEM_ANALISE` ou o ativo não for achado, diga em uma frase, peça que o assessor cole os dados da tela (marque "fonte: informado pelo assessor") e **entregue mesmo assim** a estrutura com `[CONFERIR]` onde falta número. Nunca complete número de memória.
2. **Contexto**, só se agregar (carregue com os arquivos de conhecimento): `macro-brasil` (Selic, IPCA, câmbio); `resumo-de-fato-relevante` se houve comunicado recente; `analise-fii`, `fundamentalista-metodo` ou `comparativo-setorial` conforme o ativo.
3. **Escreva para o cliente do perfil informado**: conservador = foco em oscilação e liquidez; arrojado = foco em retorno e risco assumido; sem jargão, termo técnico explicado na primeira vez.
4. **Compliance**: identificação do profissional conforme a atuação, aviso de que desempenho passado não garante o futuro, fonte e data-base em todo número. Regra específica: os arquivos de conhecimento ou `[CONFERIR]`.

## Modelo de saída
**Resumo de uma página** (`relatorio`): 
1. *Em uma frase*: o que é o ativo e por que está na conversa.
2. *Números do período*: tabela (retorno 12 e 24 meses, ano, índice de referência, pior mês) — cada linha com data-base. O índice de referência vem de dados do ativo com tipo `indice` (IFIX para FII, IBOV para ação, CDI para renda fixa), na mesma janela do ativo.
3. *Risco observado*: oscilação, concentração, liquidez (só o que há dado).
4. *Contexto de mercado*: 2 a 3 linhas, com fonte e data.
5. *O que observar*: eventos e datas, sem previsão.
6. *O que este material não diz*: não é recomendação; desempenho passado não garante o futuro.
7. *Fontes*: dados do ativo (data-base) e demais.

**Estudo em PDF**: a mesma estrutura, com os números em tabela e o comparativo com o índice; gere com PDF e informe o caminho.

**Apresentação** (`slides`, até 8): cada slide tem um título-conclusão (a frase que o cliente deve levar) e 3 linhas no máximo. Sequência: 1 capa · 2 o ativo · 3 retorno acumulado · 4 tabela mensal · 5 risco · 6 contexto · 7 o que observar · 8 avisos e fontes. Entregue o texto de cada slide marcado "Slide N — título" e, se pedido PDF, gere com PDF.

Em todos: ao final, uma mensagem curta de envio ao cliente (`whatsapp`, sem `**`) e a linha "Fontes: dados do ativo (data-base), <demais>".

## Exemplo (trecho do resumo)
"HGLG11 — fundo imobiliário de galpões logísticos. Retorno em 12 meses: X% contra Y% do IFIX (fonte: dados do ativo, data-base DD/MM/AAAA). Oscilação do período: ... Este material descreve o ativo e não é recomendação."

## Limites
- Nenhuma indicação de compra ou venda, preço-alvo próprio ou projeção de retorno.
- Número sem fonte e data não entra; cálculo derivado mostra os dados e a fórmula.
- Não envia nada ao cliente.

## Na Mesa do Assessor (acrescentado)

Na Mesa, o pedido e esta seção prevalecem sobre o Modelo de saída acima.

1. O material nasce da análise: chame dados do ativo com todos os blocos antes de montar página. Em ação e fundo imobiliário, com `pesquisa=true`.
2. Fatos do período: documentos da CVM. Juros e inflação do período: indicadores do Banco Central e do IBGE. Número sem fonte não entra no material.
3. O arquivo leva `tipo: "estudo"`. Resumo de uma página: PDF com os quatro números em `destaques` (rótulo, valor e a referência na nota), o histórico em `grafico` `linha` com `retornos: true` (ativo e índice, os retornos mensais que a ferramenta devolveu, `inicio` = o mês anterior ao primeiro retorno, `fonte` com a data e `tabela: false`, porque a tabela do histórico vem logo abaixo, no texto da seção) e os fortes e pontos de atenção. Estudo em PDF: o mesmo, com `capa: true` e as seções na ordem do pedido. Apresentação: apresentação em PowerPoint e PDF com os layouts capa, numeros, linha, tabela, lista, comparativo, frase e fechamento.
4. Sem gráfico inventado: a linha só sai com a série mensal da ferramenta (até 24 meses), com fonte e data. Sem a série mensal, o histórico vai só na tabela e o material não fala de gráfico.
5. Um título-conclusão por página, com o número que sustenta.
6. Mais de um ativo: mesma data-base para todos, ou diga qual ficou diferente.

