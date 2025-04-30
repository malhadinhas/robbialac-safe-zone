# Serviços da Aplicação

Este documento detalha o funcionamento dos principais serviços do sistema, integrando a análise técnica e as descrições fornecidas. Inclui: autenticação, base de dados, armazenamento e processamento de vídeo.

---

## Auth.ts

Este arquivo é responsável por gerenciar toda a autenticação e segurança do sistema. Suas principais funcionalidades são:

### 1. Estrutura Básica:

- Importa dependências necessárias (MongoDB, bcryptjs, jwt)
- Define interface de usuário
- Configura constantes de segurança
- Implementa funções de autenticação

### 2. Funções Principais:

- **validateCredentials**
  - Valida email e senha
  - Registra tentativas de login
  - Retorna usuário sem senha
  - Implementa logging detalhado
- **generateToken**
  - Gera token JWT
  - Inclui dados do usuário
  - Define expiração
  - Usa chave secreta
- **verifyToken**
  - Verifica token JWT
  - Decodifica informações
  - Valida assinatura
  - Retorna dados do usuário
- **hashPassword**
  - Cria hash seguro
  - Usa bcryptjs
  - Aplica salt rounds
  - Protege senhas
- **createUser**
  - Cria novo usuário
  - Valida email único
  - Hash da senha
  - Insere no banco
- **validateToken**
  - Valida token JWT
  - Verifica usuário no banco
  - Retorna status da validação

### 3. Segurança:

- Hash de senhas
- Tokens JWT
- Validação de credenciais
- Registro de eventos
- Proteção de dados

### 4. Logging:

- Registra tentativas de login
- Log de erros
- Monitoramento de eventos
- Rastreamento de ações

### 5. Observações e Boas Práticas:

- O código está bem estruturado e implementa boas práticas de segurança, incluindo:
  - Hash de senhas
  - Tokens JWT
  - Validação de credenciais
  - Logging detalhado (sem expor dados sensíveis)
  - Tratamento de erros
- Este arquivo é fundamental para o sistema pois:
  - Gerencia autenticação
  - Protege dados sensíveis
  - Controla acesso
  - Registra eventos
  - Implementa segurança

---

## Database.ts

Este arquivo é responsável por gerenciar todas as operações relacionadas à conexão com o banco de dados MongoDB.

### 1. Estrutura Básica:

- Importa dependências (Mongoose)
- Importa configurações do banco
- Define variáveis de estado
- Implementa funções de conexão

### 2. Funções Principais:

- **connectToDatabase**
  - Inicia conexão com MongoDB
  - Configura Mongoose
  - Define eventos de conexão
  - Gerencia estado da conexão
- **disconnectFromDatabase**
  - Encerra conexão com MongoDB
  - Limpa estado da conexão
  - Trata erros de desconexão
  - Garante limpeza de recursos
- **getDatabaseStatus**
  - Retorna estado atual
  - Inclui erros existentes
  - Mostra status da conexão
  - Útil para monitoramento
- **tryReconnect**
  - Tenta reconexão
  - Desconecta primeiro
  - Tenta nova conexão
  - Retorna sucesso/falha
- **getCollection**
  - Obtém coleção do banco
  - Verifica conexão
  - Conecta se necessário
  - Retorna coleção solicitada

### 3. Gerenciamento de Estado:

- Monitora conexão
- Registra erros
- Controla reconexão
- Limpa recursos

### 4. Segurança e Estabilidade:

- Tratamento de erros
- Reconexão automática
- Limpeza de recursos
- Monitoramento de estado

### 5. Observações e Boas Práticas:

- O código está bem estruturado e implementa boas práticas de gerenciamento de banco de dados, incluindo:
  - Tratamento de erros
  - Reconexão automática
  - Limpeza de recursos
  - Monitoramento de estado
  - Segurança na conexão
- Este arquivo é fundamental para o sistema pois:
  - Gerencia conexão com banco
  - Garante estabilidade
  - Implementa reconexão
  - Monitora estado
  - Limpa recursos

---

## Storage.ts

Este arquivo é responsável por gerenciar o armazenamento de arquivos tanto localmente quanto no Cloudflare R2.

### 1. Estrutura Básica:

