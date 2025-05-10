import api from '@/lib/api';
import { Accident } from '@/types';
import { toast } from "sonner";

// Buscar todos os documentos de acidentes
export const getAccidents = async (): Promise<Accident[]> => {
  try {
    const response = await api.get('/accidents');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar documentos de acidentes:", error);
    throw new Error('Falha ao buscar documentos de acidentes');
  }
};

// Buscar um documento de acidente específico por ID
export const getAccidentById = async (id: string): Promise<Accident> => {
  try {
    const response = await api.get(`/accidents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar documento de acidente ${id}:`, error);
    throw new Error('Falha ao buscar o documento de acidente');
  }
};

// Criar um novo documento de acidente
export const createAccident = async (formData: FormData): Promise<Accident> => {
  try {
    console.log("Enviando dados para criar acidente");
    // Adicionar token de autenticação
    const token = localStorage.getItem('robbialac_token');
    const response = await api.post('/accidents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
    });
    toast.success("Documento de acidente registado com sucesso!");
    return response.data;
  } catch (error) {
    console.error("Erro detalhado ao criar documento de acidente:", error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Dados:", error.response.data);
      if (error.response.status === 403 || error.response.status === 401) {
        toast.error("Sem permissão para adicionar acidentes. Verifique se está autenticado com as permissões adequadas.");
      } else {
        toast.error(`Erro ao criar acidente: ${error.response.data?.message || 'Erro desconhecido'}`);
      }
    } else {
      toast.error("Erro ao criar acidente. Verifique a conexão.");
    }
    throw error;
  }
};

// Atualizar um documento de acidente existente
export const updateAccident = async (id: string, formData: FormData): Promise<Accident> => {
  try {
    const response = await api.put(`/accidents/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar documento de acidente ${id}:`, error);
    throw new Error('Falha ao atualizar documento de acidente');
  }
};

// Apagar um documento de acidente
export const deleteAccident = async (id: string): Promise<void> => {
  try {
    await api.delete(`/accidents/${id}`);
  } catch (error) {
    console.error(`Erro ao apagar documento de acidente ${id}:`, error);
    throw new Error('Falha ao apagar documento de acidente');
  }
};

// --- Funções Adicionais (Exemplo: Upload de PDF) ---

// TODO: Implementar função para upload de PDF
// Esta função pode retornar a URL do PDF após o upload bem-sucedido.
// export const uploadAccidentPdf = async (file: File): Promise<{ url: string }> => {
//   const formData = new FormData();
//   formData.append('file', file);
//   try {
//     // TODO: Ajustar endpoint e lógica de upload
//     const response = await api.post('/accidents/upload-pdf', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     });
//     return response.data; // Ex: { url: "..." }
//   } catch (error) {
//     console.error("Erro ao fazer upload do PDF:", error);
//     throw new Error('Falha no upload do PDF');
//   }
// };

// Testar a rota de acidentes
export const testAccidentRoute = async (): Promise<any> => {
  try {
    const response = await api.get('/accidents-test');
    return response.data;
  } catch (error) {
    console.error('Erro ao testar rota de acidentes:', error);
    throw new Error('Falha ao testar rota de acidentes');
  }
};

// Testar a rota para criar departamento
export const testCreateDepartment = async (): Promise<any> => {
  try {
    const response = await api.post('/departments-test');
    return response.data;
  } catch (error) {
    console.error('Erro ao criar departamento de teste:', error);
    throw new Error('Falha ao criar departamento de teste');
  }
};

// Testar a rota para criar acidente
export const testCreateAccident = async (): Promise<any> => {
  try {
    const response = await api.post('/accidents-test');
    return response.data;
  } catch (error) {
    console.error('Erro ao criar acidente de teste:', error);
    throw new Error('Falha ao criar acidente de teste');
  }
}; 