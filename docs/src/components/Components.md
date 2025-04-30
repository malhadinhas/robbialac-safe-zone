# Componentes Principais da Aplicação

## Visão Geral

Este documento descreve os principais componentes utilitários, de layout, autenticação, vídeo, 3D, UI e integração da aplicação, detalhando o seu propósito, funcionalidades, integrações, estado, boas práticas e possíveis melhorias.

---

## 1. AdminRoute

### Visão Geral

Protege rotas que exigem a role `admin_app`, reutilizando a lógica de autenticação e conexão do `PrivateRoute`.

### Funcionalidades

- Verificação de autenticação e conexão
- Verificação de role específica
- Redirecionamento para home ou página não autorizada
- Feedback visual durante carregamento

### Integrações

- `useAuth` para autenticação
- `PrivateRoute` para lógica comum
- `react-router-dom` para navegação

---

## 2. CustomOrbitControls

### Visão Geral

Wrapper para o OrbitControls do drei, com gestão aprimorada do ciclo de vida e detecção de navegação para evitar memory leaks em cenas 3D.

### Funcionalidades

- Gestão de eventos e cleanup ao desmontar
- Força recriação ao navegar de volta
- Suporte a props do OrbitControls

### Integrações

- `@react-three/fiber`, `@react-three/drei`, `three-stdlib`
- `react-router-dom` para detecção de navegação

---

## 3. ErrorBoundary

### Visão Geral

Componente de boundary para capturar e exibir erros de renderização na UI.

### Funcionalidades

- Captura de erros em componentes filhos
- Exibição de mensagem amigável e botão para recarregar
- Não expõe detalhes sensíveis

### Integrações

- Componentes UI: Alert, Button
- Ícones: RefreshCw

---

## 4. Factory3DModelManager

### Visão Geral

Gerencia a renderização e interação com o modelo 3D da fábrica, incluindo zonas interativas e fallback.

### Funcionalidades

- Carregamento de modelo GLTF
- Destaque e clique em zonas
- Fallback para modelo simplificado
- Suporte a PresentationControls e OrbitControls
- Responsividade e integração com stats

### Integrações

- `@react-three/fiber`, `@react-three/drei`, `three.js`
- `ErrorBoundary` para erros de renderização
- Componentes UI: Canvas

---

## 5. FactoryModel3D

### Visão Geral

Renderiza uma cena 3D simplificada da fábrica com zonas clicáveis e animações de destaque.

### Funcionalidades

- Zonas interativas com animação
- Base da fábrica e estrutura
- Controles de apresentação e órbita

### Integrações

- `@react-three/fiber`, `@react-three/drei`, `three.js`

---

## 6. GLTFModel

### Visão Geral

Componente utilitário para carregar e exibir modelos GLTF/GLB em cenas 3D.

### Funcionalidades

- Carregamento de modelos externos
- Suporte a escala, posição e rotação customizáveis

### Integrações

- `@react-three/drei` (useGLTF)
- `three.js`

---

## 7. Layout

### Visão Geral

Componente de layout principal, responsável pela estrutura da aplicação, menu lateral, navegação, user info e responsividade.

### Funcionalidades

- Menu lateral colapsável e responsivo
- Exibição de info do utilizador
- Navegação entre páginas principais
- Logout
- Adaptação a mobile/tablet/desktop

### Integrações

- `useAuth` para autenticação
- `react-router-dom` para navegação
- Componentes UI: Button, Separator
- Ícones: Home, BookOpen, AlertTriangle, Medal, Settings, LogOut, BarChart, FileText
- Hooks de responsividade

---

## 8. MedalCard

### Visão Geral

Exibe uma medalha de forma visual, indicando se foi adquirida ou não.

### Funcionalidades

- Exibição de imagem da medalha
- Estado visual para adquirida/não adquirida
- Placeholder em caso de erro

### Integrações

- Tipos globais: Medal

---

## 9. NoScrollLayout

### Visão Geral

Container que otimiza o conteúdo para visualização sem scroll em mobile/tablet, usando carousel ou scroll area.

### Funcionalidades

