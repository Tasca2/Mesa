@echo off
rem Bancada de teste: igual ao claude-limpo.cmd, mais regras amplas de liberação no fim da linha (Read, Grep, Glob,
rem Write, Edit, Bash, PowerShell), como as que um usuário pode ter nas configurações dele. Não muda o modo de permissão
rem nem a camada --settings do motor. Serve só para o canário de permissões (canario-permissoes.mjs).
claude --setting-sources "project,local" %* --allowedTools Read Grep Glob Write Edit Bash PowerShell
