# Rotas da Aplicação

Este documento detalha o funcionamento de todos os ficheiros de rotas (routes) da API do sistema, integrando a análise técnica e as descrições fornecidas. Cada secção corresponde a um ficheiro de rota e descreve as suas principais funcionalidades, organização, segurança e importância para o sistema.

---

## accidentsRoutes.ts

Este arquivo é responsável por definir as rotas da API relacionadas ao gerenciamento de acidentes.

### 1. Estrutura de Autenticação e Autorização:

- Utiliza um middleware global de autenticação (`isAuthenticated`)
- Implementa controle de acesso baseado em papéis (RBAC) através do middleware `hasRole`
- Diferencia níveis de acesso entre usuários comuns e administradores

### 2. Gerenciamento de Uploads:

- Configura o Multer para processar uploads de arquivos
- Limita o tamanho dos arquivos a 10MB
- Restringe o tipo de arquivo apenas para PDFs
- Armazena os arquivos em memória

### 3. Rotas Disponíveis:

- **Rotas Públicas (após autenticação):**
  - `GET /` : Lista todos os acidentes
  - `GET /:id` : Obtém detalhes de um acidente específico
- **Rotas Administrativas:**
  - `POST /` : Cria novo acidente (`admin_qa` e `admin_app`)
  - `PUT /:id` : Atualiza acidente existente (`admin_qa` e `admin_app`)
  - `DELETE /:id` : Remove acidente (apenas `admin_qa`)

### 4. Segurança:

- Implementa validação de tipos de arquivo
- Controla tamanho máximo de upload
- Separa claramente operações de leitura e escrita
- Restringe operações críticas a papéis específicos

### 5. Organização:

- Separa claramente as responsabilidades
- Mantém uma estrutura hierárquica de permissões
- Facilita a manutenção e extensão do código

### 6. Importância:

- Garante que apenas usuários autenticados possam acessar os dados
- Apenas administradores podem modificar os registros
- Os uploads de documentos são seguros e controlados
- Operações críticas são restritas a papéis específicos

---

## activityRoutes.ts

Este arquivo é responsável por gerenciar todas as rotas relacionadas a atividades no sistema.

### 1. Estrutura Básica:

- Importa o Router do Express para criar as rotas
- Importa os controladores necessários para gerenciar as atividades
- Importa os middlewares de autenticação e autorização

### 2. Rotas Disponíveis:

- `POST /` - Registra uma nova atividade (requer autenticação)
- `GET /user/:userId` - Obtém atividades de um usuário específico (requer autenticação, acesso permitido se for o próprio usuário ou um administrador)
- `GET /feed` - Feed unificado de atividades recentes (requer autenticação)

### 3. Sistema de Segurança:

- Todas as rotas utilizam o middleware `isAuthenticated`
- Garante que apenas usuários autenticados possam acessar as funcionalidades
- Implementa controle de acesso baseado em permissões

### 4. Funcionalidades Principais:

- Registro de atividades
- Consulta de atividades por usuário
- Feed unificado de atividades recentes

### 5. Observação:

- Existem erros de linter relacionados ao tipo de retorno dos middlewares, comuns em aplicações Express com TypeScript, mas não afetam a funcionalidade.

### 6. Importância:

- Gerencia o fluxo de atividades dos usuários
- Controla o acesso às informações de atividades
- Fornece endpoints para registro e consulta de atividades
- Implementa um sistema de feed unificado para visualização de atividades recentes

---

## analyticsRoutes.ts

Este arquivo é responsável por gerenciar todas as rotas relacionadas a análises e métricas do sistema.

### 1. Estrutura Básica:

- Importa o Express e os controladores necessários
- Importa os middlewares de autenticação e autorização
- Cria um router específico para rotas de analytics

### 2. Sistema de Segurança:

- Implementa um middleware global de proteção
- Requer autenticação do usuário
- Restringe acesso apenas para usuários com role `admin_app`
- Garante que apenas administradores possam acessar os dados analíticos

### 3. Rotas Disponíveis:

- `GET /basic` : Retorna métricas gerais do sistema
- `GET /logins` : Retorna estatísticas de login (suporta agrupamento por período)
- `GET /uploads` : Retorna estatísticas de upload (suporta agrupamento por período)
- `GET /errors` : Retorna logs de erro do sistema (suporta paginação)

