# Documentação para Programadores - Aplicação RobbiSeg

Esta documentação fornece instruções detalhadas para programadores sobre como configurar, desenvolver e implementar a aplicação RobbiSeg.

## Visão Geral da Aplicação

A aplicação RobbiSeg é uma plataforma web para gestão de segurança industrial, incluindo:

- Visualização de vídeos de formação por área da fábrica e categoria
- Sistema de reporte de quase-acidentes
- Quadro de pontuação e gamificação
- Integração com WhatsApp para reportes automáticos
- Painel de controlo com estatísticas e análises

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, TailwindCSS, ShadcnUI
- **Armazenamento de Vídeos**: Cloudflare R2 + Cloudflare Workers
- **Base de Dados**: MongoDB Atlas
- **Streaming de Vídeo**: HLS (HTTP Live Streaming)
- **Conversão de Vídeo**: FFmpeg
- **APIs**: WhatsApp Business API

## Estrutura do Projeto

```
robbialac-security/
├── public/                 # Ficheiros estáticos
├── src/
│   ├── components/         # Componentes React reutilizáveis
│   │   ├── Layout/         # Componentes de disposição
│   │   ├── ui/             # Componentes de interface (ShadcnUI)
│   │   ├── video/          # Componentes relacionados a vídeo
│   │   └── whatsapp/       # Componentes de integração WhatsApp
│   ├── config/             # Ficheiros de configuração
│   ├── contexts/           # Contextos React
│   ├── hooks/              # Hooks personalizados
│   ├── lib/                # Bibliotecas e utilitários
│   ├── pages/              # Componentes de página
│   ├── services/           # Serviços e APIs
│   └── types/              # Definições de tipo TypeScript
├── .env                    # Variáveis de ambiente (não versionado)
├── .env.example           # Modelo para variáveis de ambiente
├── DEVELOPER.md           # Documentação para programadores
└── README.md              # Documentação geral do projeto
```

## Ficheiros de Configuração do Sistema

### .gitignore

Ficheiro essencial para controlo de versão que especifica quais os ficheiros e diretórios que o Git deve ignorar. Inclui:

- **Ficheiros do Sistema**:

  - `.DS_Store`: Ficheiros de metadados do macOS
  - Ficheiros temporários do sistema operativo

- **Ficheiros de Ambiente**:

  - `.env`: Variáveis de ambiente principais
  - `.env.local`: Configurações locais
  - `.env.development.local`: Configurações de desenvolvimento
  - `.env.test.local`: Configurações de teste
  - `.env.production.local`: Configurações de produção
    > Importante: Estes ficheiros contêm informações sensíveis como chaves de API e credenciais

- **Diretórios de Dependências**:

  - `/node_modules`: Pacotes npm instalados
  - `/.pnp`: Configurações Plug'n'Play
  - `.pnp.js`: JavaScript do Plug'n'Play

- **Ficheiros de Compilação**:

  - `/build`: Código compilado para produção
  - `/dist`: Distribuição do projeto
    > Estes são gerados automaticamente e não devem ser versionados

- **Ficheiros de Registo**:

  - `npm-debug.log*`: Registos de depuração do npm
  - `yarn-debug.log*`: Registos de depuração do Yarn
  - `yarn-error.log*`: Registos de erro do Yarn

- **Ficheiros da IDE**:

  - `.idea/`: Configurações do IntelliJ
  - `.vscode/`: Configurações do VS Code
  - `*.swp`, `*.swo`: Ficheiros temporários do Vim

- **Ficheiros Grandes**:
  - `public/models/Fabrica_v1.glb`: Modelo 3D da fábrica
    > Ficheiros grandes devem ser armazenados num sistema de armazenamento apropriado

### components.json

Ficheiro de configuração do shadcn/ui, uma biblioteca de componentes UI altamente personalizável. Define:

- **Estilo Padrão**:

  - `style: "default"`: Tema visual base
  - `rsc: false`: Configuração para React Server Components
  - `tsx: true`: Suporte para TypeScript com JSX

