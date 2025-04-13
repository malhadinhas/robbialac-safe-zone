
import { User, Medal } from "@/types";
import { getCollection } from "./database";
import { compare, hash } from "bcrypt";

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const collection = await getCollection<User & { password?: string }>("users");
    const user = await collection.findOne({ email });
    
    if (!user) return null;
    
    // Remover senha antes de retornar para o cliente
    const { password, ...userWithoutPassword } = user;
    
    return {
      ...userWithoutPassword,
      medals: (userWithoutPassword.medals || []).map(medal => ({
        ...medal,
        acquiredDate: medal.acquiredDate ? new Date(medal.acquiredDate) : undefined
      }))
    } as User;
  } catch (error) {
    console.error("Erro ao buscar usuário por email:", error);
    throw error;
  }
}

export async function validateUser(email: string, password: string): Promise<User | null> {
  try {
    const collection = await getCollection<User & { password: string }>("users");
    const user = await collection.findOne({ email });
    
    if (!user) return null;
    
    // Usa bcrypt para comparar as senhas de forma segura
    const isValid = await compare(password, user.password);
    
    if (!isValid) return null;
    
    // Remove a senha antes de retornar o usuário
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      ...userWithoutPassword,
      medals: (userWithoutPassword.medals || []).map(medal => ({
        ...medal,
        acquiredDate: medal.acquiredDate ? new Date(medal.acquiredDate) : undefined
      }))
    } as User;
  } catch (error) {
    console.error("Erro ao validar usuário:", error);
    return null;
  }
}

export async function createUser(userData: Omit<User, "id"> & { password: string }): Promise<User> {
  try {
    const collection = await getCollection("users");
    
    // Verifica se o email já está em uso
    const existingUser = await collection.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error("Email já está em uso");
    }
    
    // Gera hash da senha
    const passwordHash = await hash(userData.password, 10);
    
    const newUser = {
      ...userData,
      id: crypto.randomUUID(),
      password: passwordHash,
      medals: [],
      viewedVideos: [],
      reportedIncidents: []
    };
    
    await collection.insertOne(newUser);
    
    // Remove a senha antes de retornar
    const { password, ...userWithoutPassword } = newUser;
    
    return userWithoutPassword as User;
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
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
    const collection = await getCollection<Medal>("medals");
    const medals = await collection.find({}).toArray();
    return medals.map(medal => ({
      ...medal,
      acquiredDate: medal.acquiredDate ? new Date(medal.acquiredDate) : undefined
    }));
  } catch (error) {
    console.error("Erro ao buscar medalhas:", error);
    throw error;
  }
}

export async function createAdminUser(): Promise<void> {
  try {
    const collection = await getCollection("users");
    const adminEmail = "admin@robbialac.pt";
    
    // Verifica se já existe um admin
    const existingAdmin = await collection.findOne({ email: adminEmail });
    if (existingAdmin) {
      return; // Admin já existe, não precisa criar
    }
    
    // Cria um usuário admin inicial
    const adminPassword = await hash("Admin@123", 10);
    const adminUser = {
      id: crypto.randomUUID(),
      email: adminEmail,
      password: adminPassword,
      name: "Administrador",
      role: "admin_app",
      points: 0,
      level: 1,
      medals: [],
      viewedVideos: [],
      reportedIncidents: []
    };
    
    await collection.insertOne(adminUser);
    console.log("Usuário administrador criado com sucesso");
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
  }
}
