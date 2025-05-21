
import { toast } from "sonner";
import { Incident } from "@/types";
import { createIncident } from "./incidentService";

// Interface para representar o estado de uma conversa no WhatsApp
interface WhatsAppConversation {
  phoneNumber: string;
  currentStep: string;
  incidentData: Partial<Incident>;
  lastMessageTime: Date;
}

// Esta classe seria um mock do que precisaria ser implementado no backend
export class WhatsAppIntegrationService {
  private static instance: WhatsAppIntegrationService;
  private isEnabled: boolean = false;
  private conversations: Map<string, WhatsAppConversation> = new Map();
  
  private constructor() {}
  
  public static getInstance(): WhatsAppIntegrationService {
    if (!WhatsAppIntegrationService.instance) {
      WhatsAppIntegrationService.instance = new WhatsAppIntegrationService();
    }
    return WhatsAppIntegrationService.instance;
  }
  
  public enableIntegration(enabled: boolean): boolean {
    // Em uma implementação real, isso faria uma chamada para API
    // para ativar/desativar a integração no servidor
    this.isEnabled = enabled;
    return true;
  }
  
  public isIntegrationEnabled(): boolean {
    return this.isEnabled;
  }
  
  public async testConnection(): Promise<boolean> {
    // Em uma implementação real, isso testaria a conexão com a API do WhatsApp
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 2000);
    });
  }
  
  public async fetchRecentConversations(): Promise<WhatsAppConversation[]> {
    // Em uma implementação real, isso buscaria conversas recentes da API
    return Array.from(this.conversations.values());
  }
  
  // Este método seria chamado pelo backend quando uma mensagem for recebida
  public async handleIncomingMessage(
    phoneNumber: string, 
    message: string
  ): Promise<string> {
    if (!this.isEnabled) {
      return "Integração desativada";
    }
    
    let conversation = this.conversations.get(phoneNumber);
    if (!conversation) {
      // Nova conversa
      conversation = {
        phoneNumber,
        currentStep: "GREETING",
        incidentData: {},
        lastMessageTime: new Date()
      };
      this.conversations.set(phoneNumber, conversation);
      return "Olá! Obrigado por contribuir para a segurança. Vamos registrar um quase acidente. Para começar, qual é o seu nome?";
    }
    
    // Atualiza o timestamp da última mensagem
    conversation.lastMessageTime = new Date();
    
    // Processa a mensagem baseado no passo atual (similar ao ChatbotModal)
    switch (conversation.currentStep) {
      case "GREETING":
        conversation.incidentData.reporterName = message;
        conversation.currentStep = "DATE";
        return "Obrigado! Em que data ocorreu o quase acidente? (Formato: DD/MM/AAAA)";
      
      // Implementaria passos similares ao ChatbotModal...
      
      case "CONFIRMATION":
        if (message.toLowerCase().includes("confirmar")) {
          // Cria o incidente
          const incident = conversation.incidentData as Incident;
          try {
            await createIncident(incident);
            this.conversations.delete(phoneNumber); // Limpa a conversa
            return "Quase acidente registrado com sucesso! Obrigado por contribuir para a segurança de todos.";
          } catch (error) {
            return "Erro ao registrar o quase acidente. Por favor, tente novamente mais tarde.";
          }
        } else {
          this.conversations.delete(phoneNumber);
          return "Registro cancelado. Envie 'Olá' para começar novamente.";
        }
      
      default:
        return "Não entendi. Por favor, siga as instruções anteriores.";
    }
  }
}

export const whatsAppService = WhatsAppIntegrationService.getInstance();
