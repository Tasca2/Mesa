---
name: pauta-de-conteudo
description: Descobre o que postar no Instagram do assessor e fecha o ciclo do conteúdo. Estuda os perfis de referência que ele acompanha (pelo que ele envia), levanta o que o público dele pergunta, cruza com o momento (mercado, calendário, temas que mais geram interação no relatório FInfluence da ANBIMA) e entrega ideias ranqueadas, com a primeira já aberta. Também lê os números dos posts dele para decidir o que repetir. Use antes de criar post, carrossel, Reels ou a semana de posts, e quando ele pedir para estudar perfis ou avaliar os próprios posts. Conteúdo educativo, sem recomendação de ativo nem promessa de retorno ou de alcance.
---

# Pauta de conteúdo: o que postar agora

## Objetivo
Trocar "o que eu posto?" por poucas ideias bem escolhidas: sobre o que o público do assessor realmente quer saber, por que vale falar disso agora, o que já funcionou nos perfis que ele acompanha e o que a pessoa leva ao terminar de ver. Impacto vem de utilidade e momento, não de assunto da moda.

## O ciclo na Mesa
1. **Estudar perfis de referência**: o que funciona nos perfis que ele acompanha. Vira a ficha "Minhas referências", guardada no perfil da Mesa.
2. **Ideias para postar hoje**: 5 ideias ranqueadas, a primeira já aberta.
3. **Semana de posts pronta** (skill `calendario-de-conteudo`) e **Criar um post**: os posts criados, com imagens geradas por `mesa_carrossel`.
4. **Como foram meus posts**: os números dos posts dele decidem o que repetir na semana seguinte e atualizam a ficha.

## O que você enxerga (e o que não)
- **Você não entra no Instagram**: não há login, e a janela da Mesa não abre páginas do Instagram. Você vê o que o assessor manda:
  - **prints** anexados na conversa (post, capa, legenda, números visíveis, tela de estatísticas);
  - **legendas** coladas no pedido ou na conversa;
  - **links**: servem para saber de qual perfil e de qual post se trata. Sem print ou legenda, você não sabe o que o post diz;
  - a ficha **"Minhas referências"** que vem de `mesa_perfil` (campo `referencias`).
- **Conector de redes sociais** (Metricool, Buffer ou outro): só conta se uma ferramenta dele aparecer nesta conversa. Na janela da Mesa não aparece; no Claude Desktop, pode aparecer. Sem a ferramenta, diga em uma linha que o conector não está ligado aqui e siga com o que foi enviado.
- **Nunca descreva post que você não viu**, nunca estime alcance, salvamentos ou "está bombando" sem número, e nunca invente perfil, @ ou número de seguidores. Na falta do material, peça: "mande de 3 a 5 prints de posts de cada perfil, ou cole as legendas e os links".
- A busca na web serve para achar o perfil e as dúvidas do público, não para afirmar número de engajamento de ninguém.

## Temas que mais geram interação: relatório FInfluence (ANBIMA)
Fonte: ANBIMA, FInfluence, 11ª edição, feita com o Ibpad, publicada em 16/11/2026, período de 1º/1 a 30/6/2026. Página: https://www.anbima.com.br/pt_br/especial/influenciadores-de-investimentos.htm · Notícia: https://www.anbima.com.br/pt_br/noticias/videocasts-de-financas-tem-39-6-mais-visualizacoes-que-outros-videos-no-youtube-aponta-finfluence.htm
- Universo: 937 influenciadores de investimento, 1.930 perfis no Facebook, Instagram, X e YouTube, 349,1 milhões de seguidores e inscritos, 483,3 mil publicações e cerca de 1,5 bilhão de interações no semestre. Média de 3.204 interações por publicação.
- Instagram: "as interações por publicação no Instagram cresceram 15%" sobre a edição anterior; no gráfico "Engajamento médio por rede social", o Instagram passou de 1,7 mil (10ª edição) para 2 mil (11ª).
- Interações por publicação, por produto citado: previdência privada 9,8 mil · poupança 9,4 mil · renda fixa 8,1 mil · fundos 7,9 mil · FIIs 6,8 mil · ouro 6,1 mil · mercado de câmbio 5,2 mil · commodities 4,9 mil · ações 4,2 mil · criptomoedas 4 mil. As menções à previdência privada cresceram mais de 650% no semestre, partindo de uma base menor.
Como usar: é um sinal do que o público de finanças procura e comenta, no conjunto dos perfis monitorados. Cite sempre "ANBIMA, FInfluence 11ª edição, 16/11/2026". Não vale como previsão de alcance do post do assessor, nem como motivo para falar de um produto que o público dele não usa.

## Entradas
- Perfil (`mesa_perfil`): atuação, público, tom, o que evita, praça e "Minhas referências". Público vazio: pergunte **uma** coisa ("para quem você quer falar nesta semana?").
- O que vier no pedido: perfis que ele acompanha, links e legendas, dúvidas de clientes, posts dele que mais salvaram ou geraram conversa, e os anexos.
- A data de hoje (vem no pedido). Ela decide o gatilho do momento.

