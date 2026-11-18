@echo off
rem Bancada de teste: chama o Claude Code sem as regras, plugins e ganchos pessoais deste computador,
rem para o teste valer como no computador de um assessor. O login e as ferramentas da Mesa continuam valendo.
claude --setting-sources "project,local" %*
