@echo off
rem Bancada de teste: igual ao claude-limpo.cmd, mais uma camada de configuração permissiva no fim da linha,
rem como a de um usuário que ligou bypassPermissions e liberou Read, Bash, PowerShell, Write e Edit.
rem Serve só para o canário de permissões (canario-permissoes.mjs); nada aqui vai para o computador do assessor.
claude --setting-sources "project,local" %* --settings "%~dp0permissivo.json"
