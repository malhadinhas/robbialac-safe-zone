import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n'; // Importa a configuração do i18next
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { initializeDatabase, getDatabaseConnectionStatus } from './config/database';

// Initialize the application
async function startApp() {
  try {
    // Get root element
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      document.body.innerHTML = "<div style='color:red;padding:20px;'>Error: Root element not found</div>";
      return;
    }
    
    // Try to initialize the database connection
    try {
      await initializeDatabase();
      
      // Double-check connection status
      const status = getDatabaseConnectionStatus();
      
      if (!status.connected && status.error) {
        // The DatabaseContext will handle this error and display it to the user
      }
    } catch (dbError) {
      // The DatabaseContext will handle this error and display it to the user
    }
    
    ReactDOM.createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (error) {
    // Try to render an error message on the page
    try {
      document.body.innerHTML = `
        <div style="padding: 20px; color: red; font-family: sans-serif;">
          <h1>Critical Error</h1>
          <p>The application failed to start: ${error instanceof Error ? error.message : String(error)}</p>
          <pre style="background:#f5f5f5;padding:10px;overflow:auto;max-height:300px;margin-top:10px;">
            ${error instanceof Error ? (error.stack || error.message) : String(error)}
          </pre>
        </div>
      `;
    } catch (e) {
      // Last resort
    }
  }
}

startApp().catch(err => {
});
