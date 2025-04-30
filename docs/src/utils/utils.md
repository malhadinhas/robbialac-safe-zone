# Documentação de Utilitários

## Logger (logger.ts)

O arquivo `logger.ts` implementa um sistema de logging simplificado para o frontend da aplicação. Este utilitário fornece uma interface padronizada para registro de mensagens de diferentes níveis de severidade.

### Estrutura

O logger é implementado como um objeto com três métodos principais:

```typescript
const logger = {
  info: (message: string, meta?: object) => { ... },
  warn: (message: string, meta?: object) => { ... },
  error: (message: string, meta?: object) => { ... }
};
```

### Níveis de Log

1. **info**: Para mensagens informativas gerais
2. **warn**: Para avisos e situações que merecem atenção
3. **error**: Para erros e exceções

### Parâmetros

Cada método aceita:

- `message`: Uma string contendo a mensagem principal do log
- `meta`: Um objeto opcional contendo informações adicionais relevantes para o log

### Observações Importantes

- O logger está atualmente configurado como um esqueleto básico, sem implementação real dos métodos de logging
- Os comentários no código indicam que os `console.log`, `console.error` e `console.warn` devem ser removidos a menos que o logger seja usado para:
  - Integração com sistemas externos de logging
  - Propósitos de auditoria
  - Monitoramento em produção

### Uso Recomendado

```typescript
import logger from "../utils/logger";

// Exemplo de uso
logger.info("Usuário logado com sucesso", { userId: "123" });
logger.warn("Tentativa de acesso não autorizado", { path: "/admin" });
logger.error("Falha na requisição", { status: 500, endpoint: "/api/users" });
```

### Boas Práticas

1. Evite usar `console.log` diretamente no código
2. Utilize o logger para manter consistência no formato das mensagens
3. Inclua metadados relevantes no parâmetro `meta` para facilitar o debugging
4. Mantenha as mensagens claras e descritivas