### 4. Funcionalidades Principais:

- Coleta de métricas básicas
- Análise de padrões de login
- Monitoramento de uploads
- Visualização de logs de erro
- Suporte a diferentes períodos de agrupamento
- Paginação de resultados

### 5. Extensibilidade:

- Estrutura preparada para adicionar novas rotas de análise

### 6. Importância:

- Fornece dados analíticos importantes para administradores
- Permite monitoramento do sistema
- Ajuda na identificação de padrões e problemas
- Facilita a tomada de decisões baseada em dados
- Mantém um registro de erros para debug

---

## authRoutes.ts

Este arquivo é responsável por gerenciar as rotas de autenticação do sistema.

### 1. Estrutura Básica:

- Importa o Router, Request e Response do Express
- Importa os serviços de autenticação (`validateCredentials` e `generateToken`)
- Importa o logger para registro de eventos
- Cria um router específico para rotas de autenticação

### 2. Rota de Login:

- `POST /login` : Endpoint principal para autenticação (recebe email e senha no corpo da requisição)

### 3. Fluxo de Autenticação:

- Validação inicial dos campos
- Validação de credenciais
- Geração de token JWT
- Retorno dos dados do usuário (sem senha) e do token JWT

### 4. Tratamento de Erros:

- Implementa try/catch para erros inesperados
- Registra erros no logger com detalhes
- Retorna erro 500 para problemas internos

### 5. Logging:

- Registra tentativas de login sem credenciais
- Registra falhas de autenticação
- Registra logins bem-sucedidos
- Registra erros internos com stack trace

### 6. TODO Items:

- Planejamento para adicionar rota de validação de token
- Possibilidade de implementar refresh token

### 7. Importância:

- Gerencia o processo de autenticação
- Implementa segurança básica
- Fornece tokens JWT para autenticação
- Mantém registro de atividades de login
- Trata erros de forma adequada

---

## departments.ts

Este arquivo é responsável por gerenciar as rotas relacionadas aos departamentos do sistema.

### 1. Estrutura Básica:

- Importa o Router do Express
- Importa os controladores necessários do departmentController
- Cria um router específico para rotas de departamentos

### 2. Rotas Disponíveis:

- `GET /` : Lista todos os departamentos do sistema
- `GET /with-employees` : Lista departamentos com contagem de funcionários
- `GET /:departmentId` : Busca um departamento específico
- `PUT /:departmentId/employee-count` : Atualiza a contagem de funcionários

### 3. Funcionalidades Principais:

- Consulta de departamentos
- Visualização de departamentos com métricas
- Busca específica por departamento
- Atualização de contagem de funcionários

### 4. Estrutura da API:

- Segue o padrão REST
- Usa métodos HTTP apropriados (GET, PUT)
- Implementa parâmetros de rota para identificação
- Mantém endpoints organizados e descritivos

### 5. Importância:

- Gerencia o acesso aos dados de departamentos
- Permite consulta e atualização de informações
- Fornece métricas sobre funcionários por departamento
- Mantém a organização da estrutura departamental
- Facilita a gestão de recursos humanos

---

## incidents.ts

Este arquivo é responsável por gerenciar todas as rotas relacionadas a incidentes do sistema.

### 1. Estrutura Básica:

- Importa o Express e os controladores necessários
- Importa os middlewares de autenticação e autorização
- Cria um router específico para rotas de incidentes

### 2. Sistema de Autenticação e Autorização:

- Utiliza `isAuthenticated` para verificar autenticação
- Implementa diferentes níveis de acesso:
  - `isAdmin` para operações críticas
  - `hasRole` para operações específicas

### 3. Rotas Disponíveis:

- `GET /recent` : Retorna incidentes recentes (requer autenticação)
- `GET /` : Lista todos os incidentes (suporta filtro por status, requer autenticação)
- `GET /by-department` : Lista incidentes por departamento (suporta filtro por ano)
- `POST /` : Cria novo incidente (requer autenticação)
- `GET /:incidentId` : Obtém detalhes de um incidente específico (requer autenticação)
- `PUT /:incidentId` : Atualiza um incidente existente (requer autenticação e role específica)
- `DELETE /:incidentId` : Remove um incidente permanentemente (requer privilégios de administrador)

