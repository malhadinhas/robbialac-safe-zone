import api from '@/lib/api';

interface ActivityRegistration {
  userId: string;
  category: 'video' | 'incident' | 'training';
  activityId: string;
  points: number;
  details?: any;
}

interface ActivityResponse {
  message: string;
  activityId: string;
  points: number;
}

/**
 * Registra uma atividade de usuário e seus pontos
 * @param data Dados da atividade
 * @returns Resposta da API
 */
export async function registerActivity(data: ActivityRegistration): Promise<ActivityResponse> {
  try {
    const response = await api.post('/activities', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
    throw error;
  }
}

/**
 * Registra que um usuário assistiu um vídeo
 * @param userId ID do usuário
 * @param videoId ID do vídeo
 * @param points Pontos a receber
 * @returns Resposta da API
 */
export async function registerVideoView(
  userId: string, 
  videoId: string, 
  points: number = 50
): Promise<ActivityResponse> {
  return registerActivity({
    userId,
    category: 'video',
    activityId: videoId,
    points,
    details: { type: 'view' }
  });
}

/**
 * Registra um reporte de incidente pelo usuário
 * @param userId ID do usuário
 * @param incidentId ID do incidente
 * @param severity Severidade do incidente (baixa, média, alta)
 * @param hasEvidence Se tem evidência fotográfica
 * @returns Resposta da API
 */
export async function registerIncidentReport(
  userId: string,
  incidentId: string,
  severity: 'baixa' | 'média' | 'alta',
  hasEvidence: boolean = false
): Promise<ActivityResponse> {
  // Determinar pontos baseado na severidade
  let points = 50; // severidade baixa
  if (severity === 'média') points = 75;
  if (severity === 'alta') points = 100;
  
  // Adicionar pontos extras por evidência
  if (hasEvidence) points += 25;
  
  return registerActivity({
    userId,
    category: 'incident',
    activityId: incidentId,
    points,
    details: { severity, hasEvidence }
  });
}

/**
 * Registra a conclusão de um treinamento pelo usuário
 * @param userId ID do usuário
 * @param trainingId ID do treinamento
 * @param isFullCourse Se é um curso completo
 * @returns Resposta da API
 */
export async function registerTrainingCompletion(
  userId: string,
  trainingId: string,
  isFullCourse: boolean = false
): Promise<ActivityResponse> {
  // Cursos completos dão mais pontos
  const points = isFullCourse ? 100 : 75;
  
  return registerActivity({
    userId,
    category: 'training',
    activityId: trainingId,
    points,
    details: { isFullCourse }
  });
}

/**
 * Obtém o histórico de atividades de um usuário
 * @param userId ID do usuário
 * @param limit Limite de resultados
 * @returns Lista de atividades
 */
export async function getUserActivities(userId: string, limit: number = 10): Promise<any[]> {
  try {
    const response = await api.get(`/activities/user/${userId}?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar atividades do usuário:', error);
    return [];
  }
} 