- Importa dependências (fs, path, S3Client)
- Configura promisify para operações assíncronas
- Define constantes e configurações
- Implementa funções de armazenamento

### 2. Configuração Inicial:

- Verifica configurações do R2
- Inicializa cliente S3
- Define diretório base
- Configura ambiente

### 3. Funções Principais:

- **ensureStorageDirectories**
  - Cria diretórios necessários
  - Organiza estrutura
  - Trata erros
  - Garante existência
- **uploadToR2**
  - Envia arquivos para R2
  - Define tipo de conteúdo
  - Gerencia uploads
  - Trata erros
- **getSignedUrl**
  - Gera URLs assinadas
  - Configura expiração
  - Suporta desenvolvimento
  - Trata erros
- **deleteFromR2**
  - Remove arquivos do R2
  - Gerencia exclusões
  - Trata erros
  - Confirma operação
- **uploadFile**
  - Salva arquivos localmente
  - Organiza diretórios
  - Retorna caminhos
  - Trata erros
- **deleteFile**
  - Remove arquivos locais
  - Verifica existência
  - Gerencia exclusões
  - Trata erros

### 4. Gerenciamento de Arquivos:

- Armazenamento local
- Armazenamento em nuvem
- URLs assinadas
- Exclusão segura

### 5. Segurança e Logging:

- Validação de configurações
- Tratamento de erros
- Logging detalhado
- URLs temporárias em dev

### 6. Observações e Boas Práticas:

- O código está bem estruturado e implementa boas práticas de armazenamento, incluindo:
  - Suporte a múltiplos ambientes
  - Tratamento de erros
  - Logging detalhado
  - Segurança no acesso
  - Organização de arquivos
- Este arquivo é fundamental para o sistema pois:
  - Gerencia armazenamento de arquivos
  - Implementa segurança
  - Facilita uploads
  - Controla acesso
  - Organiza arquivos

---

## videoProcessingService.ts

O videoProcessingService.ts é um serviço especializado em processamento de vídeos com as seguintes funcionalidades principais:

### 1. Configuração e Estrutura:

- Utiliza o Cloudflare R2 para armazenamento de vídeos
- Implementa uma classe VideoProcessor para gerenciar todas as operações
- Configura um cliente S3 para interação com o R2

### 2. Funcionalidades Principais:

#### a) Geração de Thumbnails:

- Cria miniaturas de vídeos no formato JPG
- Tamanho padrão de 640x360 pixels
- Captura o primeiro segundo do vídeo
- Faz upload automático para o R2

#### b) Processamento de Vídeos:

- Processa vídeos em três qualidades diferentes (alta, média e baixa)
- Cada qualidade tem configurações específicas de:
  - Largura e altura
  - Taxa de bits
- Processamento paralelo para otimização
- Upload automático para o R2 após processamento

#### c) Validação de Vídeos:

- Verifica se o arquivo contém um stream de vídeo válido
- Verifica a duração do vídeo
- Retorna informações sobre dimensões e duração

#### d) Gerenciamento de URLs:

- Gera URLs assinadas para acesso temporário aos arquivos
- Configurável tempo de expiração das URLs
- Segurança no acesso aos arquivos

### 3. Recursos de Segurança e Logging:

- Logging detalhado de todas as operações
- Tratamento de erros em todas as operações
- Limpeza automática de arquivos temporários
- URLs assinadas para acesso seguro

### 4. Integração com Cloudflare R2:

- Upload automático de arquivos processados
- Gerenciamento de chaves de objetos
- Configuração de tipos de conteúdo
- Remoção de arquivos locais após upload

### 5. Otimizações:

- Processamento paralelo de diferentes qualidades
- Limpeza automática de arquivos temporários
- Verificação de diretórios antes de operações
- Logging detalhado para monitoramento

### 6. Importância do Serviço:

- Processamento eficiente de vídeos
- Otimização de armazenamento
- Fornecimento de diferentes qualidades para diferentes necessidades
- Segurança no acesso aos arquivos
- Monitoramento e debug de operações

### 7. Observações e Boas Práticas:

- O código está bem estruturado e segue boas práticas de programação, com tratamento de erros adequado e logging detalhado para facilitar a manutenção e o debug.
