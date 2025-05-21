# Deploy do Backend no Railway

## 1. Preparação do Projeto

- Certifica-te que o projeto está limpo, sem ficheiros desnecessários (`logs`, `temp`, `uploads`, etc).
- O ficheiro `.env` **NÃO** deve ser enviado para o repositório (confirma que está no `.gitignore`).

---

## 2. Subir o Projeto para o GitHub

- Faz commit de todas as alterações.
- Faz push para o GitHub.

---

## 3. Criar o Projeto no Railway

1. Vai a [https://railway.app/](https://railway.app/) e faz login.
2. Clica em **"New Project"**.
3. Seleciona **"Deploy from GitHub repo"** e escolhe o repositório do teu projeto.

---

## 4. Configurar as Variáveis de Ambiente no Railway

- No painel do projeto Railway, vai a **"Variables"**.
- Adiciona todas as variáveis do teu `.env` (NUNCA faças upload do ficheiro `.env`):
  - `MONGODB_URI`
  - `MONGODB_DB_NAME`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `R2_ENDPOINT`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET`
  - (Qualquer outra que uses no backend)

---

## 5. Configurar o Start Command

- Railway tenta detetar automaticamente, mas confirma que o comando de start está correto.
- Exemplos:
  - Se usas `ts-node`:
    ```
    npx ts-node server/server.ts
    ```
  - Se transpilas para JS antes:
    ```
    node dist/server.js
    ```
  - Se usas script no `package.json`:
    ```
    npm run start
    ```

---

## 6. Deploy

- Clica em **"Deploy"**.
- Railway vai instalar as dependências e arrancar o servidor.

---

## 7. Verifica o Endpoint

- No painel do Railway, vais ver o URL público do backend (ex: `https://nome-do-projeto.up.railway.app`).
- Usa este URL para configurar o `VITE_API_URL` do frontend (Netlify).

---

## 8. Testa o Backend

- Usa o Postman ou browser para testar as rotas públicas (ex: `/api/health` ou `/api/auth/login`).
- Garante que o backend responde corretamente.

---

## 9. Dicas de Segurança e Produção

- Nunca exponhas o `.env` no repositório.
- Usa sempre variáveis de ambiente no painel do Railway.
- Garante que o CORS está configurado para aceitar pedidos do domínio do frontend (Netlify).
