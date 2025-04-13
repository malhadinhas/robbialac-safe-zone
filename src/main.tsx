import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary.tsx';

// Log to help debug initialization
console.log('=== APPLICATION STARTUP SEQUENCE ===');

// Initialize the application
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
    
<<<<<<< HEAD
    console.log('Rendering app with error boundary...');
=======
    console.log('Rendering initial app with loading state and error boundary...');
    
    // Try to initialize the database connection
    console.log('Attempting database initialization...');
    
    try {
      await initializeDatabase();
      console.log('Database initialization completed successfully');
      
      // Double-check connection status
      const status = getDatabaseConnectionStatus();
      console.log('Connection status after initialization:', status);
      
      if (!status.connected && status.error) {
        console.warn('Database connection issue detected but continuing app startup:', status.error);
      }
    } catch (dbError) {
      // Log the error but continue rendering the app
      // The DatabaseContext will handle this error and display it to the user
      console.error('ERROR DURING DATABASE INITIALIZATION (but continuing):', dbError);
    }
>>>>>>> 247e54d8cf2ab37cc17bb28c5cb119e9bc6c7393
    
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
          <pre style="background:#f5f5f5;padding:10px;overflow:auto;max-height:300px;margin-top:10px;">
            ${error instanceof Error ? (error.stack || error.message) : String(error)}
          </pre>
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
