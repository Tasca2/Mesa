# Mesa do Assessor

A Mesa tem pedidos prontos para o dia a dia do assessor de investimentos (reuniões, retomada de leads, objeções, estudos de ativos, posts para Instagram), com dados do CaptaMais. Embaixo da tela fica uma conversa com o Claude, para ajustar cada pedido.

A instalação leva poucos minutos e tudo o que a Mesa precisa vem junto, inclusive o editor de vídeo.

## Primeiros 5 minutos

1. Abra a Mesa (**/mesa** no Claude) e diga seu nome e sua atuação. É só uma vez.
2. Clique em uma das três sugestões da tela inicial (por exemplo **Objeção do cliente**) e responda às perguntas.
3. Envie. Em 1 a 2 minutos o texto pronto aparece com os botões **Copiar** e **Copiar para WhatsApp**.
4. Peça um ajuste ali mesmo: **Mais curto**, **Mais formal**, **Mais próximo** ou **Revisar compliance**.
5. Depois, em **Completar perfil**, conte o seu público, o seu tom e cole 1 a 3 mensagens suas: os próximos textos saem do seu jeito.

Atalhos úteis: **Ctrl+K** busca qualquer tarefa pelo nome; **Histórico**, no alto da tela, reabre o resultado de uma rotina anterior; no menu **+**, **Copiar diagnóstico para o suporte** gera um resumo (sem seus dados) para você colar na conversa com a gente se algo falhar.

## Antes de começar

- **Claude Code instalado e com login feito** (claude.com/code). É nele que os pedidos da Mesa rodam, na sua conta. Só o aplicativo Claude Desktop não basta.
- **Windows 10 ou 11** (com o winget, que já vem no Windows 11) ou **Mac**.
- **Microsoft Edge ou Google Chrome** (o Windows já traz o Edge).
- Conexão com a internet durante a instalação.

O Python, o ffmpeg, o Node.js e o editor de vídeo **não precisam ser instalados antes**: o instalador da Mesa cuida de tudo.

## Instalar no Windows

1. Extraia o arquivo `Mesa-do-Assessor.zip` em qualquer pasta.
2. Dê dois cliques em **Instalar a Mesa**.
3. O instalador pergunta uma vez: **Instalar agora? (S/N)**. Respondendo S, ele instala a Mesa e, em seguida, o que ela usa para editar vídeos (Python, ffmpeg, Node.js e o editor Edvid) e cria na área de trabalho o atalho **Mesa**. A chave gratuita da Groq, usada para transcrever a fala do vídeo, a Mesa pede só na primeira vez que você for editar um vídeo.
4. Se o Windows pedir uma confirmação durante a instalação, aceite. Depois feche o Claude e abra de novo.

## Instalar no Mac

1. Extraia o arquivo `Mesa-do-Assessor.zip`.
2. Clique com o **botão direito** em **Instalar a Mesa** (o arquivo com extensão .command) e escolha **Abrir** (o Mac pede uma confirmação na primeira vez).
3. Responda **s** à pergunta **Instalar agora?**. O instalador instala a Mesa e o que ela usa para editar vídeos, usando o Homebrew. Se o Homebrew não estiver instalado, o Mac pode pedir a sua senha.
4. Feche o Claude e abra de novo.

> No Mac a instalação ainda não foi testada por nós. Se algo falhar, use **Copiar diagnóstico para o suporte** no menu **+** da Mesa.

> O instalador só copia a Mesa para `.claude/skills/mesa`. Se você já tinha uma skill `mesa`, a antiga fica guardada em `.claude/skills-backup`.

## Usar

1. No Claude, digite **/mesa**.
2. Na primeira vez, a Mesa pergunta se você quer um **atalho na área de trabalho**. Com ele, basta abrir o ícone, sem digitar /mesa.
3. A Mesa abre numa janela própria e pergunta se você quer **conectar com dados financeiros** (CaptaMais). Pode dizer "Agora não" e marcar "Não perguntar de novo".
4. Escolha a tarefa e responda às perguntas. Na tela final, **preencha os campos** (já vêm com sugestões e atalhos para clicar): o pedido se monta sozinho e o Claude pergunta só o que faltar. Depois é só enviar.
5. **A caixa de baixo é a conversa com o Claude**, parte fixa da Mesa e com o jeito do Claude: Enter envia, Shift+Enter quebra a linha, e o botão **+** abre os atalhos (atualizar o pedido, criar uma tarefa, buscar na internet, dados do CaptaMais, ampliar e limpar a conversa). Ali você escreve, por exemplo:
   - "Atualize este pedido para…" (o Claude muda o pedido que está na tela);
   - "Crie uma tarefa em Mercado hoje para…" (ela passa a existir em **Minhas tarefas** da área, já com campos e atalhos preenchidos; dá para apagar depois);
   - "Busque na internet como…" ou "Analise PETR4 com os dados do CaptaMais".

