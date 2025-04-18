// Configuração do PostCSS, uma ferramenta para transformar CSS com plugins.
export default {
  // Define os plugins a serem utilizados.
  plugins: {
    // Integra o Tailwind CSS no processo de build.
    tailwindcss: {},
    // Adiciona automaticamente prefixos de fornecedores (-webkit-, -moz-, etc.) para garantir compatibilidade entre browsers.
    autoprefixer: {},
  },
}
