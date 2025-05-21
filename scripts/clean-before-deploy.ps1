# Script PowerShell para limpar ficheiros desnecessários antes do deploy

# Limpar logs
Remove-Item -Recurse -Force logs\* 2>$null

# Limpar uploads
Remove-Item -Recurse -Force uploads\* 2>$null

# Limpar temp
Remove-Item -Recurse -Force temp\* 2>$null

# Limpar storage/uploads, storage/profiles, storage/temp
Remove-Item -Recurse -Force storage\uploads\* 2>$null
Remove-Item -Recurse -Force storage\profiles\* 2>$null
Remove-Item -Recurse -Force storage\temp\* 2>$null

# (Opcional) Limpar ficheiros PDF antigos em storage/accidents
# Remove-Item -Recurse -Force storage\accidents\*.pdf 2>$null

Write-Host "Limpeza concluída! Pronto para o deploy." 