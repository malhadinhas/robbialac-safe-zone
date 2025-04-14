import api from '@/lib/api';

export interface Medal {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  dateEarned?: string;
  category: string;
  acquired?: boolean;
  acquiredDate?: string;
  image?: string;
  requiredPoints?: number;
}

// Medalhas de exemplo baseadas nas imagens disponíveis
const sampleMedals: Medal[] = [
  // Medalhas já conquistadas (exemplos)
  {
    id: "1",
    name: "Observador Iniciante",
    description: "Completou o treinamento básico de observação de riscos",
    imageSrc: "/src/assets/medals/observador-iniciante.png",
    category: "observacao",
    acquired: true,
    acquiredDate: "2024-03-10",
    requiredPoints: 100
  },
  {
    id: "2",
    name: "Vigilante Ativo",
    description: "Reportou 5 situações potencialmente perigosas",
    imageSrc: "/src/assets/medals/vigilante-ativo.png",
    category: "seguranca",
    acquired: true,
    acquiredDate: "2024-03-20",
    requiredPoints: 200
  },
  // Medalhas a conquistar (próximas conquistas)
  {
    id: "3",
    name: "Vigilante Dedicado",
    description: "Reportou 10 situações potencialmente perigosas",
    imageSrc: "/src/assets/medals/vigilante-dedicado.png",
    category: "seguranca",
    acquired: false,
    requiredPoints: 350
  },
  {
    id: "4",
    name: "Observador Consistente",
    description: "Identificou 15 riscos no ambiente de trabalho",
    imageSrc: "/src/assets/medals/observador-consistente.png",
    category: "observacao",
    acquired: false,
    requiredPoints: 450
  },
  {
    id: "5",
    name: "Guardião da Prevenção",
    description: "Contribuiu para 30 dias sem acidentes na fábrica",
    imageSrc: "/src/assets/medals/guardiao-prevencao.png",
    category: "seguranca",
    acquired: false,
    requiredPoints: 550
  },
  {
    id: "6",
    name: "Sentinela da Segurança",
    description: "Líder em conscientização sobre segurança no trabalho",
    imageSrc: "/src/assets/medals/sentinela-seguranca.png",
    category: "lideranca",
    acquired: false,
    requiredPoints: 650
  },
  {
    id: "7",
    name: "Guardião da Produção",
    description: "Manteve práticas seguras durante alta produção",
    imageSrc: "/src/assets/medals/guardiao-producao.png",
    category: "producao",
    acquired: false,
    requiredPoints: 700
  },
  {
    id: "8",
    name: "Especialista Operacional",
    description: "Domina os procedimentos de segurança operacional",
    imageSrc: "/src/assets/medals/especialista-operacional.png",
    category: "operacoes",
    acquired: false,
    requiredPoints: 800
  },
  {
    id: "9",
    name: "Líder em Segurança",
    description: "Referência em liderança para práticas seguras",
    imageSrc: "/src/assets/medals/lider-seguranca.png",
    category: "lideranca",
    acquired: false,
    requiredPoints: 900
  },
  {
    id: "10",
    name: "Mestre em Prevenção",
    description: "Desenvolveu novas técnicas de prevenção de acidentes",
    imageSrc: "/src/assets/medals/mestre-prevencao.png",
    category: "prevencao",
    acquired: false,
    requiredPoints: 1000
  },
  {
    id: "11",
    name: "Lenda da Segurança",
    description: "Contribuição excepcional para a cultura de segurança",
    imageSrc: "/src/assets/medals/lenda-seguranca.png",
    category: "legado",
    acquired: false,
    requiredPoints: 1500
  }
];

// Níveis adiconais de medalhas para aumentar o catálogo (não mostrados inicialmente)
const advancedMedals: Medal[] = [
  {
    id: "12",
    name: "Analista de Riscos",
    description: "Especializado na identificação e mitigação de riscos",
    imageSrc: "/src/assets/medals/analista-riscos.png",
    category: "analise",
    acquired: false,
    requiredPoints: 1200
  },
  {
    id: "13",
    name: "Especialista em Riscos",
    description: "Domínio avançado em gestão de riscos operacionais",
    imageSrc: "/src/assets/medals/especialista-riscos.png",
    category: "analise",
    acquired: false,
    requiredPoints: 1300
  },
  {
    id: "14",
    name: "Mestre em Análise de Riscos",
    description: "Autoridade em análise e eliminação de riscos",
    imageSrc: "/src/assets/medals/mestre-riscos.png",
    category: "analise",
    acquired: false,
    requiredPoints: 1400
  },
  {
    id: "15",
    name: "Analista Detalhista",
    description: "Excelência em identificação de detalhes críticos de segurança",
    imageSrc: "/src/assets/medals/analista-detalhista.png",
    category: "detalhe",
    acquired: false,
    requiredPoints: 1250
  },
  {
    id: "16",
    name: "Especialista em Detalhes",
    description: "Especialista na observação de pequenos riscos negligenciados",
    imageSrc: "/src/assets/medals/especialista-detalhes.png",
    category: "detalhe",
    acquired: false,
    requiredPoints: 1350
  },
  {
    id: "17",
    name: "Mestre em Operações Seguras",
    description: "Revolucionou os padrões de segurança operacional",
    imageSrc: "/src/assets/medals/mestre-operacoes.png",
    category: "operacoes",
    acquired: false,
    requiredPoints: 1600
  },
  {
    id: "18",
    name: "Autoridade em Prevenção",
    description: "Reconhecido como autoridade máxima em prevenção",
    imageSrc: "/src/assets/medals/autoridade-prevencao.png",
    category: "prevencao",
    acquired: false,
    requiredPoints: 1700
  }
];

