# Visualizador de PDF (page.tsx)

## Visão Geral

O ficheiro `page.tsx` localizado em `src/app/pdf-viewer/[id]/` é uma página dinâmica do Next.js que serve como visualizador de documentos PDF. Utiliza parâmetros de rota e query para carregar e exibir PDFs de forma segura e responsiva.

## Estrutura e Localização

- **Caminho**: `src/app/pdf-viewer/[id]/page.tsx`
- **Tipo**: Componente React Client-Side
- **Framework**: Next.js 13+
- **Rota Dinâmica**: Utiliza `[id]` para parâmetros dinâmicos
- **Diretiva**: `'use client'` para indicar renderização no cliente

## Funcionalidades Principais

1. **Parâmetros e Query Strings**

   ```typescript
   const searchParams = useSearchParams();
   const url = searchParams.get("url");
   const title = searchParams.get("title");
   ```

   - Recebe URL do PDF via query string
   - Recebe título do documento via query string
   - Valida presença da URL

2. **Tratamento de Erros**

   - Exibe mensagem de erro quando URL não é fornecida
   - Fornece botão de retorno para página de acidentes
   - Interface amigável para o utilizador

3. **Interface do Utilizador**
   - Cabeçalho com título do documento
   - Botão de navegação para voltar
   - Visualizador de PDF responsivo
   - Layout adaptativo à altura da tela

## Componentes Utilizados

1. **PDFViewer**

   - Componente personalizado para visualização de PDFs
   - Altura calculada dinamicamente: `h-[calc(100vh-8rem)]`
   - Recebe URL do documento como prop

2. **Elementos de UI**
   - `Button` do sistema de design
   - `ChevronLeft` do Lucide Icons
   - `Link` do Next.js para navegação

## Propósito e Design

- **Visualização Segura**: Exibe PDFs de forma controlada
- **Navegação Intuitiva**: Facilita retorno à página anterior
- **Responsividade**: Adapta-se a diferentes tamanhos de tela
- **Tratamento de Erros**: Interface amigável em caso de falhas

## Boas Práticas Implementadas

1. **Validação de Dados**

   - Verifica presença da URL antes de renderizar
   - Fornece feedback claro em caso de erro

2. **Acessibilidade**

   - Botões com ícones e texto
   - Estrutura semântica HTML
   - Mensagens de erro claras

3. **Performance**
   - Carregamento condicional de componentes
   - Altura calculada dinamicamente
   - Renderização no cliente para PDFs

## Possíveis Extensões

1. **Controles de PDF**

   ```typescript
   <PDFViewer
     url={url}
     className="h-[calc(100vh-8rem)]"
     controls={true}
     zoom={1.0}
   />
   ```

2. **Download Seguro**

   ```typescript
   <Button onClick={() => handleDownload(url)}>
     <Download className="h-4 w-4 mr-2" />
     Download PDF
   </Button>
   ```

3. **Anotações**
   ```typescript
   <PDFViewer
     url={url}
     allowAnnotations={true}
     onAnnotationSave={handleAnnotationSave}
   />
   ```

## Considerações de Segurança

- Validação de URLs antes de carregar
- Sanitização de parâmetros
- Proteção contra XSS
- Controle de acesso aos documentos
