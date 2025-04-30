# Biblioteca Utilitária (lib)

## Visão Geral

Este documento descreve os principais utilitários e serviços de integração HTTP da aplicação, localizados na pasta `lib`. Explica o propósito, funcionalidades, integrações, boas práticas e possíveis melhorias para cada ficheiro.

---

## 1. api.ts

### Propósito

Fornecer uma camada de integração HTTP centralizada usando Axios, com configuração de interceptores, autenticação, tratamento de erros e funções utilitárias para chamadas à API.

### Funcionalidades

- Instância Axios pré-configurada (`baseURL`, `timeout`, headers)
- Interceptor de request para adicionar token JWT do localStorage
- Interceptor de response para tratamento de erros (ex: 401, remoção de token)
- Funções utilitárias para autenticação, CRUD de vídeos e health check

### Integrações

- Utilizado por serviços e componentes para chamadas HTTP à API backend
- Integração com autenticação (token JWT)
- Integração com localStorage para persistência de token

### Boas Práticas

- Centralização da configuração HTTP
- Uso de interceptores para lógica cross-cutting (auth, erros)
- Separação clara entre funções de API e configuração base

### Possíveis Melhorias

- Suporte a refresh automático de token
- Logging detalhado de erros de API
- Suporte a múltiplos ambientes via baseURL dinâmica
- Testes automatizados de integração

---

## 2. utils.ts

### Propósito

Fornecer utilitários para manipulação de classes CSS de forma segura e eficiente, facilitando a composição de estilos com Tailwind e clsx.

### Funcionalidades

- Função `cn(...inputs)`: combina classes usando `clsx` e faz merge com `tailwind-merge` para evitar conflitos

### Integrações

- Utilizado em componentes para composição dinâmica de classes CSS
- Facilita a escrita de componentes reutilizáveis e estilização condicional

### Boas Práticas

- Centralização de utilitários de classe
- Uso de bibliotecas robustas (`clsx`, `tailwind-merge`)
- Evita conflitos e duplicação de classes

### Possíveis Melhorias

- Adicionar utilitários para manipulação de outras propriedades comuns (ex: datas, números)
- Testes unitários para cenários complexos de composição de classes

---

## Considerações de Segurança

1. **Autenticação**
   - Garantir que tokens não sejam expostos em logs
   - Remover tokens inválidos do localStorage
2. **Erros de API**
   - Tratar erros de forma clara e segura para o utilizador
3. **UX**
   - Garantir feedback visual em caso de falha de integração
