# Bem-vindo ao projeto RobbiSeg

## Informação do Projeto

A RobbiSeg é uma plataforma web para gestão de segurança industrial que inclui:

- Visualização de vídeos de formação por área da fábrica e categoria
- Sistema de reporte de quase-acidentes
- Quadro de pontuação e gamificação
- Integração com WhatsApp para reportes automáticos
- Painel de controlo com estatísticas e análises

## Tecnologias Utilizadas

Este projeto é construído com:

- **Frontend**:
  - React
  - TypeScript
  - TailwindCSS
  - ShadcnUI
- **Armazenamento**:
  - Cloudflare R2
  - Cloudflare Workers
- **Base de Dados**:
  - MongoDB Atlas
- **Multimédia**:
  - HLS (HTTP Live Streaming)
  - FFmpeg para conversão de vídeo
- **Integrações**:
  - WhatsApp Business API

## Como Editar Este Código

Existem várias formas de editar a aplicação:

### Desenvolvimento Local

Requisitos:

- Node.js & npm - [instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- FFmpeg (para processamento de vídeos)
- MongoDB (local ou acesso ao MongoDB Atlas)

Passos para iniciar:

```sh
# 1. Clonar o repositório
git clone <URL_DO_GIT>

# 2. Navegar para a pasta do projeto
cd robbialac-security

# 3. Instalar as dependências
npm install

# 4. Configurar variáveis de ambiente
cp src/.env.example .env
# Editar .env com as credenciais necessárias

# 5. Iniciar o servidor de desenvolvimento
npm run dev
```

### Editar no GitHub

- Navegue até ao ficheiro desejado
- Clique no botão "Edit" (ícone de lápis)
- Faça as alterações e confirme as mudanças

### Utilizar GitHub Codespaces

- Na página principal do repositório
- Clique no botão "Code" (botão verde)
- Selecione o separador "Codespaces"
- Clique em "New codespace"
- Edite os ficheiros e faça commit das alterações

## Estrutura do Projeto

```
robbialac-security/
├── public/                 # Ficheiros estáticos
├── src/
│   ├── components/         # Componentes React reutilizáveis
│   ├── config/            # Ficheiros de configuração
│   ├── contexts/          # Contextos React
│   ├── hooks/             # Hooks personalizados
│   ├── lib/               # Bibliotecas e utilitários
│   ├── pages/             # Componentes de página
│   ├── services/          # Serviços e APIs
│   └── types/             # Definições de tipo TypeScript
└── docs/                  # Documentação do projeto
```

## Implementação em Produção

Para implementar em produção:

1. Construir a aplicação:

```bash
npm run build
```

2. Configurar serviços:
   - Alojar ficheiros estáticos (Vercel, Netlify, etc.)
   - Configurar MongoDB Atlas
   - Configurar Cloudflare R2
   - Configurar variáveis de ambiente

## Documentação Adicional

Para informação mais detalhada sobre:

- Configuração do ambiente
- Gestão de utilizadores
- Processamento de vídeos
- Segurança e otimização

Consulte a documentação completa em `docs/DEVELOPER.md`

## Suporte e Contacto

- **Email de Suporte**: suporte@exemplo.com
- **Documentação API**: https://api-docs.exemplo.com
- **Repositório**: https://github.com/exemplo/robbialac-security

---

Última atualização: Abril 2025
