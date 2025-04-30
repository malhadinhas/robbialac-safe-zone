# Controladores da Aplicação

Este documento detalha o funcionamento dos principais controladores (controllers) da aplicação, integrando a análise técnica e as descrições fornecidas. Cada secção corresponde a um ficheiro de controlador e descreve as suas principais funções, responsabilidades, integrações e importância para o sistema.

---

## AccidentController.ts

### 1. Propósito Principal

Este arquivo define os controladores para a entidade "Accident". Cada função exportada (createAccident, getAccidents, etc.) corresponde a uma operação específica (como criar um novo acidente, listar acidentes) que pode ser executada quando uma determinada rota da API é acessada. Ele atua como a ponte entre as requisições HTTP recebidas, a lógica de negócios/interação com o banco de dados (usando o modelo Accident) e os serviços de armazenamento de arquivos.

### 2. Importações

- express: Para tipos Request e Response.
- Accident, { IAccident }: O modelo Mongoose e a interface TypeScript para os documentos de acidente.
- logger: Um utilitário para registrar informações e erros.
- ../services/storage: Funções para interagir com o armazenamento (upload/delete/get URL no R2 ou localmente).
- path, fs/promises: Módulos Node.js para manipulação de caminhos de arquivo e operações de sistema de arquivos.
- Like, Comment, mongoose: Modelos e utilitários para buscar dados relacionados (likes, comentários) via agregação.

### 3. Funções Principais

- **createAccident:** Lida com requisições POST para criar um novo acidente. Valida o ficheiro, faz upload, cria o documento no MongoDB e responde com o documento criado.
- **getAccidents:** Lida com requisições GET para listar acidentes. Aceita filtros, usa agregação para juntar likes/comments, gera URLs assinadas para PDFs e responde com os acidentes encontrados.
- **getAccidentById:** Lida com requisições GET para buscar um acidente específico por \_id. Usa agregação, gera URL assinada para o PDF e responde com o documento ou erro.
- **updateAccident:** Lida com requisições PUT/PATCH para atualizar um acidente. Permite atualizar ficheiro PDF, remove o antigo, faz upload do novo, atualiza o documento e responde com o documento atualizado.
- **deleteAccident:** Lida com requisições DELETE para remover um acidente. Remove o ficheiro PDF associado e o documento do MongoDB.

### 4. Tratamento de Erros

Todas as funções usam try...catch, fazem logging detalhado e respondem com status e mensagens apropriadas.

### 5. Correções de Linter

Inclui verificações para evitar erros de acesso a campos opcionais e garantir robustez.

**Resumo:**
Este controlador centraliza toda a lógica de manipulação de acidentes, integrando uploads, agregações, validações e respostas seguras para o frontend.

---

## activityController.ts

Este ficheiro serve como centro de controlo para atividades dos utilizadores e feed de novidades.

### 1. Registar Atividades e Pontuações (registerActivity)

- Recebe ações dos utilizadores (ver vídeo, reportar incidente, etc.) via POST.
- Valida dados, regista na coleção user_activities, atualiza pontos do utilizador, verifica medalhas desbloqueadas e responde com sucesso e medalhas ganhas.

### 2. Buscar Histórico de Atividades do Utilizador (getUserActivities)

- Recebe o ID do utilizador, busca as atividades recentes, formata para o frontend e responde com a lista.

### 3. Gerar Feed Unificado (getFeed)

- Agrega itens recentes de várias coleções (incidents, Accident, Sensibilizacao), junta likes/comments, ordena por data e responde com o feed formatado.

**Resumo:**
Essencial para gamificação, histórico do utilizador e feed de novidades, usando agregações avançadas e lógica de atribuição de medalhas.

---

## analyticsController.ts

Este ficheiro funciona como painel de controlo de dados e estatísticas da aplicação.

### Funções Principais

- **getBasicAnalytics:** Conta utilizadores, incidentes e vídeos, incluindo métricas dos últimos 30 dias.
- **getLoginStats:** Analisa frequência de logins, agrupando por período (dia, semana, mês, ano).
- **getUploadStats:** Monitora uploads, agrupando por período e calculando quantidade e tamanho total.
- **getErrorLogs:** Busca logs de erro recentes, com paginação, para monitoramento e debug.

**Resumo:**
Fornece dados operacionais e inteligência para dashboards e monitorização da plataforma.

---

## departmentController.ts

### 1. Propósito Principal

Define a lógica para lidar com requisições HTTP relacionadas aos Departamentos. Permite buscar, listar e atualizar departamentos.

### Funções Principais

- **getDepartments:** Busca todos os departamentos.
- **getDepartmentById:** Busca um departamento específico por id.
- **getDepartmentsWithEmployees:** (Atualmente igual a getDepartments, mas pode ser expandida para incluir funcionários.)
- **updateDepartmentEmployeeCount:** Atualiza o número de funcionários de um departamento, com validação e resposta apropriada.

**Resumo:**
Fornece funcionalidades básicas de leitura e atualização para departamentos, com logging e validação.

---

## incidentController.ts

Responsável por gerir todas as operações relacionadas a Incidentes (Quase Acidentes).

### Funções Principais

- **getIncidents:** Lista incidentes, permite filtro por status (arquivado/não arquivado), ordena por data.
- **getIncidentById:** Busca detalhes de um incidente por id, com validação.
- **createIncident:** Cria novo incidente, valida campos, associa ao utilizador logado, cria departamento se necessário, gera UUID.
- **updateIncident:** Atualiza incidente existente, valida campos e datas, usa $set para atualização parcial.
- **deleteIncident:** Remove incidente por id, com validação.
- **getIncidentsByDepartment:** Conta incidentes por departamento, permite filtro por ano.
- **getRecentIncidents:** Busca os incidentes mais recentes, limitado por parâmetro.

