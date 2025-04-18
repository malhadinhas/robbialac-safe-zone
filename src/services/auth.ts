import { User, UserRole } from "@/types";
import { getUserByEmail, validateUser } from "./userService";

// Remover usuários mockados
/*
const mockUsers = [
  {
    id: "1",
    email: "joao.malhadinhas@robbialac.pt",
    password: "Sara2010",
    name: "João Malhadinhas",
    role: "admin_app" as UserRole,
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
    role: "admin_qa" as UserRole,
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
    role: "user" as UserRole,
    points: 320,
    level: 1,
    medals: [],
    viewedVideos: [],
    reportedIncidents: []
  }
];
*/

export async function loginUser(email: string, password: string): Promise<User | null> {
  // Simular atraso de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Verificar se o email tem o domínio @robbialac.pt
  if (!email.endsWith('@robbialac.pt')) {
    throw new Error('Apenas emails @robbialac.pt são permitidos');
  }
  
  // Chamar validateUser que agora retorna { user, token } ou null
  const validationResult = await validateUser(email, password);
  
  if (!validationResult) {
    return null;
  }
  
  // Extrair user e token
  const { user, token } = validationResult;
  
  // --- ARMAZENAR O TOKEN --- 
  localStorage.setItem('token', token); 
  console.log("[authService] Token stored in localStorage."); // Log para confirmar
  // ------------------------

  // Salvar informações do usuário no localStorage
  localStorage.setItem('robbialac_user', JSON.stringify(user));
  
  // Retornar apenas o usuário para o AuthContext
  return user;
}

export function logoutUser(): void {
  localStorage.removeItem('robbialac_user');
}

export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('robbialac_user');
  if (!userJson) {
    return null;
  }
  
  return JSON.parse(userJson) as User;
}

export function isAuthenticated(): boolean {
  return !!getCurrentUser();
}

export function hasRole(role: UserRole | UserRole[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
}
