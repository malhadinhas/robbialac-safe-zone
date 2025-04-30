# Componentes de Gestão de Medalhas

## Visão Geral

Este documento descreve o componente principal de gestão de medalhas da aplicação, responsável por criar, editar, remover e listar medalhas e seus critérios de atribuição.

---

## 1. MedalManagement

### Visão Geral

Componente que permite a administração completa das medalhas do sistema, incluindo criação, edição, remoção e visualização dos critérios de conquista.

### Funcionalidades

- Listagem de todas as medalhas existentes
- Criação de novas medalhas com critérios personalizados
- Edição de medalhas existentes
- Remoção de medalhas com confirmação
- Validação de campos obrigatórios e regras de negócio
- Feedback visual de sucesso e erro (notificações)
- Formulário dinâmico com campos condicionais (ex: categoria obrigatória para vídeos/treinos)
- Diálogos modais para adicionar/editar e confirmar remoção

### Estado e Gestão

```typescript
const [medals, setMedals] = useState<Medal[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isSubmitting, setIsSubmitting] = useState(false);
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingMedalId, setEditingMedalId] = useState<string | null>(null);
const [medalToDelete, setMedalToDelete] = useState<Medal | null>(null);
const [currentMedal, setCurrentMedal] = useState<Partial<MedalFormData>>({ ... });
```

### Integrações

- `medalService` para operações CRUD (getMedals, createMedal, updateMedal, deleteMedal)
- Componentes UI: Card, Button, Input, Label, Select, Textarea, Dialog, AlertDialog
- Ícones: PlusCircle, Edit, Trash2
- `sonner` para notificações
- React hooks: useState, useEffect, useCallback

---

## Integrações Comuns

- Serviços de backend para persistência das medalhas
- Componentes de UI reutilizáveis para consistência visual
- Notificações para feedback ao utilizador

---

## Boas Práticas Implementadas

- Validação de campos obrigatórios e regras de negócio no frontend
- Feedback visual imediato para ações do utilizador
- Separação clara de lógica de formulário e operações CRUD
- Uso de modais para evitar ações acidentais (exclusão)
- Atualização automática da lista após operações

---

## Possíveis Melhorias

- Paginação ou busca para grandes volumes de medalhas
- Upload de imagens diretamente pelo formulário
- Histórico de alterações/auditoria
- Permissões avançadas por role
- Internacionalização (i18n)
- Testes automatizados de UI

---

## Considerações de Segurança

1. **Permissões**
   - Restringir acesso à gestão de medalhas apenas a utilizadores autorizados
2. **Validação**
   - Validar dados no backend além do frontend
   - Sanitizar campos de texto e imagens
3. **UX**
   - Confirmação explícita para remoção de medalhas
