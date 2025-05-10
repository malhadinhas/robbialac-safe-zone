import { User, UserRole } from "@/types";
import { getUserByEmail, validateUser, createUser } from "./userService";

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
  
  // Chamar validateUser que agora retorna { user, token } ou null
  const validationResult = await validateUser(email, password);
  
  if (!validationResult) {
    return null;
  }
  
  // Extrair user e token
  const { user, token } = validationResult;
  
  // --- ARMAZENAR O TOKEN --- 
  localStorage.setItem('token', token); 
  // ------------------------

  // Salvar informações do usuário no localStorage
  localStorage.setItem('robbialac_user', JSON.stringify(user));
  
  // Retornar apenas o usuário para o AuthContext
  return user;
}

export function logoutUser(): void {
  localStorage.removeItem('robbialac_user');
  localStorage.removeItem('token');
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

export async function registerUser(email: string, password: string, name: string): Promise<void> {
  // Validar força da senha
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error('A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais');
  }

  // Chamar o endpoint correto do backend para enviar o código
  const response = await fetch('http://localhost:3000/api/auth/send-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'Erro ao enviar código de verificação');
  }
}

export async function verifyCodeAndRegister(email: string, code: string): Promise<{ user: User, token: string }> {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'Erro ao verificar código');
  }

  return response.json();
}
