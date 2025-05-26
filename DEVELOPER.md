
# Documentação para Desenvolvedores - Aplicação Robbialac Security

Esta documentação fornece instruções detalhadas para desenvolvedores sobre como configurar, desenvolver e implantar a aplicação Robbialac Security.

## Visão Geral da Aplicação

A aplicação Robbialac Security é uma plataforma web para gestão de segurança industrial, incluindo:

- Visualização de vídeos de treinamento por área da fábrica e categoria
- Sistema de reporte de quase-acidentes
- Quadro de pontuação e gamificação
- Integração com WhatsApp para reportes automáticos
- Dashboard com estatísticas e análises

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, TailwindCSS, ShadcnUI
- **Armazenamento de Vídeos**: Cloudflare R2 + Cloudflare Workers
- **Banco de Dados**: MongoDB Atlas
- **Streaming de Vídeo**: HLS (HTTP Live Streaming)
- **Conversão de Vídeo**: FFmpeg
- **APIs**: WhatsApp Business API

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
   - Copie o arquivo `.env.example` para um novo arquivo `.env`:
   ```bash
   cp src/.env.example .env
   ```
   - Edite o arquivo `.env` com suas credenciais do MongoDB Atlas e Cloudflare R2

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Configuração do Armazenamento Cloudflare R2

Para configurar o armazenamento de vídeos com Cloudflare R2:

1. Crie uma conta Cloudflare e acesse o R2 Storage
2. Crie um novo bucket para armazenar os vídeos
3. Crie API Keys com permissões para o R2
4. Configure um Workers Site ou R2 Website para servir os arquivos
5. Configure um domínio personalizado para o acesso aos vídeos

Na aplicação, adicione as credenciais em Definições > Armazenamento:
- ID da Conta Cloudflare
- Access Key ID
- Secret Access Key
- Nome do Bucket
- URL Pública do Bucket

Ou diretamente no arquivo `.env`:
```
VITE_CF_ACCOUNT_ID=seu_account_id
VITE_CF_ACCESS_KEY_ID=sua_access_key_id
VITE_CF_SECRET_ACCESS_KEY=sua_secret_access_key
VITE_CF_BUCKET_NAME=seu_bucket_name
VITE_CF_PUBLIC_URL=https://sua-url-publica.exemplo.com
```

## Configuração do MongoDB Atlas

Para configurar a conexão com MongoDB Atlas:

1. Crie uma conta no MongoDB Atlas
2. Configure um novo cluster (o plano gratuito é suficiente para testes)
3. Configure um usuário de banco de dados com as permissões necessárias
4. Configure o Network Access para permitir conexões dos IPs necessários
5. Obtenha a string de conexão

Na aplicação, adicione as credenciais em Definições > Base de Dados:
- URI de Conexão MongoDB
- Nome do Banco de Dados

Ou diretamente no arquivo `.env`:
```
VITE_MONGODB_URI=mongodb+srv://seu_usuario:sua_senha@seu_cluster.mongodb.net/seu_banco
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
    index.m3u8           # Arquivo principal HLS
    thumbnail.jpg        # Miniatura do vídeo
    segment_0.ts         # Segmentos do vídeo
    segment_1.ts
    ...
```

## Segurança e Otimização

### Segurança dos Vídeos

- Sempre use URLs assinadas com tempo de expiração para controlar o acesso aos vídeos
- Configure headers adequados no Cloudflare R2 Workers:
  - `Cache-Control: max-age=3600` para segmentos de vídeo
  - `Content-Disposition: attachment` para evitar acesso direto
  - `Access-Control-Allow-Origin` para controlar domínios permitidos

### Otimização de Custos

- Configure o cache adequado no Cloudflare para reduzir requisições ao R2
- Limite as qualidades de vídeo ao necessário (720p é geralmente suficiente para vídeos instrucionais)
- Use o parâmetro `-b:v` no FFmpeg para controlar o bitrate e o tamanho do arquivo
- Configure TTLs adequados para as URLs assinadas (1-2 horas geralmente é suficiente)

## Integração com WhatsApp Business API

A integração com WhatsApp Business permite reportar quase-acidentes diretamente pelo aplicativo de mensagens. Para configurar:

1. Registre-se no WhatsApp Business API
2. Configure os webhooks para receber mensagens
3. Configure o número de telefone e template messages
4. Adicione o número do WhatsApp Business na aplicação em Definições > WhatsApp

## Gerenciamento de Usuários

A aplicação inclui um sistema de gerenciamento de usuários com diferentes níveis de acesso:
- **Admin**: Acesso completo à plataforma e gerenciamento de usuários
- **Admin QA**: Gerenciamento de quase-acidentes e relatórios
- **Usuário**: Acesso básico para visualizar conteúdos e reportar quase-acidentes

Para adicionar novos usuários em ambiente de desenvolvimento:
1. Acesse a página de Definições na seção de Usuários
2. Use o formulário de criação de novos usuários
3. Defina um email, senha e nível de acesso

## Estrutura do Projeto

```
robbialac-security/
├── public/                 # Arquivos estáticos
├── src/
│   ├── components/         # Componentes React reutilizáveis
│   │   ├── Layout/         # Componentes de layout
│   │   ├── ui/             # Componentes de UI (ShadcnUI)
│   │   ├── video/          # Componentes relacionados a vídeo
│   │   └── whatsapp/       # Componentes de integração WhatsApp
│   ├── config/             # Arquivos de configuração
│   ├── contexts/           # Contextos React
│   ├── hooks/              # Hooks customizados
│   ├── lib/                # Bibliotecas e utilitários
│   ├── pages/              # Componentes de página
│   ├── services/           # Serviços e APIs
│   └── types/              # Definições de tipo TypeScript
├── .env                    # Variáveis de ambiente (não versionado)
├── .env.example            # Modelo para variáveis de ambiente
├── DEVELOPER.md            # Documentação para desenvolvedores
└── README.md               # Documentação geral do projeto
```

## Implantação em Produção

Para implantar em produção, recomenda-se:

1. Construir a aplicação:
```bash
npm run build
```

2. Hospedar os arquivos estáticos em um serviço como Vercel, Netlify ou servidor nginx

3. Configurar o banco de dados MongoDB Atlas para produção:
   - Senhas fortes
   - Network Access restrito
   - Ativar TLS/SSL

4. Configurar o Cloudflare R2 para produção:
   - Utilizar chaves de API restritas
   - Configurar domínio personalizado com SSL
   - Implementar controle de acesso adequado

5. Configurar variáveis de ambiente em seu serviço de hospedagem:
   - Utilizar variáveis de ambiente seguras do serviço de hospedagem
   - Nunca incluir chaves no código ou repositório

## Suporte e Contato

Para questões relacionadas ao desenvolvimento desta aplicação:

- **Email de Suporte**: suporte@exemplo.com
- **Documentação API**: https://api-docs.exemplo.com
- **Repositório**: https://github.com/exemplo/robbialac-security

---

Última atualização: Abril 2025