// Combina todas as medalhas
const allSampleMedals = [...sampleMedals, ...advancedMedals];

/**
 * Busca todas as medalhas do usuário especificado
 * @param userId ID do usuário
 * @returns Uma lista de medalhas conquistadas pelo usuário
 */
export async function getUserMedals(userId?: string): Promise<Medal[]> {
  try {
    if (!userId) {
      // Se não tiver userId, tenta obter do localStorage
      const user = JSON.parse(localStorage.getItem('robbialac_user') || '{}');
      userId = user?.id;
    }
    
    if (!userId) {
      console.warn('Tentativa de buscar medalhas sem usuário autenticado');
      return getDefaultAcquiredMedals();
    }
    
    try {
      const response = await api.get(`/medals/user/${userId}`);
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      
      // Se não há medalhas na resposta, retorna medalhas padrão
      return getDefaultAcquiredMedals();
    } catch (error) {
      console.warn('Erro ao buscar medalhas da API, usando dados de exemplo:', error);
      return getDefaultAcquiredMedals();
    }
  } catch (error) {
    console.error('Erro ao buscar medalhas:', error);
    // Retorna as medalhas de exemplo em caso de erro
    return getDefaultAcquiredMedals();
  }
}

/**
 * Retorna medalhas padrão para utilizadores novos
 */
function getDefaultAcquiredMedals(): Medal[] {
  return [
    {
      id: "1",
      name: "Observador Iniciante",
      description: "Completou o treinamento básico de observação de riscos",
      imageSrc: "/src/assets/medals/observador-iniciante.png",
      category: "observacao",
      acquired: true,
      acquiredDate: new Date().toISOString().split('T')[0],
      requiredPoints: 0
    }
  ];
}

/**
 * Busca todas as medalhas disponíveis no sistema
 * @returns Uma lista de todas as medalhas
 */
export async function getAllMedals(): Promise<Medal[]> {
  try {
    const response = await api.get('/medals');
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    // Se não houver dados, use os dados de exemplo
    return allSampleMedals;
  } catch (error) {
    console.error('Erro ao buscar todas as medalhas:', error);
    // Retorna os dados de exemplo em caso de erro
    return allSampleMedals;
  }
}

/**
 * Busca medalhas não conquistadas por um usuário
 * @param userId ID do usuário
 * @returns Uma lista de medalhas não conquistadas
 */
export async function getUnacquiredMedals(userId?: string): Promise<Medal[]> {
  try {
    if (!userId) {
      const user = JSON.parse(localStorage.getItem('robbialac_user') || '{}');
      userId = user?.id;
    }
    
    if (!userId) {
      console.warn('Tentativa de buscar medalhas sem usuário');
      return getDefaultUnacquiredMedals();
    }
    
    try {
      const response = await api.get(`/medals/user/${userId}/unacquired`);
      
      // Verifica se a resposta tem dados, se é um array e se não está vazio
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log(`Medalhas não conquistadas recebidas da API para ${userId}:`, response.data.length);
        return response.data;
      }
      
      // Se a API retornou vazia (ou não era array), usa o padrão
      console.warn(`API retornou medalhas não conquistadas vazias ou inválidas para ${userId}, usando padrão.`);
      return getDefaultUnacquiredMedals();
      
    } catch (error) {
      console.warn(`Erro ao buscar medalhas não conquistadas da API para ${userId}, usando dados de exemplo:`, error);
      return getDefaultUnacquiredMedals();
    }
  } catch (error) {
    console.error('Erro geral ao buscar medalhas não conquistadas:', error);
    return getDefaultUnacquiredMedals();
  }
}

/**
 * Retorna medalhas não conquistadas padrão para utilizadores novos
 */
function getDefaultUnacquiredMedals(): Medal[] {
  console.log("Retornando lista padrão de medalhas não conquistadas.");
  return [
    {
      id: "3",
      name: "Vigilante Dedicado",
      description: "Reportou 10 situações potencialmente perigosas",
      imageSrc: "/src/assets/medals/vigilante-dedicado.png",
      category: "seguranca",
      acquired: false,
      requiredPoints: 100
    },
    {
      id: "4",
      name: "Observador Consistente",
      description: "Identificou 15 riscos no ambiente de trabalho",
      imageSrc: "/src/assets/medals/observador-consistente.png",
      category: "observacao",
      acquired: false,
      requiredPoints: 200
    },
    {
      id: "5",
      name: "Guardião da Prevenção",
      description: "Contribuiu para 30 dias sem acidentes na fábrica",
      imageSrc: "/src/assets/medals/guardiao-prevencao.png",
      category: "seguranca",
      acquired: false,
      requiredPoints: 300
    }
  ];
} 