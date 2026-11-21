param(
  [string]$Pacote = (Join-Path $PSScriptRoot '..\edvid'),
  [string]$Skills = (Join-Path $env:USERPROFILE '.claude\skills'),
  [string]$Status = (Join-Path $env:USERPROFILE '.mesa-do-assessor\instalacao-video.json'),
  [string]$ChaveGroq = ''
)
if (-not $ChaveGroq) { $ChaveGroq = $env:MESA_CHAVE_GROQ }
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Total = 7
$Erros = New-Object System.Collections.ArrayList
$Log = Join-Path (Split-Path $Status) 'instalacao-video.log'
New-Item -ItemType Directory -Force (Split-Path $Status) | Out-Null
$Ed = Join-Path $Skills 'edvid'
$Ferramentas = Join-Path $env:LOCALAPPDATA 'MesaDoAssessor'

function Gravar($estado, $passo, $texto) {
  $o = [ordered]@{ estado = $estado; passo = $passo; total = $Total; texto = $texto; erros = @($Erros) }
  [IO.File]::WriteAllText($Status, ($o | ConvertTo-Json -Compress), (New-Object Text.UTF8Encoding $false))
}
function Registrar($t) { try { Add-Content -Path $Log -Value ("{0} {1}" -f (Get-Date -Format 's'), $t) -Encoding UTF8 } catch { } }
function Falhou($t) { [void]$Erros.Add($t); Registrar ("ERRO: " + $t); Write-Host ("  [x] " + $t) }
function Passo($n, $t) { Gravar 'rodando' $n $t; Registrar $t; Write-Host ("[{0}/{1}] {2}" -f $n, $Total, $t) }
function AtualizarPath {
  $m = [Environment]::GetEnvironmentVariable('Path', 'Machine'); $u = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = ($m + ';' + $u)
}
function Achar($nome) { $c = Get-Command $nome -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { $c.Source } else { $null } }
function Baixar($url, $arq) { Invoke-WebRequest -Uri $url -OutFile $arq -UseBasicParsing -TimeoutSec 600 }
function Winget($id) {
  if (-not (Achar 'winget')) { return $false }
  Registrar ("winget " + $id)
  & winget install --id $id -e --silent --accept-package-agreements --accept-source-agreements 2>&1 | ForEach-Object { Registrar $_ }
  AtualizarPath
  return $true
}
function NodeOk {
  $n = Achar 'node'; if (-not $n) { return $false }
  try { $v = (& node -v) -replace '^v', ''; return ([int]($v.Split('.')[0]) -ge 18) } catch { return $false }
}
function PythonAchado {
  foreach ($c in @(@('py', '-3'), @('python'), @('python3'))) {
    $exe = Achar $c[0]; if (-not $exe) { continue }
    $extra = @(); if ($c.Count -gt 1) { $extra += $c[1] }
    try {
      $r = & $exe @extra -c "import sys;print(sys.version_info>=(3,10))" 2>$null
      if ("$r".Trim() -eq 'True') { return ,@($exe, $extra) }
    } catch { }
  }
  return $null
}
function FfmpegOk { return [bool]((Achar 'ffmpeg') -and (Achar 'ffprobe')) }
function InstalarPythonDireto {
  $f = Join-Path $env:TEMP 'python-3.12.8-amd64.exe'
  Registrar 'baixando o Python em python.org'
  Baixar 'https://www.python.org/ftp/python/3.12.8/python-3.12.8-amd64.exe' $f
  Start-Process -FilePath $f -ArgumentList '/quiet', 'InstallAllUsers=0', 'PrependPath=1', 'Include_test=0', 'Include_launcher=1' -Wait
  Remove-Item $f -Force -ErrorAction SilentlyContinue
  AtualizarPath
}
function InstalarNodeDireto {
  $f = Join-Path $env:TEMP 'node-v22.11.0-x64.msi'
  Registrar 'baixando o Node.js em nodejs.org'
  Baixar 'https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi' $f
  Start-Process -FilePath 'msiexec.exe' -ArgumentList '/i', ('"' + $f + '"'), '/qn', '/norestart' -Verb RunAs -Wait
  Remove-Item $f -Force -ErrorAction SilentlyContinue
  AtualizarPath
}
function InstalarFfmpegDireto {
  $destino = Join-Path $Ferramentas 'ffmpeg'
  $tmp = Join-Path $env:TEMP ('mesa-ffmpeg-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Force $tmp | Out-Null
  Registrar 'baixando o ffmpeg'
  Baixar 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' (Join-Path $tmp 'f.zip')
  if (Test-Path $destino) { Remove-Item $destino -Recurse -Force -ErrorAction SilentlyContinue }
  New-Item -ItemType Directory -Force $destino | Out-Null
  Expand-Archive -Path (Join-Path $tmp 'f.zip') -DestinationPath $destino -Force
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  $exe = Get-ChildItem $destino -Recurse -Filter 'ffmpeg.exe' | Select-Object -First 1
  if ($exe) {
    $bin = $exe.DirectoryName
    $u = [Environment]::GetEnvironmentVariable('Path', 'User')
    if (-not (($u -split ';') -contains $bin)) { [Environment]::SetEnvironmentVariable('Path', ($u.TrimEnd(';') + ';' + $bin), 'User') }
  }
  AtualizarPath
}

Gravar 'rodando' 0 'Preparando o editor de vídeo'
Write-Host ''
Write-Host '  Preparando o editor de vídeo da Mesa (pode levar alguns minutos)...'
Write-Host ''
AtualizarPath

Passo 1 'Node.js'
if (-not (NodeOk)) {
  [void](Winget 'OpenJS.NodeJS.LTS')
  if (-not (NodeOk)) { try { InstalarNodeDireto } catch { Registrar $_.Exception.Message } }
  if (-not (NodeOk)) { Falhou 'Não consegui instalar o Node.js. Instale em nodejs.org e rode de novo.' }
}

Passo 2 'Python'
$py = PythonAchado
if (-not $py) {
  [void](Winget 'Python.Python.3.12')
  $py = PythonAchado
  if (-not $py) { try { InstalarPythonDireto } catch { Registrar $_.Exception.Message }; $py = PythonAchado }
  if (-not $py) { Falhou 'Não consegui instalar o Python. Instale em python.org (marque Add to PATH) e rode de novo.' }
}

Passo 3 'ffmpeg'
if (-not (FfmpegOk)) {
  [void](Winget 'Gyan.FFmpeg')
  if (-not (FfmpegOk)) { try { InstalarFfmpegDireto } catch { Registrar $_.Exception.Message } }
  if (-not (FfmpegOk)) { Falhou 'Não consegui instalar o ffmpeg. Instale em ffmpeg.org e rode de novo.' }
}

Passo 4 'Edição Mesa'
if (Test-Path (Join-Path $Pacote 'SKILL.md')) {
  New-Item -ItemType Directory -Force $Ed | Out-Null
  Copy-Item -Path (Join-Path $Pacote '*') -Destination $Ed -Recurse -Force
  Get-ChildItem -Path $Pacote -Force -Filter '.*' -File -ErrorAction SilentlyContinue | ForEach-Object { Copy-Item $_.FullName $Ed -Force }
  foreach ($velho in @('install.md', 'assets\preview\edvid-logo.png', 'assets\preview\edvid-logo-white.png')) { Remove-Item (Join-Path $Ed $velho) -Force -ErrorAction SilentlyContinue }
  Registrar 'Edição Mesa instalada ou atualizada a partir da Mesa'
} elseif (-not (Test-Path (Join-Path $Ed 'SKILL.md'))) {
  Falhou 'Não encontrei a Edição Mesa dentro da instalação da Mesa. Instale a Mesa de novo.'
}
$envArq = Join-Path $Ed '.env'
if ((Test-Path $Ed) -and -not (Test-Path $envArq)) {
  $ex = Join-Path $Ed '.env.example'
  if (Test-Path $ex) { Copy-Item $ex $envArq } else { New-Item -ItemType File $envArq | Out-Null }
}
if ($ChaveGroq -and (Test-Path $envArq)) {
  $linhas = @(Get-Content $envArq | Where-Object { $_ -notmatch '^\s*GROQ_API_KEY\s*=' })
  $linhas += ('GROQ_API_KEY=' + $ChaveGroq.Trim())
  [IO.File]::WriteAllText($envArq, (($linhas -join "`n") + "`n"), (New-Object Text.UTF8Encoding $false))
}

Passo 5 'Programas do editor (Python)'
$venvPy = Join-Path $Ed '.venv\Scripts\python.exe'
if ((Test-Path (Join-Path $Ed 'SKILL.md')) -and $py) {
  if (-not (Test-Path $venvPy)) {
    $extra = @(); if ($py[1]) { $extra += $py[1] }
    & $py[0] @extra -m venv (Join-Path $Ed '.venv') 2>&1 | ForEach-Object { Registrar $_ }
  }
  if (Test-Path $venvPy) {
    & $venvPy -m pip install --quiet --disable-pip-version-check requests pillow numpy 'opencv-python-headless==4.10.0.84' 2>&1 | ForEach-Object { Registrar $_ }
    & $venvPy -c "import requests, PIL, numpy, cv2" 2>$null
    if ($LASTEXITCODE -ne 0) { Falhou 'Não consegui instalar os programas Python do editor.' }
  } else { Falhou 'Não consegui criar o ambiente Python do editor.' }
}

Passo 6 'Guia do Remotion (legendas e gráficos)'
if (-not (Test-Path (Join-Path $Skills 'remotion-best-practices\SKILL.md'))) {
  try {
    $tmp = Join-Path $env:TEMP ('mesa-remotion-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force $tmp | Out-Null
    Baixar 'https://github.com/remotion-dev/skills/archive/refs/heads/main.zip' (Join-Path $tmp 'r.zip')
    Expand-Archive -Path (Join-Path $tmp 'r.zip') -DestinationPath $tmp -Force
    $raiz = Get-ChildItem $tmp -Directory | Where-Object { $_.Name -like 'skills-*' } | Select-Object -First 1
    Get-ChildItem (Join-Path $raiz.FullName 'skills') -Directory | ForEach-Object {
      $dest = Join-Path $Skills $_.Name
      if (-not (Test-Path $dest)) { Copy-Item $_.FullName $dest -Recurse -Force }
    }
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  } catch { Falhou ('Não consegui baixar o guia do Remotion: ' + $_.Exception.Message) }
}

Passo 7 'Modelo de legendas e gráficos (Node)'
$modelo = Join-Path $Ed 'assets\shortform'
if ((Test-Path (Join-Path $modelo 'package.json')) -and -not (Test-Path (Join-Path $modelo 'node_modules'))) {
  $npm = Achar 'npm.cmd'; if (-not $npm) { $npm = Achar 'npm' }
  if ($npm) {
    Push-Location $modelo
    & $npm install --no-audit --no-fund --loglevel=error 2>&1 | ForEach-Object { Registrar $_ }
    Pop-Location
    if (-not (Test-Path (Join-Path $modelo 'node_modules'))) { Falhou 'Não consegui instalar o modelo de legendas.' }
  } else { Falhou 'Sem npm, o modelo de legendas não foi instalado.' }
}

if ($Erros.Count -eq 0) { Gravar 'ok' $Total 'Editor de vídeo pronto'; Write-Host ''; Write-Host '  Editor de vídeo pronto.' }
else { Gravar 'erro' $Total 'Terminou com pendências'; Write-Host ''; Write-Host '  Terminou com pendências (veja acima).' }
exit 0
