
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
  
  try {
    // Get root element
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      console.error("CRITICAL ERROR: Root element not found!");
      document.body.innerHTML = "<div style='color:red;padding:20px;'>Error: Root element not found</div>";
      return;
    }
    
    console.log('Rendering initial app with loading state and error boundary...');
    
    // Try to initialize the database connection
    console.log('Attempting database initialization...');
    
    try {
      await initializeDatabase();
      console.log('Database initialization completed successfully');
      
      // Double-check connection status
      const status = getDatabaseConnectionStatus();
      console.log('Connection status after initialization:', status);
    } catch (dbError) {
      // Log the error but continue rendering the app
      // The DatabaseContext will handle this error and display it to the user
      console.error('ERROR DURING DATABASE INITIALIZATION (but continuing):', dbError);
    }
    
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    console.log('=== APP SUCCESSFULLY RENDERED ===');
  } catch (error) {
    console.error('FATAL ERROR DURING APPLICATION START:', error);
    // Try to render an error message on the page
    try {
      document.body.innerHTML = `
        <div style="padding: 20px; color: red; font-family: sans-serif;">
          <h1>Critical Error</h1>
          <p>The application failed to start: ${error instanceof Error ? error.message : String(error)}</p>
        </div>
      `;
    } catch (e) {
      // Last resort
      console.error('Could not even render error message:', e);
    }
  }
}

// Add a visible console message before starting
console.log('=== APPLICATION STARTUP TRIGGERED ===');
startApp().catch(err => {
  console.error('FATAL ERROR DURING APPLICATION START:', err);
});
