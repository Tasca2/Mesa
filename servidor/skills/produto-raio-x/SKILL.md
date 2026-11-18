---
name: produto-raio-x
description: Destrincha um produto de investimento que chegou da mesa de produtos (CDB, LCI, LCA, CRI, CRA, debênture, fundo, previdência, COE, oferta pública ou título público) a partir da lâmina, do termo ou do e-mail, com as condições citadas pela página, a comparação na mesma base líquida de imposto, garantia, liquidez, custos e o que o material deixa de fora. Analisa o produto; não recomenda compra, venda nem alocação a um cliente e não promete retorno.
---

# Raio-X de produto

Revisão: 18/11/2026. Fatos legais conferidos na fonte primária em 18/11/2026 (tabela abaixo).

O assessor recebe o produto da mesa e precisa entender antes de levar ao cliente: o que é, como paga, quanto custa, o que pode dar errado, para que situação de cliente encaixa e como apresentar. A análise é completa e direta; o limite é não dizer a uma pessoa que compre, venda ou aloque e não prometer retorno.

## Método

1. **Condições vêm do material.** Leia a lâmina, o termo ou o e-mail inteiro e cite a página ou o trecho de cada condição. Condição que não está no material entra como "sem dado", nunca de memória. Material sem data: diga isso na ficha.
2. **Identifique o produto e quem responde por ele.** Emissor (banco, empresa, securitizadora), gestor e administrador (fundo), coordenador (oferta), garantidor. Emissor de capital aberto: `analise_ativo` (tipo acoes, pesquisa=true) e `documentos_cvm`. Fundo: `analise_ativo` com tipo fundo e o CNPJ, e a skill `leitura-de-lamina`.
3. **Como paga.** Fluxo de juros, amortização e vencimento; nos estruturados, os cenários que o próprio material define (capital protegido ou não, barreira, teto, participação).
4. **Na mesma base.** Título público de prazo parecido com `taxas_tesouro` (cite a data base; o arquivo não diz se o título está à venda) e CDI, Selic e IPCA esperado com `painel_macro`. CDI e IPCA futuros são hipótese rotulada, não previsão. Conta escrita na nota (fórmulas abaixo).
5. **Garantia, liquidez e risco.** FGC só para o que está na lista do regulamento; liquidez antes do vencimento tem preço de mercado (pode ser menor que o aplicado); concentração no emissor; subordinação; rating com agência e data.
6. **Custos e remuneração.** O que o cliente paga (taxas, spread embutido, carregamento) e, se o assessor informou, quanto a distribuição recebe.
7. **O que o material deixa de fora.** Compare o que a lâmina diz com o que a análise precisa: custo de sair antes, comparação com título público, data das taxas, remuneração da distribuição, fatores de risco que estão só no prospecto.

## O que procurar em cada tipo

| Produto | Ler no material | Atenção |
|---|---|---|
| CDB, LCI, LCA | Emissor e conglomerado, indexador, taxa, carência, liquidez diária ou só no vencimento | Limite do FGC por conglomerado; LCI e LCA isentas para pessoa física; liquidez diária com taxa menor |
| CRI, CRA, debênture | Emissor ou devedor, garantia (real, fidejussória ou nenhuma), rating, amortização, resgate antecipado, se é incentivada | Sem FGC; preço de mercado antes do vencimento; concentração no devedor |
| Fundo ou previdência | Use `leitura-de-lamina`: classe, taxas, mandato, resgate (cotização e liquidação), tributação | Custo sobre custo; histórico não determina retorno futuro |
| COE ou estruturado | Cenários do material, capital protegido ou em risco, barreira, teto, prazo, emissor | Sem FGC; ganho limitado; saída antes do prazo pelo preço do emissor |
| Oferta pública | Prospecto e lâmina da oferta: público-alvo, taxa teto e formação da taxa, período de reserva, liquidação, fatores de risco | Taxa final só depois do procedimento; ler os fatores de risco do prospecto |
| Título público | `taxas_tesouro`: taxa, preço, fluxo e data base | Venda antes do vencimento a preço de mercado; Renda+ e Educa+ pagam em parcelas mensais |

## Fatos com fonte (consulta em 18/11/2026)

