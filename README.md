# Mesa do Assessor

Facilitador do dia a dia do assessor de investimentos: rotinas, pedidos e apresentações prontas para usar com prospects e clientes, dentro do Claude.

## Como usar

1. Instale o [Node.js](https://nodejs.org) (versão 20 ou mais nova) e o Claude Code.
2. Na pasta `servidor`, rode `npm install`.
3. Copie `skill-mesa-app/SKILL.md` para `~/.claude/skills/mesa/SKILL.md` e as pastas `janela`, `servidor` e `edvid` para `~/.claude/skills/mesa/app/`. A pasta `edvid` é a Edição Mesa, o editor de vídeo da Mesa, e já vem neste repositório: não há nada para baixar de outro lugar.
4. Para editar vídeos, rode uma vez o instalador que está na cópia em `~/.claude/skills/mesa/app/janela`: no Windows, `powershell -ExecutionPolicy Bypass -File instalar-video.ps1`; no Mac, `bash instalar-video.sh`. Ele instala o que a edição usa (Python, ffmpeg e Node.js) e coloca a Edição Mesa no Claude.
5. Abra o Claude e digite `/mesa`.

O passo a passo de uso está em [LEIA-ME.md](LEIA-ME.md).