### 4. Funcionalidades Principais:

- Gerenciamento completo de incidentes
- Filtros e consultas específicas
- Controle de acesso granular
- Suporte a operações CRUD
- Análise por departamento

### 5. Segurança:

- Autenticação obrigatória
- Controle de acesso baseado em roles
- Proteção contra acesso não autorizado
- Restrições específicas por operação

### 6. Importância:

- Gerencia o ciclo de vida dos incidentes
- Implementa controle de acesso robusto
- Fornece diferentes níveis de visualização
- Permite análise e gestão de incidentes
- Mantém a segurança dos dados

---

## interactionRoutes.ts

Este arquivo é responsável por gerenciar as rotas de interação social do sistema, como likes e comentários.

### 1. Estrutura Básica:

- Importa o Router do Express
- Importa o middleware de autenticação
- Importa os controladores de interação
- Cria um router específico para interações

### 2. Sistema de Autenticação:

- Implementa autenticação global
- Todas as rotas requerem usuário autenticado
- Garante segurança nas interações

### 3. Rotas de Likes:

- `POST /like` : Permite dar like em itens (QA, Acidentes, Sensibilização)
- `DELETE /like` : Permite remover likes

### 4. Rotas de Comentários:

- `POST /comment` : Permite adicionar comentários
- `GET /comment/:itemType/:itemId` : Busca comentários de um item

### 5. Tipos de Conteúdo Suportados:

- QA
- Acidentes
- Sensibilização
- Sistema flexível para adicionar novos tipos

### 6. Estrutura de Dados:

- Uso consistente de itemId e itemType
- Formato padronizado para todas as rotas
- Facilita a manutenção e extensão

### 7. Importância:

- Gerencia interações sociais
- Permite engajamento dos usuários
- Mantém consistência nos dados
- Implementa segurança básica
- Suporta diferentes tipos de conteúdo

---

## medals.ts

Este arquivo é responsável por gerenciar as rotas relacionadas ao sistema de medalhas do aplicativo.

### 1. Estrutura Básica:

- Importa o Express e os controladores necessários
- Importa os middlewares de autenticação e autorização
- Cria um router específico para medalhas

### 2. Sistema de Autenticação:

- Implementa dois níveis de acesso:
  - `isAuthenticated` para rotas básicas
  - `isAdmin` para operações administrativas

### 3. Rotas Públicas/Autenticadas:

- `GET /` : Lista todas as medalhas disponíveis (acesso público)
- `GET /user/:userId` : Lista medalhas de um usuário específico (requer autenticação)
- `GET /user/:userId/unacquired` : Lista medalhas não adquiridas (requer autenticação)

### 4. Rota de Atribuição:

- `POST /assign/:userId/:medalId` : Atribui medalhas manualmente (requer privilégios de administrador)

### 5. Rotas CRUD Administrativas:

- `POST /` : Cria novas medalhas (acesso restrito a administradores)
- `PUT /:medalId` : Atualiza medalhas existentes (acesso restrito a administradores)
- `DELETE /:medalId` : Remove medalhas (acesso restrito a administradores)

### 6. Funcionalidades Principais:

- Gestão completa de medalhas
- Visualização de conquistas
- Atribuição manual
- CRUD administrativo
- Controle de acesso granular

### 7. Importância:

- Gerencia o sistema de gamificação
- Controla as conquistas dos usuários
- Permite gestão administrativa
- Mantém a segurança dos dados
- Facilita a visualização de medalhas

---

## secureUrlRoutes.ts

Este arquivo é responsável por gerenciar a geração de URLs seguras para acesso a objetos armazenados no R2 (serviço de armazenamento).

### 1. Estrutura Básica:

- Importa o Router do Express
- Importa o controlador `generateSecureUrl`
- Importa o middleware de autenticação
- Cria um router específico para URLs seguras

### 2. Rota Principal:

- `GET /` : Endpoint `/api/secure-url` (requer autenticação, aceita parâmetro key na query string, retorna uma URL assinada temporária)

