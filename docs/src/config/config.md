# Configuração da Aplicação

## Visão Geral

Este documento descreve os principais ficheiros de configuração da aplicação, incluindo API, base de dados (MongoDB), armazenamento (Cloudflare R2) e exportação centralizada. Explica o propósito de cada ficheiro, principais opções, integrações, boas práticas e possíveis melhorias.

---

## 1. api.ts

### Propósito
Define a configuração base para chamadas à API, incluindo a URL base e o tempo limite padrão.

### Principais Opções
- `apiBaseUrl`: URL base das APIs, alternando entre produção e desenvolvimento.
- `defaultTimeout`: tempo limite padrão para chamadas (em ms).

### Integrações
- Utilizado por serviços de frontend para chamadas HTTP.
- Permite alternar facilmente entre ambientes.

### Boas Práticas
- Uso de variáveis de ambiente para distinguir ambientes.
- Centralização da configuração para fácil manutenção.

---

## 2. database.ts

### Propósito
Configuração e validação da ligação à base de dados MongoDB Atlas.

### Principais Opções
- `MongoDBConfig`: objeto com URI e nome da base de dados.
- Funções de validação (`validateConfig`), inicialização (`initializeMongoConfig`), obtenção (`getMongoConfig`) e verificação de estado (`getDatabaseConnectionStatus`).

### Integrações
- Utilizado pelo backend para conectar e validar a ligação ao MongoDB.
- Permite inicialização dinâmica e validação de configuração.

### Boas Práticas
- Validação rigorosa dos parâmetros de configuração.
- Separação entre configuração inicial e estado atual.
- Funções utilitárias para inicialização e verificação.

---

## 3. storage.ts

### Propósito
Configuração do armazenamento de ficheiros na Cloudflare R2 e parâmetros de transcodificação de vídeo.

### Principais Opções
- `CloudflareR2Config`: credenciais e parâmetros do bucket R2.
- `defaultTranscodingConfig`: resoluções e bitrates para transcodificação de vídeos.
- Funções para inicializar (`initializeR2Config`) e obter (`getR2Config`) a configuração.

### Integrações
- Utilizado por serviços de upload/download de ficheiros e vídeos.
- Permite parametrização dinâmica via variáveis de ambiente.

### Boas Práticas
- Uso de variáveis de ambiente para credenciais sensíveis.
- Centralização da configuração para fácil manutenção e segurança.
- Separação entre configuração de storage e de transcodificação.

---

## 4. index.ts

### Propósito
Exportação centralizada das configurações, facilitando o acesso e manutenção.

### Principais Opções
- Reexporta configurações de API, storage e database.
- Permite importar todas as configurações a partir de um único ficheiro.

### Integrações
- Utilizado por todo o backend e serviços para acesso às configurações.

### Boas Práticas
- Centralização das exportações para evitar imports duplicados.
- Facilita a manutenção e escalabilidade do projeto.

---

## Boas Práticas Gerais
- Uso de variáveis de ambiente para dados sensíveis e ambientes distintos.
- Validação rigorosa das configurações antes de inicializar serviços.
- Separação clara entre configuração, inicialização e estado.
- Centralização das exportações para facilitar manutenção.

---

## Possíveis Melhorias
- Suporte a múltiplos ambientes (staging, QA, produção) via ficheiros .env específicos.
- Validação assíncrona de credenciais (ex: testar ligação ao R2/MongoDB na inicialização).
- Rotação automática de credenciais sensíveis.
- Logging detalhado de erros de configuração.

---

## Considerações de Segurança
1. **Variáveis Sensíveis**
   - Nunca expor credenciais em código fonte público.
   - Usar ficheiros .env e variáveis de ambiente.
2. **Validação**
   - Validar todas as configurações antes de inicializar serviços.
3. **Logs**
   - Evitar logar credenciais ou URIs completas em produção. 