# Documentação dos Scripts e Ficheiros de Configuração

## Gestão de Dependências

### package.json

Ficheiro principal de configuração do projeto que define:

- Dependências do projeto
- Scripts de execução
- Configurações principais
- Metadados do projeto

Localização: `/package.json`

Dependências principais:

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "mongodb": "^6.15.0",
    "react-error-boundary": "^5.0.0"
    // ... outras dependências
  }
}
```

### package-lock.json

Ficheiro que garante consistência nas instalações:

- Mantém versões exatas das dependências
- Garante a integridade das instalações
- Previne problemas de compatibilidade
- Essencial para ambientes de produção

Localização: `/package-lock.json`

## Scripts Essenciais

### configure-r2-cors.js

Script crucial para a configuração do CORS (Cross-Origin Resource Sharing) no Cloudflare R2:

- Configura o acesso seguro aos recursos armazenados
- Define quais domínios podem aceder aos ficheiros
- Configura headers de segurança
- Gere permissões de acesso aos recursos

Funcionalidades principais:

```javascript
// Configurações do R2
const R2_CONFIG = {
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  region: "auto",
};

// Configuração CORS
const corsConfig = {
  AllowedHeaders: ["*"],
  AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
  AllowedOrigins: allowedOrigins,
  ExposeHeaders: ["ETag", "Content-Length", "x-amz-meta-custom-header"],
  MaxAgeSeconds: 3600,
};
```

### setup-pdf.js

Script para configuração do visualizador de PDF:

- Copia o worker do PDF.js das dependências para a pasta pública
- Garante que o visualizador de PDF funcione corretamente
- Configura o ambiente para visualização de documentos PDF
- É executado durante a instalação inicial

Exemplo de funcionamento:

```javascript
// Copia o worker do PDF.js
const workerPath = path.join(
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.mjs"
);
const destPath = path.join("public", "pdf.worker.min.js");
```

### setup.sh

Script de inicialização que:

- Instala dependências essenciais
- Executa a criação de utilizadores iniciais
- Configura o ambiente básico da aplicação
- Deve ser executado após a clonagem inicial do repositório

## Estrutura do Projeto

```
/
├── package.json           # Ficheiro principal de dependências
├── package-lock.json      # Ficheiro de lock para consistência
└── scripts/
    ├── configure-r2-cors.js
    ├── setup-pdf.js
    └── setup.sh
```

## Boas Práticas

1. **Gestão de Dependências**

   - Todas as dependências centralizadas no package.json principal
   - Versões específicas mantidas no package-lock.json
   - Atualizações regulares de segurança
   - Gestão cuidadosa de compatibilidade

2. **Scripts**

   - Organizados na pasta scripts/
   - Documentados adequadamente
   - Testados regularmente
   - Mantidos atualizados

3. **Segurança**
   - Proteção de credenciais
   - Validação de configurações
   - Testes de acesso
   - Monitorização de logs

## Notas Importantes

- Manter backups das configurações
- Documentar alterações significativas
- Testar após modificações
- Verificar atualizações de segurança regularmente
- Seguir as práticas de versionamento do npm
