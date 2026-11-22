---
name: primeira-reuniao
description: Gera a apresentação da primeira reunião com um prospect (uma R1 padrão) em PDF e em PowerPoint editável: quem é o assessor, o escritório e as soluções, com a foto e o logo dele. Entrega também o roteiro de fala página a página, as perguntas de descoberta e o convite para a segunda reunião. Depois de gerada, a apresentação evolui pela conversa. Objetivo é confiança e a segunda reunião marcada, não vender produto. Sem promessa de retorno.
---

# Primeira reunião: apresentação e descoberta

## Objetivo
A primeira reunião existe para construir confiança, entender a pessoa e sair com a segunda reunião marcada e os documentos combinados. Quem fala 30% do tempo e escuta 70% costuma sair com mais informação para a proposta. Reunião que vira palestra sobre produtos cansa e não fica na memória.

## Entradas
- **Minhas escolhas**, no pedido: como é a pessoa, o escritório, a corretora ou instituição, o formato de atendimento, os pontos fortes, "Sobre você" (trajetória, formação, certificações e prêmios), se pode pesquisar o nome dele na internet, e se a foto e o logo foram enviados. "não informado" quer dizer que ele pulou a pergunta.
- **Dados**, no pedido: quem é a pessoa, as soluções para pessoa física e para empresas e como ele é remunerado. Todos opcionais.
- `mesa_perfil` traz o mesmo perfil guardado (escritorio, corretora, atendimento, pontosFortes, sobre) e a marca (foto, logo, cor e tema). A foto e o logo entram sozinhos na apresentação: você não precisa passar o caminho.
- A reunião é uma R1 padrão de cerca de 45 minutos. Não pergunte a duração.
- Rode `consultar_cofre` (tema `primeira reunião apresentação confiança descoberta`); sem cofre, siga o método.
- Falta um dado da apresentação? Escreva a frase com `[CONFERIR]` e não invente. Nunca crie prêmio, número de clientes, patrimônio sob gestão, rentabilidade ou cliente de exemplo: só entra o que o assessor informou, com fonte e data quando for número.
- **Gere direto, sem perguntar antes.** O que ele pulou fica fora da página ou vai como `[CONFERIR]`. Não faça a pergunta da marca da skill `apresentacao-pdf`: foto e logo já foram pedidos na janela. Depois de entregar, diga em até 3 linhas o que faltou e o que melhoraria a apresentação se ele informasse.

## Pesquisa na internet (só se ele escolheu "Sim, pesquisar")
1. Busque o nome completo dele junto com o escritório e a cidade, se houver. Prefira o site do escritório, perfis profissionais e páginas oficiais.
2. Mostre na conversa o que achou, uma linha por achado, com o link e a data.
3. Só leve para a apresentação o que for claramente sobre ele (mesmo nome **e** mesmo escritório ou mesma cidade e atuação), com fonte e ano. Nome parecido sem outra confirmação é outra pessoa: deixe de fora e pergunte.
4. Prêmio, ranking, número de clientes e patrimônio vindos da busca entram com `[CONFERIR]`: ele valida antes de usar.
5. Não achou nada confiável: diga isso em uma linha e siga com o que ele escreveu.
Com "Não pesquisar", não busque nada sobre ele.

## Método
**Antes (20 a 30 min):** o que se sabe da pessoa (profissão, empresa, momento), 2 ou 3 observações úteis ao ramo dela (só fato público ou informado) e o objetivo da reunião em uma linha: "sair com a segunda reunião marcada e estes documentos".

