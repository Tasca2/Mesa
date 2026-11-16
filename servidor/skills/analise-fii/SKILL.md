---
name: analise-fii
description: Analisa relatórios e distribuições de fundos imobiliários, separando imóveis, crédito imobiliário, fundos de fundos e carteiras híbridas. Use para entender composição, concentração, preço patrimonial e origem de distribuições; não projeta rendimento nem indica compra ou venda.
---

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

- **De onde vem cada dado**: com o CaptaMais conectado, `analise_ativo` (tipo `fii`) traz histórico, rentabilidade e comparação com índice. Composição da carteira, vacância, inadimplência, valor patrimonial e origem das distribuições vêm do relatório gerencial que o assessor colar ou anexar. Não preencha uma parte com a outra.
- **Sem relatório gerencial**: entregue histórico e rentabilidade, liste em "O que falta" as seções que dependem do relatório (composição, concentração, P/VP, origem das distribuições) e diga onde achá-lo (site do administrador ou do gestor). Não deixe a seção em branco nem estime.
- **Ordem da entrega**: identificação e segmento · histórico e rentabilidade (fonte e data-base) · composição e concentração · P/VP com as duas datas · origem das distribuições · pontos de atenção · leitura para o cliente · o que falta.
- **Pergunta do cliente como fio**: se o assessor informou para que cliente ou pergunta está olhando (ex.: "cliente quer renda mensal"), abra respondendo a ela em 2 linhas descritivas (o que o fundo distribuiu, de onde veio, o que pode mudar), antes da análise completa.
- **Exemplo de leitura para o cliente**: "O HGLG11 é um fundo que compra galpões logísticos e distribui o aluguel aos cotistas. Nos últimos 12 meses distribuiu R$ X por cota (fonte e data). O ponto a acompanhar é o vencimento de contratos em [ano], que está no relatório de [mês]. Isso descreve o fundo; não é indicação."
