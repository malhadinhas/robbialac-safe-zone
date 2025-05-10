/**
 * @module server/config/server.config.ts
 * @description Este arquivo define a configuração para o `tsup`, uma ferramenta
 * utilizada para compilar e empacotar (bundle) código TypeScript/JavaScript
 * de forma eficiente, especialmente para bibliotecas ou aplicações backend como esta.
 * O `tsup` simplifica o processo de build, cuidando da transpilação, minificação (opcional),
 * geração de type definitions, e formatação do output.
 */
import { defineConfig } from 'tsup';

/**
 * Exporta a configuração padrão para o tsup.
 * A ferramenta `tsup` lerá este objeto ao ser executada para saber como
 * processar o build do projeto.
 * @see https://tsup.egoist.dev/ - Documentação oficial do tsup
 */
export default defineConfig({
  /**
   * Ponto(s) de entrada para o processo de build.
   * O `tsup` começará a analisar e compilar a partir deste(s) arquivo(s).
   * Neste caso, o ponto de entrada principal do servidor é 'server.ts'.
   */
  entry: ['server.ts'],

  /**
   * Formato(s) do output gerado.
   * 'esm' significa ECMAScript Modules, o sistema de módulos padrão do JavaScript moderno,
   * utilizado com `import`/`export`. Outros formatos comuns seriam 'cjs' (CommonJS)
   * ou 'iife' (para scripts de navegador). Escolher 'esm' é apropriado para aplicações Node.js modernas.
   */
  format: ['esm'],

  /**
   * Gerar arquivos de definição de tipos (`.d.ts`).
   * Essencial se este código fosse uma biblioteca a ser consumida por outros projetos TypeScript,
   * pois fornece a tipagem para o código compilado. Também útil para verificações internas.
   */
  dts: true,

  /**
   * Habilitar ou desabilitar a divisão de código (code splitting).
   * `false`: Gera um único arquivo de output (ou um por ponto de entrada).
   * `true`: O `tsup` pode dividir o código em múltiplos chunks para otimizar o carregamento.
   * Para um servidor backend, `false` geralmente simplifica o deploy e a execução.
   */
  splitting: false,

  /**
   * Gerar sourcemaps.
   * Sourcemaps mapeiam o código compilado/empacotado de volta para o código fonte original (TypeScript).
   * Isso é crucial para depuração (debugging), permitindo ver e depurar o código TS original
   * nas ferramentas de desenvolvedor ou logs de erro, em vez do código JS gerado.
   */
  sourcemap: true,

  /**
   * Limpar o diretório de output (geralmente `dist/`) antes de cada build.
   * Garante que não haja arquivos antigos ou desnecessários no diretório final após a compilação,
   * mantendo o resultado do build limpo e consistente.
   */
  clean: true,
}); 