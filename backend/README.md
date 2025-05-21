# Servidor Robbialac Safe Zone

Este diretório contém o código do servidor backend da aplicação Robbialac Safe Zone.

## Estrutura de Diretórios

```
server/
├── config/         # Configurações do servidor e banco de dados
├── controllers/    # Controladores das rotas
├── middleware/     # Middlewares personalizados
├── models/         # Modelos do MongoDB
├── routes/         # Definições de rotas
├── scripts/        # Scripts utilitários
├── services/       # Serviços e integrações
├── types/          # Definições de tipos TypeScript
├── utils/          # Funções utilitárias
├── app.ts         # Configuração básica da aplicação
└── server.ts      # Ponto de entrada principal
```

## Arquivos Principais

### server.ts

- Ponto de entrada principal do servidor
- Configuração de middlewares de segurança
- Gestão de variáveis de ambiente
- Configuração de rotas da API
- Integração com Cloudflare R2

### app.ts

- Configuração básica do Express
- Conexão com MongoDB
- Middlewares básicos
- Rota de teste para diagnóstico

## Rotas da API

- `/api/accidents` - Gestão de acidentes
- `/api/incidents` - Gestão de incidentes
- `/api/videos` - Gestão de vídeos
- `/api/secure-url` - URLs seguras
- `/api/departments` - Gestão de departamentos
- `/api/medals` - Sistema de gamificação
- `/api/zones` - Gestão de zonas
- `/api/stats` - Estatísticas
- `/api/activities` - Registro de atividades
- `/api/system` - Configurações do sistema
- `/api/sensibilizacao` - Gestão de sensibilização

## Configuração

### Variáveis de Ambiente (.env)

```
R2_ENDPOINT=seu-endpoint
R2_ACCESS_KEY_ID=sua-chave
R2_SECRET_ACCESS_KEY=sua-chave-secreta
R2_BUCKET_NAME=seu-bucket
PORT=3000
```

### Banco de Dados

- MongoDB como banco de dados principal
- Conexão configurada via variáveis de ambiente
- Validação automática da configuração

### Armazenamento

- Cloudflare R2 para armazenamento de arquivos
- Sistema de arquivos local para cache temporário
- Gestão automática de diretórios temporários

## Segurança

- CORS configurado para origens específicas
- Helmet para headers de segurança
- Limite de payload configurável (10GB)
- Validação de variáveis de ambiente
- Tratamento de erros centralizado

## Desenvolvimento

### Requisitos

- Node.js v16+
- MongoDB
- Conta Cloudflare R2

### Instalação

1. Copie `.env.example` para `.env`
2. Configure as variáveis de ambiente
3. Instale as dependências: `npm install`
4. Inicie o servidor: `npm run dev`

### Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o TypeScript
- `npm start` - Inicia o servidor em produção

## Logs e Monitoramento

- Logging detalhado de requisições
- Monitoramento de estado do banco de dados
- Diagnóstico via rota `/api/test`
- Logs de erros centralizados
