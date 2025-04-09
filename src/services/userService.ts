import { User, Medal } from "@/types";
import { getCollection, initializeMockCollection } from "./database";
import { mockMedals } from "./mockData";

// Usuários mockados - retirado de auth.ts
const mockUsers = [
  {
    id: "1",
    email: "joao.malhadinhas@robbialac.pt",
    password: "Sara2010",
    name: "João Malhadinhas",
    role: "admin_app",
    points: 1200,
    level: 5,
    medals: [],
    viewedVideos: [],
    reportedIncidents: []
  },
  {
    id: "2",
    email: "ines.lopes@robbialac.pt",
    password: "Sara2010",
    name: "Inês Lopes",
    role: "admin_qa",
    points: 850,
    level: 3,
    medals: [],
    viewedVideos: [],
    reportedIncidents: []
  },
  {
    id: "3",
    email: "user@robbialac.pt",
    password: "Sara2010",
    name: "Usuário Teste",
    role: "user",
    points: 320,
    level: 1,
    medals: [],
    viewedVideos: [],
    reportedIncidents: []
  }
];

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    // Inicializa a coleção com dados mockados
    const usersWithoutPasswords = mockUsers.map(({ password, ...user }) => user);
    await initializeMockCollection("users", usersWithoutPasswords);
    
    const collection = await getCollection("users");
    const count = await collection.countDocuments();
    
    // Se não houver documentos, inicializa com os usuários mockados
    if (count === 0) {
      console.log("Inicializando coleção de usuários com dados mockados");
      // Remove as senhas antes de inserir no banco
      await collection.insertMany(usersWithoutPasswords);
    }
    
    const user = await collection.findOne<User>({ email });
    if (!user) return null;
    
    return {
      ...user,
      medals: user.medals.map(medal => ({
        ...medal,
        acquiredDate: medal.acquiredDate ? new Date(medal.acquiredDate) : undefined
      }))
    };
  } catch (error) {
    console.error("Erro ao buscar usuário por email:", error);
    // Em caso de erro, retorna o usuário dos dados mockados (sem a senha)
    const mockUser = mockUsers.find(u => u.email === email);
    if (!mockUser) return null;
    
    const { password, ...userWithoutPassword } = mockUser;
    return userWithoutPassword as User;
  }
}

export async function validateUser(email: string, password: string): Promise<User | null> {
  // Simular validação com os dados mockados (em produção, a senha estaria hasheada no banco)
  const mockUser = mockUsers.find(u => u.email === email && u.password === password);
  if (!mockUser) return null;
  
  // Busca o usuário atualizado no banco
  return getUserByEmail(email);
}

export async function updateUser(user: User): Promise<void> {
  try {
    const collection = await getCollection("users");
    const { id, ...dataToUpdate } = user;
    await collection.updateOne({ id }, { $set: dataToUpdate });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
}

export async function getAllMedals(): Promise<Medal[]> {
  try {
    const collection = await getCollection("medals");
    const count = await collection.countDocuments();
    
    // Se não houver documentos, inicializa com os dados mockados
    if (count === 0) {
      console.log("Inicializando coleção de medalhas com dados mockados");
      await collection.insertMany(mockMedals);
    }
    
    const medals = await collection.find<Medal>({}).toArray();
    return medals.map(medal => ({
      ...medal,
      acquiredDate: medal.acquiredDate ? new Date(medal.acquiredDate) : undefined
    }));
  } catch (error) {
    console.error("Erro ao buscar medalhas:", error);
    // Em caso de erro, retorna os dados mockados
    return mockMedals;
  }
}
