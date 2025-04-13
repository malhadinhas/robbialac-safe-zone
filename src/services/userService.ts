import { User, Medal } from "@/types";

const API_URL = 'http://localhost:3000/api';

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/users/email/${email}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Erro ao buscar usuário por email:", error);
    return null;
  }
}

export async function validateUser(email: string, password: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Erro ao validar usuário:", error);
    return null;
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
    console.error("Erro ao criar usuário:", error);
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
    console.error("Erro ao atualizar usuário:", error);
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
    console.error("Erro ao buscar medalhas:", error);
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
    console.log("Usuário administrador criado com sucesso");
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
    throw error;
  }
}
