# Tipos e Interfaces Globais da Aplicação

Este documento detalha o funcionamento dos principais ficheiros de tipos (types) e interfaces globais da aplicação backend, integrando a análise técnica e as descrições fornecidas. Cada secção corresponde a um ficheiro de tipos e descreve as suas principais funções, estrutura, validação e importância para o sistema.

---

## express.d.ts

### 1. Propósito Principal
O ficheiro `server/types/express.d.ts` serve para **extender e tipar corretamente os objetos do Express** na tua aplicação, especialmente para suportar autenticação e autorização de forma segura e tipada em TypeScript.

### 2. Estrutura e Funcionalidades
- **Importações:**
  Importa os tipos `Request`, `Response` e `NextFunction` do Express, que são fundamentais para definir middlewares e handlers de rotas.

- **AuthenticatedUser:**
  Define uma interface para o utilizador autenticado, incluindo campos como `id`, `role`, `email` e `name`.
  Isto permite que o objeto `req.user` seja fortemente tipado em toda a aplicação.

- **AuthenticatedRequest:**
  Extende a interface `Request` do Express para incluir a propriedade opcional `user` do tipo `AuthenticatedUser`.
  Assim, qualquer middleware ou handler pode aceder a `req.user` de forma segura e tipada.

- **AuthMiddleware:**
  Define o tipo para middlewares de autenticação, garantindo que recebem um `AuthenticatedRequest` e podem ser síncronos ou assíncronos.

- **RoleMiddleware:**
  Define o tipo para middlewares de autorização baseados em papéis (roles), permitindo receber uma lista de papéis permitidos e retornar um middleware que valida o acesso.

- **RouteHandler:**
  Define o tipo para handlers de rota que usam autenticação, garantindo que recebem um `AuthenticatedRequest` e retornam uma Promise.

### 3. Importância
- **Segurança e Robustez:**
  Garante que todas as rotas e middlewares que dependem de autenticação/autorização estejam corretamente tipados, evitando erros em tempo de execução.
- **Produtividade:**
  Melhora o autocompletar e a verificação de tipos no desenvolvimento com TypeScript.
- **Padronização:**
  Centraliza a definição dos tipos usados em toda a camada de autenticação/autorização.

**Resumo:**
Este ficheiro é essencial para garantir que a autenticação e autorização no Express sejam feitas de forma segura, tipada e consistente em toda a aplicação backend.

---

## index.ts (server/types/index.ts)

### 1. Propósito Principal
O ficheiro `server/types/index.ts` centraliza **todas as definições de tipos e interfaces globais** usadas na aplicação, especialmente para entidades principais como utilizadores, vídeos, incidentes, eventos de login, uploads e configuração da base de dados.

### 2. Estrutura e Funcionalidades
- **UserRole:**
  Define os papéis possíveis de um utilizador (`admin_app`, `admin_qa`, `user`).

- **User:**
  Interface que representa um utilizador, incluindo campos como `id`, `email`, `password`, `name`, `role`, pontos, nível, medalhas, vídeos vistos e incidentes reportados.

- **Video:**
  Interface para vídeos, incluindo campos como `id`, `title`, `description`, `url`, `thumbnailUrl`, `category`, `uploadDate`, `views` e `duration`.

- **Incident:**
  Interface para incidentes (quase acidentes), com campos detalhados para título, descrição, localização, datas, status, severidade, departamento, ações, notas, pontos, imagens, etc.

- **LoginEvent:**
  Interface para eventos de login, útil para auditoria e estatísticas, incluindo campos como `userId`, `userEmail`, `timestamp`, `ipAddress` e `userAgent`.

- **UploadLog:**
  Interface para logs de upload de ficheiros, incluindo informações sobre o ficheiro, tipo de armazenamento, tamanho, data, etc.

- **DatabaseConfig:**
  Interface para a configuração da base de dados, com `uri` e `dbName`.

### 3. Importância
- **Consistência:**
  Garante que todas as partes da aplicação usam os mesmos tipos e interfaces, evitando discrepâncias e bugs.
- **Segurança de Tipos:**
  Permite que o TypeScript valide o uso correto das entidades em toda a aplicação.
- **Facilidade de Manutenção:**
  Centraliza as definições, facilitando alterações futuras e a compreensão do modelo de dados.

**Resumo:**
Este ficheiro é fundamental para a padronização e robustez do backend, fornecendo todas as interfaces e tipos globais usados em modelos, controladores, serviços e middlewares. 