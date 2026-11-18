@echo off
rem Claude falso para os testes do motor (bancada): grava argumentos e pedido e responde como o Claude Code em -p.
node "%~dp0falso-claude.mjs" %*