| Fato | O que diz | Fonte |
|---|---|---|
| FGC, limite por pessoa | R$ 250 mil por pessoa contra a mesma instituição ou o mesmo conglomerado | Regulamento do FGC (Anexo II à Resolução CMN nº 4.222/2013), art. 2º, § 2º, em fgc.org.br |
| FGC, teto global | R$ 1 milhão a cada quatro anos consecutivos, somando todas as instituições | Idem, art. 2º, § 3º |
| FGC, o que cobre | Depósitos à vista e de poupança, depósitos a prazo (CDB e RDB), letras de câmbio, letras hipotecárias, LCI, LCA, LCD e compromissadas de título de empresa ligada emitido após 8/3/2012 | Idem, art. 2º |
| FGC, o que não cobre | Instrumento com cláusula de subordinação e cotas de fundos (art. 2º, § 1º); debênture, CRI, CRA e COE não estão na lista do art. 2º | Idem |
| IR de renda fixa | 22,5% até 180 dias; 20% de 181 a 360; 17,5% de 361 a 720; 15% acima de 720 dias | Lei nº 11.033/2004, art. 1º, em planalto.gov.br |
| Isenção de IR para pessoa física | LH, CRI e LCI (art. 3º, II); CDA, WA, CDCA, LCA e CRA (art. 3º, IV) | Lei nº 11.033/2004, art. 3º |
| Debênture incentivada | Alíquota de 0% para pessoa física | Lei nº 12.431/2011, art. 2º, I |
| IOF | Resgate antes de 30 dias: 1% ao dia, limitado ao rendimento pela tabela do Anexo (96% do rendimento no 1º dia, 50% no 15º, 3% no 29º, zero a partir do 30º) | Decreto nº 6.306/2007, art. 32 e Anexo |
| IOF zero | LCA, CRA e CDCA (art. 32, § 2º, V); debêntures, CRI e letras financeiras (VI); resgate de fundos de ações (IV). CDB e LCI não estão nessa lista | Decreto nº 6.306/2007, art. 32, § 2º |
| Come-cotas | Fundos: tributação periódica no último dia útil de maio e de novembro; na regra geral, 15% na data da tributação periódica | Lei nº 14.754/2023 |
| MP do IR sobre aplicações | A Medida Provisória nº 1.303/2025 perdeu a vigência em 8/10/2025: não use as regras dela | Ato Declaratório do Presidente da Mesa do Congresso Nacional nº 67/2025 |

Fato que não está nesta tabela (carência mínima de LCI e LCA, regras de previdência, rating) vem do material ou da fonte primária, com a data; sem isso, "sem dado".

## Contas na mesma base

Escreva na nota a convenção (dias corridos com ano de 365 dias, ou dias úteis com ano de 252) e use a mesma para todos os produtos.

- Fator bruto no prazo: F = (1 + taxa ao ano)^(dias ÷ 365).
- Pós-fixado em % do CDI, com a hipótese de CDI constante: taxa ao ano ≈ percentual × CDI de hoje (aproximação; diga que é).
- IPCA + taxa: (1 + IPCA esperado do Focus) × (1 + taxa) − 1, com o IPCA rotulado como hipótese.
- Líquido de imposto: F líquido = 1 + (F − 1) × (1 − alíquota do prazo); taxa líquida ao ano = F líquido^(365 ÷ dias) − 1.
- Isento comparado com tributado: F bruto equivalente = 1 + (F líquido − 1) ÷ (1 − alíquota); taxa = F^(365 ÷ dias) − 1. O atalho "taxa ÷ (1 − alíquota)" só é exato para um ano: se usar, chame de aproximação.
- Equivale a % do CDI: taxa bruta (ou bruta equivalente) ao ano ÷ CDI de hoje ao ano, com a hipótese escrita.
- Prêmio sobre o título público: diferença, em pontos percentuais, entre a taxa do produto e a do título de prazo parecido no mesmo indexador, já na mesma base de imposto.

Mostre os fatores e o resultado com duas casas; refaça cada conta antes de escrever. Sem dado para uma conta, a célula fica "sem dado", com o motivo.

## Limites

- Análise do produto, sem recomendação de compra, venda ou alocação para uma pessoa e sem promessa ou expectativa de retorno, nem em cenário hipotético.
- Todo número com fonte e data. Taxa de material sem data vira ponto de atenção.
- Não usar dados pessoais de clientes; rótulos genéricos.
- Arquivo para o cliente sai sem o Conferir, sem o Próximo passo e sem orientação para o assessor.
