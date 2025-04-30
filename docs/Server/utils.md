# Utils - Sistema de Logging

## Logger.js (Versão JavaScript)

O `logger.js` implementa um sistema básico de logging usando a biblioteca Winston. Este ficheiro é responsável por:

- Configuração do logger com nível padrão 'info'
- Formatação dos logs com timestamp e formato JSON
- Armazenamento de logs em dois ficheiros:
  - `error.log`: exclusivo para logs de erro
  - `combined.log`: contém todos os tipos de logs
- Em ambiente de desenvolvimento (não produção), adiciona logs no console com formatação colorida para melhor visualização

## Logger.ts (Versão TypeScript - Melhorada)

O `logger.ts` é uma versão mais robusta e completa do sistema de logging, com funcionalidades adicionais:

### Logging no MongoDB

- Armazena logs de warning e erro na base de dados
- Utiliza a coleção 'errorLogs'
- Inclui metadados adicionais nos logs
- Configuração via variáveis de ambiente

### Configuração Avançada

- Nível de log configurável via variável de ambiente
- Inclui stack traces completos para erros
- Suporta múltiplos formatos de log:
  - JSON para armazenamento
  - Formato simples e colorido para console

### Tratamento de Exceções

- Captura automática de exceções não tratadas
- Captura de rejeições de Promises não tratadas
- Armazenamento em ficheiros dedicados:
  - `exceptions.log`
  - `rejections.log`

### Ambiente de Desenvolvimento

- Exibe logs de debug no console
- Formatação colorida para melhor legibilidade
- Logs mais detalhados que em produção

## Comparação entre Versões

| Característica | Logger.js        | Logger.ts           |
| -------------- | ---------------- | ------------------- |
| Tipagem        | JavaScript       | TypeScript          |
| Armazenamento  | Ficheiros locais | Ficheiros + MongoDB |
| Formatação     | Básica           | Avançada            |
| Exceções       | Não tratadas     | Tratadas            |
| Configuração   | Fixa             | Flexível            |
| Ambiente Dev   | Console colorido | Console + Debug     |

## Uso Recomendado

- **Logger.js**: Adequado para projetos menores ou protótipos
- **Logger.ts**: Recomendado para ambientes de produção e sistemas complexos

Ambos os ficheiros servem para centralizar e padronizar o logging da aplicação, facilitando o debug e monitorização do sistema.