## Ideias para postar hoje: método
1. **Demanda do público** (3 a 5 sinais): dúvidas que ele ouve de clientes (o sinal mais forte, porque é real); dúvidas que se repetem na busca (`WebSearch`), com link e data; os posts de referência que ele mandou. Cada sinal com a origem e a data.
2. **Momento atual** (2 a 4 gatilhos, todos com data): `painel_macro` para o dado novo do dia e a agenda de divulgações; calendário do público (13º, fim de ano, declaração de imposto, prazo de previdência), só o que você confirmou em fonte, senão `[CONFERIR]`. Notícia de mais de umas duas semanas é só pano de fundo.
3. **Cruzar e gerar 6 a 8 ideias**, cada uma ligando uma dúvida real a um gatilho de agora, e quando houver, a um formato que funcionou nos perfis de referência (adaptado, nunca copiado).
4. **Nota de 0 a 10**: cada critério vale de 0 a 2.
   - **Dor real**: responde a uma dúvida que o público tem, não a um assunto que o assessor gosta.
   - **Por que agora**: existe um motivo datado para ver isto esta semana.
   - **Utilidade imediata**: a pessoa entende ou consegue fazer algo concreto (comparar, calcular, perguntar ao banco, organizar), sem receber orientação de investimento.
   - **Retenção**: há gancho na primeira tela ou nos 3 primeiros segundos (erro comum, número com fonte, pergunta que a pessoa já se fez).
   - **Salvável ou compartilhável**: serve como consulta (checklist, comparação, passo a passo) ou como conversa com o cônjuge ou o sócio.
   Ficam as 5 melhores, com 7 ou mais; nada fica com 0 em dor real. Ideia que só funciona com recomendação de ativo sai.
5. **Abrir a ideia 1**: título da capa, roteiro slide a slide (carrossel de capa, 5 a 7 slides e fechamento) ou cena a cena (Reels de 30 a 45 segundos), legenda com chamada e 5 hashtags. Pergunte se ele quer as imagens agora; se sim, gere com `mesa_carrossel` variando os tipos de slide (numero, lista, comparacao, passos, citacao).
6. **Como medir em 48 horas**: salvamentos, envios e respostas pesam mais que curtida. Compare com a média dos últimos posts dele só se ele informou os números.

## Estudar perfis de referência
1. Sem print, legenda ou conector, **não analise**: diga o que precisa (3 a 5 prints ou legendas por perfil, até 10 perfis) e pare. Pode adiantar, com fonte, o que o FInfluence mostra sobre temas.
2. Para cada post visto, uma linha: perfil · data (se aparecer) · formato · tema · gancho da primeira tela · estrutura (quantos slides, sequência) · chamada final · números visíveis no print (curtidas, comentários, visualizações; alcance e salvamentos o print público não mostra).
3. **Padrões**: o que se repete em 2 ou mais posts (tipo de capa, tamanho, sequência, chamada). Diga em quantos posts apareceu e como adaptar ao perfil do assessor **sem copiar** texto, arte ou bordão.
4. **Espaços vazios**: 3 dúvidas do público dele que nenhum desses perfis está respondendo.
5. **Ficha "Minhas referências"** (até 15 linhas): perfis (@), padrões que funcionam, ganchos que valem adaptar, temas a evitar. Mostre a ficha e **pergunte antes de gravar**. Com o ok, grave com `mesa_perfil` (`salvar.referencias`): a ficha nova substitui a anterior, então junte o que já estava guardado e ainda vale.

## Como foram meus posts
1. Use só números que ele mandou (prints das estatísticas, números colados ou o conector). **Sem número, não avalie o post**: peça os prints das estatísticas de cada post e pare. Para dizer onde achar os números, use só o que a Central de Ajuda da Meta confirma: no Meta Business Suite, selecione a publicação para ver os insights dela (artigo 942827662903020, lido em 18/11/2026). Não cite botão ou menu do aplicativo do Instagram que você não confirmou.
2. Tabela por post: data, formato, alcance, salvamentos, envios, comentários, seguidores ganhos e uma leitura curta. Campo que não veio fica "não informado".
3. Contas só com os números dados (ex.: salvamentos por mil contas alcançadas), com a conta à vista. Poucos posts não provam regra: diga que é uma indicação.
4. Repetir e parar (até 3 de cada, com o número que sustenta) e até 3 testes para a semana (hipótese, como testar, o que medir).
5. Proponha a atualização da ficha "Minhas referências" e **pergunte antes de gravar**.

## Compliance
- A ideia explica mecanismo, custo, prazo ou risco; não diz o que a pessoa deve comprar, vender ou manter e não promete retorno.
- Não promete alcance, seguidores ou clientes: o resultado depende de execução, constância e do público.
- Não use dado de cliente, nome ou caso real identificável; trate dúvidas como padrões gerais.
- Não publica, não agenda e não envia nada sozinho.

## Exemplo (formato, sem dados reais)
| Ideia | Formato | Dor do público | Por que agora | Gancho da primeira tela | Nota |
|---|---|---|---|---|---|
| O que fazer com o 13º antes de gastar | Carrossel | "Recebi o 13º e não sei se pago dívida, guardo ou invisto" | Pagamento da segunda parcela [CONFERIR: data e fonte] | "Antes de gastar o 13º, responda isto" | 2·2·2·2·1 = 9 |
