# Componentes de Análise

## Visão Geral

Este documento descreve os componentes principais do módulo de análise da aplicação, que incluem visualização de dados, edição de metas e acompanhamento de progresso por departamento.

## 1. DepartmentEmployeeEditor

### Visão Geral

Componente responsável pela gestão do número de funcionários por departamento.

### Funcionalidades

- Visualização do número atual de funcionários
- Edição do número de funcionários
- Validação de permissões (admin_app/admin_qa)
- Feedback visual de alterações

### Estado e Gestão

```typescript
const [departments, setDepartments] = useState<DepartmentWithEmployees[]>([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
```

### Segurança

```typescript
const isAuthorized = user?.role === "admin_app" || user?.role === "admin_qa";
```

## 2. DepartmentIncidentsChart

### Visão Geral

Componente de visualização de dados que exibe um gráfico de barras comparando incidentes reportados com metas por departamento.

### Funcionalidades

- Gráfico de barras responsivo
- Tooltips informativos
- Adaptação a diferentes tamanhos de tela
- Cálculo automático de domínios

### Dados e Processamento

```typescript
const chartData = data.map((item) => ({
  name: item.department.label,
  incidentes: item.incidents,
  meta: item.target,
  color: item.department.color,
}));
```

### Responsividade

```typescript
const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
```

## 3. DepartmentProgressList

### Visão Geral

Componente que exibe o progresso de cada departamento em relação às suas metas de incidentes.

### Funcionalidades

- Barras de progresso coloridas
- Exibição de percentagens
- Layout responsivo
- Cores personalizadas por departamento

### Interface

```typescript
interface DepartmentData {
  department: {
    id: string;
    name: string;
    color: string;
    employeeCount: number;
  };
  incidents: number;
  target: number;
  percentage: number;
}
```

## 4. IncidentTargetEditor

### Visão Geral

Componente para configuração da meta anual de incidentes por funcionário.

### Funcionalidades

- Slider para ajuste visual
- Input numérico para precisão
- Validação de permissões
- Feedback de salvamento

### Estado e Controles

```typescript
const [targetValue, setTargetValue] = useState<number>(5);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
```

## Integrações Comuns

### 1. Serviços

- `departmentService` para operações CRUD
- `AuthContext` para autenticação
- `toast` para notificações

### 2. Componentes UI

- `Card` para containers
- `Button` para ações
- `Input` para entrada de dados
- `Progress` para barras de progresso
- `Slider` para controles deslizantes

## Boas Práticas Implementadas

### 1. Segurança

- Validação de permissões
- Sanitização de inputs
- Proteção contra acesso não autorizado

### 2. Performance

- Memoização de cálculos
- Renderização condicional
- Otimização de re-renders

### 3. UX/UI

- Feedback visual imediato
- Estados de loading
- Mensagens de erro claras
- Interface responsiva

## Possíveis Melhorias

### 1. Cache de Dados

```typescript
const cachedData = useMemo(
  () =>
    departments.map((dept) => ({
      ...dept,
      progress: calculateProgress(dept),
    })),
  [departments]
);
```

### 2. Exportação de Dados

```typescript
const handleExport = () => {
  const csvData = departments.map((dept) => ({
    Departamento: dept.label,
    Funcionários: dept.employeeCount,
    Meta: dept.target,
    Progresso: `${dept.percentage}%`,
  }));
  exportToCSV(csvData);
};
```

### 3. Filtros Avançados

```typescript
const [filters, setFilters] = useState({
  dateRange: null,
  department: null,
  progressThreshold: null,
});
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

3. **Permissões**
   - Controle granular de acesso
   - Logs de alterações
   - Auditoria de ações
