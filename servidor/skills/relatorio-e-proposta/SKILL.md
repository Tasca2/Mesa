---
name: relatorio-e-proposta
description: Prepara o material de relacionamento que o assessor entrega ao cliente: relatório mensal descritivo, proposta de assessoria e follow-up pós-proposta. Tudo descritivo, com fonte e data, sem recomendar ativo nem prometer retorno.
---

# Relatório mensal, proposta e follow-up

## Objetivo
Tirar do assessor o trabalho de montar do zero o relatório do mês, a proposta e a cobrança educada da resposta, mantendo o cliente informado e a decisão com ele.

## Entradas
- Qual material (o pedido diz). Dados que o assessor cola: posição e movimentos do período (relatório), escopo, serviços e condições (proposta), histórico e data da proposta (follow-up). Sem número, sem peça: peça o dado, não invente.
- Perfil do assessor (`mesa_perfil`). Para ativos listados, `analise_ativo` quando o pedido disser que o CaptaMais está conectado. Rode `consultar_cofre` (tema `relacionamento comunicação com cliente`); sem cofre, siga o método.
- Falta algo essencial? Pergunte **uma** coisa e entregue o resto com `[CONFERIR]`.

## Método
**Relatório mensal (descritivo):** abertura de uma frase com o que mudou no mês; patrimônio e variação com período e fonte; composição por classe; o que aconteceu no mercado que explica os números, em linguagem simples; vencimentos e eventos dos próximos 30 dias; um próximo passo com data. Nada de "recomendamos" nem projeção.
**Proposta de assessoria:** quem somos e como trabalhamos; o que o cliente disse que quer (nas palavras dele); o que o serviço inclui; como e quando conversamos; o que não está incluído; condições comerciais **só as que o assessor informou** (`[CONFERIR]` no restante); **como o assessor é remunerado e se há conflito de interesse**, dito com clareza e em linguagem simples (a transparência de remuneração é tema das normas da CVM: confirme a regra atual com `consultar_cofre` tema `legislacao` ou `[CONFERIR]` com o compliance); próximo passo. Sem prometer resultado. Proposta de terceiros no material de consulta com rentabilidade média, "lucro" ou "IA que elimina riscos" é exemplo do que **não** escrever.
**Follow-up pós-proposta:** 3 toques (dia 2, dia 5 e dia 10): perguntar o que falta para decidir, oferecer esclarecer um ponto, fechar o ciclo sem culpa. Respeitar a data que o cliente deu.

## Modelo de saída (nesta ordem)
**Resumo** — 2 a 3 linhas.
**Peças** (cada uma separada, sem comentário dentro): `relatorio` (relatório ou proposta, com título), `whatsapp` (mensagem de envio ou cada toque, até 4 linhas), `email` (quando pedido), `nota-crm` (o que foi enviado e o próximo passo).
**Conferir** — dados, condições e datas que o assessor valida.

**Em PDF** (Resultado PDF): `mesa_documento` com `cliente` (apelido ou iniciais) e `dataBase`. Relatório mensal: `tipo: "relatorio"`, até 4 `destaques` do mês (patrimônio, variação no período, com o número do texto) e, se o assessor informar os retornos mensais, `grafico` `linha` com `retornos: true` (carteira, CDI e índice, com fonte). Proposta: `tipo: "proposta"` e `capa: true`. WhatsApp, e-mail, nota de CRM e Conferir ficam no chat, fora do PDF.

## Exemplo
Bom (envio do relatório): "Oi, Marta! Mandei o resumo de outubro: o patrimônio fechou o mês em R$ 482 mil e abaixo vai o que explicou a variação. Tem dois vencimentos em dezembro que quero combinar com você. Sexta, 10h, funciona?" Ruim: "Seu rendimento foi ótimo, recomendo aumentar a renda variável." (recomendação e juízo sem fonte).

## Limites
Descritivo, nunca prescritivo; número só com fonte e data; sem promessa ou projeção; sem condição comercial inventada; identificação do profissional na proposta. Nada é enviado nem gravado por você.
