import api from '@/lib/api';

export interface Department {
  value: string;
  label: string;
}

/**
 * Busca todos os departamentos disponíveis
 * @returns Uma lista de departamentos com valor e rótulo
 */
export async function getDepartments(): Promise<Department[]> {
  try {
    const response = await api.get('/departments');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error);
    // Retorna uma lista vazia em caso de erro
    return [];
  }
}

/**
 * Busca um departamento específico pelo ID
 * @param id ID (value) do departamento
 * @returns O departamento encontrado ou null
 */
export async function getDepartmentById(id: string): Promise<Department | null> {
  try {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar departamento ${id}:`, error);
    return null;
  }
} 