import api from '@/lib/api';
import { Sensibilizacao } from '@/types';
import { toast } from "sonner";

// Buscar todos os documentos de sensibilização
export const getSensibilizacoes = async (): Promise<Sensibilizacao[]> => {
  try {
    const response = await api.get('/sensibilizacao');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar documentos de sensibilização:", error);
    throw new Error('Falha ao buscar documentos de sensibilização');
  }
};

// Buscar um documento de sensibilização específico por ID
export const getSensibilizacaoById = async (id: string): Promise<Sensibilizacao> => {
  try {
    const response = await api.get(`/sensibilizacao/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar documento de sensibilização ${id}:`, error);
    throw new Error('Falha ao buscar o documento de sensibilização');
  }
};

// Criar um novo documento de sensibilização
export const createSensibilizacao = async (formData: FormData): Promise<Sensibilizacao> => {
  try {
    console.log("Enviando dados para sensibilização");
    
    // Verificar token de autenticação
    const token = localStorage.getItem('robbialac_token');
    console.log("Token de autenticação presente");
    
    const response = await api.post('/sensibilizacao', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    toast.success("Documento de sensibilização adicionado com sucesso");
    return response.data;
  } catch (error) {
    console.error("Erro detalhado ao criar documento de sensibilização:", error);
    // Se o erro for uma resposta da API, mostrar detalhes
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Dados:", error.response.data);
      
      // Verificar se é erro de autenticação
      if (error.response.status === 403 || error.response.status === 401) {
        toast.error("Sem permissão para adicionar documentos de sensibilização. Verifique se está autenticado com as permissões adequadas.");
      } else {
        toast.error(`Erro ao criar documento de sensibilização: ${error.response.data?.message || 'Erro desconhecido'}`);
      }
    } else {
      toast.error("Erro ao criar documento de sensibilização. Verifique a conexão.");
    }
    throw error;
  }
};

// Atualizar um documento de sensibilização existente
export const updateSensibilizacao = async (id: string, formData: FormData): Promise<Sensibilizacao> => {
  try {
    const response = await api.put(`/sensibilizacao/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar documento de sensibilização ${id}:`, error);
    throw new Error('Falha ao atualizar documento de sensibilização');
  }
};

// Excluir um documento de sensibilização
export const deleteSensibilizacao = async (id: string): Promise<void> => {
  try {
    await api.delete(`/sensibilizacao/${id}`);
  } catch (error) {
    console.error(`Erro ao excluir documento de sensibilização ${id}:`, error);
    throw new Error('Falha ao excluir documento de sensibilização');
  }
}; 