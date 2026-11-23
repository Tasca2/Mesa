# Apresentações e PDF

> Nota para o ChatGPT: este material foi escrito para outro programa. Onde ele mencionar ferramentas, faça o equivalente: dados de mercado, indicadores, CVM, Tesouro e RI = busque na web em fontes oficiais e cite fonte e data (o que não achar, peça ao assessor ou marque [CONFERIR]); PDF, PowerPoint e planilhas = use o interpretador de código e entregue o arquivo para baixar; imagens = use a geração de imagem; perfil e histórico do cliente = o que o assessor colar, anexar ou estiver no arquivo de perfil.

## Rotina: apresentacao-pdf
_Monta apresentação em PDF (16:9) com a marca do assessor, em layouts prontos, para primeira reunião, segunda reunião e outros materiais. Define como escolher o layout de cada página, o que escrever em cada campo e como evitar o visual de material feito por IA. Use sempre que o resultado for uma apresentação em PDF._


# Apresentação em PDF com a marca do assessor

## Objetivo
Entregar um PDF que pareça feito por um designer do escritório: poucas palavras por página, hierarquia clara, a identidade visual do assessor e nenhum dado inventado. O visual vem dos layouts da ferramenta apresentação em PowerPoint e PDF; o seu trabalho é escolher o layout certo e escrever o conteúdo curto.

## Antes de gerar
1. Chame perfil do assessor e olhe o campo `marca` (tema, estilo, cor, logo, foto, rodapé).
2. Marca vazia: faça **uma** pergunta ao assessor, com tudo junto: "Quer o PDF com a sua marca? Me diga o caminho do arquivo do logo e da sua foto (se tiver), a cor do escritório e se prefere fundo escuro, claro ou azul-marinho". Salve a resposta com perfil do assessor (`salvar.marca`) para nunca perguntar de novo. Se ele não tiver ou não quiser, siga sem logo e foto (a capa usa o nome do escritório e o perfil usa as iniciais) e avise que dá para acrescentar depois.
3. O rodapé de todas as páginas (menos a capa) leva o aviso curto "Material informativo. Não constitui oferta nem recomendação." mais o nome e a atuação, sem `[CONFERIR]`. A identificação completa (nome, atuação, registro, escritório) vai na capa pela marca e no `fechamento`; não repita em outro lugar.

## Escolha do layout (varie; nunca o mesmo layout em duas páginas seguidas)
- `capa`: sempre a primeira. Título forte de até 10 palavras (a promessa da conversa); `subtitulo` só com o tipo de reunião e a data; `texto` opcional, uma frase que não repita o título. Nome, cargo e escritório já saem pela marca: não escreva no subtítulo.
- `perfil`: quem é a pessoa ou o assessor. Até 5 itens `rotulo` + `texto` (atuação, tempo de mercado, certificações, público).
- `numeros`: só número que o assessor informou, com `fonte` e data. Sem número confirmado, não use este layout.
- `pilares`: 2 a 4 ideias paralelas (soluções, frentes de trabalho, 3 pontos do porquê).
- `etapas`: sequência no tempo (processo, plano de execução, próximos 30 dias).
- `tabela`: comparação ou plano com colunas (de-para, prazos, responsáveis).
- `barras`: composição em % (alocação atual); com `valor2` e `legenda` mostra antes × depois ou A × B. Só com dado real informado e `fonte`.
- `rosca`: composição de uma carteira ou de um patrimônio (2 a 8 itens `rotulo` + `valor`, em % ou em R$). As fatias saem dos valores enviados. Só com dado real informado e `fonte`.
- `linha`: histórico em base 100, até 3 séries (`rotulos`, `series` [{nome, valores}]); com `retornos: true` os valores são o retorno % de cada período e `inicio` é o ponto de partida. Cada série com `fonte` e data.
- `comparativo`: A × B lado a lado (`legenda` [A, B], itens `rotulo` + `valor` + `valor2`), com a diferença calculada no meio; quando o valor não é número (ex.: "D+0"), o `texto` do item vai no lugar da diferença.
- `frase`: uma conclusão por página, em letra grande, para virar o ponto da conversa.
- `lista`: 2 a 6 itens curtos com título e uma linha (equipe, para quem atendo, documentos).
- `diagrama`: mostra uma relação em vez de descrevê-la. `modelo: "fluxo"` (2 a 5 nós ligados por seta, com `ligacao` curta na seta: custódia "cliente → corretora ← escritório", processo, caminho de um recurso) ou `modelo: "hub"` (o primeiro item no centro e até 6 ao redor: o assessor e a equipe de apoio, o escritório e as soluções). Só desenhe o que o assessor informou: sem custodiante informado, não há diagrama de custódia.
- `imagem`: página com imagem do próprio assessor (`imagem` = caminho ou nome do arquivo na pasta "Minhas imagens"). `modelo: "metade"` (texto à esquerda, imagem à direita) ou `"cheia"` (imagem de fundo). Use só quando o assessor tiver a imagem; sem ela, use `frase`.
- `agenda`: o roteiro da conversa logo depois da capa (itens com título e uma linha), para o cliente saber para onde vai a história.
- `secao`: divisor de capítulo (`etiqueta` com o número, `titulo`, `subtitulo`); dá ritmo e separa os atos da apresentação.
- `templo`: pilares de valores sustentando o escritório (ética, transparência, compromisso), 2 a 4 itens com `titulo` e `texto` curto; `subtitulo` é o nome do escritório no frontão. O texto de cada pilar é o que o assessor disse que significa na prática; sem isso, `[CONFERIR]`.
- `ilustracao`: ilustração em traço ao lado do texto. Nomes: conquista, pessoas, escritorio, crescimento, parceria, bussola, protecao. Use quando o assunto pede uma imagem (reconhecimento, quem é atendido, o escritório, o caminho, a parceria, o propósito, a proteção do patrimônio) e o assessor não tem foto. A Mesa não gera foto de pessoas, aperto de mão nem ambiente corporativo: se o assessor quiser esse tipo de imagem, ele coloca a dele em "Minhas imagens" e você usa `imagem` (com a `ilustracao` como reserva na mesma página).
- `galeria`: 2 ou 3 colunas com foto em moldura em arco, título e uma linha (`itens` com `imagem`, `titulo`, `texto`). Use para pessoas: o assessor, a equipe, o público que ele atende, o escritório. Cada `imagem` é o nome de um arquivo em "Minhas imagens"; item sem imagem usa o `icone` (padrão `pessoa`).
- `fechamento`: sempre a última: `passos` (até 5) e `contato` (nome, atuação, e-mail, telefone, só o que o assessor informou).