6. **Copiar o resultado:** cada resposta e cada entrega tem dois botões: **Copiar** (texto limpo, sem símbolos) e **Copiar para WhatsApp** (negrito com um asterisco, itálico com _underline_, sem títulos nem tabelas). Quando o resultado é "Texto no chat", o texto completo vem no chat e no cartão da entrega.

Os pedidos rodam no seu Claude, na sua conta, e consomem o seu plano.

## Conectar ao CaptaMais (opcional)

Conectando, a Mesa traz direto os dados de ações, fundos imobiliários e fundos da Análise de Ativo, e os relatórios saem mais completos. Sem conectar, tudo funciona: você só cola os dados do ativo.

A conta no CaptaMais é **gratuita** e vale para todos: não há diferença entre planos na Mesa. Para proteger o sistema, há um limite de consultas por minuto e por hora, igual para todos; se você chegar nele, a Mesa avisa e segue com os dados que você colar.

Para conectar: botão **Conectar** no aviso (ou **Entrar no CaptaMais**, no canto direito) › digite o **e-mail e a senha** do CaptaMais › **Entrar**. A senha vai direto para o CaptaMais e a Mesa não a guarda. Se você entra com o Google, ou ainda não tem conta, use «Entrar com o Google ou criar conta»: abre o site do CaptaMais e, lá, é só clicar em **Conectar**.

Ao conectar, a Mesa avisa o CaptaMais **quais tarefas você usou** (só os nomes, nunca o que você digita nem dados de clientes). Sem conexão, nada é enviado. Os registros são apagados após 12 meses.

## Conversa com o Claude, modelo e rascunho

- Na caixa de baixo, escreva "atualize este pedido para…" ou "busque na internet como…". O Claude pesquisa, reescreve o pedido e **aplica na tela** (dá para desfazer).
- **Salvar como meu modelo** guarda a sua versão do pedido: aquela tarefa passa a começar por ela. Salve com os campos `[COLE AQUI]` vazios, sem dados de cliente.
- A Mesa guarda neste computador onde você parou e a conversa. Ao reabrir, volta do mesmo ponto; **Começar do zero** descarta e **Limpar** apaga o histórico da conversa.

## Imagens e PDF

- No post para Instagram, a Mesa gera as **imagens do carrossel** em PNG (com a sua identificação e o aviso de conteúdo educativo no rodapé) e um PDF com todos os slides.
- Qualquer tarefa com resultado em PDF sai como arquivo pronto.
- **Anexar arquivo:** o clipe da conversa, em qualquer tarefa, aceita PDF e imagem (até 6 por pedido). O Claude lê só as pastas **Anexos** e **Fontes** da Mesa, sem terminal e sem acesso ao seu perfil. Na edição de vídeo não há anexo.
- **PDF em mais tarefas:** comparador de carteira, revisão de carteira (duas roscas, política × atual), proposta de assessoria e diagnóstico financeiro, além das apresentações das duas reuniões.
- **Produtos:** o Raio-X de produto lê a lâmina e mostra cada condição com a página de onde saiu, sem recomendar compra. Comparar produtos é a antiga Renda fixa.
- **Apresentação em PDF com a sua marca** (primeira e segunda reunião): escolha o resultado PDF e a Mesa monta páginas 16:9 com capa, quem sou, escritório, custódia, soluções, processo, remuneração e próximos passos, com ícones e diagramas. Na primeira vez ela pergunta a sua marca (logo, foto, cor do escritório e fundo escuro, claro ou azul-marinho) e guarda; não precisa repetir.
- **Suas próprias imagens e ícones:** guarde os arquivos (PNG, JPG, WEBP ou SVG, até 6 MB) em **Documentos › Mesa do Assessor › Minhas imagens** e peça no chat, citando o nome do arquivo ("use a foto escritorio.jpg na página do escritório").
- Trechos que a Mesa não tem como confirmar saem com **[CONFERIR]** em destaque nas páginas: preencha ou valide antes de usar com o cliente. A Mesa também se recusa a escrever, sem [CONFERIR], frases sobre independência, custo, regulação ou retorno que você não disse.
- Tudo fica em **Documentos › Mesa do Assessor**.

## Privacidade e segurança