**Resumo:**
Centraliza toda a lógica de gestão de Quase Acidentes, incluindo criação automática de departamentos e estatísticas por área.

---

## interactionController.ts

Responsável por gerir interações sociais (likes e comentários) em diferentes tipos de conteúdo.

### Funções Principais

- **addLike / removeLike:** Permite ao utilizador dar ou remover like em itens (QA, Acidentes, Sensibilizações), garantindo unicidade e segurança.
- **addComment:** Permite adicionar comentários, valida dados, associa ao utilizador logado, salva e retorna o comentário criado.
- **getCommentsByItem:** Busca comentários de um item, com paginação e ordenação.

**Resumo:**
Camada lógica para likes e comentários, com validação, controlo de acesso e integração eficiente com o MongoDB.

---

## medalController.ts

Responsável por toda a lógica de medalhas (conquistas/badges).

### Funções Principais

- **getMedals / getUserMedals / getUserUnacquiredMedals:** Busca medalhas disponíveis, conquistadas e por conquistar.
- **checkActionBasedMedals:** Verifica se ações do utilizador desbloqueiam medalhas automaticamente.
- **assignMedalToUser:** Permite atribuição manual de medalhas por administradores.
- **createMedal / updateMedal / deleteMedal:** Gestão CRUD de medalhas.

### Integrações

- Interage com as coleções medals, user_medals, user_activities.
- Usa interfaces TypeScript e logger para robustez e rastreabilidade.

### Erros de Linter Detectados

- Problemas de tipagem em funções async e inserção de dados, recomendando ajustes para maior segurança de tipos.

**Resumo:**
Centraliza a lógica de gamificação, atribuição automática/manual e gestão de conquistas.

---

## secureUrlController.ts

Responsável por gerar URLs seguras e assinadas para acesso a ficheiros no Cloudflare R2.

### Funções Principais

- **Configuração do R2:** Carrega configurações, valida credenciais e estabelece ligação ao serviço.
- **Geração de URLs Seguras:** Recebe pedidos, processa a chave do objeto, gera URL assinada com expiração e responde ao cliente.
- **Gestão de Erros:** Valida dados, trata erros de configuração, regista logs detalhados e responde apropriadamente.

### Erros de Linter Detectados

- Parâmetros de configuração e variáveis fora de escopo devem ser corrigidos para robustez.

**Resumo:**
Crucial para segurança, fornecendo acesso temporário e controlado a ficheiros privados.

---

## sensibilizacaoController.ts

Responsável por gerir documentos de sensibilização (PDFs) e suas interações.

### Funções Principais

- **Gestão de Documentos:** Criação, listagem, busca, atualização e exclusão de documentos, com upload de PDFs.
- **Integração com Armazenamento:** Upload para R2/local, geração de URLs seguras.
- **Interações Sociais:** Contagem de likes/comentários, verificação de like do utilizador, agregação de dados.
- **Tratamento de Erros e Logging:** Validação, logging detalhado e tratamento de erros.

**Resumo:**
API completa para CRUD de documentos de sensibilização, com suporte a uploads e interações sociais.

---

## systemController.ts

Define o controlador para fornecer configuração do sistema.

### Funções Principais

- Busca configuração na coleção system_config.
- Retorna configuração encontrada ou valor padrão.
- Em caso de erro, responde com erro 500 e regista no logger.

**Resumo:**
Permite centralizar e tornar dinâmicas certas configurações do sistema, garantindo sempre um valor de configuração válido.

---

## userController.ts

Centraliza toda a lógica relacionada a utilizadores.

### Funções Principais

- Listar todos os utilizadores.
- Obter utilizador por ID ou email.
- Criar novo utilizador (com validação e hash da password).
- Atualizar dados de utilizador.
- Eliminar utilizador.

**Resumo:**
Cada função trata de um endpoint RESTful, faz validação básica e utiliza logging para registar operações e erros.

---

## videoController.ts

Responsável por toda a lógica relacionada à gestão de vídeos.

### Funções Principais

- **getVideos:** Recupera todos os vídeos.
- **getVideoById:** Devolve os dados de um vídeo específico.
- **createVideo:** Recebe ficheiro e metadados, valida, guarda, inicia processamento e faz logging detalhado.
- **updateVideo:** Permite atualizar dados de um vídeo existente.
- **deleteVideo:** Remove um vídeo da base de dados.
- **incrementVideoViews:** Aumenta o contador de visualizações.
- **getLastViewedVideosByCategory:** Devolve os vídeos mais vistos de uma categoria.
- **getRecentVideos:** Devolve os vídeos mais recentes.
- **getErrorMessage:** Função auxiliar para extrair mensagens de erro.

**Resumo:**
Centraliza toda a lógica de manipulação de vídeos, validação, integração com base de dados e serviços de processamento, e logging detalhado.

---

## zoneController.ts

Responsável por fornecer estatísticas relacionadas a zonas e categorias de vídeos.

### Funções Principais

- **getZoneStats:** Estatísticas de todas as zonas (vídeos assistidos, taxa de conclusão, pontuação de segurança).
- **getZoneStatsById:** Estatísticas detalhadas de uma zona específica.
- **getCategoryStats:** Estatísticas de todas as categorias (vídeos concluídos, total de vídeos, nome do ícone).

**Resumo:**
Alimenta o frontend com dados analíticos sobre progresso, desempenho e segurança por zona e categoria, permitindo dashboards e relatórios.
