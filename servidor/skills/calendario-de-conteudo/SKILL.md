---
name: calendario-de-conteudo
description: Deixa a semana de posts do Instagram do assessor pronta para programar. Cria 3, 5 ou 7 posts. As imagens dos carrosséis saem com mesa_carrossel e ficam na pasta da semana. Junto vêm os roteiros de Reels, as legendas e os stories, com dia, hora e o caminho para programar. Conteúdo educativo, sem recomendação de ativo nem promessa de retorno ou de alcance.
---

# Semana de posts pronta

## Objetivo
Trocar "o que eu posto esta semana?" por uma pasta com os posts criados, uma tabela de dia e hora e o caminho para programar. O assessor revisa, aprova e programa.

## Antes de começar
- Carregue a skill `pauta-de-conteudo` para escolher os temas. Ela explica o ciclo e o que você enxerga: prints, legendas e links que ele anexa ou cola. Você não entra no Instagram. Use também a ficha "Minhas referências" do perfil (`mesa_perfil`) e o relatório FInfluence da ANBIMA, sempre com a edição e a data.
- **Posts**: use o número que veio no pedido (3, 5 ou 7). Sem número, faça 5, de segunda a sexta.
- **Programar**: siga o caminho que veio no pedido (Meta Business Suite, conector ligado ao Claude ou só quero a pasta).
- **Semana**: a que veio no pedido. Sem semana no pedido, use a segunda-feira seguinte à data de hoje.
- **Perfil**: tom, público, assinatura e o que ele evita vêm de `mesa_perfil`. Se faltar algo essencial, pergunte **uma** coisa. O resto sai com `[CONFERIR]`.

## Método
1. **Fio e grade da semana.** Monte o mix conforme o objetivo:
   - educativo: um conceito por post;
   - mercado: o post cai no dia do dado, pela agenda de divulgações do `painel_macro`, com fonte e data;
   - prova e relacionamento: pergunta comum respondida, sem dado de cliente;
   - convite: conversa ou conteúdo gratuito.

   Varie os formatos: carrossel, Reels e post único.
2. **Horário.** Use só os números do assessor: prints das estatísticas ou os "Horários ativos" que ele mostrou. Sem número, proponha um horário e escreva "hipótese".
3. **Carrosséis.** Gere cada um com `mesa_carrossel` no formato feed.
   - Estrutura: capa, 5 a 7 slides e o fechamento com a chamada.
   - Limite: até 10 imagens por post. O Meta Business Suite aceita até 10 fotos no Instagram.
   - Varie os tipos de slide: numero, lista, comparacao, passos e citacao.
   - Use o parâmetro `pasta` = "Semana de DD-MM/N-dia-tema".
     - DD-MM é a data da segunda-feira da semana.
     - N é a ordem do post.
     - O dia vai abreviado: seg, ter, qua, qui, sex, sab ou dom.
     - O tema tem de 1 a 3 palavras, sem acento.
   - Exemplo: "Semana de 23-11/1-seg-previdencia". Todos os posts da semana vão para a mesma "Semana de …".
   - O rodapé leva a identificação do profissional e o aviso "conteúdo educativo, não é recomendação".
   - Todo slide com número de mercado leva o campo `fonte` (órgão e data), inclusive a capa. A fonte sai no pé da imagem.
   - Se a trava de palavras barrar, reescreva o slide. `termosConfirmados` só vale quando o assessor afirmou o termo.
   - Se a resposta trouxer "avisos" (por exemplo, perfil sem foto), conte ao assessor.
4. **Reels.**
   - Gancho dos 3 primeiros segundos.
   - Roteiro de 30 a 45 segundos em tabela: cena, tempo, fala e texto na tela.
   - Capa feita com `mesa_carrossel`: 1 slide do tipo capa, na pasta do post. Se a capa tiver número de mercado, preencha `fonte` com órgão e data.
   - O vídeo é gravado pelo assessor ou editado na tarefa "Editar um vídeo (Reels)". Segundo a Central de Ajuda da Meta, o Meta Business Suite não cria Reels a partir de fotos quando o post é para o Instagram.
