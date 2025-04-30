# Serviços da Aplicação

## Visão Geral

Este documento descreve os principais serviços da aplicação, responsáveis pela comunicação com a API, gestão de dados, autenticação, armazenamento e integrações externas. Cada serviço encapsula uma área específica de funcionalidade, seguindo boas práticas de separação de responsabilidades.

---

## 1. accidentService.ts

### Propósito

Serviço para gestão de documentos de acidentes, incluindo CRUD completo e upload de PDFs.

### Funcionalidades

- Busca de todos os acidentes
- Busca por ID específico
- Criação de novo acidente
- Atualização de acidente existente
- Eliminação de acidente
- Upload de PDF
- Testes de rotas

### Integrações

- API REST
- FormData para uploads
- Toasts para feedback

### Boas práticas

- Tratamento de erros detalhado
- Logs para debugging
- Validação de dados

### Possíveis melhorias

- Cache de dados
- Upload assíncrono
- Validação de PDF

---

## 2. activityService.ts

### Propósito

Serviço para registo e gestão de atividades do utilizador, incluindo visualização de vídeos, reporte de incidentes e conclusão de formações.

### Funcionalidades

- Registro de atividades
- Registro de visualização de vídeos
- Registro de reporte de incidentes
- Registro de conclusão de formações
- Busca de histórico de atividades
- Dados padrão para novos utilizadores

### Integrações

- API REST
- LocalStorage para dados do utilizador

### Boas práticas

- Tipagem forte com interfaces
- Tratamento de casos sem utilizador
- Dados padrão para fallback

### Possíveis melhorias

- Cache de atividades recentes
- Sincronização offline
- Estatísticas avançadas

---

## 3. analyticsService.ts

### Propósito

Serviço para análise de dados da aplicação, incluindo estatísticas de utilizadores, incidentes, uploads e logs de erro.

### Funcionalidades

- Dados analíticos básicos
- Estatísticas de login
- Estatísticas de upload
- Logs de erro paginados
- Agrupamento por período

### Integrações

- API REST
- Logger para erros

### Boas práticas

- Tipagem forte
- Tratamento de erros
- Logs detalhados

### Possíveis melhorias

- Cache de estatísticas
- Agregação em tempo real
- Exportação de dados

---

## 4. auth.ts

### Propósito

Serviço de autenticação e autorização, gerindo login, logout e permissões de utilizador.

### Funcionalidades

- Login de utilizador
- Logout
- Obtenção do utilizador atual
- Verificação de autenticação
- Verificação de roles
- Persistência em localStorage

### Integrações

- API REST
- LocalStorage
- Contexto de autenticação

### Boas práticas

- Validação de domínio de email
- Persistência segura
- Verificação de roles

### Possíveis melhorias

- Refresh token
- 2FA
- Sessões simultâneas

---

## 5. database.ts

### Propósito

Serviço para gestão da conexão com a base de dados MongoDB, incluindo status e reconexão.

### Funcionalidades

- Verificação de status
- Tentativa de reconexão
- Atualização periódica de status
- Cache de status

### Integrações

- API REST
- Toasts para feedback

### Boas práticas

- Verificação periódica
- Cache de status
- Feedback visual

### Possíveis melhorias

- Retry automático
- Logs detalhados
- Métricas de performance

---

## 6. departmentService.ts

### Propósito

Serviço para gestão de departamentos, incluindo funcionários, metas e configurações.

### Funcionalidades

- Busca de departamentos
- Busca por ID
- Atualização de contagem de funcionários
- Cálculo de metas
- Configuração do sistema
- Dados mock para desenvolvimento

### Integrações

- API REST
- Tipos compartilhados

### Boas práticas

- Validação de dados
- Cálculos precisos
- Dados mock para dev

### Possíveis melhorias

- Cache de departamentos
- Sincronização em tempo real
- Histórico de alterações

---

## 7. feedService.ts

### Propósito

Serviço para gestão do feed de atividades, unificando diferentes tipos de conteúdo.

### Funcionalidades

- Busca de feed unificado
- Tipagem de itens do feed
- Limitação de resultados
- Ordenação por data

### Integrações

- API REST
- Tipos compartilhados

### Boas práticas

- Interface unificada
- Tipagem forte
- Tratamento de erros

### Possíveis melhorias

- Paginação
- Filtros
- Cache

---

## 8. incidentService.ts

### Propósito

Serviço para gestão de incidentes/quase acidentes, incluindo CRUD e estatísticas.

### Funcionalidades

- CRUD completo de incidentes
- Conversão de ficheiros para base64
- Captura de imagem da câmera
- Estatísticas por departamento
- Dados mock para desenvolvimento

### Integrações

- API REST
- MediaDevices API
- FileReader API

### Boas práticas

- Tratamento de erros
- Validação de dados
- Fallback para dados mock

### Possíveis melhorias

- Upload assíncrono
- Compressão de imagens
- Cache de estatísticas

---

## 9. interactionService.ts

### Propósito

Serviço para gestão de interações (likes, comentários) em diferentes tipos de conteúdo.

### Funcionalidades

