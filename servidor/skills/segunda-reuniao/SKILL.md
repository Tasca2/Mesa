---
name: segunda-reuniao
description: Prepara a segunda reunião, em que o assessor devolve ao cliente o que ouviu na primeira, mostra a leitura da situação e a proposta de trabalho e pede a decisão. Entrega roteiro, estrutura do material, adaptação ao perfil de quem decide, tratamento de objeção e fechamento com data. Descritivo, sem prometer resultado.
---

# Segunda reunião: devolutiva e decisão

## Objetivo
Transformar o que o cliente disse na primeira reunião em uma proposta clara e sair com uma decisão ou com o próximo passo marcado. Reunião que termina em "vou pensar" sem data não avançou. A segunda reunião só funciona se o material fala dos objetivos **nas palavras do cliente**.

## Entradas
- O que o pedido diz: apelido do cliente, o que ele disse na primeira reunião (objetivos, preocupações, o que recusou), o que o assessor vai propor, duração e canal.
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

**Em PDF** (Resultado PDF ou pedido de material pronto): carregue a skill `apresentacao-pdf` e gere as páginas com `mesa_apresentacao`. Layouts sugeridos: 1 `capa` (com sumário no subtítulo) · 2 `frase` ou `lista` (objetivos nas palavras dele) · 3 `pilares` ou `numeros` (cenário, com fonte e data) · 4 `barras` (alocação atual) e, se houver, `tabela` (custos e liquidez) · 5 `barras` com `valor2` e `legenda` (antes × depois) seguida de `pilares` (3 pontos do porquê) · 6 `etapas` ou `tabela` (plano de execução) · 7 `fechamento` · a nota de compliance vai no `rodape`. Roteiro, objeções, WhatsApp e nota de CRM continuam em texto.

**Estrutura** (padrão 60 min):
1. **Retomada (5 a 7 min):** conexão pessoal, horário-limite e o slide com os objetivos como ele disse. Pergunte: "continuam sendo as prioridades?".
2. **Cenário calibrado (5 a 10 min):** só o que toca os objetivos dele. No nível do cliente: delega, versão simples com analogia; valida, lógica e alternativas; analisa, dados e fontes.
3. **Carteira atual (10 a 15 min):** composição, concentração, liquidez e custos informados, sem juízo. Termine com uma pergunta: "o que você achou mais importante aqui?".
4. **Proposta de trabalho (15 min, páginas 5 e 6 do material):** para cada ponto, "isso responde ao seu objetivo de X porque Y". Descritivo: o que se faz, como, quanto custa e quem faz. Sem prometer resultado e sem recomendar ativo como certeza; a decisão é do cliente.
5. **Dúvidas e objeções (10 min):** pergunte antes de rebater ("o que falta para você se sentir seguro?"). Use a skill `objecoes` se aparecer uma frase pronta.
6. **Fechamento (5 min):** peça uma ação concreta e com data: assinatura, transferência de uma parte, envio de documentos ou a terceira conversa. Alternativa menor se ele hesitar. Combine o que acontece na ativação.

**Erros a evitar:** apresentar o que não responde ao que ele disse · excesso de técnica ou de macro · proposta "tamanho único" · não pedir a decisão · pressão, prazo inventado ou "cota limitada" · ansiedade de fechar com concessão que o assessor não informou.

**Depois:** mensagem em até 24 h com o resumo do combinado e o que cada um faz, e 3 toques se a decisão ficou em aberto (use a skill `relatorio-e-proposta`).

## Modelo de saída (nesta ordem)
**Resumo** — 2 linhas: o objetivo da reunião, o perfil de decisão e a decisão que se pede.
**Peças** (cada uma separada, sem comentário dentro): `roteiro-reuniao` (minuto a minuto, o que fazer e dizer), `material` (as páginas já escritas para o cliente, com título por página, na ordem acima), `objecoes` (as 3 mais prováveis para esse perfil, com a pergunta que responde cada uma), `whatsapp` (resumo do combinado, até 4 linhas), `nota-crm` (decisão, pendências e data).
**Conferir** — perfil de decisão, números do cenário e da carteira, condições comerciais e remuneração.

## Exemplo
Bom (fechamento): "Paula, então combinamos três coisas: você me envia o extrato do banco até terça, eu fecho a proposta com o prazo que conversamos e na quinta, às 10h, nos falamos de novo para você decidir com calma. Pode ser?" Ruim: "Se não fechar hoje, perde a condição." (urgência inventada).

## Limites
Descritivo, nunca prescritivo: sem promessa ou projeção de retorno, sem simulação de rentabilidade como garantia, sem escassez inventada, sem condição comercial que o assessor não informou, sem concorrente pelo nome. Número de mercado com fonte e data. Nada é enviado nem gravado por você.
