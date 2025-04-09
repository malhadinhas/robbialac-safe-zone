
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Image, MessageSquare, Send } from "lucide-react";
import { Incident, Department } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitIncident: (incident: Incident) => void;
  departments: Department[];
}

export default function ChatbotModal({
  isOpen,
  onClose,
  onSubmitIncident,
  departments
}: ChatbotModalProps) {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState<{text: string, isBot: boolean}[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentIncident, setCurrentIncident] = useState<Partial<Incident>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setChatMessages([
        { 
          text: "Olá! Vou ajudar você a reportar um quase acidente. Para começar, qual o título ou breve descrição do ocorrido?", 
          isBot: true 
        }
      ]);
      setCurrentIncident({});
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    setChatMessages(prev => [...prev, { text: newMessage, isBot: false }]);
    const botResponse = processChatbotResponse(newMessage);
    setNewMessage("");
    setTimeout(() => {
      setChatMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    }, 500);
  };
  
  const processChatbotResponse = (message: string): string => {
    const lastBotMessage = [...chatMessages].reverse().find(msg => msg.isBot)?.text || "";
    
    if (lastBotMessage.includes("qual o título ou breve descrição")) {
      setCurrentIncident(prev => ({ ...prev, title: message }));
      return "Obrigado! Em qual local da fábrica isso aconteceu?";
    }
    
    if (lastBotMessage.includes("qual local da fábrica")) {
      setCurrentIncident(prev => ({ ...prev, location: message }));
      return "Agora, por favor descreva com mais detalhes o que aconteceu:";
    }
    
    if (lastBotMessage.includes("descreva com mais detalhes")) {
      setCurrentIncident(prev => ({ ...prev, description: message }));
      return "Qual departamento você pertence? Opções: " + departments.map(d => d.name).join(", ");
    }
    
    if (lastBotMessage.includes("Qual departamento você pertence")) {
      // Find closest matching department
      const departmentNames = departments.map(d => d.name.toLowerCase());
      const messageLC = message.toLowerCase();
      const department = departments.find(d => 
        messageLC.includes(d.name.toLowerCase()) || 
        departmentNames.some(name => messageLC.includes(name))
      )?.name || departments[0].name;
      
      setCurrentIncident(prev => ({ ...prev, department }));
      return "Qual a gravidade do quase acidente? Responda com: Baixo, Médio ou Alto";
    }
    
    if (lastBotMessage.includes("gravidade do quase acidente")) {
      const severity = message.toLowerCase().includes("alto") 
        ? "Alto" 
        : message.toLowerCase().includes("médio") || message.toLowerCase().includes("medio")
        ? "Médio" 
        : "Baixo";
      
      const gravityValue = severity === "Alto" ? 7 : severity === "Médio" ? 4 : 1;
      
      const frequency = "Baixa";
      const frequencyValue = 2;
      
      const risk = frequencyValue * gravityValue;
      
      let qaQuality: "Baixa" | "Média" | "Alta" = "Baixa";
      if (risk > 24) qaQuality = "Alta";
      else if (risk >= 8) qaQuality = "Média";
      else qaQuality = "Baixa";
      
      const resolutionDays = severity === "Alto" ? 7 : severity === "Médio" ? 14 : 30;
      
      const resolutionDeadline = new Date();
      resolutionDeadline.setDate(resolutionDeadline.getDate() + resolutionDays);
      
      setCurrentIncident(prev => ({ 
        ...prev, 
        severity: severity as "Baixo" | "Médio" | "Alto",
        date: new Date(),
        reportedBy: user?.email || "",
        status: "Reportado",
        id: Date.now().toString(),
        pointsAwarded: severity === "Alto" ? 100 : severity === "Médio" ? 75 : 50,
        gravityValue,
        frequency,
        frequencyValue,
        risk,
        qaQuality,
        resolutionDays,
        resolutionDeadline
      }));
      
      setTimeout(() => {
        if (currentIncident.title && currentIncident.location && currentIncident.description) {
          const newIncident = currentIncident as Incident;
          onSubmitIncident(newIncident);
          onClose();
        }
      }, 1000);
      
      return "Obrigado por reportar! Seu relato é muito importante para melhorarmos a segurança. Estou processando as informações...";
    }
    
    return "Desculpe, não entendi. Pode tentar novamente?";
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b bg-robbialac text-white rounded-t-lg flex justify-between items-center">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-semibold">Reportar Quase Acidente</h2>
          </div>
          <button onClick={onClose} className="text-white">
            &times;
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: '60vh' }}>
          {chatMessages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 ${message.isBot ? 'flex' : 'flex justify-end'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isBot 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-robbialac text-white'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-4 border-t">
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="mr-2">
              <Image className="h-5 w-5" />
            </Button>
            <input
              type="text"
              className="flex-1 border rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-robbialac focus:border-transparent"
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              className="rounded-l-none bg-robbialac hover:bg-robbialac-dark"
              onClick={handleSendMessage}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            O chatbot ajudará a coletar todas as informações necessárias
          </p>
        </div>
      </div>
    </div>
  );
}
