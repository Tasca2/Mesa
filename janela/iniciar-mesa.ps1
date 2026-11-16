Add-Type -AssemblyName System.Windows.Forms
$pasta = Split-Path -Parent $MyInvocation.MyCommand.Path
function Aviso($t) { [System.Windows.Forms.MessageBox]::Show($t, 'Mesa do Assessor') | Out-Null }
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = @((Join-Path $env:ProgramFiles 'nodejs\node.exe'), (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe')) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1 }
if (-not $node) { Aviso 'A Mesa precisa do Node.js (nodejs.org). Instale e abra o ícone de novo.'; exit 1 }
$saida = & $node (Join-Path $pasta 'abrir.mjs') 2>&1 | Out-String
if ($saida -notmatch '"ok":true') { Aviso 'Não consegui abrir a Mesa. Tente de novo.'; exit 1 }
if ($saida -match '"claude":false') { Aviso 'A Mesa abriu, mas precisa do Claude Code instalado e com login feito para rodar os pedidos (claude.com/code).' }
