import { Video, Incident, Medal, StatsByCategory, StatsByZone, StatsBySeverity, Department, SystemConfig } from "@/types";

export const mockVideos: Video[] = [
  {
    id: "1",
    title: "Procedimentos de Segurança no Enchimento",
    description: "Este vídeo explica os procedimentos de segurança essenciais na área de enchimento.",
    url: "https://placeholder-video.mp4",
    thumbnail: "/placeholder.svg",
    duration: 320, // segundos
    category: "Segurança",
    zone: "Enchimento",
    uploadDate: new Date("2023-10-15"),
    views: 124,
    pointsForWatching: 50
  },
  {
    id: "2",
    title: "Qualidade na Linha de Produção",
    description: "Aprenda sobre os padrões de qualidade que devem ser seguidos na linha de produção.",
    url: "https://placeholder-video.mp4",
    thumbnail: "/placeholder.svg",
    duration: 450,
    category: "Qualidade",
    zone: "Fabrico",
    uploadDate: new Date("2023-09-22"),
    views: 98,
    pointsForWatching: 50
  },
  {
    id: "3",
    title: "Regras de Utilização de EPIs",
    description: "Guia completo sobre a utilização correta dos Equipamentos de Proteção Individual.",
    url: "https://placeholder-video.mp4",
    thumbnail: "/placeholder.svg",
    duration: 380,
    category: "Segurança",
    zone: "Enchimento",
    uploadDate: new Date("2023-11-05"),
    views: 156,
    pointsForWatching: 50
  },
  {
    id: "4",
    title: "Procedimentos de Emergência",
    description: "Instruções detalhadas sobre como agir em situações de emergência na fábrica.",
    url: "https://placeholder-video.mp4",
    thumbnail: "/placeholder.svg",
    duration: 520,
    category: "Procedimentos e Regras",
    zone: "Fabrico",
    uploadDate: new Date("2024-01-10"),
    views: 201,
    pointsForWatching: 60
  },
  {
    id: "5",
    title: "Manutenção Preventiva de Equipamentos",
    description: "Aprenda como realizar a manutenção preventiva básica dos equipamentos.",
    url: "https://placeholder-video.mp4",
    thumbnail: "/placeholder.svg",
    duration: 410,
    category: "Procedimentos e Regras",
    zone: "Enchimento",
    uploadDate: new Date("2024-02-18"),
    views: 87,
    pointsForWatching: 50
  },
  {
    id: "6",
    title: "Controle de Qualidade das Tintas",
    description: "Instruções detalhadas sobre o processo de controle de qualidade das tintas produzidas.",
    url: "https://placeholder-video.mp4",
    thumbnail: "/placeholder.svg",
    duration: 490,
    category: "Qualidade",
    zone: "Fabrico",
    uploadDate: new Date("2024-03-05"),
    views: 112,
    pointsForWatching: 60
  }
];

export const mockIncidents: Incident[] = [
  {
    id: "1",
    title: "Derrame de solvente na área de enchimento",
    description: "Pequeno derrame de solvente devido a uma válvula mal fechada. Área já limpa e isolada.",
    location: "Área de Enchimento - Setor A",
    date: new Date("2024-03-15"),
    reportedBy: "user@robbialac.pt",
    severity: "Médio",
    status: "Resolvido",
    images: ["/placeholder.svg"],
    adminNotes: "Válvula substituída e procedimento revisado.",
    resolution: "Substituição da válvula e treinamento da equipe.",
    pointsAwarded: 75,
    department: "Operações"
  },
  {
    id: "2",
    title: "Escada sem sinalização de segurança",
    description: "Escada de acesso ao mezanino sem fita antiderrapante e sinalização adequada.",
    location: "Fábrica - Mezanino B",
    date: new Date("2024-03-20"),
    reportedBy: "user@robbialac.pt",
    severity: "Baixo",
    status: "Em Análise",
    images: ["/placeholder.svg"],
    adminNotes: "Material já solicitado para manutenção.",
    pointsAwarded: 50,
    department: "Operações"
  },
  {
    id: "3",
    title: "Painel elétrico aberto",
    description: "Painel elétrico encontrado aberto próximo à linha de produção principal.",
    location: "Fábrica - Linha 2",
    date: new Date("2024-04-01"),
    reportedBy: "ines.lopes@robbialac.pt",
    severity: "Alto",
    status: "Reportado",
    images: ["/placeholder.svg"],
    pointsAwarded: 100,
    department: "Comercial"
  },
  {
    id: "4",
    title: "Equipamento sem trava de segurança",
    description: "Misturador da linha 3 com trava de segurança danificada.",
    location: "Enchimento - Linha 3",
    date: new Date("2024-04-05"),
    reportedBy: "joao.malhadinhas@robbialac.pt",
    severity: "Alto",
    status: "Em Análise",
    images: ["/placeholder.svg"],
    adminNotes: "Engenharia notificada para reparo urgente.",
    pointsAwarded: 100,
    department: "Financeira"
  }
];

export const mockMedals: Medal[] = [
  {
    id: "1",
    name: "Observador Iniciante",
    description: "Assistiu 5 vídeos de formação",
    image: "🎬",
    acquired: true,
    acquiredDate: new Date("2024-02-10")
  },
  {
    id: "2",
    name: "Vigilante da Segurança",
    description: "Reportou 3 quase acidentes",
    image: "🛡️",
    acquired: true,
    acquiredDate: new Date("2024-03-15")
  },
  {
    id: "3",
    name: "Mestre da Prevenção",
    description: "Completou todas as formações de segurança",
    image: "🏆",
    acquired: false
  },
  {
    id: "4",
    name: "Expert em Qualidade",
    description: "Assistiu a todos os vídeos da categoria Qualidade",
    image: "⭐",
    acquired: false
  },
  {
    id: "5",
    name: "Olho de Águia",
    description: "Reportou um quase acidente de alta gravidade",
    image: "🦅",
    acquired: true,
    acquiredDate: new Date("2024-03-22")
  }
];

export const mockStatsByCategory: StatsByCategory[] = [
  { category: "Segurança", count: 45, color: "#FF7A00" },
  { category: "Qualidade", count: 32, color: "#0071CE" },
  { category: "Procedimentos e Regras", count: 23, color: "#28a745" }
];

export const mockStatsByZone: StatsByZone[] = [
  { zone: "Enchimento", count: 37, color: "#0071CE" },
  { zone: "Fabrico", count: 53, color: "#FF7A00" },
  { zone: "Outra", count: 10, color: "#6c757d" }
];

export const mockStatsBySeverity: StatsBySeverity[] = [
  { severity: "Baixo", count: 15, color: "#ffc107" },
  { severity: "Médio", count: 8, color: "#fd7e14" },
  { severity: "Alto", count: 5, color: "#dc3545" }
];

export const mockDepartments: Department[] = [
  { name: "Comercial", employeeCount: 185, color: "#4e79a7" },
  { name: "Financeira", employeeCount: 19, color: "#f28e2c" },
  { name: "Marketing", employeeCount: 16, color: "#e15759" },
  { name: "Operações", employeeCount: 66, color: "#76b7b2" },
  { name: "Recursos Humanos", employeeCount: 5, color: "#59a14f" },
  { name: "Direção", employeeCount: 2, color: "#edc949" }
];

export const mockSystemConfig: SystemConfig = {
  annualIncidentTargetPerEmployee: 5
};