### 3. Funcionalidade:

- Gera URLs seguras para acesso a objetos
- Implementa autenticação obrigatória
- Usa o serviço R2 para armazenamento
- Fornece acesso temporário e controlado

### 4. Segurança:

- Protege o endpoint com autenticação
- Gera URLs assinadas temporárias
- Controla acesso a objetos armazenados
- Previna acesso não autorizado

### 5. Uso:

- Acesso a arquivos armazenados
- Compartilhamento seguro de objetos
- Controle de tempo de acesso
- Gestão de permissões

### 6. Importância:

- Gerencia acesso seguro a objetos
- Implementa controle de acesso
- Facilita compartilhamento seguro
- Integra com serviço de armazenamento
- Mantém a segurança dos dados

---

## sensibilizacaoRoutes.ts

Este arquivo é responsável por gerenciar as rotas relacionadas aos documentos de sensibilização do sistema.

### 1. Estrutura Básica:

- Importa o Express e o Multer para uploads
- Importa os controladores necessários
- Importa os middlewares de autenticação
- Cria um router específico para sensibilização

### 2. Configuração de Upload:

- Usa o Multer para gerenciar uploads
- Configurações específicas:
  - Armazenamento em memória
  - Limite de 10MB por arquivo
  - Aceita apenas arquivos PDF
  - Validação de tipo de arquivo

### 3. Sistema de Autenticação:

- Implementa autenticação global
- Todas as rotas requerem usuário autenticado
- Diferentes níveis de acesso por role

### 4. Rotas de Visualização:

- `GET /` : Lista todos os documentos (acesso para qualquer usuário autenticado)
- `GET /:id` : Obtém um documento específico (acesso para qualquer usuário autenticado)

### 5. Rotas de Modificação:

- `POST /` : Cria novo documento (requer role `admin_qa` ou `admin_app`, permite upload de PDF)
- `PUT /:id` : Atualiza documento existente (requer role `admin_qa`, permite atualização de PDF)
- `DELETE /:id` : Remove documento (requer role `admin_qa`, operação permanente)

### 6. Controle de Acesso:

- Visualização: qualquer usuário autenticado
- Criação: `admin_qa` ou `admin_app`
- Atualização/Exclusão: apenas `admin_qa`

### 7. Importância:

- Gerencia documentos de sensibilização
- Controla uploads de arquivos PDF
- Implementa segurança adequada
- Mantém controle de acesso granular
- Facilita a gestão de documentos

---

## statsRoutes.ts

Este arquivo é responsável por gerenciar as rotas relacionadas às estatísticas e rankings do sistema.

### 1. Estrutura Básica:

- Importa o Router do Express
- Importa os controladores de estatísticas
- Importa o middleware de autenticação
- Cria um router específico para estatísticas

### 2. Rotas Disponíveis:

- `GET /user/:userId/points-breakdown` : Retorna detalhamento dos pontos por categoria
- `GET /user/:userId/ranking` : Retorna posição do usuário no ranking
- `GET /leaderboard` : Retorna ranking completo

### 3. Funcionalidades Principais:

- Análise de pontos por categoria
- Ranking individual
- Leaderboard geral
- Métricas de desempenho
- Comparação entre usuários

### 4. Estrutura da API:

- Endpoints bem definidos
- Parâmetros claros
- Respostas estruturadas
- Fácil integração

### 5. Importância:

- Gerencia estatísticas do sistema
- Fornece métricas de desempenho
- Implementa sistema de ranking
- Facilita análise de progresso
- Promove engajamento dos usuários

---

## system.ts

Este arquivo é responsável por gerenciar as rotas relacionadas às configurações do sistema.

### 1. Estrutura Básica:

- Importa o Router do Express
- Importa o controlador de configurações do sistema
- Cria um router específico para configurações

### 2. Rota Principal:

- `GET /config` : Endpoint `/api/system/config` (retorna configurações gerais do sistema)

### 3. Funcionalidades Principais:

- Fornece configurações do sistema
- Centraliza parâmetros importantes
- Facilita configuração do frontend
- Permite ajustes dinâmicos

### 4. Estrutura da API:

