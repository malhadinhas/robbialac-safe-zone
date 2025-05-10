/**
 * Configuração para APIs
 */

// URL base para as chamadas de API
export const apiBaseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://api.robbialac-safezone.com' 
  : 'http://localhost:3000';

// Tempo limite padrão para chamadas de API em milissegundos
export const defaultTimeout = 10000; 