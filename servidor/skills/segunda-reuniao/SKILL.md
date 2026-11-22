---
name: segunda-reuniao
description: Prepara a segunda reunião, em que o assessor devolve ao cliente o que ouviu na primeira, mostra a leitura da situação e a proposta de trabalho e pede a decisão. Gera o material da reunião em PDF e em PowerPoint editável e entrega o roteiro, a adaptação ao perfil de quem decide, o tratamento de objeção e o fechamento com data. Depois de gerado, o material evolui pela conversa. Descritivo, sem prometer resultado.
---

# Segunda reunião: devolutiva e decisão

## Objetivo
Transformar o que o cliente disse na primeira reunião em uma proposta clara e sair com uma decisão ou com o próximo passo marcado. Reunião que termina em "vou pensar" sem data não avançou. A segunda reunião só funciona se o material fala dos objetivos **nas palavras do cliente**.

## Entradas
- **Minhas escolhas**, no pedido: como o cliente decide, quem é o cliente e a data, o que ele disse na primeira reunião (objetivos, preocupações, o que recusou), a proposta e a carteira atual. "não informado" quer dizer que o assessor pulou a pergunta: gere com o que há, e o que faltar fica fora da página ou vai como `[CONFERIR]`. Não faça a pergunta da marca da skill `apresentacao-pdf`: foto e logo vêm do perfil.
- O jeito de decidir do cliente. Se o assessor não souber, proponha pelo que ele contou e marque `[CONFERIR]`:
  - **Delega**: quer segurança e tranquilidade, pouco jargão, valoriza o atendimento.
  - **Valida**: quer entender a lógica e ver que o assessor sabe, compara antes de decidir.
  - **Analisa**: quer dados e decide sozinho, aceita termo técnico.
- Perfil do assessor (`mesa_perfil`). Rode `consultar_cofre` (tema `segunda reunião proposta fechamento`); sem cofre, siga o método.
- Sem as notas da primeira reunião, peça-as: sem elas a proposta sai genérica. Nunca invente o que o cliente disse.

## Método
**Material** (curto, uma ideia por página, com o nome do cliente e a data na capa), nesta ordem:
1. **Capa e sumário.**
2. **Objetivos do cliente**: curto, médio e longo prazo, nas palavras dele; restrições (liquidez, prazo, tributação, preferências) e a métrica de sucesso que ele definiu (ex.: renda mensal de R$ X em Y anos, só se ele disse).
3. **Cenário**: exterior e Brasil, em poucas linhas, só o que toca os objetivos: o que está acontecendo (crescimento, inflação, juros), a tendência segundo a fonte e o que isso muda para quem tem esse objetivo. Dado com fonte e data; sem previsão própria.
4. **Raio-X da carteira atual**: alocação por classe, custos e tributação informados (taxas, come-cotas), risco (oscilação histórica, concentração) e liquidez (D+X). Só descritivo.
5. **Proposta de melhoria**, só depois de o cliente validar os objetivos e o raio-X (não entre na alocação antes disso): nova alocação como hipótese para decidir juntos, em tabela por classe; o porquê em 3 pontos ligados aos objetivos; comparativo antes e depois em composição, risco e liquidez. Retorno esperado só como cenário com premissas e fonte, nunca como promessa (`[CONFERIR]` com o compliance).
6. **Plano de execução** (o detalhe de produto entra só aqui, e só se o cliente avançar): de-para por etapa (o que sai, o que entra), prazos, responsáveis e pré-requisitos (documentos, cadastros, autorizações). Imposto e custo de transação dessa mudança ficam com o contador e a mesa (`[CONFERIR]`).
7. **Conclusão e próximos passos**: checklist, agenda com datas e contatos do assessor.
8. **Nota de compliance**, no fim: "Material informativo. Não constitui oferta, recomendação nem garantia de retorno. A adequação ao perfil e a documentação seguem as normas aplicáveis." Inclui a identificação do profissional.

