import { User, Medal } from "@/types";

const API_URL = 'http://localhost:3000/api';

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/users/email/${email}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    throw error;
  }
}

export async function validateUser(email: string, password: string): Promise<{ user: User, token: string } | null> {
  try {
    console.log(`[userService] Making login request for email: ${email}`);
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error("Erro na validação:", response.status, errorData);
      } catch (e) {
        console.error("Erro na validação e ao ler corpo do erro:", response.status);
      }
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.user && data.token) {
      return { user: data.user as User, token: data.token as string };
    } else {
      console.error("Resposta da API de login inesperada:", data);
      return null;
    }

  } catch (error) {
    console.error("Erro de rede ou outro erro em validateUser:", error);
    throw error;
  }
}

export async function createUser(userData: Omit<User, "id"> & { password: string }): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar usuário');
    }
    return response.json();
  } catch (error) {
    throw error;
  }
}

export async function updateUser(user: User): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar usuário');
    }
  } catch (error) {
    throw error;
  }
}

export async function getAllMedals(): Promise<Medal[]> {
  try {
    const response = await fetch(`${API_URL}/medals`);
    if (!response.ok) {
      throw new Error('Erro ao buscar medalhas');
    }
    return response.json();
  } catch (error) {
    throw error;
  }
}

export async function createAdminUser(): Promise<void> {
  try {
    await createUser({
      email: "admin@robbialac.pt",
      password: "Admin@123",
      name: "Administrador",
      role: "admin_app",
      points: 0,
      level: 1,
      medals: [],
      viewedVideos: [],
      reportedIncidents: []
    });
  } catch (error) {
    throw error;
  }
}
