import api from '@/lib/api';
import { Sensibilizacao } from '@/types';
import { toast } from 'react-hot-toast';

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
    const response = await api.post('/sensibilizacao', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao criar documento de sensibilização:", error);
    throw new Error('Falha ao criar documento de sensibilização');
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