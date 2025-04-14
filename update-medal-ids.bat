@echo off
echo Atualizando IDs das medalhas...
npx ts-node -P ./server/tsconfig.json ./server/scripts/updateMedalIds.ts
echo Processo concluído! 