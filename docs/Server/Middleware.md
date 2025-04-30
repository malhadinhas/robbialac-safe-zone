# Middlewares da Aplicação

Este documento detalha o funcionamento dos principais middlewares da aplicação, integrando a análise técnica e as descrições fornecidas. Cada secção corresponde a um ficheiro de middleware e descreve as suas principais funcionalidades, estrutura, validação e importância para a segurança e robustez do sistema.

---

## authMiddleware.ts

O ficheiro `authMiddleware.ts` define middlewares de autenticação e autorização para proteger as rotas da tua API. Estes middlewares garantem que apenas utilizadores autenticados e/ou com permissões adequadas conseguem aceder a determinadas rotas.

### O que cada middleware faz:

- **isAuthenticated:**

  - Garante que o utilizador tem um token JWT válido.
  - Se estiver em modo desenvolvimento, faz bypass e simula um admin.
  - Utiliza o token para validar a identidade do utilizador e associar os dados ao request.

- **isAdmin:**

  - Garante que o utilizador está autenticado e tem papel de administrador (`admin_app` ou `admin_qa`).
  - Verifica o papel do utilizador após a autenticação e só permite acesso se for admin.

- **hasRole:**
  - Permite definir dinamicamente quais papéis podem aceder a uma rota (ex: só utilizadores com certos papéis).
  - Recebe uma lista de papéis permitidos e valida se o utilizador autenticado pertence a algum deles.

**Resumindo:**
Este ficheiro centraliza toda a lógica de autenticação e autorização, tornando a aplicação mais segura e fácil de manter. Permite proteger endpoints sensíveis e personalizar o acesso conforme o papel do utilizador.

---

## uploadMiddleware.ts

O ficheiro `uploadMiddleware.ts` define middlewares para upload, validação e tratamento de erros de ficheiros de vídeo na tua API Express.

### O que cada parte faz:

- **Configuração do multer:**

  - Define onde e como os ficheiros são guardados temporariamente, e como são nomeados.
  - Utiliza armazenamento em disco ou memória conforme a configuração.

- **Validação de ficheiros:**

  - Garante que apenas ficheiros de vídeo permitidos (por extensão e MIME type) são aceites.
  - Rejeita ficheiros com extensões ou tipos inválidos logo no início do processo de upload.

- **Validação pós-upload:**

  - Verifica se todos os campos obrigatórios estão presentes e se o ficheiro cumpre os requisitos (tamanho, existência).
  - Garante que o ficheiro não excede o tamanho máximo permitido e que os metadados necessários estão presentes.

- **Remoção de ficheiros inválidos:**

  - Se houver erro de validação, remove o ficheiro do disco para não acumular lixo.
  - Mantém o sistema limpo e evita ocupação desnecessária de espaço.

- **Tratamento de erros do multer:**
  - Garante que erros como ficheiro demasiado grande são tratados e comunicados ao utilizador.
  - Responde com mensagens claras em caso de erro de upload.

**Resumindo:**
Este middleware centraliza toda a lógica de upload e validação de vídeos, tornando o processo seguro, limpo e fácil de manter. Garante que só vídeos válidos e com metadados completos entram no sistema, e que ficheiros inválidos são removidos imediatamente.
