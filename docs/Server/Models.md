# Modelos de Dados da Aplicação

Este documento detalha o funcionamento de todos os ficheiros de modelos (models) da aplicação, integrando a análise técnica e as descrições fornecidas. Cada secção corresponde a um ficheiro de modelo e descreve as suas principais funcionalidades, estrutura, validação, índices e importância para o sistema.

---

## Accident.ts

O ficheiro `Accident.ts` define o modelo de dados (schema e interface) para acidentes na base de dados MongoDB, usando o Mongoose.

### O que este código faz:

- Define a estrutura de um acidente, incluindo campos obrigatórios (nome, país, data) e opcionais (ficheiro PDF).
- Permite guardar e consultar acidentes na base de dados de forma tipada e validada.
- Adiciona automaticamente as datas de criação e atualização.
- Cria índices para otimizar pesquisas por data e país.
- Exporta o modelo para ser usado em controladores, serviços e outras partes da aplicação.

**Resumindo:**
Este ficheiro centraliza toda a lógica de estrutura e validação de dados para acidentes, garantindo consistência e performance nas operações relacionadas a acidentes na tua aplicação.

---

## Comment.ts

O ficheiro `Comment.ts` define o modelo de dados (schema e interface) para comentários na base de dados MongoDB, usando o Mongoose.

### O que este código faz:

- Define a estrutura de um comentário, incluindo o utilizador, o item comentado, o tipo de item, o texto e a data de criação.
- Permite guardar e consultar comentários de forma tipada e validada.
- Adiciona automaticamente a data de criação.
- Cria um índice para otimizar pesquisas de comentários por item e tipo.
- Exporta o modelo para ser usado em controladores, serviços e outras partes da aplicação.

**Resumindo:**
Este ficheiro centraliza toda a lógica de estrutura e validação de dados para comentários, garantindo consistência e performance nas operações relacionadas a comentários na tua aplicação.

---

## Department.ts

O ficheiro `Department.ts` define o modelo de dados (schema e interface) para departamentos na base de dados MongoDB, usando o Mongoose.

### O que este código faz:

- Define a estrutura de um departamento, incluindo nome, descrição, estado ativo e datas de criação/atualização.
- Permite guardar e consultar departamentos de forma tipada e validada.
- Garante que o nome do departamento é único.
- Adiciona automaticamente as datas de criação e atualização.
- Cria índices para otimizar pesquisas por nome e estado ativo.
- Exporta o modelo para ser usado em controladores, serviços e outras partes da aplicação.

**Resumindo:**
Este ficheiro centraliza toda a lógica de estrutura e validação de dados para departamentos, garantindo consistência e performance nas operações relacionadas a departamentos na tua aplicação.

---

## Like.ts

O ficheiro `Like.ts` define o modelo de dados (schema e interface) para likes (gostos) na base de dados MongoDB, usando o Mongoose.

### O que este código faz:

- Define a estrutura de um like, incluindo o utilizador, o item gostado, o tipo de item e a data de criação.
- Permite guardar e consultar likes de forma tipada e validada.
- Garante que um utilizador só pode gostar de um item uma vez (índice único).
- Adiciona automaticamente a data de criação.
- Cria índices para otimizar pesquisas por item e tipo.
- Exporta o modelo para ser usado em controladores, serviços e outras partes da aplicação.

**Resumindo:**
Este ficheiro centraliza toda a lógica de estrutura e validação de dados para likes, garantindo consistência e performance nas operações relacionadas a gostos na tua aplicação.

---

## Sensibilizacao.ts

O ficheiro `Sensibilizacao.ts` define o modelo de dados (schema e interface) para documentos de sensibilização na base de dados MongoDB, usando o Mongoose.

### O que este código faz:

- Define a estrutura de um documento de sensibilização, incluindo nome, país, data, ficheiro PDF e datas de criação/atualização.
- Permite guardar e consultar documentos de sensibilização de forma tipada e validada.
- Adiciona automaticamente as datas de criação e atualização.
- Cria um índice para otimizar pesquisas por data.
- Exporta o modelo para ser usado em controladores, serviços e outras partes da aplicação.

**Resumindo:**
Este ficheiro centraliza toda a lógica de estrutura e validação de dados para documentos de sensibilização, garantindo consistência e performance nas operações relacionadas a estes documentos na tua aplicação.

---

## Video.ts

O ficheiro `Video.ts` define o modelo de dados (schema e interface) para vídeos na base de dados MongoDB, usando o Mongoose.

### O que este código faz:

- Define a estrutura de um vídeo, incluindo campos obrigatórios e opcionais, como título, descrição, chaves de storage, categoria, zona, duração, visualizações, estado, etc.
- Permite guardar e consultar vídeos de forma tipada e validada.
- Adiciona automaticamente as datas de criação e atualização.
- Cria índices para otimizar pesquisas por categoria, visualizações, data e videoId.
- Inclui métodos estáticos para buscar vídeos por categoria e zona.
- Inclui método de instância para incrementar visualizações.
- Middleware para garantir que o campo id nunca é nulo.
- Exporta o modelo para ser usado em controladores, serviços e outras partes da aplicação.

**Resumindo:**
Este ficheiro centraliza toda a lógica de estrutura e validação de dados para vídeos, garantindo consistência, performance e funcionalidades extra (como métodos utilitários) nas operações relacionadas a vídeos na tua aplicação.
