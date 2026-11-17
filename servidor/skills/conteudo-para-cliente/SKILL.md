---
name: conteudo-para-cliente
description: Produz conteúdo financeiro educativo no formato, nível e voz do usuário, com fontes e revisão de linguagem. Use para post, newsletter, roteiro ou explicação para audiência; não para recomendação individual, promessa de retorno ou publicação automática.
---

# Conteúdo educativo para cliente

Revisão: 22/09/2026.

Produza a peça pedida, com linguagem adequada à audiência e explicação do mecanismo financeiro.

## Contexto que muda o texto

Aproveite tema, formato, extensão, público, dúvida original e exemplos aprovados já disponíveis. Se o tom estiver indefinido, use linguagem clara e direta; não bloqueie uma primeira versão por falta de manual de marca. Exemplo de texto aprovado ajuda mais que lista extensa de adjetivos.

Regras institucionais fornecidas delimitam o texto; não invente aprovação ou norma interna. Dado de mercado exige origem e data; se o pedido incluir pesquisa, procure fonte primária. Sem dado verificável, explique o mecanismo sem introduzir número de mercado.

## Quando falta o tema, ou o assessor pede ideias

Não invente um tema genérico. Carregue a skill `pauta-de-conteudo`, entregue 3 ideias ranqueadas (dor do público, por que agora, gancho e o que a pessoa leva) e, se o assessor não escolher, siga com a de maior nota e diga em uma linha por quê. Todo texto passa no teste de impacto: quem vê entende ou faz algo concreto depois, há motivo datado para ver agora e o gancho aparece nos 3 primeiros segundos.

## Composição

- Uma ideia central por peça curta; material longo pode desenvolver vários pontos com relação clara.
- Traduza termo técnico na primeira ocorrência, inclusive quando a audiência é experiente, com explicação breve.
- Separe observação de opinião e relação condicional. Cenário pode explicar mecanismo, mas não sugerir expectativa de ganho.
- Exemplos numéricos devem ser sintéticos e identificados, sem expectativa de resultado em investimento. Use exemplos de custo, prazo ou funcionamento quando possível.
- Mantenha a voz reconhecível em vocabulário, tamanho de frase e grau de formalidade, sem copiar fatos ou promessas de exemplos antigos.
- Versão curta, alternativas de abertura, apoio visual e explicação editorial só entram quando pedidos ou úteis ao objetivo. Não acrescente sete seções a uma mensagem de três linhas.
- Reel para tráfego pago: nos primeiros três segundos, tensão profissional ou prova concreta; resultado demonstrado antes do passo a passo; uma chamada final. Isso não autoriza promessa financeira nem gasto de anúncio.

## Revisão antes de entregar

Confira internamente se o texto indica o que uma pessoa deve fazer com seu dinheiro, associa ativo a compra/venda/manutenção ou promete/insinua resultado. Corrija antes de mostrar. Aviso no rodapé não torna uma promessa aceitável.

Citação de desempenho passado exige janela, fonte e explicação de que não determina desempenho futuro. Não transforme caso excepcional em expectativa.

Se for pedido parecer de revisão, mostre trecho, problema e reescrita. Se foi pedida peça pronta, entregue a versão corrigida e as fontes pertinentes, sem relatório interno de testes.

## Entrega completa, quando solicitada

1. Ideia central.
2. Audiência e contexto.
3. Texto principal.
4. Versão curta.
5. Checagem de linguagem.
6. Fontes com data.
7. Apoio visual sugerido, apenas se ajudar.

Pedido de ajuste “menos técnico”, “mais curto” ou “mais meu jeito” reaproveita a versão e altera o aspecto indicado. Não refaça pesquisa ou mude argumento sem necessidade. Não finalize sempre com pergunta genérica; pergunte sobre uma escolha concreta apenas quando melhorar a próxima versão.

## Modelo de saída para Instagram (Mesa do Assessor)

Entregue sempre, nesta ordem, cada item em bloco separado e pronto para usar:
1. **3 ganchos** para a primeira linha ou os 3 primeiros segundos (curiosidade, número concreto com fonte, erro comum). Escolha um e diga qual e por quê, em uma linha.
2. **Carrossel** (`legenda` + slides): capa com o gancho; 5 a 7 slides com uma ideia cada (título curto + até 2 linhas); fechamento com uma única chamada para ação. **Post único**: frase de impacto + apoio. **Reels** (`roteiro-video`): tabela cena · tempo · fala · texto na tela, 30 a 45 s, resultado ou prova antes do passo a passo.
3. **Legenda** (`legenda`): 3 a 5 linhas, a mesma ideia do gancho, 1 pergunta ou chamada final, até 5 hashtags relevantes. Sem promessa, sem "garantido", sem recomendação de ativo.
4. **Arte** (`imagem`): descreva a imagem de cada slide em uma linha (fundo conforme o estilo escolhido) e, se o assessor pediu imagens, gere com `mesa_carrossel`.
5. **Revisão das regras**: tabela curta trecho · problema · reescrita, ou "nada a ajustar". Identificação do profissional conforme a atuação e o aviso "conteúdo educativo, não é recomendação" no rodapé/legenda.
6. **Fontes e data** de qualquer número; sem fonte, explique o mecanismo sem número.

Exemplo de gancho (tema "3 erros ao investir em renda fixa"): "Você já olhou o imposto antes de olhar a taxa? Esse é o erro nº 1." — mecanismo, sem prometer ganho.

## Imagens e PDF (Mesa do Assessor)

- Carrossel ou arte de Instagram: depois de aprovar o texto, chame `mesa_carrossel` com os slides (capa, 5 a 7 de conteúdo, fechamento; título curto, texto de até 2 linhas, `destaque` só para número grande, `fonte` com órgão e data). O `rodape` leva a identificação do profissional conforme a atuação e o aviso "conteúdo educativo, não é recomendação". Informe a pasta das imagens e o PDF.
- Se a ferramenta falhar, entregue o texto de cada slide e diga em uma frase que as imagens não foram geradas.
- Resultado em PDF de qualquer peça: use `mesa_documento`.

## Limites

- Não produzir recomendação individual de compra, venda, manutenção ou alocação, nem promessa ou expectativa de retorno, mesmo em cenário hipotético.
- Dado de mercado exige fonte e data visíveis. Ausência é “não informado”; não é zero nem autorização para estimar. Cálculos derivados devem mostrar os dados e a fórmula.
- Usar rótulos genéricos e dados minimizados para pessoas; não solicitar identificadores, contas ou informações confidenciais. Não usar informação relevante ainda não pública nem dados obtidos no trabalho de assessoria. Não expor empregador ou clientes do operador.
- Esta skill prepara análise ou rascunho. Não envia mensagem, publica, movimenta carteira, contrata serviço nem gasta créditos.