**Em PDF e PowerPoint, sempre:** carregue a skill `apresentacao-pdf` e gere as páginas com `mesa_apresentacao`. A ferramenta devolve `pdf` e `pptx`: o PDF é o material de apresentar, e o PowerPoint é o mesmo conteúdo em texto e caixas editáveis, com visual mais simples (gráficos viram tabela). Diga onde os dois ficaram e que o PowerPoint abre no PowerPoint, no Google Slides ou importado no Canva. Se `pptx` vier vazio, diga que só o PDF saiu. Não existe a opção de entregar o material só como texto: se a ferramenta falhar, corrija o que ela apontou e gere de novo. Layouts sugeridos: 1 `capa` (com sumário no subtítulo) · 2 `frase` ou `lista` (objetivos nas palavras dele) · 3 `pilares` ou `numeros` (cenário, com fonte e data) · 4 `rosca` (alocação atual: um item por classe, com o % informado) e, se houver, `tabela` (custos e liquidez) · 5 `comparativo` (atual × proposta por classe, `legenda` ["Atual", "Proposta"]; a diferença sai calculada) seguida de `pilares` (3 pontos do porquê) · se o assessor informar os retornos mensais da carteira, `linha` com `retornos: true` (carteira, CDI e índice, até 3 séries, cada uma com fonte e data) · 6 `etapas` ou `tabela` (plano de execução) · 7 `fechamento` · a nota de compliance vai no `rodape` e o `cliente` (apelido ou iniciais) vai na capa e no rodapé. Roteiro, objeções, WhatsApp e nota de CRM continuam em texto.

**Estrutura** (padrão 60 min):
1. **Retomada (5 a 7 min):** conexão pessoal, horário-limite e o slide com os objetivos como ele disse. Pergunte: "continuam sendo as prioridades?".
2. **Cenário calibrado (5 a 10 min):** só o que toca os objetivos dele. No nível do cliente: delega, versão simples com analogia; valida, lógica e alternativas; analisa, dados e fontes.
3. **Carteira atual (10 a 15 min):** composição, concentração, liquidez e custos informados, sem juízo. Termine com uma pergunta: "o que você achou mais importante aqui?".
4. **Proposta de trabalho (15 min, páginas 5 e 6 do material):** para cada ponto, "isso responde ao seu objetivo de X porque Y". Descritivo: o que se faz, como, quanto custa e quem faz. Sem prometer resultado e sem recomendar ativo como certeza; a decisão é do cliente.
5. **Dúvidas e objeções (10 min):** pergunte antes de rebater ("o que falta para você se sentir seguro?"). Use a skill `objecoes` se aparecer uma frase pronta.
6. **Fechamento (5 min):** peça uma ação concreta e com data: assinatura, transferência de uma parte, envio de documentos ou a terceira conversa. Alternativa menor se ele hesitar. Combine o que acontece na ativação.

**Erros a evitar:** apresentar o que não responde ao que ele disse · excesso de técnica ou de macro · proposta "tamanho único" · não pedir a decisão · pressão, prazo inventado ou "cota limitada" · ansiedade de fechar com concessão que o assessor não informou.

**Depois:** mensagem em até 24 h com o resumo do combinado e o que cada um faz, e 3 toques se a decisão ficou em aberto (use a skill `relatorio-e-proposta`).

## Evoluir o material
Depois da entrega, a conversa serve para melhorar o material: trocar um título, tirar ou acrescentar página, mudar o tema, ajustar a proposta. A cada pedido, chame `mesa_apresentacao` de novo com **todas** as páginas, mudando só o que ele pediu, e entregue o PDF e o PowerPoint novos. Diga em uma linha o que mudou e em qual página. Se ele editou o PowerPoint por fora, você não vê essa edição: peça que diga o que mudou.

## Modelo de saída (nesta ordem)
**Resumo** — 2 linhas: o material está pronto, com o número de páginas e onde ficaram o PDF e o PowerPoint, e a decisão que se pede na reunião.
**Peças** (cada uma separada, sem comentário dentro; a resposta final na conversa traz o caminho do PDF e do PowerPoint e todas as peças por inteiro: na janela da Mesa o assessor lê a conversa, e um "tudo entregue" deixa ele sem o texto): `roteiro-reuniao` (minuto a minuto, o que fazer e dizer), `objecoes` (as 3 mais prováveis para esse perfil, com a pergunta que responde cada uma), `whatsapp` (resumo do combinado, até 4 linhas), `nota-crm` (decisão, pendências e data).
**Conferir** — perfil de decisão, números do cenário e da carteira, condições comerciais e remuneração.

## Exemplo
Bom (fechamento): "Paula, então combinamos três coisas: você me envia o extrato do banco até terça, eu fecho a proposta com o prazo que conversamos e na quinta, às 10h, nos falamos de novo para você decidir com calma. Pode ser?" Ruim: "Se não fechar hoje, perde a condição." (urgência inventada).

## Limites
Descritivo, nunca prescritivo: sem promessa ou projeção de retorno, sem simulação de rentabilidade como garantia, sem escassez inventada, sem condição comercial que o assessor não informou, sem concorrente pelo nome. Número de mercado com fonte e data. Nada é enviado nem gravado por você.