5. **Post único.** Gere 1 slide com `mesa_carrossel`, na pasta do post.
6. **Legendas.** Escreva uma peça para cada post:
   - gancho na primeira linha;
   - corpo curto;
   - chamada fácil de responder;
   - 5 hashtags;
   - o aviso educativo e a identificação do profissional.

   Fique bem abaixo do limite da Meta: 2.200 caracteres e 30 hashtags por legenda.
7. **Stories.** Faça uma sequência de 3 telas para o dia do post principal: abertura com a pergunta, um ponto do conteúdo e a chamada para o post.
8. **Fim.** Depois da última peça gerada, chame `mesa_andamento` com concluido=true e entrega.arquivo = o PDF do último carrossel. Diga ao assessor onde ficou a pasta "Semana de …".

## Programar
**Tabela de programação**: uma linha por post. Colunas: Post | Pasta e arquivos | Dia e hora | Legenda. Na coluna da legenda, indique qual peça de legenda vai no post.

**Meta Business Suite** (Central de Ajuda da Meta, artigo 2223502627919449, lido em 18/11/2026):
1. Acesse o Meta Business Suite > Conteúdo > Criar post.
2. Escreva o post: cole a legenda e adicione as imagens da pasta, na ordem (slide-01, slide-02…).
3. Ative a opção para Programar opções.
4. Escolha a data e a hora. Para usar os horários em que o público está mais ativo, clique em Horários ativos.
5. Clique em Programar.
6. Confira os posts programados na aba Planner ou em Conteúdo > Posts e reels > Programados.

Outros caminhos, da mesma página:
- **Rascunho**: "Concluir mais tarde" guarda o post em Conteúdo > Posts e reels > Rascunhos.
- **Reprogramar**: em Programados, clique em Opções > Gerenciar post > Reprogramar post.

Pela página de posts no computador (artigo 942827662903020, lido em 18/11/2026):
- É preciso ter controle total ou permissão de conteúdo na conta do Instagram.
- O limite para postar no Instagram é de 10 fotos.
- "Horários ativos" usa a atividade dos seguidores nos últimos sete dias.

Não descreva tela, botão ou menu fora desses passos. Se o assessor disser que a tela dele está diferente, peça um print.

**Conector ligado ao Claude**: só vale se uma ferramenta do conector (Metricool, Buffer ou outro) aparecer nesta conversa.
- Mostre a tabela de programação e pergunte se pode agendar. Agende post por post, só depois do ok.
- Na janela da Mesa o conector não aparece. Diga isso em uma linha e entregue os passos do Meta Business Suite.

**Só quero a pasta**: entregue a tabela de programação e o caminho da pasta, sem o passo a passo.

## Modelo de saída (nesta ordem)
1. Em uma frase (negrito): o fio da semana e o post em que você mais aposta.
2. A grade da semana em UMA tabela. Colunas: Dia e hora | Tema | Formato | Objetivo (alcance, autoridade, conversa ou contato) | Gancho | De onde veio a ideia.
3. As peças, cada uma separada e sem comentário dentro:
   - os carrosséis gerados, com a pasta de cada um;
   - os roteiros de Reels;
   - as legendas;
   - os stories.
4. A tabela de programação e o caminho escolhido.
5. Conferir: sempre a última coisa da resposta, em texto simples, sem título, negrito ou tabela. Até 5 itens: dados, datas, horários marcados como hipótese e regras do escritório.

## Limites
- Não recomende compra, venda ou alocação de ativo. Não prometa retorno, alcance, seguidores ou clientes: o resultado depende do público e da constância.
- Número de mercado só entra com fonte e data. O FInfluence entra com "ANBIMA, FInfluence 11ª edição, 16/11/2026".
- Não use dado nem nome de cliente.
- Não publique nem agende nada sem o ok do assessor.