- **Configuração Tailwind**:

  - `config`: Localização do ficheiro de configuração
  - `css`: Ficheiro de estilos principal
  - `baseColor`: Esquema de cores base
  - `cssVariables`: Utilização de variáveis CSS

- **Aliases de Importação**:
  - `components`: Atalho para componentes reutilizáveis
  - `utils`: Funções utilitárias
  - `ui`: Componentes de interface
  - `lib`: Bibliotecas partilhadas
  - `hooks`: Hooks React personalizados

### Ficheiros de Registo

#### error.log

Ficheiro crucial para monitorização e depuração que regista:

- Erros de carregamento de ficheiros
- Problemas de ligação com serviços externos
- Erros de validação de dados
- Falhas de autenticação
- Problemas com a base de dados
- Erros de integração com serviços cloud

Formato do registo:

```json
{
  "timestamp": "ISO-8601",
  "level": "error",
  "message": "Descrição do erro",
  "stack": "Stack trace",
  "metadata": {
    // Informações adicionais
  }
}
```

#### exceptions.log

Registo dedicado para exceções não tratadas do sistema, incluindo:

- Erros de execução
- Exceções de memória
- Falhas de sistema
- Problemas de concorrência

#### rejections.log

Monitoriza promessas rejeitadas não tratadas, essencial para:

- Depuração de operações assíncronas
- Identificação de problemas de condição de corrida
- Monitorização de tempos limite
- Falhas em chamadas de API

### index.html

Ponto de entrada principal da aplicação web que:

- **Metadados Básicos**:

  ```html
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RobbiSeg</title>
  ```

  > Configuração essencial para responsividade e codificação correta

- **SEO e Redes Sociais**:

  - Tags Open Graph para partilha no Facebook
  - Tags Twitter Card para partilha no Twitter
  - Descrição e imagens otimizadas para motores de busca

- **Recursos Externos**:

  - Google Fonts (Inter) para tipografia consistente
  - Scripts de terceiros carregados de forma otimizada
  - Ícone personalizado da aplicação

- **Estrutura da Aplicação**:
  - Elemento raiz para montagem do React
  - Carregamento modular de scripts
  - Integração com ferramentas de desenvolvimento

### Ficheiros de Dependências

#### package.json

Manifesto do projeto que define:

- **Metadados**:

  - Nome do projeto
  - Versão
  - Descrição
  - Autores
  - Licença

- **Scripts**:

  - Comandos de desenvolvimento
  - Processos de compilação
  - Testes automatizados
  - Linting e formatação

- **Dependências**:

  - Pacotes de produção
  - Dependências de desenvolvimento
  - Versões específicas ou intervalos

- **Configurações**:
  - Engines Node.js
  - Configurações de tipo
  - Browserlist

#### package-lock.json

Garante consistência nas instalações através de:

- Árvore completa de dependências
- Hashes de integridade
- Versões exatas de cada pacote
- Resoluções de conflitos

### Ficheiros de Configuração TypeScript

#### tsconfig.json

Configuração detalhada do TypeScript:

- **Compilação**:

  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "ESNext",
      "strict": true
    }
  }
  ```

- **Paths e Aliases**:

  - Mapeamento de importações
  - Resolução de módulos
  - Diretórios de tipos

- **Opções Avançadas**:
  - Decorators
  - Source Maps
  - Verificações estritas
  - Interoperabilidade com JavaScript

### Ficheiros de Configuração da Compilação

#### vite.config.ts

Configuração do bundler Vite:

- **Plugins**:

  - React
  - TypeScript
  - PostCSS
  - Otimização de imagens

- **Compilação**:

  - Minificação
  - Divisão de código
  - Cache busting
  - Otimização de recursos

- **Desenvolvimento**:
  - Hot Module Replacement
  - Proxy para APIs
  - Portas e hosts
  - SSL/HTTPS

### Ficheiros de Estilo

#### tailwind.config.ts

Configuração extensiva do Tailwind CSS:

- **Temas**:

  - Cores personalizadas
  - Tipografia
  - Espaçamento
  - Pontos de quebra

- **Plugins**:

  - Formulários
  - Tipografia
  - Proporções de aspeto
  - Limitação de linhas

- **Personalizações**:
  - Extensões de classes
  - Variantes personalizadas
  - Funções utilitárias
  - Tokens de design

## Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js v16+ e npm v8+
- FFmpeg (para processamento de vídeos)
- MongoDB (local para desenvolvimento ou acesso ao MongoDB Atlas)

### Configuração Inicial

1. Clone o repositório:

```bash
git clone <seu-repositorio>
cd robbialac-security
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

   - Copie o ficheiro `.env.example` para um novo ficheiro `.env`:

   ```bash
   cp src/.env.example .env
   ```

   - Edite o ficheiro `.env` com as suas credenciais do MongoDB Atlas e Cloudflare R2

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Configuração do Armazenamento Cloudflare R2

