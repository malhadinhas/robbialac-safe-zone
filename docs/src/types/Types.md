# Documentação de Tipos

## Arquivos de Definição de Tipos

### env.d.ts

Este arquivo define as interfaces para as variáveis de ambiente do projeto. Ele estende o tipo `ImportMetaEnv` do Vite para incluir as seguintes variáveis de ambiente:

- `VITE_MONGODB_URI`: URI de conexão com o MongoDB
- `VITE_MONGODB_DB_NAME`: Nome do banco de dados MongoDB
- `VITE_CF_ACCOUNT_ID`: ID da conta Cloudflare
- `VITE_CF_ACCESS_KEY_ID`: Chave de acesso Cloudflare
- `VITE_CF_SECRET_ACCESS_KEY`: Chave secreta de acesso Cloudflare
- `VITE_CF_BUCKET_NAME`: Nome do bucket Cloudflare
- `VITE_CF_PUBLIC_URL`: URL pública do Cloudflare

### index.ts

Este arquivo contém as principais interfaces e tipos utilizados no projeto:

#### Tipos de Usuário

- `UserRole`: Define os papéis possíveis dos usuários ("admin_app", "admin_qa", "user")
- `User`: Interface que define a estrutura de um usuário, incluindo informações como ID, email, nome, papel, pontos, nível, medalhas, vídeos visualizados e incidentes reportados
- `Medal`: Interface para medalhas que podem ser conquistadas pelos usuários

#### Tipos de Conteúdo

- `Video`: Interface para vídeos, incluindo metadados como título, descrição, chaves R2, duração, categoria, zona, etc.
- `Incident`: Interface detalhada para incidentes, incluindo informações como título, descrição, localização, severidade, status, etc.

#### Tipos de Estatísticas

- `StatsByCategory`: Estatísticas por categoria
- `StatsByZone`: Estatísticas por zona
- `StatsBySeverity`: Estatísticas por severidade
- `Department`: Informações sobre departamentos

#### Outros Tipos

- `SystemConfig`: Configurações do sistema
- `Accident`: Interface para acidentes
- `Sensibilizacao`: Interface para sensibilizações

### vite-env.d.ts

Este é um arquivo de referência do Vite que inclui as definições de tipos do cliente Vite. É um arquivo padrão gerado pelo Vite para garantir que o TypeScript reconheça corretamente as funcionalidades específicas do Vite durante o desenvolvimento.

## Uso

Estes arquivos de tipos são essenciais para:

1. Fornecer autocompletar e verificação de tipos no IDE
2. Garantir consistência no uso de dados em toda a aplicação
3. Documentar a estrutura esperada dos dados
4. Facilitar a manutenção e evolução do código