- Adição/remoção de likes
- Adição de comentários
- Toggle de likes
- Validação de dados

### Integrações

- API REST
- Toasts para feedback

### Boas práticas

- Validação de dados
- Feedback visual
- Tratamento de erros

### Possíveis melhorias

- Cache de interações
- Notificações em tempo real
- Moderação de comentários

---

## 10. medalService.ts

### Propósito

Serviço para gestão de medalhas e conquistas do sistema de gamificação.

### Funcionalidades

- CRUD de medalhas
- Busca de medalhas do utilizador
- Busca de medalhas não conquistadas
- Atribuição manual de medalhas
- Dados mock para desenvolvimento

### Integrações

- API REST
- LocalStorage
- Toasts para feedback

### Boas práticas

- Dados mock para dev
- Validação de dados
- Tratamento de erros

### Possíveis melhorias

- Cache de medalhas
- Sincronização em tempo real
- Estatísticas avançadas

---

## 11. pointService.ts

### Propósito

Serviço para gestão de pontos e sistema de recompensas.

### Funcionalidades

- Atribuição de pontos por visualização
- Logs de erros
- Preparação para expansão

### Integrações

- API REST
- Serviço de atividades

### Boas práticas

- Logs detalhados
- Tratamento de erros
- Preparação para expansão

### Possíveis melhorias

- Leaderboard
- Histórico de pontos
- Recompensas personalizadas

---

## 12. sensibilizacaoService.ts

### Propósito

Serviço para gestão de documentos de sensibilização, similar ao serviço de acidentes.

### Funcionalidades

- CRUD completo
- Upload de documentos
- Validação de autenticação
- Feedback visual

### Integrações

- API REST
- FormData
- Toasts

### Boas práticas

- Validação de autenticação
- Tratamento de erros
- Logs detalhados

### Possíveis melhorias

- Pré-visualização
- Versões de documentos
- Compartilhamento

---

## 13. statsService.ts

### Propósito

Serviço para estatísticas e rankings do sistema de gamificação.

### Funcionalidades

- Breakdown de pontos
- Ranking do utilizador
- Leaderboard geral
- Dados mock para desenvolvimento

### Integrações

- API REST
- LocalStorage
- Tipos compartilhados

### Boas práticas

- Cálculos precisos
- Dados mock para dev
- Tratamento de erros

### Possíveis melhorias

- Cache de estatísticas
- Agregação em tempo real
- Exportação de dados

---

## 14. userService.ts

### Propósito

Serviço para gestão de utilizadores, incluindo autenticação e perfil.

### Funcionalidades

- Busca por email
- Validação de credenciais
- Criação de utilizador
- Atualização de perfil
- Criação de admin
- Gestão de medalhas

### Integrações

- API REST
- LocalStorage
- Tipos compartilhados

### Boas práticas

- Validação de dados
- Tratamento de erros
- Logs detalhados

### Possíveis melhorias

- Recuperação de password
- Verificação de email
- Perfil avançado

---

## 15. videoPlayerService.ts

### Propósito

Serviço para gestão do player de vídeo HLS, incluindo suporte cross-browser.

### Funcionalidades

- Verificação de suporte HLS
- Carregamento de player
- Configuração de opções
- Tratamento de erros
- Limpeza de recursos

### Integrações

- HLS.js
- MediaDevices API
- Canvas API

### Boas práticas

- Fallback para navegadores
- Limpeza de recursos
- Tratamento de erros

### Possíveis melhorias

- Qualidade adaptativa
- Cache de vídeo
- Offline playback

---

## 16. videoService.ts

### Propósito

Serviço para gestão de vídeos, incluindo upload, streaming e estatísticas.

### Funcionalidades

- Upload de vídeos
- Busca de vídeos
- Busca por ID
- Incremento de visualizações
- URL segura para streaming
- Estatísticas

### Integrações

- API REST
- Cloudflare R2
- HLS

### Boas práticas

- Validação de ficheiros
- URLs seguras
- Tratamento de erros

### Possíveis melhorias

- Upload resumível
- Transcodificação
- CDN

---

## 17. whatsappService.ts

### Propósito

Serviço para integração com WhatsApp, permitindo reporte de incidentes via chat.

### Funcionalidades

- Mock de integração
- Gestão de conversas
- Processamento de mensagens
- Criação de incidentes
- Feedback visual

### Integrações

- API REST (mock)
- Serviço de incidentes
- Toasts

### Boas práticas

- Mock para desenvolvimento
- Validação de dados
- Feedback visual

### Possíveis melhorias

- Integração real
- NLP para mensagens
- Automação

---

## 18. zoneStatsService.ts

### Propósito

Serviço para estatísticas de zonas da fábrica e categorias de treinamento.

### Funcionalidades

- Estatísticas por zona
- Estatísticas por categoria
- Cálculo de taxas
- Pontuação de segurança

### Integrações

- API REST
- Tipos compartilhados

### Boas práticas

- Cálculos precisos
- Tratamento de erros
- Tipagem forte

### Possíveis melhorias

- Cache de estatísticas
- Agregação em tempo real
- Exportação de dados

---
