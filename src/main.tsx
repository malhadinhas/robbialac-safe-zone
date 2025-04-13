
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeDatabase, getDatabaseConnectionStatus } from './services/database';

// Inicializa o banco de dados antes de renderizar a aplicação
async function startApp() {
  // Renderiza a aplicação imediatamente para mostrar ao menos a tela de carregamento
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Elemento root não encontrado!");
    return;
  }
  
  createRoot(rootElement).render(<App />);
  
  try {
    // Tenta inicializar a conexão com o banco de dados
    console.log('Tentando inicializar o banco de dados...');
    await initializeDatabase();
    console.log('Banco de dados inicializado com sucesso');
    
    // Verificação adicional do status da conexão
    const status = getDatabaseConnectionStatus();
    console.log('Status da conexão após inicialização:', status);
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    // A interface tratará o erro de conexão através do DatabaseContext
  }
}

startApp();
