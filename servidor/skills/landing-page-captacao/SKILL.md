---
name: landing-page-captacao
description: Monta a landing page de captação que o post do Instagram vai divulgar (link na bio, anúncio ou resposta de story), no formato da Landing Page do CaptaMais, e cria o rascunho na conta do assessor pelo domínio do CaptaMais. Use quando o assessor quiser captar clientes a partir de um post, carrossel ou Reels, ou pedir uma landing page, página de captura ou link para a bio. Educativa e de convite para conversa, sem promessa de retorno nem recomendação de produto.
---

# Landing page de captação (formato CaptaMais)

## Objetivo
Dar ao post um destino claro: uma página curta que explica quem o assessor é, o que a pessoa ganha ao conversar com ele e um formulário simples. Os contatos caem no CRM do CaptaMais do assessor.

## O que existe no CaptaMais (use só isto, não invente recurso)
- A página fica no domínio do CaptaMais: `https://captamais.me/landingpage/<link>`. **Não há domínio próprio do assessor neste fluxo.** Se ele pedir domínio próprio, diga que hoje o endereço é o do CaptaMais e que o domínio próprio não é feito por aqui.
- O `<link>` tem 3 a 48 caracteres: letras minúsculas, números e hífen (ex.: `henri-diagnostico`). Cada conta tem **uma** landing page.
- Quatro modelos (mesmo conteúdo, muda o visual):
  - `diagnostico`: escuro, título grande, números de destaque, "para quem é" (PF e PJ), como funciona e formulário com patrimônio e objetivo. O mais completo; bom para convidar para um diagnóstico.
  - `direto`: claro, formulário no topo, feito para tráfego pago e para quem chega do Instagram com pressa.
  - `confianca`: escuro, foto em destaque, relacionamento e solidez.
  - `autoridade`: depoimentos, credenciais e instituições de custódia no centro.
- Os leads entram no CRM, na etapa do layout "Landing Page" (campo `crmLayoutName`).

## Entradas
- Perfil (`mesa_perfil`): nome, escritório, atuação, tom, público, o que evita. Não pergunte o que já está lá.
- O post de origem (tema, objetivo, gancho), se houver.
- Pergunte só o que faltar e que muda a página: o que a pessoa recebe ao deixar o contato (ex.: diagnóstico gratuito de 30 minutos), WhatsApp de contato, Instagram, e o `<link>` desejado (se não disser, proponha um, derivado do nome).
- Foto e imagens: você não envia arquivo. Deixe `profilePhotoUrl` e `socialProofPhotoUrl` vazios e diga que o assessor sobe a foto na tela Landing Page.

## Regras de conteúdo
- Uma promessa por página: o que a pessoa leva ao falar com o assessor (clareza, diagnóstico, método), nunca rentabilidade, "ganhe", "garantido" ou recomendação de produto.
- A página deve continuar o post: o mesmo gancho e a mesma dor, em outras palavras. Quem clicou já leu o post.
- Linguagem simples, frases curtas, na voz do perfil. Sem jargão sem tradução.
- Formulário: peça o mínimo. Padrão: nome, e-mail, telefone/WhatsApp. Acrescente patrimônio (faixas) e objetivo só no modelo `diagnostico` ou se o assessor quiser qualificar. Cada campo a mais derruba as respostas.
- Depoimentos, números de carteira e selos só entram se o assessor forneceu e pode comprovar. Sem isso, deixe o campo vazio e liste em "Conferir". Nunca invente cliente, resultado, prêmio ou número de patrimônio.
- Inclua a identificação do assessor (nome, escritório e vínculo/credencial que ele informou) e o aviso de que o conteúdo é educativo e não é recomendação de investimento. Marque `[CONFERIR]` para o que depende das regras do escritório e da CVM.

## Campos e limites (nomes exatos do CaptaMais)
`template` (diagnostico, direto, confianca ou autoridade) · `publicName` (até 120) · `headline` (até 120, obrigatório) · `bio` (até 2000) · `productTitle` (até 120) · `productDescription` (até 2000) · `differentiators` (até 2000, uma linha por item) · `custodyInfo` (até 800) · `socialProofText` (até 1200) · `ctaTitle` (até 80, texto do botão; padrão "Concluir") · `instagramUrl`, `linkedinUrl`, `whatsapp` · `redirectUrl` (https, para onde a pessoa vai depois de enviar; vazio se não houver) · `crmLayoutName` ("Landing Page") · `leadFields` (lista entre name, email, phone, state, city, profession, wealth, goal) · `leadCustomQuestions` (perguntas livres) · `wealthOptions` (faixas) · só no modelo `diagnostico`: `accent` (hex), `tagline`, `badges` (lista), `responseTime`, `stats` (lista de `{value,label,detail}`), `statsNote`, `audienceTitle`, `audienceIntro`, `audiences` (lista de `{tag,title,subtitle,items,note}`), `stepsTitle`, `steps` (lista de `{title,text}`), `formTitle`, `formIntro`.

Respeite os limites: texto maior que o limite é cortado na gravação.

## Método
1. Carregue o perfil e confirme o post de origem. Escolha o modelo (se o assessor não escolheu: `diagnostico` para convidar para conversa, `direto` para vir de anúncio ou story).
2. Escreva o conteúdo campo a campo, na ordem da página: título, apresentação, o que a pessoa recebe, como funciona, para quem é, formulário.
3. Conferência: título até 120, nada de promessa de retorno, identificação e aviso presentes, nenhum dado inventado.
4. **Mostre o texto da página primeiro**, por seção, em linguagem normal (sem JSON).
5. **Crie o rascunho** chamando `landing_captamais` com o `slug` e o `conteudo` nos nomes exatos acima. Ele só cria rascunho: **não publica** e **não altera** uma página que já exista.
   - `ok`: informe o endereço que a página terá depois de publicada e diga os 3 passos do assessor: abrir Landing Page no CaptaMais (`https://captamais.me/landing-page`), subir a foto e revisar, publicar.
   - `ja_existe`: não insista. Diga que a conta já tem landing page (cite o link devolvido), entregue o texto pronto para colar na tela Landing Page e pergunte se prefere trocar o conteúdo lá.
   - `slug_em_uso`: proponha dois outros links e tente uma vez com o escolhido.
   - `sem_conexao` ou rota indisponível: diga em uma frase que sem o CaptaMais conectado a Mesa não grava a página; entregue o texto pronto para colar.
6. **Ligue ao post:** entregue a chamada para o post e a legenda ("link na bio", ou "responda este story"), com o endereço final `captamais.me/landingpage/<link>`, e o texto curto do botão do story. Não diga que a página está no ar enquanto não estiver publicada.

## Modelo de saída
**Em uma frase** — modelo escolhido, a promessa da página e o link.
**A página, seção a seção** — título, apresentação, o que a pessoa recebe, como funciona, para quem é, formulário e botão.
**Rascunho no CaptaMais** — resultado de `landing_captamais` e os passos do assessor para publicar.
**Chamada no post** — legenda, "link na bio" e texto do botão do story.
**Conferir** — foto, depoimentos e números que faltam, aviso e identificação, regras do escritório, domínio próprio (se pedido).

## Cuidados
- Nunca publique e nunca diga que publicou. Quem publica é o assessor, na tela do CaptaMais.
- Não peça nem registre dado de cliente. Dados pessoais de quem preencher o formulário entram direto no CRM do assessor; a Mesa não os vê.
- Sem promessa de retorno, sem recomendação de ativo, sem escassez falsa ("últimas vagas").