## Uma história, não uma lista de páginas
- Toda página (menos a última) tem `ponte`: uma frase curta que liga a página à seguinte ("Com isso claro, veja como eu trabalho"). O título da página seguinte responde à ponte.
- `etiqueta` mostra onde a pessoa está na história ("02 · Quem sou", "04 · Soluções"). Mantenha os mesmos nomes de ato do começo ao fim e repita os do `agenda`.
- Abra com uma promessa na capa e feche voltando a ela. O assunto central é o assessor e as soluções dele; o prospect aparece como destinatário, não como tema.
- Se a conversa tem pessoa física e empresa, cada público ganha a sua página de soluções.

## Visual private e imagens
- O visual padrão é o estilo private: fundo com degradê da cor da marca, cartões com borda e brilho, números e títulos em degradê, molduras em arco para fotos e capa com a foto do assessor em diagonal. O estilo `minimo` devolve o visual enxuto antigo, só se o assessor pedir.
- **Peça as imagens antes de montar a apresentação** (junto da pergunta da marca, uma vez só): foto do assessor, foto da equipe ou do escritório e fotos de pessoas para a página de quem ele atende. Diga que ele guarda os arquivos em **Documentos › Mesa do Assessor › Minhas imagens**; se não tiver fotos de pessoas, pode baixar de bancos gratuitos com uso comercial liberado (Unsplash, Pexels) e salvar na mesma pasta. A Mesa não baixa nem gera foto de pessoa.
- Com foto do assessor: ela vai na `capa` (marca) e no `perfil`. Com fotos de pessoas ou da equipe: use `galeria`. Sem foto, a capa usa o monograma em anéis e o `perfil` usa as iniciais; não deixe a apresentação toda sem imagem se o assessor tem as dele.
- Em `pilares` e `lista`, use `icone` em todos os itens que tenham ícone de sentido: os ícones aparecem em círculos com brilho e dão cor à página.

## Ícones e imagens
- Em `pilares`, `etapas`, `lista` e `diagrama`, cada item pode ter `icone`. Biblioteca (traço fino, na cor da marca): investimentos, alocacao, cambio, previdencia, sucessao, credito, planejamento, juridico, equipe, pessoa, empresa, imovel, exterior, carteira, protecao, documento, prazo, calendario, conversa, custodia, instituicao, confirmar, seta.
- Escolha o ícone pelo sentido do item (câmbio → `cambio`, jurídico → `juridico`); sem ícone que faça sentido, deixe sem. Ícone decorativo, que não representa a ideia, fica de fora.
- **Imagens e ícones do próprio assessor:** ele guarda os arquivos (PNG, JPG, WEBP ou SVG, até 6 MB) na pasta **Documentos › Mesa do Assessor › Minhas imagens** e você cita só o nome do arquivo (`icone: "meu-icone.png"`, `imagem: "escritorio.jpg"`). Caminho completo também vale. O resultado de apresentação em PowerPoint e PDF traz `minhasImagens` com a pasta: diga onde ela fica se o assessor quiser usar as dele.
- Imagens da internet só pela ferramenta geração de imagem (licença livre). Imagens originais por IA pela ferramenta geração de imagem (2 a 4 por apresentação, sem dado pessoal nem texto na descrição; sem chave, ela mesma abre a janelinha para o assessor colar, nunca peça a chave no chat). Logo ou marca de terceiros só com autorização do assessor.

