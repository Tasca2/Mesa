#!/bin/bash
PACOTE="${MESA_EDVID_PACOTE:-$(cd "$(dirname "$0")/../edvid" 2>/dev/null && pwd)}"
SKILLS="${MESA_SKILLS_DIR:-$HOME/.claude/skills}"
STATUS="${MESA_STATUS_VIDEO:-$HOME/.mesa-do-assessor/instalacao-video.json}"
CHAVE_GROQ="${MESA_CHAVE_GROQ:-}"
TOTAL=7
ERROS=()
ED="$SKILLS/edvid"
LOG="$(dirname "$STATUS")/instalacao-video.log"
mkdir -p "$(dirname "$STATUS")" "$SKILLS"

json_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }
gravar() {
  local lista="" e
  for e in "${ERROS[@]}"; do lista="$lista\"$(json_escape "$e")\","; done
  lista="[${lista%,}]"
  printf '{"estado":"%s","passo":%s,"total":%s,"texto":"%s","erros":%s}' "$1" "$2" "$TOTAL" "$(json_escape "$3")" "$lista" > "$STATUS"
}
registrar() { echo "$(date +%Y-%m-%dT%H:%M:%S) $1" >> "$LOG"; }
falhou() { ERROS+=("$1"); registrar "ERRO: $1"; echo "  [x] $1"; }
passo() { gravar rodando "$1" "$2"; registrar "$2"; echo "[$1/$TOTAL] $2"; }

for d in /opt/homebrew/bin /usr/local/bin "$HOME/.local/bin"; do [ -d "$d" ] && PATH="$d:$PATH"; done
export PATH

tem() { command -v "$1" >/dev/null 2>&1; }
node_ok() { tem node && [ "$(node -v | sed 's/^v//; s/\..*//')" -ge 18 ] 2>/dev/null; }
python_cmd() {
  local c
  for c in python3 python; do
    if tem "$c" && [ "$("$c" -c 'import sys;print(sys.version_info>=(3,10))' 2>/dev/null)" = "True" ]; then echo "$c"; return 0; fi
  done
  return 1
}
brew_instalar() {
  if ! tem brew; then
    if [ -t 0 ]; then
      NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" >> "$LOG" 2>&1
      for d in /opt/homebrew/bin /usr/local/bin; do [ -x "$d/brew" ] && eval "$("$d/brew" shellenv)"; done
    fi
  fi
  tem brew || return 1
  brew install "$@" >> "$LOG" 2>&1
}

gravar rodando 0 "Preparando o editor de vídeo"
echo ""
echo "  Preparando o editor de vídeo da Mesa (pode levar alguns minutos)..."
echo ""

passo 1 "Node.js"
if ! node_ok; then brew_instalar node; node_ok || falhou "Não consegui instalar o Node.js. Instale em nodejs.org e rode de novo."; fi

passo 2 "Python"
PY="$(python_cmd)"
if [ -z "$PY" ]; then brew_instalar python@3.12; PY="$(python_cmd)"; [ -n "$PY" ] || falhou "Não consegui instalar o Python. Instale em python.org e rode de novo."; fi

passo 3 "ffmpeg"
if ! { tem ffmpeg && tem ffprobe; }; then brew_instalar ffmpeg; { tem ffmpeg && tem ffprobe; } || falhou "Não consegui instalar o ffmpeg. Instale com Homebrew (brew install ffmpeg) e rode de novo."; fi

passo 4 "Edição Mesa"
if [ -n "$PACOTE" ] && [ -f "$PACOTE/SKILL.md" ]; then
  mkdir -p "$ED" && cp -R "$PACOTE/." "$ED/" && rm -f "$ED/install.md" "$ED/assets/preview/edvid-logo.png" "$ED/assets/preview/edvid-logo-white.png" && registrar "Edição Mesa instalada ou atualizada a partir da Mesa"
elif [ ! -f "$ED/SKILL.md" ]; then
  falhou "Não encontrei a Edição Mesa dentro da instalação da Mesa. Instale a Mesa de novo."
fi
if [ -d "$ED" ] && [ ! -f "$ED/.env" ]; then
  if [ -f "$ED/.env.example" ]; then cp "$ED/.env.example" "$ED/.env"; else : > "$ED/.env"; fi
fi
if [ -n "$CHAVE_GROQ" ] && [ -f "$ED/.env" ]; then
  grep -v '^[[:space:]]*GROQ_API_KEY[[:space:]]*=' "$ED/.env" > "$ED/.env.tmp"
  printf 'GROQ_API_KEY=%s\n' "$CHAVE_GROQ" >> "$ED/.env.tmp"
  mv "$ED/.env.tmp" "$ED/.env"
fi

passo 5 "Programas do editor (Python)"
if [ -f "$ED/SKILL.md" ] && [ -n "$PY" ]; then
  [ -x "$ED/.venv/bin/python" ] || "$PY" -m venv "$ED/.venv" >> "$LOG" 2>&1
  if [ -x "$ED/.venv/bin/python" ]; then
    "$ED/.venv/bin/python" -m pip install --quiet --disable-pip-version-check requests pillow numpy 'opencv-python-headless==4.10.0.84' >> "$LOG" 2>&1
    "$ED/.venv/bin/python" -c "import requests, PIL, numpy, cv2" 2>/dev/null || falhou "Não consegui instalar os programas Python do editor."
  else falhou "Não consegui criar o ambiente Python do editor."; fi
fi

passo 6 "Guia do Remotion (legendas e gráficos)"
if [ ! -f "$SKILLS/remotion-best-practices/SKILL.md" ]; then
  TMP="$(mktemp -d)"
  if curl -fsSL "https://github.com/remotion-dev/skills/archive/refs/heads/main.zip" -o "$TMP/r.zip" && unzip -q "$TMP/r.zip" -d "$TMP"; then
    for d in "$TMP"/skills-*/skills/*/; do n="$(basename "$d")"; [ -e "$SKILLS/$n" ] || cp -R "$d" "$SKILLS/$n"; done
  else falhou "Não consegui baixar o guia do Remotion."; fi
  rm -rf "$TMP"
fi

passo 7 "Modelo de legendas e gráficos (Node)"
MODELO="$ED/assets/shortform"
if [ -f "$MODELO/package.json" ] && [ ! -d "$MODELO/node_modules" ]; then
  if tem npm; then
    (cd "$MODELO" && npm install --no-audit --no-fund --loglevel=error >> "$LOG" 2>&1)
    [ -d "$MODELO/node_modules" ] || falhou "Não consegui instalar o modelo de legendas."
  else falhou "Sem npm, o modelo de legendas não foi instalado."; fi
fi

if [ "${#ERROS[@]}" -eq 0 ]; then gravar ok "$TOTAL" "Editor de vídeo pronto"; echo ""; echo "  Editor de vídeo pronto."
else gravar erro "$TOTAL" "Terminou com pendências"; echo ""; echo "  Terminou com pendências (veja acima)."; fi
exit 0
