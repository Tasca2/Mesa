---
name: prospeccao-abordagem
description: Prepara primeira abordagem e perguntas de descoberta para um contato, usando contexto público pertinente e vínculo confirmado. Use antes de uma conversa inicial; retomadas com histórico ficam em retomada-lead-frio. Não envia mensagens nem produz recomendação de investimento.
---

# Preparação de abordagem

Revisão: 22/09/2026.

Escreva uma abertura adequada ao canal, ao vínculo real e ao motivo de conversar.

## Contexto da abordagem

Identifique se é primeiro contato ou retomada. Com histórico aberto, trabalhe como acompanhamento usando o combinado; não repita pesquisa de primeiro contato. Aproveite canal, objetivo, tom e diferencial real do serviço já informados.

Para personalização, use fatos profissionais públicos com fonte e data quando disponíveis: setor, atividade, evento ou informação que o contato divulgou. Não deduza patrimônio, vulnerabilidade, renda ou interesse em produto a partir do cargo. Informação não necessária não entra só porque é pública.

Vínculo prévio ou apresentação recebida do operador pode orientar o tom, identificado como informação fornecida; não invente conexão comum nem exija fonte pública de uma conversa privada. Use rótulos e não reproduza informação confidencial no texto.

## Construção

- Abertura: contexto verdadeiro, motivo específico e convite de baixo esforço. Um WhatsApp curto, e-mail com assunto ou início de ligação conforme canal escolhido.
- Hipótese de necessidade só aparece como hipótese e pergunta que a testaria, não como diagnóstico do contato.
- Perguntas de descoberta sobre objetivo da conversa, experiência e dificuldade percebida, em número proporcional ao tempo disponível. Não solicite patrimônio no primeiro contato.
- Objeções: responda às que o usuário trouxe ou às pertinentes; não acrescente sempre “já tenho assessor” e “prefiro o banco”. Reconheça a posição sem depreciar concorrente.
- Se faltarem diferenciais comprovados, descreva serviço real em vez de inventar exclusividade, credencial ou resultado.
- Sem nome/profiling suficiente, prepare abertura contextual genérica e sinalize o ponto que uma informação pública pertinente permitiria personalizar.

## Entrega completa, quando solicitada

1. Fatos públicos relevantes com fontes.
2. Hipóteses e perguntas de verificação.
3. Motivo da conversa.
4. Abertura no canal pedido; alternativas apenas se solicitadas.
5. Perguntas de descoberta.
6. Objeções pertinentes e respostas.
7. Checagem de linguagem, caso seja pedido relatório ou exercício.

Faça a checagem internamente em todo texto: sem retorno prometido, recomendação individual, urgência inventada, falsa familiaridade ou conexão fictícia. Texto para copiar vem primeiro; observações internas ficam separadas.

Se a resposta do contato for enviada depois, adapte-se ao que ele disse. Recusa expressa deve ser respeitada; não transforme personalização em insistência ou crie sequência automática.

## Limites

- Não produzir recomendação individual de compra, venda, manutenção ou alocação, nem promessa ou expectativa de retorno, mesmo em cenário hipotético.
- Dado de mercado exige fonte e data visíveis. Ausência é “não informado”; não é zero nem autorização para estimar. Cálculos derivados devem mostrar os dados e a fórmula.
- Usar rótulos genéricos e dados minimizados para pessoas; não solicitar identificadores, contas ou informações confidenciais. Não usar informação relevante ainda não pública nem dados obtidos no trabalho de assessoria. Não expor empregador ou clientes do operador.
- Esta skill prepara análise ou rascunho. Não envia mensagem, publica, movimenta carteira, contrata serviço nem gasta créditos.

## Método do cofre (acrescentado)

Antes de montar a abordagem, chame `mesa_perfil` e `consultar_cofre` (tema `cold call SPIN rapport`).

- **Ligação (IPQF)**: Introdução nos primeiros 30 a 40 segundos (nome, motivo, pedido de permissão), Pitch rápido (o porquê da ligação), Qualificação (decidir se vale seguir), Finalização (próximo passo marcado). Ligação com lead que já interagiu é "morna": cite o conteúdo que ele consumiu.
- **Pesquisa antes**: perfil público do lead (LinkedIn, Instagram) em busca de ponto de rapport e notícia relevante; o DDD também abre conversa ("de qual cidade você fala?").
- **Descoberta (SPIN)**: motivo da conversa, objetivo e emoção por trás dele (não aceite só a primeira resposta), perguntas de problema, de implicação negativa e de implicação positiva. Use os ganchos que o lead falar: não é script.
- **O que fica para a reunião**: mapeamento de instituições, renda fixa x variável e valores são perguntas da reunião de descoberta, depois que ele aceitou conversar. Na primeira mensagem ou nos primeiros minutos da ligação, não pergunte patrimônio nem onde ele investe.
- **Solução**: só depois da dor; falar do escritório antes de resolver o problema do lead não vende.
- **Depois do primeiro contato**: entregue uma linha para cada caminho (se ele responder; se não responder, quando e por onde voltar a falar, uma vez). Sequência completa de toques só se o assessor pedir: na Mesa, é a tarefa Sequência para lead novo (skill `roteiro-comercial`); lead que já conversou e parou de responder é `retomada-lead-frio`. Para a resposta a uma objeção, `objecoes`.

## Modelo de saída na Mesa (nesta ordem)

**Motivo da conversa** — uma linha: por que falar com essa pessoa agora, com o fato que sustenta (vínculo informado ou fato público com fonte e data).
**Peça principal**, só a do canal escolhido, pronta para copiar:
- `whatsapp`: até 4 linhas. Quem sou e de onde nos conhecemos · o motivo específico · uma pergunta de resposta fácil. Sem anexo, sem link, sem falar de produto.
- `email`: assunto de até 6 palavras, sem "oportunidade" nem "proposta" · 5 a 6 linhas · uma chamada só.
- Ligação: na Mesa, a ligação de primeiro contato é a tarefa Ligação de primeiro contato (skill `roteiro-comercial`); aqui a peça é só mensagem.
**Perguntas de descoberta** — 4 a 6, para quando ele aceitar conversar: objetivo, o que o incomoda hoje, o que acontece se nada mudar. Nenhuma sobre valores.
**Contexto público que vale citar** — até 3 fatos com fonte e data, ou "nada encontrado: abertura pelo vínculo".
**Se ele responder / se não responder** — uma linha para cada caminho.
**Conferir** — vínculo, nome da pessoa que indicou e qualquer fato que o assessor precisa validar antes de enviar.

## Exemplo (resumido)
Entrada: Dr. Marcos, cardiologista; indicação do Carlos (cliente); canal WhatsApp.
- Motivo: indicação do Carlos; médicos em fase de consultório próprio costumam ter renda alta e pouco tempo para organizar o patrimônio (hipótese, a confirmar com ele).
- WhatsApp: "Oi, Dr. Marcos, tudo bem? Sou o [nome], assessor de investimentos; o Carlos me passou seu contato [CONFERIR se ele avisou]. Ele comentou que o senhor anda sem tempo para olhar a parte financeira. Faz sentido uma conversa de 15 minutos para eu entender como está hoje? Se não for o momento, sem problema."
- Evite: "Tenho uma oportunidade para o senhor" (promessa) e "Quanto o senhor tem investido?" (patrimônio no primeiro contato).
