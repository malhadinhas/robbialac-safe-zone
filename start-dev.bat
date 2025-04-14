@echo off
echo Iniciando ambiente de desenvolvimento...

:: Instalar dependências do frontend
echo Instalando dependências do frontend...
call npm install

:: Instalar dependências do backend
echo Instalando dependências do backend...
cd server
call npm install
cd ..

:: Iniciar frontend em uma nova janela
echo Iniciando frontend...
start cmd /k "npm run dev"

:: Iniciar backend em uma nova janela
echo Iniciando backend...
cd server
start cmd /k "npm run dev"
cd ..

echo Ambiente de desenvolvimento iniciado!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3000
pause 