**Estrutura** (R1 padrão, cerca de 45 minutos):
1. **Abertura e conexão (5 min):** agradeça, confirme o horário-limite ("temos até as [hora], certo?") e faça uma pergunta genuína sobre algo da pessoa.
2. **Apresentação (3 a 5 min):** quem sou eu, meu escritório, como posso ajudar (modelo abaixo). Curta, em primeira pessoa, com foco no que importa para ela e não no currículo. Termine devolvendo a palavra.
3. **Descoberta (15 a 20 min):** o centro da reunião, nas quatro camadas: situação atual (como investe hoje, o que funciona e o que incomoda), aspirações (o que quer para a vida e para a família), necessidades (liquidez, sucessão, renda) e obstáculos (o que já tentou, o que a preocupa). Parafraseie, anote, não discorde. Pergunta de implicação vale mais que argumento.
4. **Soluções (5 a 10 min):** só a que responde ao **único problema** que ela revelou. Mostre as outras soluções do escritório em uma frase, sem aprofundar o que ela não pediu. Descritivo: o que a solução faz, quanto custa e quem a oferece. Sem recomendar ativo e sem prometer resultado.
5. **Próximo passo (5 min):** proponha a segunda reunião com data, diga o que você vai preparar e peça os documentos (extratos, IR, carteira) ou o questionário. Se hesitar, ofereça o passo menor: enviar só o extrato até uma data.

**Apresentação falada (modelo):** "Sou [nome], [atuação] no [escritório]. Há [X anos] ajudo [público] a [o que faz, em uma frase]. No escritório trabalhamos com [soluções reais, em uma frase]. Eu sou remunerado [como, conforme informado]. Hoje quero entender o seu momento e, se fizer sentido, na próxima conversa mostro um caminho. Pode ser?" O assessor troca os colchetes pelos fatos dele; o que faltar sai como `[CONFERIR]`.

**Apresentação com história** (de 12 a 16 páginas; o assunto é o assessor e as soluções dele). A apresentação conta uma história em cinco atos, e cada página termina com uma `ponte`: uma frase curta que leva à página seguinte ("Com isso claro, veja como eu trabalho"). O título de cada página é a conclusão dela, e o título da página seguinte responde à ponte.
- **Ato 1, abertura:** `capa` (a promessa da conversa em uma frase, não só o nome do escritório) · `agenda` (o roteiro da conversa, 4 a 5 itens que são os próximos atos).
- **Ato 2, quem sou:** `secao` "Quem sou eu" · `perfil` (atuação, tempo de mercado, certificações) · trajetória: `etapas` com os marcos que o assessor informou (com o ano) ou `ilustracao` `bussola` com o propósito dele ("o que me move"), só com o que ele disse · conquistas: `numeros` (só números com fonte e data) ou `ilustracao` `conquista` com o reconhecimento informado; sem conquista informada, não crie a página e não invente.
- **Ato 3, como trabalho:** `templo` com ética, transparência e compromisso, cada um com o que significa na prática para o assessor (texto dele, em `texto`); sem a explicação dele, escreva `[CONFERIR]` · `etapas` com o jeito de trabalhar (conhecer, propor, acompanhar) · `diagrama` fluxo da custódia (só se o custodiante foi informado) · o escritório: `ilustracao` `escritorio` ou `imagem` com a foto do assessor, mais `numeros` se houver número com fonte.
- **Ato 4, soluções:** `secao` "Como posso ajudar" · `ilustracao` `pessoas` ou `parceria` para quem o assessor atende (pessoa física e empresas) · **uma página só de pessoa física** (`pilares` com ícones: o que o assessor oferece a pessoas, como investimentos, previdência, sucessão, câmbio) · **uma página só de empresas (PJ)** (`pilares` com ícones: caixa, câmbio comercial, crédito, previdência dos sócios, o que ele informou) · `diagrama` hub com a equipe de apoio real · `remuneração`: `frase` ou `tabela` só com a forma informada. Sem solução PJ informada, escreva `[CONFERIR]` na página PJ e avise o assessor; não invente solução.
- **Ato 5, próximo passo:** `ilustracao` `protecao` ou `crescimento` com o que o prospect ganha ao avançar (descritivo, sem promessa) · `fechamento` com `passos` (segunda reunião com data, documentos) e `contato`.
Imagens: peça as fotos antes (assessor, equipe ou escritório, pessoas) e use `galeria` para pessoas e a foto na `capa` e no `perfil`; use `ilustracao` quando o assessor não tiver foto (a Mesa não gera fotos de pessoas, apertos de mão nem ambientes). Se o assessor tiver fotos, `imagem` com o nome do arquivo na pasta "Minhas imagens" e `ilustracao` de reserva na mesma página. No fim da resposta, liste em uma linha por página "onde uma foto do assessor funcionaria melhor" (capa, escritório, equipe, trajetória), para ele decidir se adiciona as dele. Sem rentabilidade, ranking, superlativo, prêmio sem comprovação, mapa de clientes por estado nem depoimento de cliente (depoimento só com validação do compliance, `[CONFERIR]`). Logo de terceiros só se o assessor tiver autorização.

