# Usa uma imagem oficial do Node.js
FROM node:20

# Define o diretório de trabalho
WORKDIR /app

# Copia os ficheiros de package
COPY package*.json ./

# Instala as dependências (incluindo devDependencies)
RUN npm install

# Copia o resto do código
COPY . .

# Compila o TypeScript
RUN npx tsc

# Expõe a porta (ajusta se usares outra)
EXPOSE 3000

# Comando para iniciar a app
CMD ["node", "dist/server.js"] 