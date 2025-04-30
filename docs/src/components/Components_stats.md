# Componentes de Estatísticas de Categorias

## Visão Geral

Este documento descreve os principais componentes de visualização estatística por categoria, utilizados para apresentar a distribuição de vídeos ou eventos em gráficos circulares (pie chart) de forma clara e interativa.

---

## 1. CategoryDistributionChart

### Visão Geral

Componente que exibe um gráfico circular (pie chart) mostrando a distribuição de itens (ex: vídeos visualizados) por categoria, com cores personalizadas e legendas.

### Funcionalidades

- Gráfico circular responsivo
- Rótulos percentuais personalizados
- Tooltip customizado com detalhes da categoria
- Legenda automática
- Título e descrição configuráveis

### Estado e Gestão

- Recebe dados via prop `data: { category, count, color }[]`
- Não possui estado interno relevante além do render

### Integrações

- `recharts` para gráficos
- Componentes UI: Card, CardHeader, CardContent, CardTitle, CardDescription

---

## 2. SimpleVideoCategoryPieChart

### Visão Geral

Componente simplificado para exibir a distribuição de vídeos por categoria em formato de gráfico circular, com foco em reutilização e customização visual.

### Funcionalidades

- Gráfico circular responsivo
- Rótulos percentuais personalizados
- Tooltip customizado
- Legenda automática
- Título, descrição e classe CSS customizáveis

### Estado e Gestão

- Recebe dados via prop `data: { category, count, color }[]`
- Não possui estado interno relevante além do render

### Integrações

- `recharts` para gráficos
- Componentes UI: Card, CardHeader, CardContent, CardTitle, CardDescription

---

## 3. VideoCategoryPieChart

### Visão Geral

Componente que processa uma lista de vídeos e gera um gráfico circular mostrando a distribuição por categoria, atribuindo cores automaticamente e exibindo percentuais e totais.

### Funcionalidades

- Processamento automático dos dados dos vídeos
- Gráfico circular responsivo
- Rótulos percentuais personalizados
- Tooltip customizado com percentuais e totais
- Legenda automática
- Mensagem de vazio quando não há dados
- Título e descrição configuráveis

### Estado e Gestão

- Recebe lista de vídeos via prop `videos: Video[]`
- Processa dados internamente para gerar categorias e cores
- Não possui estado interno além do render

### Integrações

- `recharts` para gráficos
- Componentes UI: Card, CardHeader, CardContent, CardTitle, CardDescription
- Tipos globais: Video

---

## Integrações Comuns

- `recharts` para visualização de dados
- Componentes UI reutilizáveis para consistência visual

---

## Boas Práticas Implementadas

- Responsividade total dos gráficos
- Separação clara entre dados e visualização
- Customização de tooltips e legendas
- Mensagens claras para ausência de dados
- Uso de cores distintas para cada categoria

---

## Possíveis Melhorias

- Suporte a seleção/filtro de categorias
- Exportação dos dados do gráfico
- Animações de entrada/atualização
- Suporte a temas escuro/claro
- Acessibilidade aprimorada para leitores de ecrã

---

## Considerações de Segurança

1. **Dados**
   - Garantir que os dados recebidos estejam validados e sanitizados
2. **UX**
   - Mensagens claras para ausência de dados
   - Cores acessíveis para todos os utilizadores
