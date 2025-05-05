# Documentação de Ficheiros do Sistema

## Ficheiros de Configuração

### .gitignore

Ficheiro essencial para controlo de versão que especifica quais os ficheiros e diretórios que o Git deve ignorar. Isto evita que ficheiros desnecessários ou sensíveis sejam versionados. Inclui:

- **Ficheiros do Sistema**:

  - `.DS_Store`: Ficheiros de metadados do macOS
  - Ficheiros temporários do sistema operativo

- **Ficheiros de Ambiente**:

  - `.env`: Variáveis de ambiente principais
  - `.env.local`: Configurações locais
  - `.env.development.local`: Configurações de desenvolvimento
  - `.env.test.local`: Configurações de teste
  - `.env.production.local`: Configurações de produção
    > Importante: Estes ficheiros contêm informações sensíveis como chaves de API e credenciais

- **Diretórios de Dependências**:

  - `/node_modules`: Pacotes npm instalados
  - `/.pnp`: Configurações Plug'n'Play
  - `.pnp.js`: JavaScript do Plug'n'Play

- **Ficheiros de Compilação**:

  - `/build`: Código compilado para produção
  - `/dist`: Distribuição do projeto
    > Estes são gerados automaticamente e não devem ser versionados

- **Ficheiros de Registo**:

  - `npm-debug.log*`: Registos de depuração do npm
  - `yarn-debug.log*`: Registos de depuração do Yarn
  - `yarn-error.log*`: Registos de erro do Yarn

- **Ficheiros da IDE**:

  - `.idea/`: Configurações do IntelliJ
  - `.vscode/`: Configurações do VS Code
  - `*.swp`, `*.swo`: Ficheiros temporários do Vim

- **Ficheiros Grandes**:
  - `public/models/Fabrica_v1.glb`: Modelo 3D da fábrica
    > Ficheiros grandes devem ser armazenados num sistema de armazenamento apropriado

### components.json

Ficheiro de configuração do shadcn/ui, uma biblioteca de componentes UI altamente personalizável. Define:

- **Estilo Padrão**:

  - `style: "default"`: Tema visual base
  - `rsc: false`: Configuração para React Server Components
  - `tsx: true`: Suporte para TypeScript com JSX

- **Configuração Tailwind**:

  - `config`: Localização do ficheiro de configuração
  - `css`: Ficheiro de estilos principal
  - `baseColor`: Esquema de cores base
  - `cssVariables`: Utilização de variáveis CSS

- **Aliases de Importação**:
  - `components`: Atalho para componentes reutilizáveis
  - `utils`: Funções utilitárias
  - `ui`: Componentes de interface
  - `lib`: Bibliotecas partilhadas
  - `hooks`: Hooks React personalizados

### Ficheiros de Registo

#### error.log

Ficheiro crucial para monitorização e depuração que regista:

- Erros de carregamento de ficheiros
- Problemas de ligação com serviços externos
- Erros de validação de dados
- Falhas de autenticação
- Problemas com a base de dados
- Erros de integração com serviços cloud

Formato do registo:

```json
{
  "timestamp": "ISO-8601",
  "level": "error",
  "message": "Descrição do erro",
  "stack": "Stack trace",
  "metadata": {
    // Informações adicionais
  }
}
```

#### exceptions.log

Registo dedicado para exceções não tratadas do sistema, incluindo:

- Erros de execução
- Exceções de memória
- Falhas de sistema
- Problemas de concorrência

#### rejections.log

Monitoriza promessas rejeitadas não tratadas, essencial para:

- Depuração de operações assíncronas
- Identificação de problemas de condição de corrida
- Monitorização de tempos limite
- Falhas em chamadas de API

### index.html

Ponto de entrada principal da aplicação web que:

- **Metadados Básicos**:

  ```html
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RobbiSeg</title>
  ```

  > Configuração essencial para responsividade e codificação correta

- **SEO e Redes Sociais**:

  - Tags Open Graph para partilha no Facebook
  - Tags Twitter Card para partilha no Twitter
  - Descrição e imagens otimizadas para motores de busca

- **Recursos Externos**:

  - Google Fonts (Inter) para tipografia consistente
  - Scripts de terceiros carregados de forma otimizada
  - Ícone personalizado da aplicação

