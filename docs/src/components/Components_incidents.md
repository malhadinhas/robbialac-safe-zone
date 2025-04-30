# Componentes de Incidentes

## Visão Geral

Este documento descreve os principais componentes relacionados à gestão e visualização de incidentes (quase acidentes) na aplicação, incluindo chatbot para registo, gráficos analíticos, galeria de imagens e upload de imagens.

---

## 1. ChatbotModal

### Visão Geral

Componente que implementa um chatbot interativo para registo de quase acidentes, guiando o utilizador passo a passo no preenchimento dos dados necessários.

### Funcionalidades

- Conversa guiada para recolha de dados do incidente
- Validação de campos obrigatórios
- Ajuda contextual sobre parâmetros de QA (gravidade, frequência, risco, etc.)
- Seleção de datas com calendário
- Sugestão de áreas e departamentos
- Resumo e confirmação antes do envio
- Feedback visual e mensagens de erro

### Estado e Gestão

```typescript
const [chatMessages, setChatMessages] = useState<
  { text: string; isBot: boolean; options?: string[]; calendar?: boolean }[]
>([]);
const [currentIncident, setCurrentIncident] = useState<Partial<Incident>>({});
const [currentStep, setCurrentStep] = useState<ChatStep>(ChatStep.NAME);
const [date, setDate] = useState<Date | undefined>(new Date());
```

### Integrações

- `AuthContext` para autenticação do utilizador
- `Incident` e `Department` (tipos globais)
- Componentes UI: Button, Popover, Calendar
- Ícones: MessageSquare, HelpCircle, Send
- `date-fns` para formatação de datas

---

## 2. DepartmentAnalyticsChart

### Visão Geral

Componente de análise que exibe gráficos de barras e pizza com estatísticas de incidentes por departamento, metas e colaboradores.

### Funcionalidades

- Gráfico de barras comparando reportes e metas
- Gráfico de pizza para percentuais
- Tooltips customizados
- Edição de meta anual por colaborador (admin)
- Edição do número de colaboradores por departamento (admin)
- Feedback visual de sucesso/erro

### Estado e Gestão

```typescript
const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
const [isEmployeesDialogOpen, setIsEmployeesDialogOpen] = useState(false);
const [chartData, setChartData] = useState<DepartmentDataItem[]>([]);
```

### Integrações

- `recharts` para gráficos
- `react-hook-form` e `zod` para validação de formulários
- `AuthContext` para permissões
- Componentes UI: Dialog, Form, Button, Input
- Ícones: Settings
- `sonner` para notificações

---

## 3. ImageGallery

### Visão Geral

Componente para visualização de imagens associadas a incidentes, com suporte a galeria, zoom e navegação entre imagens.

### Funcionalidades

- Exibição de miniaturas e visualização ampliada
- Navegação entre imagens (anterior/próxima)
- Zoom in/out
- Contador de imagens
- Suporte a visualização única ou múltipla
- Feedback visual para imagens não carregadas

### Estado e Gestão

```typescript
const [selectedImage, setSelectedImage] = useState<string | null>(null);
const [currentImageIndex, setCurrentImageIndex] = useState(0);
const [zoomLevel, setZoomLevel] = useState(1);
```

### Integrações

- Componentes UI: Dialog, Button
- Ícones: X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut

---

## 4. ImageUploader

### Visão Geral

Componente para upload e captura de imagens, com redimensionamento automático, pré-visualização e integração com dispositivos móveis.

### Funcionalidades

- Upload de múltiplas imagens (com limite)
- Captura de imagem via câmara (mobile/tablet)
- Redimensionamento e compressão automática
- Remoção de imagens
- Feedback visual e mensagens de erro
- Suporte a arrastar e soltar (drag & drop)

### Estado e Gestão

```typescript
const [uploadedImages, setUploadedImages] = useState<string[]>(images);
```

### Integrações

- Componentes UI: Button
- Ícones: Camera, Upload, X
- `sonner` para notificações
- Funções utilitárias: fileToBase64, captureImage
- Hooks: useIsMobile, useIsTablet

---

## Integrações Comuns

- `AuthContext` para autenticação e permissões
- Tipos globais: Incident, Department
- Componentes UI reutilizáveis (Button, Dialog, Form, Input, Calendar)
- Bibliotecas de ícones (lucide-react)
- Bibliotecas de gráficos (recharts)
- Validação e feedback (zod, react-hook-form, sonner)

---

## Boas Práticas Implementadas

- Validação de permissões e roles (admin, utilizador)
- Feedback visual imediato (notificações, loading, erros)
- Otimização para mobile e acessibilidade
- Redimensionamento e compressão de imagens para performance
- Separação clara de responsabilidades por componente
- Uso de hooks para gestão de estado e efeitos

---

## Possíveis Melhorias

- Suporte a upload offline e sincronização posterior
- Pré-processamento de imagens no backend
- Exportação de dados e imagens
- Filtros avançados nos gráficos
- Internacionalização (i18n) completa
- Testes automatizados de UI

---

## Considerações de Segurança

1. **Autenticação e Permissões**
   - Verificação de roles para ações sensíveis
   - Proteção de endpoints e rotas
2. **Dados e Imagens**
   - Sanitização de inputs
   - Limite de tamanho e tipo de ficheiros
   - Validação de formatos
3. **Privacidade**
   - Não expor dados sensíveis em imagens ou metadados
   - Controle de acesso às imagens
