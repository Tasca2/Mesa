param([string]$Destino)
$ErrorActionPreference = 'Stop'
$pasta = Split-Path -Parent $MyInvocation.MyCommand.Path
$html  = Join-Path $pasta 'mesa-janela.html'
$icone = Join-Path $pasta 'mesa.ico'

Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
$fundo = New-Object System.Drawing.Drawing2D.GraphicsPath
$r = 56; $fundo.AddArc(0, 0, $r, $r, 180, 90); $fundo.AddArc(256 - $r, 0, $r, $r, 270, 90)
$fundo.AddArc(256 - $r, 256 - $r, $r, $r, 0, 90); $fundo.AddArc(0, 256 - $r, $r, $r, 90, 90); $fundo.CloseFigure()
$g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16, 17, 19))), $fundo)
$fonte = New-Object System.Drawing.Font 'Segoe UI', 150, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$fmt = New-Object System.Drawing.StringFormat; $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
$g.DrawString('M', $fonte, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(232, 200, 142))), (New-Object System.Drawing.RectangleF 0, 6, 256, 256), $fmt)
$g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 113, 25))), 196, 196, 26, 26)
$g.Dispose()
$ms = New-Object System.IO.MemoryStream; $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); $png = $ms.ToArray(); $bmp.Dispose()
$fs = [System.IO.File]::Create($icone); $bw = New-Object System.IO.BinaryWriter $fs
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]1)
$bw.Write([Byte]0); $bw.Write([Byte]0); $bw.Write([Byte]0); $bw.Write([Byte]0)
$bw.Write([UInt16]1); $bw.Write([UInt16]32); $bw.Write([UInt32]$png.Length); $bw.Write([UInt32]22)
$bw.Write($png); $bw.Close()

$desktop = if ($Destino) { $Destino } else { [Environment]::GetFolderPath('Desktop') }
$vbs = Join-Path $pasta 'iniciar-mesa.vbs'
$wsh = New-Object -ComObject WScript.Shell
$antigo = Join-Path $desktop 'Mesa do Assessor.lnk'
if (Test-Path $antigo) { try { if ($wsh.CreateShortcut($antigo).Arguments -match 'iniciar-mesa\.vbs') { Remove-Item $antigo -Force } } catch { } }
$atalho = $wsh.CreateShortcut((Join-Path $desktop 'Mesa.lnk'))
$atalho.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'
$atalho.Arguments = "`"$vbs`""
$atalho.WorkingDirectory = $pasta
$atalho.IconLocation = "$icone,0"
$atalho.Description = 'Atalho da Mesa no desktop'
$atalho.Save()
Write-Output "Atalho criado em $desktop"