Para configurar o armazenamento de vídeos com Cloudflare R2:

1. Crie uma conta Cloudflare e aceda ao R2 Storage
2. Crie um novo bucket para armazenar os vídeos
3. Crie API Keys com permissões para o R2
4. Configure um Workers Site ou R2 Website para servir os ficheiros
5. Configure um domínio personalizado para o acesso aos vídeos

Na aplicação, adicione as credenciais em Definições > Armazenamento:

- ID da Conta Cloudflare
- Access Key ID
- Secret Access Key
- Nome do Bucket
- URL Pública do Bucket

Ou diretamente no ficheiro `.env`:

```
VITE_CF_ACCOUNT_ID=seu_account_id
VITE_CF_ACCESS_KEY_ID=sua_access_key_id
VITE_CF_SECRET_ACCESS_KEY=sua_secret_access_key
VITE_CF_BUCKET_NAME=seu_bucket_name
VITE_CF_PUBLIC_URL=https://sua-url-publica.exemplo.com
```

## Configuração do MongoDB Atlas

Para configurar a ligação com MongoDB Atlas:

1. Crie uma conta no MongoDB Atlas
2. Configure um novo cluster (o plano gratuito é suficiente para testes)
3. Configure um utilizador de base de dados com as permissões necessárias
4. Configure o Network Access para permitir ligações dos IPs necessários
5. Obtenha a string de ligação

Na aplicação, adicione as credenciais em Definições > Base de Dados:

- URI de Ligação MongoDB
- Nome da Base de Dados

Ou diretamente no ficheiro `.env`:

```
VITE_MONGODB_URI=mongodb+srv://seu_utilizador:sua_senha@seu_cluster.mongodb.net/sua_base
VITE_MONGODB_DB_NAME=robbialac_security
```

## Processamento de Vídeos para HLS

A aplicação utiliza o formato HLS para streaming de vídeos. Para converter vídeos MP4 para HLS:

### Utilizando FFmpeg (Comando de exemplo):

```bash
ffmpeg -i video.mp4 -profile:v baseline -level 3.0 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls output/index.m3u8
```

Para múltiplas qualidades:

```bash
# Qualidade Alta (720p)
ffmpeg -i video.mp4 -vf scale=1280:720 -c:a aac -ar 48000 -c:v h264 -profile:v baseline -level 3.0 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls output/high/index.m3u8

# Qualidade Média (480p)
ffmpeg -i video.mp4 -vf scale=854:480 -c:a aac -ar 48000 -c:v h264 -profile:v baseline -level 3.0 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls output/medium/index.m3u8

# Qualidade Baixa (360p)
ffmpeg -i video.mp4 -vf scale=640:360 -c:a aac -ar 48000 -c:v h264 -profile:v baseline -level 3.0 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls output/low/index.m3u8
```

### Estrutura recomendada no bucket R2:

```
/videos/
  /{video_id}/
    index.m3u8           # Ficheiro principal HLS
    thumbnail.jpg        # Miniatura do vídeo
    segment_0.ts         # Segmentos do vídeo
    segment_1.ts
    ...
```

## Segurança e Otimização

### Segurança dos Vídeos

