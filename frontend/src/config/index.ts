/**
 * Exportações centralizadas de configuração
 */

// Importar configurações de API
import { apiBaseUrl, defaultTimeout } from './api';

// Exportar configurações renomeadas
export const API_BASE_URL = apiBaseUrl;
export const API_TIMEOUT = defaultTimeout;

// Re-exportar outras configurações conforme necessário
export * from './storage';
export * from './database'; 