- O que você digita, os pedidos e a conversa com o Claude ficam **só neste computador** (pasta `.mesa-do-assessor` do seu usuário) e passam pelo seu Claude. A Mesa não envia isso ao CaptaMais.
- Ao conectar, o CaptaMais recebe só o que é preciso: o código do pedido, o nome do computador, o código do ativo consultado e o nome das tarefas usadas. Sem conexão, nada é enviado.
- A conexão usa uma chave que só lê dados de mercado e o cofre: não abre leads, clientes, créditos nem dados de outras pessoas. Você pode desligá-la em **Minha Conta** no site.
- **Senha errada tem limite:** depois de 5 erros seguidos, a Mesa e o CaptaMais bloqueiam novas tentativas por 15 minutos; se continuar, por 1 hora, 6 horas e 24 horas. Durante o bloqueio nem a senha certa entra, e o aviso é o mesmo para e-mail que existe ou não. O bloqueio fica salvo e não zera ao reiniciar.
- Seus rascunhos somem sozinhos depois de 14 dias e a conversa depois de 30. **Limpar** e **Começar do zero** apagam na hora.
- PDFs e imagens ficam em **Documentos › Mesa do Assessor**; se o seu Documentos sincroniza na nuvem (OneDrive), eles sobem junto.
- Dentro da Mesa o Claude só abre páginas de fontes oficiais (Banco Central, CVM, B3, IBGE, Tesouro, gov.br etc.). A busca na internet funciona normalmente. Juros e inflação, fato relevante da CVM e taxas do Tesouro vêm direto dessas fontes, cada número com data e fonte.
- Fora da edição de vídeo, o Claude da Mesa não usa terminal, não grava arquivos por conta própria e ignora as configurações pessoais do seu Claude (por exemplo, permissões liberadas ou proxy definido no settings.json). Quem gera os arquivos é a Mesa.

## Cuidados

- Não digite CPF nem o nome completo do cliente: a Mesa não precisa deles.
- A Mesa organiza o trabalho: ela **não** recomenda compra nem venda e não promete retorno. Os pontos que você precisa validar com o compliance saem marcados com `[CONFERIR]`.

## Editar vídeos

A tarefa **Editar um vídeo (Reels)**, em Post para Instagram, corta, ajusta a cor e coloca legendas num vídeo vertical, e o resultado fica em **Documentos › Mesa do Assessor › Videos editados**.

O instalador já deixa tudo pronto: o editor **Edvid**, o **ffmpeg**, o **Python**, o **Node.js** e o modelo de legendas. O editor vem dentro da Mesa, já com o jeito de editar ajustado (corte limpo, cor, zoom e legendas simples), e o instalador o coloca em `.claude/skills/edvid` sem baixar nada de outro lugar. Ele é baseado no Edvid, um projeto de código aberto (licença MIT, mantida na pasta). Python, ffmpeg e Node.js são baixados dos sites oficiais, e as bibliotecas do editor (pip e npm) dos repositórios oficiais. A única coisa que falta é a sua **chave gratuita da Groq**, que é importante: é ela que transcreve a fala do vídeo para criar as legendas. A Mesa não cria contas por você, então na primeira edição ela abre uma janela, você cria a chave no site da Groq, cola ali e pronto. Cada pessoa usa a sua.

Se por algum motivo algo não estiver instalado, ao clicar na tarefa a Mesa mostra **Instalar e continuar** e instala na hora, com o andamento na tela. Só o áudio do vídeo vai ao serviço de transcrição. Música e imagens de apoio pedem chaves próprias, opcionais, que você coloca no arquivo `.env` do editor se quiser usá-las.

Ao clicar na tarefa, a Mesa abre a janela de arquivos, você escolhe o vídeo e a edição começa. O corte aparece na tela para você aprovar, e **Abrir o editor do Edvid** deixa ajustar na linha do tempo.

## Se algo não funcionar

- **/mesa não abre a janela:** feche o Claude e abra de novo; confira se o Node.js está instalado (`node -v`) e, se não estiver, rode o instalador de novo. Sem Edge nem Chrome, a Mesa abre no navegador padrão.
- **A janela mostra um erro de "Claude":** a Mesa roda os pedidos no Claude Code, que precisa estar instalado e com login feito (claude.com/code).
- **Um botão não respondeu ou deu erro:** no menu **+**, use **Copiar diagnóstico para o suporte**. O resumo sai sem os seus dados.
- **A instalação do editor de vídeo terminou com pendências:** o que faltou aparece na tela do instalador e em `instalacao-video.log`, na pasta `.mesa-do-assessor` do seu usuário. Rode o instalador de novo (ele só refaz o que falta) ou use **Instalar e continuar** ao clicar em Editar um vídeo.
- **Atualizar a Mesa:** rode o instalador do kit novo; a versão antiga fica guardada em `.claude/skills-backup`. Seus perfil, modelos e arquivos em Documentos continuam.

## Opcional: painel dentro do Cowork

A pasta `opcional-cowork` tem o plugin e o painel para quem usa o Cowork do Claude Desktop. Não é necessária para o `/mesa`.
