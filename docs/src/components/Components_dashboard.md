# Componentes do Dashboard

## Visão Geral

Este documento descreve os componentes principais do dashboard da aplicação, que incluem visualização de vídeos por categoria, chatbot, incidentes por departamento, feed de atividades e dashboard mobile.

## 1. CategoryVideosCard

### Visão Geral

Componente responsável por exibir os vídeos mais recentes organizados por categorias (Segurança, Qualidade, Procedimentos e Regras).

### Funcionalidades

- Exibição de thumbnails dos vídeos
- Categorização visual com ícones e cores
- Carregamento lazy de imagens
- Navegação para visualização do vídeo
- Feedback visual de hover

### Estado e Gestão

```typescript
const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
```

### Integrações

- `videoService` para URLs seguras
- `react-router-dom` para navegação
- Componentes UI: Card, CardContent, CardHeader, CardTitle

## 2. ChatbotCard

### Visão Geral

Componente que apresenta o assistente virtual e permite acesso rápido ao chatbot.

### Funcionalidades

- Interface amigável com ícone
- Feedback visual de hover
- Navegação direta para o chatbot
- Design responsivo

### Integrações

- `react-router-dom` para navegação
- Componentes UI: Card, CardContent
- Ícones: Bot, ArrowRight

## 3. DepartmentIncidents

### Visão Geral

Componente que exibe estatísticas de incidentes por departamento.

### Funcionalidades

- Carregamento de dados com estados de loading
- Tratamento de erros
- Atualização manual dos dados
- Exibição responsiva

### Estado e Gestão

```typescript
const [incidents, setIncidents] = useState<DepartmentIncident[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Integrações

- `incidentService` para dados
- Componentes UI: Card, CardContent, Skeleton, Alert, Button
- Ícones: AlertTriangle, RefreshCw

## 4. FeedCard

### Visão Geral

Componente que exibe o feed de atividades recentes da aplicação.

### Funcionalidades

- Exibição de diferentes tipos de atividades
- Formatação de datas
- Contagem de likes e comentários
- Navegação para detalhes
- Estados de loading e erro

### Estado e Gestão

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
```

### Integrações

- `feedService` para dados
- `date-fns` para formatação de datas
- Componentes UI: Card, CardContent, CardHeader, CardTitle, Button
- Ícones: AlertTriangle, FileText, ThumbsUp, MessageSquare

## 5. MobileDashboard

### Visão Geral

Componente que implementa uma versão otimizada do dashboard para dispositivos móveis.

### Funcionalidades

- Perfil do usuário com progresso
- Categorias de vídeos
- Estatísticas principais
- Atividade recente em tabs
- Gráficos interativos
- Layout responsivo

### Estado e Gestão

```typescript
interface MobileDashboardProps {
  user: User | null;
  videos: Video[];
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  statsByCategory: any[];
  statsBySeverity: any[];
  statsByRisk: any[];
  statsByQAQuality: any[];
  statsByFrequency: any[];
  totalViews: number;
  totalIncidents: number;
  totalVideos: number;
  totalMedalsAcquired: number;
  progressToNextLevel: number;
  currentLevel: number;
  pointsToNextLevel: number;
}
```

### Integrações

- `recharts` para gráficos
- Componentes UI: Card, CardContent, CardHeader, CardTitle, Progress, Tabs
- Ícones: Eye, AlertTriangle, BookOpen

## Integrações Comuns

### 1. Serviços

- `videoService` para URLs seguras
- `incidentService` para estatísticas
- `feedService` para atividades
- `AuthContext` para autenticação

### 2. Componentes UI

- `Card` para containers
- `Button` para ações
- `Progress` para barras de progresso
- `Tabs` para navegação
- `Skeleton` para loading states

### 3. Bibliotecas

- `react-router-dom` para navegação
- `date-fns` para formatação de datas
- `recharts` para visualização de dados
- `lucide-react` para ícones

## Boas Práticas Implementadas

### 1. Performance

- Lazy loading de imagens
- Memoização de cálculos
- Renderização condicional
- Otimização para mobile

### 2. UX/UI

- Feedback visual imediato
- Estados de loading
- Mensagens de erro claras
- Interface responsiva
- Animações suaves

### 3. Segurança

- Validação de dados
- URLs seguras para mídia
- Proteção de rotas
- Sanitização de inputs

## Possíveis Melhorias

### 1. Cache de Dados

```typescript
const cachedStats = useMemo(
  () => ({
    ...stats,
    formatted: formatStats(stats),
  }),
  [stats]
);
```

### 2. Offline Support

```typescript
const [isOnline, setIsOnline] = useState(navigator.onLine);
useEffect(() => {
  window.addEventListener("online", () => setIsOnline(true));
  window.addEventListener("offline", () => setIsOnline(false));
}, []);
```

### 3. Analytics

```typescript
const trackInteraction = (component: string, action: string) => {
  analytics.track("dashboard_interaction", {
    component,
    action,
    timestamp: new Date(),
  });
};
```

## Considerações de Segurança

1. **Autenticação**

   - Verificação de roles
   - Proteção de rotas
   - Validação de tokens

2. **Dados**

   - Sanitização de inputs
   - Validação de tipos
   - Proteção contra XSS

3. **Mídia**
   - URLs seguras
   - Validação de formatos
   - Controle de acesso
