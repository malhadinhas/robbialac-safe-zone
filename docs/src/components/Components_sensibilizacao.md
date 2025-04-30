# Componentes de Sensibilização

## Visão Geral

Este documento descreve o componente principal de sensibilização da aplicação, responsável pela gestão, visualização e interação com documentos de sensibilização (PDFs), incluindo funcionalidades sociais como gostos e comentários.

---

## 1. Sensibilizacao

### Visão Geral

Componente que permite listar, adicionar, visualizar, comentar e dar gosto em documentos de sensibilização, com suporte a permissões, pré-visualização de PDFs e interação social.

### Funcionalidades

- Listagem de todos os documentos de sensibilização
- Adição de novos documentos (upload de PDF, nome, país, data)
- Pré-visualização de PDFs (desktop/tablet) e visualização completa (mobile)
- Remoção de documentos (apenas admin)
- Gostos (like) e comentários por utilizador
- Modal para comentários e feedback visual
- Filtros por país e data
- Responsividade para mobile e desktop
- Feedback visual de sucesso e erro (notificações)

### Estado e Gestão

```typescript
const [sensibilizacoes, setSensibilizacoes] = useState<SensibilizacaoTypeFromAPI[]>([]);
const [loading, setLoading] = useState(true);
const [showAddModal, setShowAddModal] = useState(false);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [newSensibilizacao, setNewSensibilizacao] = useState<Partial<SensibilizacaoType>>({ ... });
const [pdfModalOpen, setPdfModalOpen] = useState(false);
const [pdfUrlInModal, setPdfUrlInModal] = useState<string | null>(null);
const [comments, setComments] = useState<Map<string, Comment[]>>(new Map());
const [commentInputText, setCommentInputText] = useState<string>('');
const [showCommentsModal, setShowCommentsModal] = useState<boolean>(false);
const [selectedDocForComments, setSelectedDocForComments] = useState<SensibilizacaoTypeFromAPI | null>(null);
```

### Integrações

- `sensibilizacaoService` para CRUD de documentos
- `interactionService` para likes e comentários
- Componentes UI: Layout, Input, Button, Label, Select, Dialog, PDFViewer
- `react-pdf` para renderização de PDFs
- `react-icons/fa` para ícones
- `sonner` para notificações
- `AuthContext` para permissões
- `date-fns` para formatação de datas
- React Router para navegação e parâmetros

---

## Integrações Comuns

- Serviços de backend para persistência dos documentos e interações
- Componentes de UI reutilizáveis para consistência visual
- Notificações para feedback ao utilizador
- Hooks de autenticação e navegação

---

## Boas Práticas Implementadas

- Validação de permissões para ações sensíveis (adicionar/remover)
- Feedback visual imediato para ações do utilizador
- Separação clara de lógica de upload, visualização e interação
- Otimização para mobile e acessibilidade
- Atualização automática da lista após operações
- Pré-visualização otimizada de PDFs

---

## Possíveis Melhorias

- Busca e filtros avançados por país, data ou nome
- Paginação para grandes volumes de documentos
- Upload de múltiplos documentos em lote
- Moderação de comentários
- Histórico de alterações/auditoria
- Internacionalização (i18n)
- Testes automatizados de UI

---

## Considerações de Segurança

1. **Permissões**
   - Restringir upload e remoção a utilizadores autorizados
2. **Validação**
   - Validar dados e ficheiros no backend
   - Sanitizar campos de texto e comentários
3. **Privacidade**
   - Não expor dados sensíveis em comentários ou metadados
   - Controle de acesso aos documentos
