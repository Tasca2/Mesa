# Cálculos de renda fixa e limites de aplicação

Leia esta referência quando houver equivalência de taxas ou valores. O cálculo precisa representar o contrato; precisão aritmética não substitui calendário, regra fiscal ou fluxo correto.

## Base e calendário

Registre aplicação/liquidação, vencimento ou data da comparação, convenção de inclusão das datas, dias corridos, dias úteis no calendário contratual, base anual e arredondamento. Não use dias corridos/365 no lugar de dias úteis/252 sem suporte no título. Um prazo fiscal e um prazo de capitalização podem usar contagens diferentes.

Não suponha que 720 dias corridos são dois anos de capitalização, nem que um feriado local é feriado de negociação. Sem calendário adequado, apresente fórmula com contagem pendente. Datas futuras e seus indexadores são desconhecidos; não preencha a trajetória.

## Fatores de acumulação

Todos os percentuais entram em decimal. Fator 1,05 significa capital multiplicado por 1,05 no intervalo informado, não promessa de resultado.

- Taxa efetiva fixa r e fração de ano t definida pelo contrato: F = (1+r)^t.
- Taxa diária efetiva do índice d_j e percentual p do índice expresso como multiplicador (110% = 1,10): F = produto de (1+p*d_j), **somente quando essa é a convenção do contrato**. Se a entrada é taxa anual i_j em base 252, a conversão diária é (1+i_j)^(1/252)-1; isso não autoriza usar taxa atual em dias futuros.
- Inflação mais taxa real pode exigir fatores multiplicados, defasagem do índice, pró-rata e regras de aniversário. Use o índice e a fórmula do título; não some percentuais automaticamente.
- Cupons e amortizações são fluxos separados em suas datas. Comparar só um fator final pode ignorar reinvestimento e imposto intermediário. Não use o auxiliar simples nesses casos.

## Tributação e equivalência

Para caso simples sem custos, sem IOF e com imposto único a sobre ganho positivo no resgate:

    F_liquido = 1 + max(F_bruto - 1, 0)*(1-a) + min(F_bruto - 1, 0)

Não há crédito fiscal automático quando o fator é inferior a um. A alíquota a é entrada verificada, não escolhida pelo programa.

Para igualar fator líquido alvo L >= 1, no mesmo prazo e sob essas mesmas condições:

    F_bruto_equivalente = 1 + (L-1)/(1-a)
    r_bruta_equivalente = F_bruto_equivalente^(1/t) - 1

Se o alvo resulta de taxa efetiva isenta r_i, L = (1+r_i)^t. Dividir r_i/(1-a) só coincide neste modelo quando t=1 (ou em casos triviais). Mesmo t=1 não transforma automaticamente percentual do CDI em taxa efetiva anual.

Equivalente em percentual do CDI requer resolver p usando a **mesma sequência diária realizada** e a acumulação contratual, por busca numérica monotônica quando aplicável. Não divida uma taxa anual equivalente pelo CDI anual e rotule o resultado como exato.

## Custos e regras não cobertas pelo auxiliar

IOF, cupons, come-cotas, deduções tributárias, custódia diária, tarifas, spread de compra/venda e compensação de perdas precisam de tratamento próprio conforme documentos e norma vigente. Não acrescente um desconto arbitrário ao auxiliar para simular isso. Informe o que está dentro e fora da conta.

O resultado é uma comparação matemática sob dados e condições definidos. Fluxo contratual, valor histórico apurado e eventual premissa do usuário devem ser identificados separadamente. Nunca apresentar conta condicional como expectativa de recebimento.

## Auxiliar local

O arquivo ../scripts/calculos.py usa apenas a biblioteca padrão do Python 3.11 ou superior, não acessa rede, não grava arquivos e não escolhe premissas. Aceita um JSON local com operação e parâmetros declarados; imprime o resultado e limitações. Os percentuais são decimais, preferencialmente strings para preservar a entrada.

Operações:
- fixed: rate, year_fraction.
- indexed: daily_rates (lista não vazia), multiplier.
- net: gross_factor, tax_rate.
- equivalent: target_net_factor, tax_rate, year_fraction.

Na raiz desta skill, execução técnica:

    python scripts/calculos.py --input caminho-do-caso.json
    python scripts/test_calculos.py

O primeiro comando só é apropriado após confirmar que o caso atende às condições acima. O segundo usa dados sintéticos para testar identidades e rejeição de entradas inválidas; não consulta alíquotas vigentes nem valida contrato.