- Utilize sempre URLs assinadas com tempo de expiração para controlar o acesso aos vídeos
- Configure headers adequados no Cloudflare R2 Workers:
  - `Cache-Control: max-age=3600` para segmentos de vídeo
  - `Content-Disposition: attachment` para evitar acesso direto
  - `Access-Control-Allow-Origin` para controlar domínios permitidos

### Otimização de Custos

- Configure a cache adequada no Cloudflare para reduzir pedidos ao R2
- Limite as qualidades de vídeo ao necessário (720p é geralmente suficiente para vídeos instrucionais)
- Use o parâmetro `-b:v` no FFmpeg para controlar o bitrate e o tamanho do ficheiro
- Configure TTLs adequados para as URLs assinadas (1-2 horas geralmente é suficiente)

## Integração com WhatsApp Business API

A integração com WhatsApp Business permite reportar quase-acidentes diretamente pela aplicação de mensagens. Para configurar:

1. Registe-se no WhatsApp Business API
2. Configure os webhooks para receber mensagens
3. Configure o número de telefone e template messages
4. Adicione o número do WhatsApp Business na aplicação em Definições > WhatsApp

## Gestão de Utilizadores

A aplicação inclui um sistema de gestão de utilizadores com diferentes níveis de acesso:

- **Admin**: Acesso completo à plataforma e gestão de utilizadores
- **Admin QA**: Gestão de quase-acidentes e relatórios
- **Utilizador**: Acesso básico para visualizar conteúdos e reportar quase-acidentes

Para adicionar novos utilizadores em ambiente de desenvolvimento:

1. Aceda à página de Definições na secção de Utilizadores
2. Use o formulário de criação de novos utilizadores
3. Defina um email, senha e nível de acesso

## Estrutura da Pasta `public`

A pasta `public` contém ficheiros estáticos que são servidos diretamente pelo servidor web. Estes ficheiros são copiados para a pasta `dist` durante o processo de compilação sem qualquer modificação.

### Ficheiros Principais:

#### Ficheiros PDF.js

- `pdf.worker.js` - Worker script completo do PDF.js (1.3MB)
- `pdf.worker.min.js` - Versão minificada do worker script (1.3MB)
  Estes ficheiros são necessários para o funcionamento do visualizador de PDF na aplicação.

#### Recursos Estáticos

- `favicon.ico` - Ícone do site exibido na aba do navegador
- `placeholder.svg` - Imagem padrão utilizada quando outras imagens não carregam
- `robots.txt` - Configurações para motores de busca e crawlers

#### Diretórios

- `models/` - Modelos 3D ou outros recursos específicos da aplicação
- `lovable-uploads/` - Diretório para armazenamento de ficheiros enviados pelos utilizadores

### Notas Importantes:

- Os ficheiros nesta pasta são acessíveis publicamente
- Não devem ser colocados ficheiros sensíveis nesta pasta
- O diretório `lovable-uploads` deve ter permissões adequadas configuradas
- Os workers do PDF.js são necessários para visualização de documentos PDF na aplicação

## Scripts de Configuração e Automação

A pasta `scripts` contém scripts essenciais para a configuração e manutenção da aplicação:

### Scripts Principais

#### `setup-pdf.js`

Script para configuração do visualizador de PDF:

- Copia o worker do PDF.js das dependências para a pasta `public`
- Garante que o visualizador de PDF funcione corretamente
- Executado durante a instalação inicial da aplicação

#### `configure-r2-cors.js`

Script para configuração do CORS no Cloudflare R2:

