# Componente Acidentes (Acidentes.tsx)

## Visão Geral

O componente `Acidentes.tsx` é um componente React client-side que gerencia a exibição, criação e interação com acidentes. Implementa um sistema completo de gestão de documentos PDF com funcionalidades de visualização, comentários e interações sociais.

## Estrutura e Localização

- **Caminho**: `src/components/acidentes/Acidentes.tsx`
- **Tipo**: Componente React Client-Side
- **Framework**: Next.js 13+
- **Diretiva**: `'use client'` para renderização no cliente

## Funcionalidades Principais

### 1. Gestão de Acidentes

- Listagem de acidentes
- Adição de novos acidentes
- Remoção de acidentes (apenas admin_qa)
- Visualização detalhada
- Filtragem por país

### 2. Interações Sociais

- Sistema de likes
- Comentários
- Contagem de interações
- Permissões baseadas em roles

### 3. Visualização de PDFs

- Pré-visualização em miniatura
- Visualização completa em modal
- Suporte responsivo (mobile/desktop)
- Integração com react-pdf

### 4. Gestão de Estado

```typescript
const [accidents, setAccidents] = useState<Accident[]>([]);
const [loading, setLoading] = useState(true);
const [showAddModal, setShowAddModal] = useState(false);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [newAccident, setNewAccident] = useState<Partial<Accident>>({...});
```

## Componentes e Integrações

### 1. Componentes UI

- `Layout` para estrutura base
- `Button` para ações
- `Input` para formulários
- `Select` para escolhas
- `Dialog` para modais
- `PDFViewer` para documentos

### 2. Serviços

- `accidentService` para CRUD
- `interactionService` para likes/comentários
- `AuthContext` para autenticação

### 3. Bibliotecas

- `react-pdf` para visualização
- `date-fns` para formatação
- `sonner` para notificações
- `react-icons` para ícones

## Fluxo de Dados

### 1. Carregamento Inicial

```typescript
useEffect(() => {
  loadAccidents();
  checkMobile();
  window.addEventListener("resize", checkMobile);
  return () => window.removeEventListener("resize", checkMobile);
}, []);
```

### 2. Gestão de Interações

```typescript
const handleLikeClick = async (accidentId: string) => {
  // Lógica de like/unlike
};

const handleCommentSubmit = async () => {
  // Lógica de comentários
};
```

## Responsividade e Adaptação

### 1. Detecção de Dispositivo

```typescript
const [isMobile, setIsMobile] = useState(false);
const [mobilePdfWidth, setMobilePdfWidth] = useState<number | undefined>();
```

### 2. Layout Adaptativo

- Visualização diferente para mobile/desktop
- Ajuste automático de largura
- Modais responsivos
- PDF viewer adaptativo

## Segurança e Permissões

### 1. Controle de Acesso

```typescript
const hasAddPermission =
  user?.role === "admin_qa" || user?.role === "admin_app";
const hasDeletePermission = user?.role === "admin_qa";
```

### 2. Validações

- Verificação de permissões
- Validação de arquivos PDF
- Sanitização de inputs
- Proteção contra XSS

## Boas Práticas Implementadas

1. **Gestão de Estado**

   - Uso de hooks (useState, useEffect)
   - Memoização com useMemo
   - Callbacks otimizados

2. **Performance**

   - Lazy loading de PDFs
   - Renderização condicional
   - Otimização de re-renders

3. **UX/UI**
   - Feedback visual
   - Loading states
   - Mensagens de erro
   - Interface intuitiva

## Possíveis Melhorias

1. **Cache e Otimização**

```typescript
const cachedAccidents = useMemo(
  () => accidents.filter((accident) => accident.country === selectedCountry),
  [accidents, selectedCountry]
);
```

2. **Paginação**

```typescript
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
```

3. **Filtros Avançados**

```typescript
const [filters, setFilters] = useState({
  dateRange: null,
  severity: null,
  status: null,
});
```
