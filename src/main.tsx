
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeDatabase, getDatabaseConnectionStatus } from './services/database';
import ErrorBoundary from './components/ErrorBoundary.tsx';

// Log to help debug initialization
console.log('=== APPLICATION STARTUP SEQUENCE ===');
console.log('Environment variables loaded:', {
  MONGODB_URI: import.meta.env.VITE_MONGODB_URI ? 'Set (masked)' : 'Not set',
  DB_NAME: import.meta.env.VITE_MONGODB_DB_NAME || 'Using default'
});

// Initialize the database before rendering the application
async function startApp() {
  console.log('=== START APP FUNCTION CALLED ===');
  
  // Render the application immediately to show at least the loading screen
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("CRITICAL ERROR: Root element not found!");
    return;
  }
  
  console.log('Rendering initial app with loading state and error boundary...');
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  
  try {
    // Try to initialize the database connection
    console.log('Attempting database initialization...');
    await initializeDatabase();
    console.log('Database initialization completed successfully');
    
    // Double-check connection status
    const status = getDatabaseConnectionStatus();
    console.log('Connection status after initialization:', status);
  } catch (error) {
    console.error('ERROR DURING DATABASE INITIALIZATION:', error);
    // The interface will handle the connection error through DatabaseContext
  }
}

// Add a visible console message before starting
console.log('=== APPLICATION STARTUP TRIGGERED ===');
startApp().catch(err => {
  console.error('FATAL ERROR DURING APPLICATION START:', err);
});
