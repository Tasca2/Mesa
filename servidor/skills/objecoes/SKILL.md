---
name: objecoes
description: Prepara a resposta do assessor a uma objeção de cliente ou prospect ("já tenho assessor", "estou sem tempo", "a taxa é alta", "vou pensar"): diagnostica a objeção real, dá a pergunta de aprofundamento e entrega a resposta pronta para o canal (WhatsApp, ligação ou reunião). Use em prospecção, reunião ou follow-up; não promete resultado nem indica ativo.
---

# Objeções do cliente

## Objetivo
Responder o "não" sem pressionar: entender o que está por trás da frase, fazer uma pergunta que abre a conversa e deixar a resposta pronta no canal onde a objeção apareceu.

## Entradas
- A **frase exata** do cliente (se veio só o tema, peça a frase).
- O canal (WhatsApp, ligação, reunião) e o ponto da relação (prospecção, depois da reunião, follow-up).
- O histórico, se houver. Perfil do assessor (`mesa_perfil`) e `consultar_cofre` com o tema `objecoes SPIN venda consultiva`; sem cofre, siga o método.

Se tudo isso já veio no pedido, **não pergunte nada**: entregue.

## Passos
1. **Classifique** a objeção real e diga em uma linha, com o porquê: *falta de confiança* · *falta de urgência* ("vou pensar") · *falta de valor percebido* (taxa, "meu banco já faz") · *falta de autoridade* (cônjuge, sócio) · *cliente satisfeito* (já tem assessor) · *experiência ruim* ("já perdi dinheiro", "não confio em corretora") · *esquiva* ("me manda por WhatsApp", "depois eu vejo") · *momento* ("o mercado está ruim", "vou esperar a eleição"). A mesma frase pode esconder outro tipo: "a taxa é alta" dita por quem ainda não entendeu o serviço é valor percebido, não preço. Decida pelo histórico, não pela frase.
   - *Experiência ruim*: não defenda o mercado. Pergunte o que aconteceu e o que ele gostaria que tivesse sido diferente.
   - *Esquiva*: aceite o pedido e amarre uma data ("mando hoje; posso te chamar na quinta para ouvir o que achou?"). Material sem data marcada vira silêncio.
   - *Momento*: não preveja o mercado. Pergunte o que precisaria acontecer para ele se sentir seguro e o que o dinheiro faz enquanto isso.
2. **Responda em três movimentos**: reconhecer sem discutir ("faz sentido…") → **uma** pergunta de aprofundamento (problema ou implicação do SPIN, nunca argumento) → ponte para um próximo passo pequeno (15 minutos, material, nova data).
3. **Adapte ao canal onde apareceu**: WhatsApp = até 4 linhas; ligação = frase falada com a pausa marcada; reunião = a pergunta e o que fazer com o silêncio. Só entregue as variantes de outros canais se forem úteis (uma linha basta).
4. **Taxa ou custo**: explique o que a taxa paga (serviço, frequência, acompanhamento), sem comparar com concorrente pelo nome e sem desconto não informado. Qualquer regra (custódia, conflito) vai como `[CONFERIR]` com o compliance.
5. **O que não dizer**: 2 frases que pioram este caso.

## Modelo de saída (nesta ordem)
**Diagnóstico** — tipo da objeção + o que está por trás, em 2 linhas.
**Pergunta de aprofundamento** — a frase, uma só.
**Peça principal** (no canal pedido): `whatsapp` (até 4 linhas) ou `roteiro-ligacao` (frase falada + pausa + plano B) ou `roteiro-reuniao` (pergunta, silêncio, próximo passo).
**Se ele responder / se não responder** — uma linha para cada caminho (o que dizer, quando voltar).
**Não diga** — 2 frases com o motivo.
**Conferir** — o que validar antes (regras, números).

## Exemplo (resumido)
Frase: "Já tenho assessor e estou satisfeito." Canal: WhatsApp. Conheceram-se numa palestra.
- Diagnóstico: cliente satisfeito; vínculo ainda fraco, então sem urgência para mudar.
- Pergunta: "Se você pudesse acrescentar uma coisa ao que tem hoje (planejamento, sucessão, proteção), o que seria?"
- WhatsApp: "Que bom, Marcos, é ótimo ter alguém de confiança. Não quero mexer no que funciona. Só por curiosidade: se pudesse acrescentar uma coisa ao que tem hoje, o que seria? Se nada, perfeito; se algo, troco uma ideia de 15 min, sem compromisso."
- Não diga: "Posso fazer melhor que ele" (ataca o assessor atual) e "Tenho uma carteira que rende mais" (promessa).

## Limites
- Não prometa rentabilidade nem compare com concorrente pelo nome.
- Sem desconto ou condição comercial que o assessor não tenha informado.
- Conteúdo de mercado só descritivo e com fonte e data.

Termine com "Base: <notas do cofre usadas>", se usou.
