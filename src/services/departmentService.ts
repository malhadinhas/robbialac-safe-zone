import api from '@/lib/api';
import { Department } from '@/types/department';

export interface DepartmentWithEmployees extends Department {
  employeeCount: number;
  label: string;
}

/**
 * Busca todos os departamentos disponíveis
 * @returns Uma lista de departamentos com valor e rótulo
 */
export const getDepartments = async (): Promise<Department[]> => {
  try {
    const response = await api.get('/departments');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error);
    throw new Error('Falha ao buscar departamentos');
  }
};

/**
 * Busca um departamento específico pelo ID
 * @param id ID do departamento
 * @returns O departamento encontrado ou null
 */
export async function getDepartmentById(id: string): Promise<Department | null> {
  try {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Mock data - será substituído pela API real
const mockDepartments: DepartmentWithEmployees[] = [
  {
    id: '1',
    name: 'Operações',
    color: '#FF4B4B',
    employeeCount: 40,
    label: 'Operações'
  },
  {
    id: '2',
    name: 'Marketing',
    color: '#4CAF50',
    employeeCount: 15,
    label: 'Marketing'
  },
  {
    id: '3',
    name: 'Recursos Humanos',
    color: '#2196F3',
    employeeCount: 20,
    label: 'Recursos Humanos'
  },
  {
    id: '4',
    name: 'Direção',
    color: '#9C27B0',
    employeeCount: 10,
    label: 'Direção'
  },
  {
    id: '5',
    name: 'Financeira',
    color: '#FF9800',
    employeeCount: 8,
    label: 'Financeira'
  },
  {
    id: '6',
    name: 'Comercial',
    color: '#607D8B',
    employeeCount: 5,
    label: 'Comercial'
  }
];

export async function getDepartmentsWithEmployees(): Promise<DepartmentWithEmployees[]> {
  try {
    const response = await api.get('/departments/with-employees');
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza o número de funcionários de um departamento
 */
export async function updateDepartmentEmployeeCount(department_Id: string, employeeCount: number): Promise<boolean> {
  try {
    await api.put(`/departments/${department_Id}/employee-count`, { employeeCount });
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém a meta de quase acidentes por departamento
 * @param department Departamento
 * @param targetPerEmployee Meta por funcionário (padrão: 5)
 * @returns Meta total para o departamento
 */
export function getDepartmentIncidentTarget(department: DepartmentWithEmployees, targetPerEmployee: number = 5): number {
  return department.employeeCount * targetPerEmployee;
}

/**
 * Obtém a configuração do sistema
 */
export async function getSystemConfig(): Promise<{ annualIncidentTargetPerEmployee: number }> {
  try {
    const response = await api.get('/system/config');
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza a meta anual de quase acidentes por funcionário
 */
export async function updateIncidentTargetPerEmployee(value: number): Promise<boolean> {
  try {
    await api.put('/system/config/incident-target', { annualIncidentTargetPerEmployee: value });
    return true;
  } catch (error) {
    throw error;
  }
} 