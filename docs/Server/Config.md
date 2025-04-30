# Configuração da Aplicação

Este documento detalha o funcionamento dos principais ficheiros de configuração do backend da aplicação, integrando a análise técnica e as descrições fornecidas. Cada secção corresponde a um ficheiro de configuração e descreve as suas principais funções, estrutura, validação e importância para o sistema.

---

## Database.ts

### 1. Propósito Principal

O arquivo `server/config/database.ts` centraliza e gerencia as informações necessárias para que o backend se conecte ao banco de dados MongoDB. Garante que a aplicação saiba onde (URI) e a qual banco de dados (dbName) se conectar.

### 2. Carregamento de Variáveis de Ambiente (dotenv)

- Importa a função `config` da biblioteca dotenv.
- Executa `config()`, que lê o arquivo `.env` na raiz do projeto e carrega as variáveis para o ambiente do Node.js (`process.env`).
- Prática comum para guardar informações sensíveis fora do código fonte, tornando-o mais seguro e configurável para diferentes ambientes.

### 3. Definição da Configuração (databaseConfig)

- `uri`: Obtém a string de conexão do MongoDB da variável de ambiente `MONGODB_URI` ou usa um valor padrão.
- `dbName`: Obtém o nome do banco de dados da variável `MONGODB_DB_NAME` ou usa 'workplace-safety' como padrão.
- **Nota:** Ter a string de conexão diretamente no código é má prática para produção; o ideal é sempre usar variáveis de ambiente.

### 4. Função getDatabaseConfig()

- Retorna uma cópia do objeto `databaseConfig` para que outras partes da aplicação possam obter a configuração sem modificar o original.

### 5. Função validateDatabaseConfig()

- Verifica se a configuração é válida antes de tentar conectar ao banco.
- Checa se `uri` e `dbName` existem e se a `uri` começa com 'mongodb'.
- Lança um erro se alguma validação falhar, interrompendo a inicialização do servidor.

**Resumo:**
Fornece uma maneira organizada e configurável (via .env) de definir e acessar os detalhes de conexão do MongoDB, incluindo validações básicas para evitar erros comuns.

---

## Mongoose.ts

### 1. Propósito Principal

O arquivo `server/config/mongoose.ts` serve como gerenciador central para a conexão da aplicação com o MongoDB, utilizando a biblioteca Mongoose. Permite definir modelos de dados (Schemas) e realizar operações no banco de forma estruturada.

### 2. Importações

- `mongoose`: Biblioteca Mongoose.
- `getDatabaseConfig`: Função que retorna a configuração do banco de dados (URI e nome) do módulo database.ts.

### 3. connectMongoose()

- Função principal para iniciar a conexão.
- Obtém a configuração do banco e usa `mongoose.connect()` com a URI e dbName.
- Registra no console o sucesso ou erro da conexão.
- Em caso de erro, relança a exceção, interrompendo a inicialização.

### 4. Listeners de Eventos da Conexão

- `'error'`: Regista erros que ocorram após a conexão inicial.
- `'disconnected'`: Regista eventos de desconexão.

### 5. Manipulador de Sinal SIGINT

- Garante um desligamento gracioso da aplicação ao fechar a conexão Mongoose antes de sair.
- Usa `process.on('SIGINT', ...)` para interceptar Ctrl+C e fechar a conexão corretamente.

### 6. disconnectMongoose()

- Permite desconectar manualmente o Mongoose, útil para testes ou rotinas de desligamento.

**Resumo:**
Abstrai a lógica de conexão, monitoramento e desconexão do Mongoose, tornando o código principal mais limpo e robusto.

---

## server.config.ts

### 1. Propósito Principal

O arquivo `server/config/server.config.ts` serve como arquivo de configuração para a ferramenta de build `tsup`. O tsup é usado para compilar o código TypeScript do backend para JavaScript executável pelo Node.js.

### 2. Importações

- Importa a função `defineConfig` do tsup.

### 3. Opções de Configuração

- `entry: ['server.ts']`: Define o ponto de entrada para o build.
- `format: ['esm']`: Especifica o formato ECMAScript Modules.
- `dts: true`: Gera arquivos de definição de tipo (.d.ts).
- `splitting: false`: Gera um único arquivo JavaScript como saída.
- `sourcemap: true`: Gera sourcemaps para depuração.
- `clean: true`: Limpa o diretório de saída antes de cada build.

### 4. Observação sobre o uso

- O script de build principal do projeto usa `tsc && vite build`, não usando tsup diretamente.
- O arquivo pode ser usado manualmente ou ter sido deixado de versões anteriores.
- Recomenda-se remover se não for utilizado no fluxo de build atual.

**Resumo:**
Configura o tsup para compilar o backend, mas pode não ser necessário se o build for feito apenas com tsc e vite.

---

## Storage.ts

### 1. Propósito Principal

O arquivo `server/config/storage.ts` é crucial para gerenciar tudo relacionado ao armazenamento de arquivos no backend.

### 2. Configuração Cloudflare R2 (config.r2)

- Define parâmetros para interagir com o serviço Cloudflare R2 (compatível com S3).
- Carrega informações sensíveis de variáveis de ambiente.
- Define padrões para região e expiração de URLs assinadas.

### 3. Configuração de Armazenamento Local (storageConfig)

- Define caminhos absolutos para diretórios de upload, temporários, thumbnails e processados.
- Estabelece limites para tamanho e duração dos vídeos.
- Lista tipos e extensões permitidas para uploads.
- Função para gerar nomes de ficheiros únicos usando UUIDs.
- Especifica configurações para diferentes qualidades de vídeo.

### 4. Função ensureStorageDirectories()

- Garante que todos os diretórios locais definidos existam, criando-os se necessário.
- Previne erros ao tentar escrever em diretórios inexistentes.

**Resumo:**
Centro de controlo para o manuseio de ficheiros, configurando tanto o destino final (R2) quanto o processo local (diretórios, limites, validações, processamento).

---

## tsconfig.server.json

### 1. Propósito Principal

Arquivo de configuração para o compilador TypeScript (tsc), definindo como o código do backend deve ser compilado.

### 2. compilerOptions

- `target: "ES2020"`: Gera JavaScript compatível com ES2020.
- `module: "NodeNext"` / `moduleResolution: "NodeNext"`: Usa o sistema de módulos mais recente do Node.js.
- `esModuleInterop: true`: Facilita importação de bibliotecas com diferentes sistemas de módulos.
- `strict: true`: Ativa verificações de tipo rigorosas.
- `skipLibCheck: true`: Pula verificação de tipos em bibliotecas de terceiros.
- `outDir: "dist"`: Coloca os arquivos compilados na pasta dist.
- `baseUrl: "."` / `paths: { "@/*": ["src/*"] }`: Configura aliases de caminho para importações.

### 3. include / exclude

- `include`: Lista arquivos e diretórios a serem processados.
- `exclude`: Lista arquivos/diretórios a serem ignorados (ex: node_modules).

**Resumo:**
Configura o tsc para compilar o backend com regras estritas, suporte a ES2020, aliases de caminho e saída organizada na pasta dist.