- **Estrutura da Aplicação**:
  - Elemento raiz para montagem do React
  - Carregamento modular de scripts
  - Integração com ferramentas de desenvolvimento

### Ficheiros de Dependências

#### package.json

Manifesto do projeto que define:

- **Metadados**:

  - Nome do projeto
  - Versão
  - Descrição
  - Autores
  - Licença

- **Scripts**:

  - Comandos de desenvolvimento
  - Processos de compilação
  - Testes automatizados
  - Linting e formatação

- **Dependências**:

  - Pacotes de produção
  - Dependências de desenvolvimento
  - Versões específicas ou intervalos

- **Configurações**:
  - Engines Node.js
  - Configurações de tipo
  - Browserlist

#### package-lock.json

Garante consistência nas instalações através de:

- Árvore completa de dependências
- Hashes de integridade
- Versões exatas de cada pacote
- Resoluções de conflitos

### Ficheiros de Configuração TypeScript

#### tsconfig.json

Configuração detalhada do TypeScript:

- **Compilação**:

  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "ESNext",
      "strict": true
    }
  }
  ```

- **Paths e Aliases**:

  - Mapeamento de importações
  - Resolução de módulos
  - Diretórios de tipos

- **Opções Avançadas**:
  - Decorators
  - Source Maps
  - Verificações estritas
  - Interoperabilidade com JavaScript

### Ficheiros de Configuração da Compilação

#### vite.config.ts

Configuração do bundler Vite:

- **Plugins**:

  - React
  - TypeScript
  - PostCSS
  - Otimização de imagens

- **Compilação**:

  - Minificação
  - Divisão de código
  - Cache busting
  - Otimização de recursos

- **Desenvolvimento**:
  - Hot Module Replacement
  - Proxy para APIs
  - Portas e hosts
  - SSL/HTTPS

### Ficheiros de Estilo

#### tailwind.config.ts

Configuração extensiva do Tailwind CSS:

- **Temas**:

  - Cores personalizadas
  - Tipografia
  - Espaçamento
  - Pontos de quebra

- **Plugins**:

  - Formulários
  - Tipografia
  - Proporções de aspeto
  - Limitação de linhas

- **Personalizações**:
  - Extensões de classes
  - Variantes personalizadas
  - Funções utilitárias
  - Tokens de design

### Scripts de Desenvolvimento

#### start-dev.bat

Script Windows para inicialização do ambiente:

```batch
@echo off
:: Configuração de variáveis de ambiente
set NODE_ENV=development

:: Inicialização de serviços
start npm run dev
start npm run server
```

## Utilização e Melhores Práticas

### Configuração do Ambiente

1. Clone o repositório
2. Copie `.env.example` para `.env`
3. Instale as dependências
4. Configure as variáveis de ambiente
5. Inicie o ambiente de desenvolvimento

### Gestão de Dependências

- Mantenha um registo de alterações
- Atualize pacotes regularmente
- Verifique vulnerabilidades
- Utilize `npm audit` periodicamente

### Compilação e Build

- Teste compilações localmente
- Verifique otimizações
- Monitorize tamanho dos bundles
- Mantenha source maps em desenvolvimento

### Registo e Depuração

- Implemente registos estruturados
- Defina níveis de registo apropriados
- Configure rotação de registos
- Monitorize erros em produção

### Estilização

- Siga o sistema de design
- Mantenha consistência
- Otimize desempenho
- Documente componentes

### Controlo de Versão

- Commits semânticos
- Revisão de código
- Ramos organizados
- Etiquetas para lançamentos

## Observações Importantes

### Segurança

- Proteja informações sensíveis
- Utilize variáveis de ambiente
- Implemente CORS adequadamente
- Mantenha dependências atualizadas

### Manutenção

- Reveja registos regularmente
- Atualize documentação
- Monitorize desempenho
- Faça cópias de segurança regulares

### Desenvolvimento

- Siga padrões de código
- Documente alterações
- Teste adequadamente
- Otimize continuamente

### Produção

- Monitorize recursos
- Configure alertas
- Mantenha redundância
- Planeie escalabilidade