**Em PDF e PowerPoint, sempre:** carregue a skill `apresentacao-pdf` e gere com `mesa_apresentacao`, na ordem dos cinco atos, com `etiqueta` mostrando o ato ("02 · Quem sou") e `ponte` em todas as páginas, menos na última. A ferramenta devolve `pdf` e `pptx`: o PDF é o material de apresentar, e o PowerPoint é o mesmo conteúdo em texto e caixas editáveis, com visual mais simples (diagramas e gráficos viram cartões ou tabela). Diga onde os dois ficaram e que o PowerPoint abre no PowerPoint, no Google Slides ou importado no Canva. Se `pptx` vier vazio, diga que só o PDF saiu. Não existe a opção de entregar a apresentação só como texto: se a ferramenta falhar, corrija o que ela apontou e gere de novo. Corretora, formato de atendimento e pontos fortes entram no ato 3 (como trabalho) com as palavras dele; "Sobre você" alimenta o ato 2. Roteiro de fala, perguntas e WhatsApp continuam em texto. Passe `cliente` (apelido ou iniciais): ele sai na capa e no rodapé. A letra e o espaço se ajustam ao número de itens; prefira 3 ou 4 itens fortes a 6 fracos.
Sem rentabilidade, ranking, "melhor", prêmio sem comprovação, mapa de clientes por estado nem depoimento de cliente (depoimento só com validação do compliance, `[CONFERIR]`). Logo de terceiros só se o assessor tiver autorização.

## Evoluir a apresentação
Depois da entrega, a conversa serve para melhorar a apresentação: trocar um título, tirar ou acrescentar página, mudar o tema ou a cor, incluir uma solução, encurtar. A cada pedido, chame `mesa_apresentacao` de novo com **todas** as páginas, mudando só o que ele pediu, e entregue o PDF e o PowerPoint novos. Diga em uma linha o que mudou e em qual página. Se ele editou o PowerPoint por fora, você não vê essa edição: peça que diga o que mudou.

## Modelo de saída (nesta ordem)
**Resumo** — 2 linhas: a apresentação está pronta, com o número de páginas, e onde ficaram o PDF e o PowerPoint.
**Peças** (cada uma separada, sem comentário dentro; a resposta final na conversa traz o caminho do PDF e do PowerPoint e todas as peças por inteiro: na janela da Mesa o assessor lê a conversa, e um "tudo entregue" deixa ele sem o texto): `roteiro-reuniao` (roteiro de fala página a página, uma ou duas frases por página, no tom do perfil), `perguntas` (descoberta nas quatro camadas, 8 a 10 perguntas), `whatsapp` (convite para a segunda reunião, até 4 linhas, no tom do perfil).
**O que faltou** — até 3 linhas: o que ele pulou e o que melhoraria a apresentação.
**Conferir** — dados da apresentação, forma de remuneração e qualquer número que o assessor valida.

## Exemplo
Bom (fechamento): "Marcos, com o que você me contou sobre a venda da empresa e o imóvel, vou preparar uma leitura da sua situação. Consigo te mostrar quinta, às 15h? Para isso, me manda o extrato das contas até terça." Ruim: "Só esta semana tenho uma oportunidade que vai render muito mais que a sua carteira." (urgência inventada, promessa e comparação).

## Limites
Não afirme o que o assessor não disse sobre custo ou remuneração (nada de "sem custo" ou "sem cobrança direta" por dedução: o que não foi informado vai como `[CONFERIR]`). Sem promessa ou projeção de retorno, sem escassez ou "cota limitada" inventada, sem prêmio, patrimônio sob gestão ou caso de cliente que o assessor não informou (e nunca com nome de cliente), sem comparar com concorrente pelo nome. Identificação do profissional na apresentação conforme a atuação. Nada é enviado nem gravado por você.
