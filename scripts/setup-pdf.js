const fs = require('fs');
const path = require('path');

// Criar diretório public se não existir
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Caminho do arquivo worker na pasta node_modules
const workerPath = path.join(
  'node_modules',
  'pdfjs-dist',
  'build',
  'pdf.worker.min.mjs'
);

// Caminho de destino na pasta public
const destPath = path.join('public', 'pdf.worker.min.js');

// Copiar o arquivo
try {
  fs.copyFileSync(workerPath, destPath);
  console.log('Worker do PDF.js copiado com sucesso!');
} catch (error) {
  console.error('Erro ao copiar worker do PDF.js:', error);
  process.exit(1);
}