- Carousel para seções em mobile/tablet
- Scroll area adaptativa
- Suporte a navegação e paginação
- Adaptação dinâmica de altura

### Integrações

- Componentes UI: Carousel, ScrollArea
- Hooks de responsividade

---

## 10. PDFViewer

### Visão Geral

Componente para visualização de PDFs, com navegação entre páginas, loading e tratamento de erros.

### Funcionalidades

- Renderização de PDFs com react-pdf
- Navegação entre páginas
- Loading spinner e mensagens de erro
- Suporte a largura customizada

### Integrações

- `react-pdf`, `react-icons/fa`
- Componentes UI: Button

---

## 11. PrivateRoute

### Visão Geral

Protege rotas que exigem autenticação e conexão com a base de dados.

### Funcionalidades

- Verificação de autenticação e conexão
- Redirecionamento para login ou dashboard
- Feedback visual durante carregamento/erro

### Integrações

- `useAuth`, `useDatabase`
- `react-router-dom` para navegação
- Componentes UI: Button
- Ícones: AlertTriangle, RefreshCcw, Settings, Loader2

---

## 12. RecentActivityCard

### Visão Geral

Exibe atividades recentes (vídeos e quase acidentes) em formato de card/tab, com thumbnails e navegação.

### Funcionalidades

- Tabs para vídeos e quase acidentes
- Thumbnails e detalhes
- Navegação para detalhes
- Responsividade

### Integrações

- Componentes UI: Card, Tabs, Skeleton
- `getSecureR2Url` para thumbnails
- `date-fns` para datas

---

## 13. TestApi

### Visão Geral

Componente utilitário para testar endpoints da API (login, health check, listar vídeos).

### Funcionalidades

- Formulário de login
- Botões para testar endpoints
- Exibição de resultados e erros

### Integrações

- `apiService` para chamadas à API

---

## 14. VideoCard

### Visão Geral

Exibe informações resumidas de um vídeo (título, duração, visualizações, data, descrição).

### Funcionalidades

- Exibição de título, duração, visualizações, data
- Destaque para vídeos novos
- Layout compacto

### Integrações

- Ícones: EyeIcon

---

## 15. VideoCardItem

### Visão Geral

Card interativo de vídeo com thumbnail, pré-visualização em hover, navegação e detalhes.

### Funcionalidades

- Thumbnail e pré-visualização em hover
- Navegação para página do vídeo
- Exibição de visualizações e data
- Loading spinner durante fetch

### Integrações

- Componentes UI: Card, Skeleton
- `getSecureR2Url` para vídeos
- `date-fns` para datas
- `sonner` para notificações

---

## 16. VideosCategoryCard

### Visão Geral

Card de categoria de vídeos, exibindo quantidade, descrição e pré-visualização em hover.

### Funcionalidades

- Exibição de ícone, título, descrição, quantidade
- Pré-visualização de vídeo ao passar o mouse
- Cores e ícones por categoria

### Integrações

- Componentes UI: Card, Skeleton
- `getSecureR2Url` para vídeos
- `sonner` para notificações

---

## 17. VideoThumbnail

### Visão Geral

Exibe a miniatura de um vídeo, buscando a imagem de forma segura, com loading e tratamento de erro.

### Funcionalidades

- Busca de URL segura para thumbnail
- Placeholder de loading e erro
- Atualização automática ao mudar a chave

### Integrações

- `getSecureR2Url` para thumbnails
- Componentes UI: Skeleton

---

## Boas Práticas Implementadas

- Separação clara de responsabilidades
- Feedback visual para loading e erros
- Responsividade e adaptação a diferentes dispositivos
- Logging e tratamento de erros
- Uso de hooks para estado e efeitos
- Integração com serviços e APIs

---

## Possíveis Melhorias

- Internacionalização (i18n)
- Acessibilidade aprimorada
- Animações e transições
- Testes automatizados de UI
- Suporte a temas escuro/claro
- Otimização de performance para listas grandes

---

## Considerações de Segurança

1. **Autenticação e Permissões**
   - Proteção de rotas e ações sensíveis
2. **Dados**
   - Validação e sanitização de dados recebidos
3. **UX**
   - Mensagens claras para erros e loading
