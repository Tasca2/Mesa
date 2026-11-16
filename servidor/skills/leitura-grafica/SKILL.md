---
name: leitura-grafica
description: Descreve estrutura de preços, níveis observados e indicadores solicitados a partir de série, imagem ou descrição fornecida. Use para análise gráfica com condições e invalidação, sem previsão, probabilidade inventada, preço-alvo ou sinal de operação.
---

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

- **Sem imagem nem série**: com o CaptaMais conectado, `analise_ativo` traz o histórico do ativo. Confira a periodicidade que veio antes de calcular. Se for mensal, a leitura é mensal: indicador que o assessor pediu em outra escala (ex.: IFR de 14 dias no gráfico diário) fica pendente, com o pedido da série ou do print na escala certa. Não converta mensal em diário.
- **Escala declarada**: toda leitura abre dizendo ativo, período, escala e fonte. Se o campo "Ativo, período e escala" veio incompleto, pergunte só a escala.
- **Ordem da entrega**: base e limites da entrada · estrutura de preços · níveis com o critério · indicadores pedidos, com parâmetros · condições e o que invalidaria a leitura · leitura para o cliente.
- **Leitura para o cliente**: descreva o que o preço fez no período ("oscilou entre X e Y, com fonte e data"), sem dizer para onde vai. Se ele perguntar "vai subir?", a resposta pronta é que gráfico descreve o passado e que a decisão volta ao objetivo e ao prazo dele.
