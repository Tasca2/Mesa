# Mesa do Assessor

Facilitador do dia a dia do assessor de investimentos: rotinas, pedidos e apresentações prontas para usar com prospects e clientes. Há duas versões: uma para o **Claude** (com janela própria, histórico de clientes, PDF e PowerPoint, imagens e edição de vídeo) e uma para o **ChatGPT** (um GPT personalizado, na pasta `chatgpt`).

## Versão para o Claude

1. Instale o [Node.js](https://nodejs.org) (versão 20 ou mais nova) e o Claude Code.
2. Na pasta `servidor`, rode `npm install`.
3. Copie `skill-mesa-app/SKILL.md` para `~/.claude/skills/mesa/SKILL.md` e as pastas `janela`, `servidor` e `edvid` para `~/.claude/skills/mesa/app/`. A pasta `edvid` é a Edição Mesa, o editor de vídeo da Mesa, e já vem neste repositório: não há nada para baixar de outro lugar.
4. Para editar vídeos, rode uma vez o instalador que está na cópia em `~/.claude/skills/mesa/app/janela`: no Windows, `powershell -ExecutionPolicy Bypass -File instalar-video.ps1`; no Mac, `bash instalar-video.sh`. Ele instala o que a edição usa (Python, ffmpeg e Node.js) e coloca a Edição Mesa no Claude.
5. Abra o Claude e digite `/mesa`.

O passo a passo de uso está em [LEIA-ME.md](LEIA-ME.md).

## Versão para o ChatGPT

No ChatGPT não existe skill: o equivalente é um **GPT personalizado**. A pasta [`chatgpt`](chatgpt) traz as instruções e os arquivos de conhecimento com as mesmas rotinas, e o [passo a passo](chatgpt/LEIA-ME.md) para criar o seu em poucos minutos. Ele não tem a janela, o histórico guardado no computador nem a edição de vídeo.
