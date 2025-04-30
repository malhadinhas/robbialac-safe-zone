# Contextos Globais da Aplicação

## Visão Geral

Este documento descreve os principais contextos globais utilizados na aplicação React: autenticação de utilizador (`AuthContext`) e ligação à base de dados (`DatabaseContext`). Explica o propósito, funcionalidades, integrações, estado, boas práticas e possíveis melhorias para cada contexto.

---

## 1. AuthContext

### Propósito

Gerir o estado global de autenticação do utilizador, incluindo login, logout, carregamento do utilizador atual, permissões e atualização de pontos.

### Funcionalidades

- Login e logout de utilizador
- Carregamento automático do utilizador atual (com persistência em localStorage)
- Atualização dos pontos do utilizador
- Exposição de estado de loading e autenticação
- Feedback visual via notificações

### Estado e Gestão

```typescript
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(true);
```

### Integrações

- Serviços de autenticação (`loginUser`, `logoutUser`, `getCurrentUser`)
- `react-router-dom` para navegação
- `sonner` para notificações
- Tipos globais: User

### Boas Práticas

- Persistência do utilizador no localStorage
- Feedback visual para login/logout/erros
- Atualização reativa do estado global
- Proteção de hooks (erro se usado fora do provider)

---

## 2. DatabaseContext

### Propósito

Gerir o estado global da ligação à base de dados, incluindo verificação de conexão, reconexão e tratamento de erros.

### Funcionalidades

- Verificação periódica do estado da ligação
- Tentativa de reconexão manual
- Exposição de estado de loading, erro e inicialização
- Feedback visual via notificações

### Estado e Gestão

```typescript
const [isConnected, setIsConnected] = useState<boolean>(false);
const [connectionError, setConnectionError] = useState<string | null>(null);
const [isInitializing, setIsInitializing] = useState<boolean>(true);
```

### Integrações

- Serviços de base de dados (`getDatabaseConnectionStatus`, `tryReconnect`)
- `sonner` para notificações

### Boas Práticas

- Verificação periódica automática da ligação
- Feedback visual para erros e reconexão
- Proteção de hooks (erro se usado fora do provider)
- Separação clara entre estado de conexão e inicialização

---

## Integrações Comuns

- Utilização de React Context API para estado global
- Notificações para feedback ao utilizador
- Integração com serviços externos (auth, database)

---

## Boas Práticas Gerais

- Proteção dos hooks para evitar uso fora do provider
- Feedback visual imediato para ações e erros
- Separação clara de responsabilidades entre autenticação e base de dados
- Persistência e atualização reativa do estado global

---

## Possíveis Melhorias

- Suporte a múltiplos providers (ex: multi-tenant)
- Testes automatizados de contexto
- Suporte a refresh automático de tokens JWT
- Logging detalhado de eventos de autenticação/conexão
- Otimização de performance para grandes aplicações

---

## Considerações de Segurança

1. **Autenticação**
   - Proteger endpoints e rotas sensíveis
   - Não expor dados sensíveis no contexto global
2. **Base de Dados**
   - Tratar erros de conexão de forma segura
   - Evitar exposição de mensagens sensíveis ao utilizador
3. **UX**
   - Mensagens claras para erros e loading
