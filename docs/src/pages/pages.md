# Páginas Principais da Aplicação

## Visão Geral

Este documento descreve as páginas principais da aplicação, detalhando o seu propósito, funcionalidades, integrações, estado, boas práticas e possíveis melhorias. Cada página representa uma rota relevante para a experiência do utilizador, gestão de dados, visualização de estatísticas, autenticação, uploads, gamificação e navegação geral.

---

## 1. AcidenteForm.tsx

### Propósito

Formulário para criar ou editar documentos de acidentes, permitindo upload de PDF, seleção de departamento e preenchimento de dados obrigatórios.

### Funcionalidades

- Criação e edição de acidentes
- Upload de documento PDF
- Seleção de departamento
- Validação de campos obrigatórios
- Feedback visual de sucesso/erro
- Navegação automática após submissão

### Integrações

- `react-query` para fetch e mutação
- Serviços de acidente e departamento
- Toasts para feedback

### Estado

- `formData` para dados do formulário
- `mutation` para submissão
- `departments` para lista dinâmica

### Boas práticas

- Validação de tipo de ficheiro
- UX clara para edição vs criação

### Possíveis melhorias

- Pré-visualização do PDF
- Upload assíncrono com progresso

---

## 2. Acidentes.tsx

### Propósito

Listagem, adição e remoção de acidentes, com permissões por role e visualização de PDFs associados.

### Funcionalidades

- Listagem paginada de acidentes
- Adição de novo acidente (modal)
- Upload de PDF
- Remoção de acidentes (admin)
- Visualização de PDF em nova rota
- Filtros por país

### Integrações

- Serviços de acidente
- Toasts para feedback
- Autenticação para permissões

### Estado

- `accidents`, `loading`, `showAddModal`, `selectedFile`, `newAccident`

### Boas práticas

- Verificação de permissões
- UX responsiva

### Possíveis melhorias

- Filtros avançados
- Exportação de dados

---

## 3. Definicoes.tsx

### Propósito

Página de definições/configuração da aplicação, incluindo integração com Cloudflare R2, MongoDB, gestão de medalhas, metas de incidentes, interface e idioma.

### Funcionalidades

- Configuração de armazenamento (R2)
- Configuração de base de dados (MongoDB)
- Gestão de medalhas
- Definição de metas de incidentes
- Alteração de idioma
- Integração WhatsApp
- Layout responsivo (tabs/accordion)

### Integrações

- Contexto de autenticação
- Serviços de configuração
- Toasts para feedback

### Estado

- Vários estados para configs e feedback

### Boas práticas

- Separação clara por secções
- Validação de campos obrigatórios

### Possíveis melhorias

- Sincronização em tempo real
- Logs de alterações

---

## 4. Feed.tsx

### Propósito

Página de feed de novidades, mostrando atividades recentes (quase acidentes, documentos, interações) com navegação contextual.

### Funcionalidades

- Listagem de atividades
- Ícones e tags por tipo
- Navegação para detalhes
- Contadores de likes/comentários
- Feedback de loading/erro

### Integrações

- Serviço de feed
- Toasts para feedback

### Estado

- `feedItems`, `loading`, `error`

### Boas práticas

- UX de navegação rápida
- Feedback visual claro

### Possíveis melhorias

- Filtros por tipo/data
- Scroll infinito

---

## 5. Formacoes.tsx

### Propósito

Página de formações, com navegação por zonas da fábrica (3D ou lista), upload de vídeos (admin), e visualização por categoria.

### Funcionalidades

- Mapa 3D da fábrica (interativo)
- Lista de zonas
- Upload de vídeo (admin)
- Listagem de vídeos por categoria
- Validação de ficheiros
- Progresso de upload

### Integrações

- Serviços de vídeo e zona
- Toasts para feedback
- ErrorBoundary para 3D

### Estado

- `zoneStats`, `categoryVideos`, `videoData`, `isUploading`, etc.

### Boas práticas

- Validação de tamanho/tipo
- UX adaptada a mobile/desktop

### Possíveis melhorias

- Filtros avançados
- Estatísticas por zona

---

## 6. Index.tsx (Dashboard)

### Propósito

Dashboard principal com overview de progresso, estatísticas, feed, vídeos recentes e gamificação.

### Funcionalidades

- Progresso de nível e pontos
- Estatísticas por categoria, gravidade, risco, frequência, qualidade
- Feed de atividades
- Cards de vídeos e incidentes recentes
- Visualização responsiva (mobile/desktop)

### Integrações

