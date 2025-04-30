# Hooks Personalizados da Aplicação

## Visão Geral

Este documento descreve os principais hooks personalizados utilizados na aplicação, focando em responsividade/adaptação de UI (`use-mobile.tsx`) e sistema de notificações/toasts (`use-toast.ts`). Explica o propósito, funcionalidades, integrações, estado, boas práticas e possíveis melhorias para cada hook.

---

## 1. use-mobile.tsx

### Propósito

Fornecer hooks utilitários para adaptação responsiva da interface, detecção de dispositivo, orientação, espaçamento, altura de viewport e interação por toque.

### Hooks Disponíveis e Funcionalidades

- `useIsMobile()`: Detecta se a viewport é mobile.
- `useIsTablet()`: Detecta se a viewport é tablet.
- `useDeviceSize()`: Retorna "mobile", "tablet" ou "desktop".
- `useIsCompactView()`: Detecta se a visualização deve ser compacta (mobile/tablet).
- `useShouldCollapseMenu()`: Indica se o menu deve ser colapsado (mobile).
- `useOrientation()`: Retorna a orientação do dispositivo (portrait/landscape).
- `useViewportHeight()`: Retorna a altura da viewport, considerando visualViewport.
- `useAdaptiveSpacing()`: Fornece valores de espaçamento adaptativos conforme o dispositivo.
- `useIsTouchDevice()`: Detecta se o dispositivo suporta toque.
- `useResponsiveFont(baseSize)`: Calcula tamanho de fonte responsivo baseado na largura da viewport.

### Estado e Gestão

- Cada hook utiliza internamente `useState` e `useEffect` para reagir a mudanças de tamanho/orientação.

### Integrações

- Utilizados em componentes de layout, UI, menus, carrosséis, etc.
- Permitem adaptação dinâmica da interface para mobile, tablet e desktop.

### Boas Práticas

- Separação de lógica de responsividade em hooks reutilizáveis.
- Atualização automática em eventos de resize/orientation.
- Uso de breakpoints centralizados.

---

## 2. use-toast.ts

### Propósito

Fornecer um sistema global de notificações (toasts) para feedback ao utilizador, com limite de simultaneidade e controlo de ciclo de vida.

### Funcionalidades

- `useToast()`: Hook para consumir o estado global de toasts e disparar notificações.
- `toast({ ... })`: Função para criar um novo toast.
- Limite de toasts simultâneos (`TOAST_LIMIT`)
- Remoção automática após tempo definido (`TOAST_REMOVE_DELAY`)
- Suporte a ações customizadas, atualização e dismiss manual

### Estado e Gestão

- Estado global de toasts gerido por reducer e listeners.
- Cada toast tem id, título, descrição, ação, estado de open/close.

### Integrações

- Utilizado em toda a aplicação para feedback de sucesso, erro, info, etc.
- Integrado com componentes UI de toast.

### Boas Práticas

- Centralização do estado de notificações
- Limite de toasts para evitar poluição visual
- Remoção automática e manual
- Suporte a atualização e dismiss

---

## Integrações Comuns

- Utilização em componentes de UI, layout, menus, formulários, feedback de ações, etc.
- Permite adaptação e feedback consistente em toda a aplicação.

---

## Boas Práticas Gerais

- Separação clara de lógica de UI/responsividade e notificações
- Hooks reutilizáveis e fáceis de testar
- Atualização automática baseada em eventos do browser

---

## Possíveis Melhorias

- Suporte a temas escuro/claro nos toasts
- Animações customizadas para entrada/saída
- Suporte a múltiplos tipos de toasts (info, warning, error, success)
- Otimização de performance para grandes listas de toasts
- Hooks adicionais para breakpoints customizados

---

## Considerações de Segurança

1. **UX**
   - Mensagens claras e não intrusivas
2. **Performance**
   - Limitar número de toasts simultâneos
3. **Acessibilidade**
   - Garantir que toasts sejam acessíveis a leitores de ecrã
