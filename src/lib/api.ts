import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  // ---- REMOVER DEBUG LOG ----
  // console.log(`[API Interceptor] Making request to: ${config.url}`);
  // console.log(`[API Interceptor] Token from localStorage: ${token ? token.substring(0, 10) + '...' : 'NULL'}`);
  // ---- END DEBUG LOG ----
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Token expirado ou inválido
        localStorage.removeItem('token');
        // Comentado para não redirecionar durante desenvolvimento
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
    } else {
      // Algo aconteceu na configuração da requisição
    }
    return Promise.reject(error);
  }
);

// Funções de API
export const apiService = {
  // Autenticação
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Vídeos
  getVideos: async () => {
    const response = await api.get('/videos');
    return response.data;
  },

  getVideoById: async (id: string) => {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  createVideo: async (videoData: any) => {
    const response = await api.post('/videos', videoData);
    return response.data;
  },

  updateVideo: async (id: string, videoData: any) => {
    const response = await api.put(`/videos/${id}`, videoData);
    return response.data;
  },

  deleteVideo: async (id: string) => {
    const response = await api.delete(`/videos/${id}`);
    return response.data;
  },

  incrementVideoViews: async (id: string) => {
    const response = await api.post(`/videos/${id}/views`);
    return response.data;
  },

  // Health Check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default api; 