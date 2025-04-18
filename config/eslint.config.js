import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Exporta a configuração do ESLint.
export default tseslint.config(
  // Ignora a pasta 'dist' (geralmente contém o build de produção).
  { ignores: ["dist"] },
  // Configuração principal para ficheiros TypeScript e TSX.
  {
    // Estende configurações recomendadas de JavaScript e TypeScript.
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    // Aplica esta configuração a ficheiros .ts e .tsx.
    files: ["**/*.{ts,tsx}"],
    // Opções relacionadas com a linguagem.
    languageOptions: {
      // Define a versão do ECMAScript a suportar.
      ecmaVersion: 2020,
      // Define as variáveis globais disponíveis (neste caso, as de um browser).
      globals: globals.browser,
    },
    // Define os plugins ESLint a utilizar.
    plugins: {
      // Plugin para impor as regras dos Hooks do React.
      "react-hooks": reactHooks,
      // Plugin para garantir o funcionamento correto do Fast Refresh do Vite/React.
      "react-refresh": reactRefresh,
    },
    // Define regras específicas ou sobrescreve regras das configurações estendidas.
    rules: {
      // Inclui as regras recomendadas para Hooks do React.
      ...reactHooks.configs.recommended.rules,
      // Regra do react-refresh: avisa se um componente não for exportado corretamente para Fast Refresh.
      "react-refresh/only-export-components": [
        "warn", // Emite um aviso em vez de um erro.
        { allowConstantExport: true }, // Permite exportar constantes.
      ],
      // Desativa a regra que sinaliza variáveis não utilizadas do TypeScript (pode ser útil em desenvolvimento).
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