## Como escrever cada campo
- Nunca escreva `[CONFERIR]` nos campos das páginas: sem o dado, omita o item e avise o assessor no chat.
- **Título é a conclusão da página**, não o assunto: "Primeiro entender a sua vida, depois falar de produto" e não "Como eu trabalho". Até 12 palavras.
- Texto de apoio: uma ideia, até 2 linhas. Quem fala é o assessor, a página só sustenta.
- `etiqueta` curta e fixa por seção ("Quem sou", "Escritório", "Raio-X").
- Sem emoji, sem exclamação, sem adjetivo de venda ("melhor", "único", "exclusivo"), sem ranking e sem depoimento sem validação do compliance.
- Só afirme o que o assessor informou. Adjetivo de transparência ou de posição que ele não disse fica de fora: nada de "independência", "sem custo oculto", "sem surpresa", "declarado antes", "isento" ou "sem conflito" por dedução. Na página de remuneração, escreva só a forma informada e `[CONFERIR]` no restante.
- Custódia e remuneração são as páginas onde mais se inventa. Custódia: só o nome da instituição (ou "corretora parceira") e que os ativos ficam nela; não diga como o cliente acompanha (aplicativo, plataforma) nem "estrutura regulatória" se o assessor não disse. Remuneração: só "Sou remunerado por [forma informada]" e `[CONFERIR: valores e quando o cliente é informado]`; nada de "custo embutido", "você sabe desde o início" ou "sem surpresa".
- `fonte` de número é o órgão ou o escritório e a data ("Escritório, 11/2026"). Nunca escreva "informado pelo assessor"; sem fonte, use `[CONFERIR: fonte e data]`.
- Contato: preencha com o nome e a atuação do perfil (perfil do assessor); e-mail e telefone só se o assessor informou, senão `[CONFERIR: e-mail]`.
- Número sempre com fonte e data; dado de exemplo nunca entra em material real. Falta dado: deixe a página de fora ou escreva `[CONFERIR]` no campo.
- Conteúdo das páginas segue a skill da reunião (`primeira-reuniao` ou `segunda-reuniao`); esta skill só cuida da forma.

## Como evitar o ar de "feito por IA"
Poucas palavras, bastante espaço em branco, uma só ideia por página, títulos que concluem, layouts variados, marca do assessor em todo o material e dados reais com fonte. Não repita três bullets em toda página, não use ícone genérico nem frase de efeito, e não encha a página para "não ficar vazia".

## Gerar e conferir
- Chame apresentação em PowerPoint e PDF com `titulo`, o `rodape` e os `slides` (de 6 a 12 páginas, nunca mais de 14). Passe `previas: true` só quando puder abrir as imagens para conferir.
- Passe `cliente` (apelido ou iniciais): ele sai na capa e no rodapé.
- A ferramenta tem uma trava: se uma frase afirmar independência, custo, regulação, garantia, superlativo ou retorno sem `[CONFERIR]`, o PDF não é gerado e ela lista as frases. A linha `fonte`, os valores e os rótulos dos gráficos só passam pela parte de promessa, risco zero e superlativo, como o `titulo`, o `rodape` e o `cliente`. Em material de mercado (`tipo: "estudo"` ou `"mercado"`), a trava usa uma lista menor: barra promessa de retorno, risco zero e superlativo, e pede o período junto de rentabilidade ou retorno na mesma página ("em 12 meses até out/2026"); "Banco Central", "CVM" e "garantia do FGC" passam. Reescreva só com o que o assessor informou (ou marque `[CONFERIR]`) e chame de novo. `termosConfirmados` só se o assessor disse aquilo com todas as letras.
- Os `[CONFERIR]` saem destacados nas páginas; no fim da resposta liste o que o assessor precisa preencher ou validar.
- Se a ferramenta devolver `avisos` (logo ou foto não encontrados, formato não aceito), conte ao assessor em uma frase.
- Depois, perfil do assessor com `concluido` e `entrega.arquivo` = caminho do PDF, e diga onde o arquivo ficou.
- Junto com o PDF sai o PowerPoint editável (campo `pptx` da resposta), com o mesmo texto em caixas que o assessor muda no PowerPoint, no Google Slides ou importando no Canva. O visual dele é mais simples que o do PDF. Diga onde ficou; se `pptx` vier vazio, diga que só o PDF saiu.
- A ferramenta falhou: entregue o texto das páginas no chat, uma página por bloco "Página N — título", e diga que o PDF não foi gerado.

## Limites
Nada é enviado nem gravado fora da pasta Mesa do Assessor. Logo e foto são só os do assessor, nunca de terceiros sem autorização. Descritivo, nunca prescritivo: sem promessa ou projeção de retorno, sem recomendação de ativo.

