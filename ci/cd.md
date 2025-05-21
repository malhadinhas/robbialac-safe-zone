# CI/CD - LearnSafe360

## 1. Visão Geral dos Ambientes

- **Desenvolvimento (local):** Onde você desenvolve e testa rapidamente no seu PC.
- **Staging/Homologação:** Ambiente online idêntico à produção, usado para testes finais antes de liberar para todos.
- **Produção:** Ambiente final, acessado pelos usuários reais.

## 2. Pipeline de Deploy

- **Branch de feature:** Desenvolvimento de novas funcionalidades.
- **Branch develop:** Integração de features, deploy automático para Staging.
- **Branch main:** Código estável, deploy automático para Produção.

## 3. Como configurar o GitHub para este fluxo

### Pré-requisitos

- Repositório já criado no GitHub (como já está no seu caso).
- Projeto já com commit inicial.

### Passo a Passo

#### 1. Estrutura de Branches

1.1. Certifique-se de que você tem as seguintes branches:

- `main` (produção)
- `develop` (homologação/staging)

Se não existir, crie a branch develop baseada na main:

```bash
git checkout main
git pull origin main
git checkout -b develop
git push origin develop
```

#### 2. Proteja as branches principais

- No GitHub, vá em **Settings > Branches > Branch protection rules**.
- Adicione regras para `main` e `develop`:
  - Exigir Pull Request para merge
  - Exigir aprovação de pelo menos 1 reviewer
  - Exigir que o status do CI esteja verde (testes passem)

#### 3. Workflow de Pull Requests

- Para cada nova feature, crie uma branch:
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b feature/nome-da-feature
  # desenvolva, commit, push
  git push origin feature/nome-da-feature
  ```
- Abra um Pull Request (PR) de `feature/nome-da-feature` para `develop`.
- O GitHub irá rodar o pipeline de testes automaticamente (veremos como configurar o workflow abaixo).
- Após aprovação e merge, o código vai para Staging.
- Quando quiser liberar para produção, abra um PR de `develop` para `main`.

#### 4. Configuração de Secrets (variáveis de ambiente) no GitHub

- No repositório, vá em **Settings > Secrets and variables > Actions**.
- Adicione os secrets necessários para o pipeline (ex: tokens de deploy do Railway, Netlify, etc).
- Use os mesmos nomes das variáveis do `.env.example`.

#### 5. Configuração do Workflow de CI/CD

- Crie a pasta `.github/workflows/` na raiz do projeto.
- Adicione um arquivo `ci.yml` (ou `main.yml`) com o pipeline (iremos detalhar o conteúdo deste arquivo nos próximos passos).

---

## 4. Próximos Passos

- Configurar o workflow do GitHub Actions para rodar testes, lint, build e deploy automático para Railway (backend) e Netlify (frontend).
- Documentar como configurar os ambientes de Staging e Produção no Railway e Netlify.

---

**IMPORTANTE:**

- Sempre mantenha o `.env.example` atualizado.
- Nunca suba o `.env` real para o repositório.
- Use Pull Requests para todo o fluxo de integração e deploy.

## 5. Configurando o Workflow do GitHub Actions (CI/CD)

### 5.1. Estrutura de Pastas

- Crie a pasta `.github/workflows/` na raiz do projeto.
- Dentro dela, crie o arquivo `ci.yml`.

### 5.2. Conteúdo do arquivo `ci.yml`

```yaml
name: CI/CD LearnSafe360

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-and-test-backend:
    name: Backend - Build, Lint e Testes
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./Backend
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run lint
      - run: npm run build
      - run: npm test

  build-and-test-frontend:
    name: Frontend - Build, Lint e Testes
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./Frontend
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run lint
      - run: npm run build

  deploy-backend:
    name: Deploy Backend Railway
    needs: build-and-test-backend
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railwayapp/cli-action@v1
        with:
          railwayToken: ${{ secrets.RAILWAY_TOKEN }}
          project: ${{ secrets.RAILWAY_PROJECT }}
          service: ${{ secrets.RAILWAY_SERVICE }}
          command: deploy

  deploy-frontend:
    name: Deploy Frontend Netlify
    needs: build-and-test-frontend
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: ./Frontend/dist
          production-branch: main
          deploy-message: "Deploy via GitHub Actions"
          github-token: ${{ secrets.GITHUB_TOKEN }}
          netlify-auth-token: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          netlify-site-id: ${{ secrets.NETLIFY_SITE_ID }}
```

### 5.3. Como configurar os secrets necessários

- No GitHub, vá em **Settings > Secrets and variables > Actions**.
- Adicione:
  - `RAILWAY_TOKEN`, `RAILWAY_PROJECT`, `RAILWAY_SERVICE` (dados do Railway)
  - `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` (dados do Netlify)

### 5.4. Como criar e gerenciar ambientes no Railway

- Crie dois projetos Railway: um para produção, outro para staging.
- Em cada projeto, configure as variáveis de ambiente conforme o `.env.example` do backend.
- No painel do Railway, conecte o repositório GitHub e defina a branch que dispara o deploy (main=produção, develop=staging).
- O deploy será feito automaticamente pelo workflow do GitHub Actions.

### 5.5. Como criar e gerenciar ambientes no Netlify

- Crie dois sites no Netlify: um para produção, outro para staging.
- Em cada site, configure as variáveis de ambiente conforme o `.env.example` do frontend.
- No painel do Netlify, conecte o repositório GitHub e defina a branch que dispara o deploy (main=produção, develop=staging).
- O deploy será feito automaticamente pelo workflow do GitHub Actions.

---

## 6. Observações Finais

- Sempre teste no ambiente de staging antes de liberar para produção.
- Use Pull Requests para garantir qualidade e rastreabilidade.
- Mantenha a documentação e os exemplos de variáveis de ambiente atualizados.