- Endpoint único e claro
- Resposta estruturada
- Fácil integração
- Documentação clara

### 5. Importância:

- Gerencia configurações centrais
- Facilita manutenção do sistema
- Permite ajustes dinâmicos
- Centraliza parâmetros importantes
- Melhora a organização do código

---

## users.ts

Este arquivo é responsável por gerenciar todas as rotas relacionadas aos usuários do sistema.

### 1. Estrutura Básica:

- Importa o Router do Express
- Importa todos os controladores necessários para usuários
- Cria um router específico para gerenciar rotas de usuários

### 2. Rotas Disponíveis:

- `GET /` : Lista todos os usuários do sistema
- `GET /:id` : Busca usuário específico por ID
- `GET /email/:email` : Busca usuário por email
- `POST /` : Cria novo usuário
- `PUT /:id` : Atualiza dados do usuário
- `DELETE /:id` : Remove usuário do sistema

### 3. Funcionalidades Principais:

- Gerenciamento completo de usuários
- CRUD (Create, Read, Update, Delete)
- Busca por diferentes critérios
- Manutenção de dados

### 4. Estrutura da API:

- Endpoints bem definidos
- Métodos HTTP apropriados
- Parâmetros claros
- Respostas estruturadas

### 5. Importância:

- Gerencia todos os usuários
- Permite administração de contas
- Facilita manutenção de dados
- Implementa segurança básica
- Organiza operações de usuário

---

## videos.ts

Este arquivo é responsável por gerenciar todas as rotas relacionadas aos vídeos do sistema.

### 1. Estrutura Básica:

- Importa o Router do Express
- Importa controladores de vídeo
- Importa middlewares de autenticação e upload
- Importa utilitários do sistema
- Cria router específico para vídeos

### 2. Configuração de Armazenamento:

- Cria estrutura de diretórios:
  - uploads: Armazena vídeos originais
  - thumbnails: Armazena miniaturas
  - processed: Armazena vídeos processados
  - temp: Armazena arquivos temporários
- Verifica e cria diretórios automaticamente
- Registra operações no logger

### 3. Rotas de Visualização:

- `GET /recent` : Lista vídeos recentes (requer autenticação)
- `GET /category/:category/most-viewed` : Lista mais vistos por categoria (requer autenticação)

### 4. Rotas CRUD:

- `GET /` : Lista todos os vídeos (acesso público)
- `GET /:id` : Obtém vídeo específico (requer autenticação)
- `POST /` : Cria novo vídeo (requer autenticação, upload de arquivo, validação de vídeo)
- `PUT /:id` : Atualiza vídeo (requer role `admin_app` ou `admin_qa`)
- `DELETE /:id` : Remove vídeo (requer admin)

### 5. Funcionalidades Principais:

- Gerenciamento completo de vídeos
- Upload e processamento
- Categorização
- Controle de acesso
- Organização de arquivos

### 6. Segurança:

- Autenticação obrigatória
- Controle de roles
- Validação de uploads
- Tratamento de erros

### 7. Importância:

- Gerencia todo o ciclo de vida dos vídeos
- Implementa segurança adequada
- Organiza armazenamento
- Facilita manutenção
- Controla acesso aos recursos

---

## zones.ts

Este arquivo é responsável por gerenciar as rotas relacionadas às estatísticas das zonas do sistema.

### 1. Estrutura Básica:

- Importa o Router do Express
- Importa os controladores de zona
- Cria um router específico para gerenciar rotas de zonas

### 2. Rotas Disponíveis:

- `GET /stats` : Retorna estatísticas gerais de todas as zonas
- `GET /:zoneId/stats` : Retorna dados específicos de uma zona
- `GET /categories/stats` : Retorna dados por categoria

### 3. Funcionalidades Principais:

- Análise estatística de zonas
- Métricas detalhadas
- Comparação entre categorias
- Dados específicos por zona
- Relatórios gerais

### 4. Estrutura da API:

- Endpoints bem definidos
- Parâmetros claros
- Respostas estruturadas
- Fácil integração

### 5. Importância:

- Fornece dados estatísticos
- Permite análise de zonas
- Facilita tomada de decisões
- Apoia gestão de áreas
- Melhora compreensão do sistema
