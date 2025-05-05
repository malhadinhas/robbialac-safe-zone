# Documentação dos Ficheiros Públicos

## Visão Geral

A pasta `public` contém ficheiros estáticos que são servidos diretamente pelo servidor web. Estes ficheiros são copiados para a pasta `dist` durante o processo de compilação sem qualquer modificação.

## Ficheiros PDF.js

### pdf.worker.js

- Ficheiro worker completo do PDF.js (não minificado)
- Tamanho aproximado: 1.3MB
- Utilizado para processamento de PDFs no navegador
- Permite funcionalidades como:
  - Renderização de PDFs
  - Extração de texto
  - Pesquisa em documentos
  - Manipulação de páginas
  - Zoom e rotação
  - Suporte a formulários PDF

### pdf.worker.min.js

- Versão minificada do worker script do PDF.js
- Tamanho aproximado: 1.3MB
- Otimizado para produção
- Mantém todas as funcionalidades do pdf.worker.js
- Recomendado para ambiente de produção devido ao código minificado

## Ficheiros de Sistema

### robots.txt

Ficheiro de configuração para motores de busca que define as regras de acesso para crawlers. Configurado para:

```txt
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
```

Este ficheiro:

- Permite indexação completa por motores de busca principais
- Não bloqueia nenhuma área do site
- Otimiza a visibilidade do site em resultados de pesquisa
- Permite partilha adequada em redes sociais

### placeholder.svg

- Imagem vetorial utilizada como placeholder
- Exibida quando:
  - Imagens principais estão a carregar
  - Imagens principais falham ao carregar
  - Conteúdo ainda não está disponível
- Ajuda a manter a consistência visual
- Evita layouts quebrados durante o carregamento

## Utilização

### Em Desenvolvimento

- Os ficheiros são servidos diretamente da pasta `public`
- Modificações são refletidas imediatamente
- Útil para testes e depuração

### Em Produção

- Ficheiros são copiados para a pasta `dist`
- Servidos com headers de cache apropriados
- Otimizados para desempenho

## Boas Práticas

1. **Gestão de Ficheiros**

   - Manter apenas ficheiros estáticos necessários
   - Remover ficheiros não utilizados
   - Atualizar regularmente quando necessário

2. **Segurança**

   - Não armazenar informações sensíveis
   - Verificar permissões de ficheiros
   - Manter ficheiros atualizados

3. **Otimização**

   - Utilizar versões minificadas em produção
   - Comprimir imagens quando possível
   - Configurar cache adequadamente

4. **SEO**
   - Manter robots.txt atualizado
   - Verificar regras periodicamente
   - Ajustar conforme necessidades do projeto

## Notas Importantes

- Os ficheiros nesta pasta são publicamente acessíveis
- Não devem conter código sensível ou configurações
- Devem ser otimizados para produção
- Necessário manter versões atualizadas dos workers PDF.js