- Serviços de vídeo e incidente
- Contexto de autenticação
- Componentes de estatísticas

### Estado

- `videos`, `incidents`, `loading`, `error`, etc.

### Boas práticas

- Cálculo eficiente de estatísticas
- UX clara para diferentes perfis

### Possíveis melhorias

- Customização do dashboard
- Exportação de estatísticas

---

## 7. Login.tsx

### Propósito

Página de autenticação de utilizador, com seleção de idioma e feedback visual.

### Funcionalidades

- Formulário de login
- Seleção de idioma (PT/EN/FR)
- Feedback de loading/erro
- Redirecionamento pós-login

### Integrações

- Contexto de autenticação
- Toasts para feedback
- i18n para tradução

### Estado

- `email`, `password`, `isLoading`

### Boas práticas

- UX acessível
- Mensagens de erro claras

### Possíveis melhorias

- Recuperação de palavra-passe
- Registo de novo utilizador

---

## 8. NotFound.tsx

### Propósito

Página de erro 404 para rotas não encontradas, com navegação de retorno.

### Funcionalidades

- Mensagem de erro amigável
- Botão para voltar ao dashboard/login
- Ícone visual

### Integrações

- Contexto de autenticação
- Navegação

### Boas práticas

- Mensagem clara e visual

### Possíveis melhorias

- Sugestão de rotas alternativas

---

## 9. NovoAcidente.tsx

### Propósito

Formulário detalhado para registar um novo acidente, com campos obrigatórios e opcionais, e validação.

### Funcionalidades

- Campos detalhados (título, descrição, local, data, departamento, etc.)
- Validação de campos obrigatórios
- Submissão com feedback
- Redirecionamento pós-sucesso

### Integrações

- Serviço de acidentes
- Contexto de autenticação
- Toasts para feedback

### Estado

- `formData`, `isSubmitting`

### Boas práticas

- UX clara para admins e utilizadores

### Possíveis melhorias

- Upload de ficheiros
- Pré-visualização de dados

---

## 10. Pontuacao.tsx

### Propósito

Página de gamificação, mostrando progresso, medalhas, ranking, histórico e sistema de pontos.

### Funcionalidades

- Progresso de nível
- Listagem de medalhas conquistadas e por conquistar
- Ranking do utilizador
- Histórico de atividades
- Explicação do sistema de pontos

### Integrações

- Serviços de medalhas, stats e atividades
- Contexto de autenticação

### Estado

- `medals`, `unacquiredMedals`, `pointsBreakdown`, `userRanking`, `activities`

### Boas práticas

- Feedback visual de progresso
- UX adaptada a mobile/desktop

### Possíveis melhorias

- Filtros no histórico
- Exportação de conquistas

---

## 11. QuaseAcidentes.tsx

### Propósito

Página principal de gestão de quase acidentes, com listagem, filtros, ações (editar, arquivar, eliminar, reativar) e paginação.

### Funcionalidades

- Listagem paginada
- Filtros por status, departamento, data
- Edição e arquivamento
- Eliminação e reativação
- Visualização detalhada

### Integrações

- Serviços de incidentes
- Toasts para feedback

### Estado

- Vários estados para filtros, paginação, seleção

### Boas práticas

- Confirmação para ações destrutivas
- UX clara para admins

### Possíveis melhorias

- Exportação de dados
- Filtros avançados

---

## 12. QuaseAcidentesEditar.tsx

### Propósito

Modal de edição detalhada de quase acidentes, com cálculo automático de risco e qualidade QA.

### Funcionalidades

- Edição de todos os campos do incidente
- Cálculo automático de risco e qualidade
- Validação de campos obrigatórios
- Visualização de imagens
- Feedback de loading/erro

### Integrações

- Serviço de incidentes
- Contexto de autenticação
- Toasts para feedback

### Estado

- `formData`, `images`, `isSubmitting`

### Boas práticas

- Separação clara de campos obrigatórios e opcionais
- UX para admins

### Possíveis melhorias

- Upload/remoção de imagens
- Histórico de alterações

---

## 13. QuaseAcidentesEstatisticas.tsx

### Propósito

Página de estatísticas de quase acidentes por departamento, metas, percentuais e gráficos.

### Funcionalidades

- Cards de totais, metas, percentuais, dias restantes
- Gráfico de incidentes vs meta por departamento
- Tabela de incidentes por departamento
- Feedback de loading/erro

### Integrações

- Serviços de departamento, incidentes e configuração
- Toasts para feedback

### Estado

