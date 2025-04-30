# Componentes de Layout

## Visão Geral

Este documento descreve o componente principal de navegação do layout da aplicação: o menu lateral (MainMenu), responsável por organizar e facilitar o acesso às principais áreas do sistema.

---

## 1. MainMenu

### Visão Geral

Componente que implementa o menu de navegação lateral, exibindo os principais links da aplicação com ícones e suporte a responsividade.

### Funcionalidades

- Exibição de itens de menu com ícones
- Destaque do item ativo conforme a rota
- Navegação entre páginas principais (Dashboard, Formações, Quase Acidentes, Estatísticas, Pontuação, Definições)
- Suporte a restrição de acesso por role (exemplo: Estatísticas apenas para admin)
- Responsividade para diferentes tamanhos de tela

### Estado e Gestão

```typescript
const menuItems = [
  { name: "Dashboard", href: "/", icon: Box },
  { name: "Formações", href: "/formacoes", icon: Film },
  { name: "Quase Acidentes", href: "/quase-acidentes", icon: AlertTriangle },
  {
    name: "Estatísticas",
    href: "/quase-acidentes/estatisticas",
    icon: BarChart,
  },
  { name: "Pontuação", href: "/pontuacao", icon: Star },
  { name: "Definições", href: "/definicoes", icon: Settings },
];
```

### Integrações

- `react-router-dom` para navegação e detecção de rota ativa
- `lucide-react` para ícones (Box, Film, AlertTriangle, BarChart, Star, Settings)
- `useAuth` para autenticação e roles
- `useMediaQuery` para responsividade
- Componentes UI: Button
- Função utilitária: `cn` para classes condicionais

---

## Integrações Comuns

- Contexto de autenticação para exibir/ocultar itens conforme permissões
- Hooks de media query para adaptação do menu em dispositivos móveis
- Componentes de UI reutilizáveis para consistência visual

---

## Boas Práticas Implementadas

- Separação clara dos itens do menu em array para fácil manutenção
- Uso de ícones para melhor usabilidade
- Destaque visual do item ativo
- Estrutura preparada para restrição de acesso por role
- Responsividade para diferentes dispositivos

---

## Possíveis Melhorias

- Implementar animações de transição ao alternar entre itens
- Suporte a submenus ou agrupamento de itens
- Personalização do menu conforme preferências do utilizador
- Adição de badges/contadores para notificações
- Suporte a internacionalização (i18n)

---

## Considerações de Segurança

1. **Permissões**
   - Exibir itens sensíveis apenas para roles autorizados
2. **Navegação**
   - Garantir proteção de rotas no backend/front (não só no menu)
3. **UX**
   - Feedback visual claro para evitar confusão de navegação