- Configura as políticas CORS para o bucket R2
- Define origens permitidas para acesso aos recursos
- Configura headers e métodos HTTP permitidos
- Requer variáveis de ambiente no `.env`:
  - `R2_ENDPOINT`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - `CORS_ORIGIN` (opcional, padrão: http://localhost:5173)

#### `setup.sh`

Script de configuração inicial:

- Instala dependências essenciais (MongoDB, bcrypt)
- Executa a criação de utilizadores iniciais
- Deve ser executado após a clonagem inicial do repositório

## Servidor Backend (pasta `server`)

A pasta `server` contém toda a lógica do backend da aplicação, implementada em TypeScript com Node.js e Express.

### Ficheiros Principais

#### `server.ts`

Ficheiro principal do servidor Express:

- Configuração de middlewares de segurança (helmet, cors)
- Gestão de variáveis de ambiente
- Configuração de rotas da API
- Gestão de uploads e ficheiros temporários
- Limite de payload configurado para 10GB
- Integração com Cloudflare R2 para armazenamento
- Rotas principais:
  - `/api/accidents` - Gestão de acidentes
  - `/api/incidents` - Gestão de incidentes
  - `/api/videos` - Gestão de vídeos
  - `/api/departments` - Gestão de departamentos
  - `/api/medals` - Sistema de gamificação
  - `/api/stats` - Estatísticas
  - `/api/activities` - Registo de atividades
  - `/api/sensibilizacao` - Gestão de sensibilização

#### `app.ts`

Configuração da aplicação Express:

- Ligação com MongoDB
- Middleware de logging
- Rota de teste para verificação da base de dados
- Tratamento de erros global

### Estrutura de Diretórios

- `routes/` - Definição das rotas da API
- `controllers/` - Lógica de negócio
- `models/` - Modelos do MongoDB
- `services/` - Serviços e integrações
- `scripts/` - Scripts utilitários
- `types/` - Definições de tipos TypeScript
- `config/` - Configurações do servidor
- `middleware/` - Middlewares personalizados
- `utils/` - Funções utilitárias
- `src/` - Código fonte adicional

### Configuração TypeScript

O ficheiro `tsconfig.json` define as configurações do TypeScript:

- Target: ES2022
- Module: CommonJS
- Strict mode ativado
- Suporte a resolução de módulos
- Output em ./dist
- Aliases de importação configurados

### Variáveis de Ambiente (.env)

Configurações necessárias no ficheiro `.env`:

- `R2_ENDPOINT` - Endpoint do Cloudflare R2
- `R2_ACCESS_KEY_ID` - Chave de acesso R2
- `R2_SECRET_ACCESS_KEY` - Chave secreta R2
- `R2_BUCKET_NAME` - Nome do bucket R2
- `PORT` - Porta do servidor (padrão: 3000)
- Outras configurações específicas da aplicação

### Segurança

- CORS configurado para origens específicas
- Helmet para headers de segurança
- Limite de payload configurável
- Tratamento de erros centralizado
- Validação de variáveis de ambiente

### Armazenamento

- Gestão de ficheiros temporários em `/temp`
- Integração com Cloudflare R2 para armazenamento permanente
- Diretório específico para desenvolvimento em `/storage/temp`

### Base de Dados

- Ligação MongoDB configurada via mongoose
- Verificação de estado da base de dados
- Logging de operações da base de dados
- Validação de configuração da base de dados

### Notas de Desenvolvimento

- Em modo desenvolvimento, ficheiros temporários são servidos via `/temp`
- Logging detalhado de pedidos
- Rota de teste `/api/test` para diagnóstico
- Tratamento de erros com stack traces em desenvolvimento

## Implementação em Produção

Para implementar em produção, recomenda-se:

1. Construir a aplicação:

```bash
npm run build
```

2. Alojar os ficheiros estáticos num serviço como Vercel, Netlify ou servidor nginx

3. Configurar a base de dados MongoDB Atlas para produção:

   - Palavras-passe fortes
   - Network Access restrito
   - Ativar TLS/SSL

4. Configurar o Cloudflare R2 para produção:

   - Utilizar chaves de API restritas
   - Configurar domínio personalizado com SSL
   - Implementar controlo de acesso adequado

5. Configurar variáveis de ambiente no seu serviço de alojamento:
   - Utilizar variáveis de ambiente seguras do serviço de alojamento
   - Nunca incluir chaves no código ou repositório

## Suporte e Contacto

Para questões relacionadas com o desenvolvimento desta aplicação:

- **Email de Suporte**: suporte@exemplo.com
- **Documentação API**: https://api-docs.exemplo.com
- **Repositório**: https://github.com/exemplo/robbialac-security

---

Última atualização: Abril 2025

## Ficheiros Públicos (pasta `public`)

### Visão Geral

A pasta `public` contém ficheiros estáticos que são servidos diretamente pelo servidor web. Estes ficheiros são copiados para a pasta `dist` durante o processo de compilação sem qualquer modificação.

### Ficheiros PDF.js

#### pdf.worker.js

- Ficheiro worker completo do PDF.js (não minificado)
- Tamanho aproximado: 1.3MB
- Utilizado para processamento de PDFs no navegador
- Permite funcionalidades como:
  - Renderização de PDFs
  - Extração de texto
  - Pesquisa em documentos
  - Manipulação de páginas
  - Zoom e rotação
  - Suporte a formulários PDF

#### pdf.worker.min.js

- Versão minificada do worker script do PDF.js
- Tamanho aproximado: 1.3MB
- Otimizado para produção
- Mantém todas as funcionalidades do pdf.worker.js
- Recomendado para ambiente de produção devido ao código minificado

### Ficheiros de Sistema

#### robots.txt

Ficheiro de configuração para motores de busca que define as regras de acesso para crawlers. Configurado para:

```txt
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
```

Este ficheiro:

- Permite indexação completa por motores de busca principais
- Não bloqueia nenhuma área do site
- Otimiza a visibilidade do site em resultados de pesquisa
- Permite partilha adequada em redes sociais

#### placeholder.svg

- Imagem vetorial utilizada como placeholder
- Exibida quando:
  - Imagens principais estão a carregar
  - Imagens principais falham ao carregar
  - Conteúdo ainda não está disponível
- Ajuda a manter a consistência visual
- Evita layouts quebrados durante o carregamento

### Utilização dos Ficheiros Públicos

#### Em Desenvolvimento

- Os ficheiros são servidos diretamente da pasta `public`
- Modificações são refletidas imediatamente
- Útil para testes e depuração

#### Em Produção

- Ficheiros são copiados para a pasta `dist`
- Servidos com headers de cache apropriados
- Otimizados para desempenho

### Boas Práticas para Ficheiros Públicos

1. **Gestão de Ficheiros**

   - Manter apenas ficheiros estáticos necessários
   - Remover ficheiros não utilizados
   - Atualizar regularmente quando necessário

2. **Segurança**

   - Não armazenar informações sensíveis
   - Verificar permissões de ficheiros
   - Manter ficheiros atualizados

3. **Otimização**

   - Utilizar versões minificadas em produção
   - Comprimir imagens quando possível
   - Configurar cache adequadamente

4. **SEO**
   - Manter robots.txt atualizado
   - Verificar regras periodicamente
   - Ajustar conforme necessidades do projeto

### Notas Importantes sobre Ficheiros Públicos

- Os ficheiros nesta pasta são publicamente acessíveis
- Não devem conter código sensível ou configurações
- Devem ser otimizados para produção
- Necessário manter versões atualizadas dos workers PDF.js

## Gestão de Dependências e Scripts

### Ficheiros de Dependências

#### package.json

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

#### package-lock.json

Ficheiro que garante consistência nas instalações:

- Mantém versões exatas das dependências
- Garante a integridade das instalações
- Previne problemas de compatibilidade
- Essencial para ambientes de produção

Localização: `/package-lock.json`

### Scripts Essenciais

#### configure-r2-cors.js

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

#### setup-pdf.js

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

#### setup.sh

Script de inicialização que:

- Instala dependências essenciais
- Executa a criação de utilizadores iniciais
- Configura o ambiente básico da aplicação
- Deve ser executado após a clonagem inicial do repositório

### Estrutura do Projeto Atualizada

```
/
├── package.json           # Ficheiro principal de dependências
├── package-lock.json      # Ficheiro de lock para consistência
└── scripts/
    ├── configure-r2-cors.js
    ├── setup-pdf.js
    └── setup.sh
```

### Boas Práticas

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

### Notas Importantes

- Manter backups das configurações
- Documentar alterações significativas
- Testar após modificações
- Verificar atualizações de segurança regularmente
- Seguir as práticas de versionamento do npm
