
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeDatabase } from './services/database';

// Inicializa o banco de dados antes de renderizar a aplicação
async function startApp() {
  try {
    // Tenta inicializar a conexão com o banco de dados
    await initializeDatabase();
    console.log('Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    // Continuamos mesmo se houver erro, pois pode ser um problema temporário
    // ou o usuário pode configurar mais tarde nas definições
  }
  
  // Renderiza a aplicação
  createRoot(document.getElementById("root")!).render(<App />);
}

startApp();
