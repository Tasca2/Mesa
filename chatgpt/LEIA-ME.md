# Mesa do Assessor para o ChatGPT

No ChatGPT não existe "skill" como no Claude. O equivalente é um **GPT personalizado** (em inglês, *Custom GPT*): um assistente seu, com instruções fixas e arquivos de consulta. Esta pasta traz tudo para você criar o seu em poucos minutos, com as mesmas rotinas da Mesa: perguntas certas, entrega na ordem certa e as mesmas regras de compliance.

## O que você precisa

- Uma conta do ChatGPT que permita criar GPTs (hoje: Plus, Pro, Business, Enterprise ou Edu). Confira na sua conta: os planos e os nomes dos menus podem mudar.
- Os arquivos desta pasta: `instrucoes-do-gpt.md` e a pasta `conhecimento` (9 arquivos).

## Criar o GPT (uns 10 minutos)

1. No ChatGPT, abra **Explorar GPTs** e clique em **Criar** (ou **+ Criar**). Escolha a aba **Configurar**.
2. **Nome:** Mesa do Assessor. **Descrição:** Rotinas, mercado e posts do assessor de investimentos, no meu jeito.
3. **Instruções:** abra `instrucoes-do-gpt.md`, copie tudo e cole no campo. (O limite do campo é de 8.000 caracteres; o arquivo já cabe.)
4. **Conhecimento:** clique em **Carregar arquivos** e suba os 9 arquivos da pasta `conhecimento`. O limite é de 20 arquivos.
5. **Recursos:** deixe ligados **Pesquisa na web**, **Interpretador de código e análise de dados** (é ele que gera o PDF e o PowerPoint) e **Geração de imagens**. Não crie **Ações**.
6. **Iniciadores de conversa** (opcional, um por linha):
   - Mesa
   - Preparar a primeira conversa com um possível cliente
   - Montar a pré-reunião de um cliente atual
   - Resumir o fato relevante mais recente de uma empresa
   - Analisar uma ação
   - Ideias de posts para hoje
7. Clique em **Criar** (ou **Salvar**) e escolha **Somente eu**.

## Preencher o seu perfil

Abra `conhecimento/09-meu-perfil.md`, preencha (nome, atuação, escritório, público, tom, e 1 a 3 mensagens suas como exemplo) e suba de novo no GPT no lugar do arquivo em branco. Sem o perfil, o GPT pede essas informações na primeira rotina e devolve o texto pronto para você colar no arquivo. Cada vez que o seu perfil mudar, troque o arquivo.

## Usar

Digite **Mesa** para ver o menu, ou diga direto o que quer: "pré-reunião do Cliente A", "retomar um lead parado", "analisar WEGE3", "resumir o último fato relevante da PETR4". O GPT pergunta tudo de uma vez, entrega na ordem da rotina e termina com o próximo passo. Quando a rotina tiver PDF ou apresentação, ele gera o arquivo para você baixar.

## O que muda em relação à Mesa no Claude

| | Mesa no Claude | Mesa no ChatGPT |
|---|---|---|
| Janela própria, menus e campos | Sim | Não: tudo na conversa, com perguntas em lista |
| Dados do CaptaMais (Análise de Ativo, métodos de venda) | Sim, se conectar | Não existe. Dados vêm da busca na web e do que você colar |
| Histórico de clientes guardado no computador | Sim | Não. Cole o que for preciso, ou use uma conversa por cliente |
| Perfil que aprende com o uso | Sim | Você mantém o arquivo de perfil |
| PDF e PowerPoint com a sua marca | Sim, com foto e logo | Sim, pelo interpretador de código; visual mais simples. Anexe a foto e o logo na conversa |
| Imagens livres da internet e por IA | Sim | Só a geração de imagem do ChatGPT |
| Edição de vídeo (Reels) e página de captação | Sim | Não |
| Seus dados ficam | No seu computador | No ChatGPT, conforme as suas configurações de dados |

## Cuidados

- Não escreva CPF nem o nome completo de clientes: a Mesa não precisa deles.
- Confira nas configurações de dados do ChatGPT se as suas conversas podem ser usadas para treinar modelos, e desligue se não quiser.
- A Mesa organiza o seu trabalho: ela não recomenda compra nem venda e não promete retorno. O que precisar de validação do compliance sai marcado com [CONFERIR].
- Dados de mercado vêm da busca na web. Confira número e data nas fontes antes de enviar ao cliente.

## Outra forma: Projetos

Se preferir não criar um GPT, crie um **Projeto** no ChatGPT, cole o conteúdo de `instrucoes-do-gpt.md` nas instruções do projeto e anexe os 9 arquivos de `conhecimento`. Funciona do mesmo jeito.

## Atualizar

Quando sair uma versão nova da Mesa, baixe a pasta de novo, apague os arquivos antigos do GPT, suba os novos de `conhecimento` e cole as novas instruções. Mantenha o seu `09-meu-perfil.md`.