- `departmentData`, `totalIncidents`, `totalTarget`, `targetPercentage`, `daysRemaining`

### Boas práticas

- Cálculo robusto de metas
- UX clara para admins

### Possíveis melhorias

- Exportação de estatísticas
- Filtros por ano

---

## 14. QuaseAcidentesNovo.tsx

### Propósito

Página para registo de quase acidente via chatbot interativo, guiando o utilizador no preenchimento.

### Funcionalidades

- Chatbot para recolha de dados
- Validação de campos
- Seleção de departamento
- Feedback visual

### Integrações

- Serviço de incidentes
- Toasts para feedback

### Estado

- `isChatbotOpen`, `departments`, `isLoading`

### Boas práticas

- UX conversacional
- Validação progressiva

### Possíveis melhorias

- Upload de imagens
- Sugestão automática de áreas

---

## 15. QuaseAcidentesVisualizar.tsx

### Propósito

Página de visualização detalhada de um quase acidente, com todos os campos e imagens associadas.

### Funcionalidades

- Exibição de todos os campos do incidente
- Visualização de imagens
- Botão de voltar

### Integrações

- Serviço de incidentes
- Navegação

### Estado

- `incident`

### Boas práticas

- Layout limpo e informativo

### Possíveis melhorias

- Exportação para PDF
- Comentários/admin notes

---

## 16. Ranking.tsx

### Propósito

Página de ranking geral dos utilizadores, mostrando posição, pontos, medalhas e melhores conquistas.

### Funcionalidades

- Tabela de ranking
- Destaque para top 3
- Visualização de medalhas
- Feedback de loading/erro

### Integrações

- Serviço de stats
- Navegação

### Estado

- `leaderboardData`, `isLoading`, `error`

### Boas práticas

- UX clara para competição

### Possíveis melhorias

- Filtros por período
- Exportação de ranking

---

## 17. TestApi.tsx

### Propósito

Página de testes para endpoints da API, login, criação de utilizador e obtenção de medalhas.

### Funcionalidades

- Teste de API
- Login manual
- Criação de utilizador
- Obtenção de medalhas
- Exibição de resultados

### Estado

- `result`, `email`, `password`

### Boas práticas

- Feedback visual de erros

### Possíveis melhorias

- Testes de outros endpoints
- Exportação de logs

---

## 18. Videos.tsx

### Propósito

Página de listagem de vídeos por zona e categoria, com navegação e visualização detalhada.

### Funcionalidades

- Listagem de vídeos por zona
- Tabs por categoria
- Visualização de vídeo
- Feedback de loading/erro

### Integrações

- Serviço de vídeos
- Toasts para feedback

### Estado

- `videos`, `loading`

### Boas práticas

- UX clara para navegação

### Possíveis melhorias

- Filtros avançados
- Exportação de vídeos

---

## 19. VideoStats.tsx

### Propósito

Página de estatísticas de vídeos por categoria, com gráficos circulares.

### Funcionalidades

- Gráfico de distribuição por categoria
- Feedback de loading/erro

### Integrações

- Componente de estatísticas

### Boas práticas

- Visualização clara

### Possíveis melhorias

- Mais métricas
- Exportação de gráficos

---

## 20. VideosVisualizar.tsx

### Propósito

Página de visualização de vídeo, com player seguro, progresso, atribuição de pontos e partilha.

### Funcionalidades

- Player de vídeo (ReactPlayer)
- Progresso de visualização
- Atribuição automática de pontos
- Partilha de link
- Feedback de loading/erro

### Integrações

- Serviço de vídeos
- Serviço de pontos
- Toasts para feedback

### Estado

- `video`, `progressPercent`, `streamUrl`, `thumbnailUrl`, `isLoadingUrls`, `hasAwardedPoints`

### Boas práticas

- URLs seguras (Cloudflare R2)
- UX clara para mobile/desktop

### Possíveis melhorias

- Comentários no vídeo
- Download seguro

---

## 21. AnalyticsPage.tsx

### Propósito

Página de estatísticas avançadas da aplicação, incluindo utilizadores, incidentes, uploads, erros e logs.

### Funcionalidades

- Cards de overview
- Tabelas de logins, uploads, erros
- Filtros por período
- Paginação de logs
- Feedback de loading/erro

### Integrações

- Serviço de analytics
- i18n para tradução

### Estado

- Vários estados para dados, loading, erro

### Boas práticas

- Visualização clara e segmentada
- Feedback visual

### Possíveis melhorias

- Gráficos interativos
- Exportação de logs

---
