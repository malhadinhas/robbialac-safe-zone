import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Image, MessageSquare, Send, Calendar as CalendarIcon, HelpCircle } from "lucide-react";
import { Incident, Department } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitIncident: (incident: Incident) => void;
  departments: Department[];
}

const factoryLocations = [
  "Uf1 - Enchimento",
  "Uf1 - fabrico",
  "Uf1 - Piso Intermédio",
  "Armazêm de matérias primas",
  "Uf3",
  "Silos Areia Uf3"
];

enum ChatStep {
  NAME,
  DATE,
  DEPARTMENT,
  LOCATION,
  INCIDENT_LOCATION,
  DESCRIPTION,
  SUGGESTION,
  SEVERITY,
  CONFIRMATION,
  HELP
}

export default function ChatbotModal({
  isOpen,
  onClose,
  onSubmitIncident,
  departments
}: ChatbotModalProps) {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState<{text: string, isBot: boolean, options?: string[], calendar?: boolean}[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentIncident, setCurrentIncident] = useState<Partial<Incident>>({});
  const [currentStep, setCurrentStep] = useState<ChatStep>(ChatStep.NAME);
  const [previousStep, setPreviousStep] = useState<ChatStep>(ChatStep.NAME);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      resetChat();
    }
  }, [isOpen]);
  
  const resetChat = () => {
    setChatMessages([
      { 
        text: "Olá! Obrigado por contribuir para a segurança de todos! Vamos registrar um quase acidente para melhorar nosso ambiente de trabalho. Para começar, qual é o seu nome?", 
        isBot: true 
      }
    ]);
    setCurrentIncident({});
    setCurrentStep(ChatStep.NAME);
    setPreviousStep(ChatStep.NAME);
    setDate(new Date());
  };
  
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim() && currentStep !== ChatStep.DATE) return;
    
    setChatMessages(prev => [...prev, { text: newMessage, isBot: false }]);
    processUserInput(newMessage);
    setNewMessage("");
  };

  const showHelpInformation = () => {
    setPreviousStep(currentStep);
    setCurrentStep(ChatStep.HELP);
    
    setChatMessages(prev => [...prev, { 
      text: "Aqui estão algumas informações úteis sobre os parâmetros dos Quase Acidentes (QA):\n\n" +
            "📊 **Parâmetros de Quase Acidentes**\n\n" +
            "**1. Gravidade (atribuído pelo admin)**\n" +
            "- Baixo (valor 1): Situação com potencial de causar incidentes leves\n" +
            "- Médio (valor 4): Situação com potencial de causar incidentes moderados\n" +
            "- Alto (valor 7): Situação com potencial de causar incidentes graves\n\n" +
            "**2. Frequência (atribuído pelo admin)**\n" +
            "- Baixa (valor 2): Ocorrência rara ou primeira vez\n" +
            "- Moderada (valor 6): Ocorrência ocasional\n" +
            "- Alta (valor 8): Ocorrência frequente\n\n" +
            "**3. Risco (calculado automaticamente)**\n" +
            "- Valor = Gravidade × Frequência\n" +
            "- Baixo: < 8 pontos\n" +
            "- Médio: 8-24 pontos\n" +
            "- Alto: > 24 pontos\n\n" +
            "**4. Qualidade QA (calculado automaticamente)**\n" +
            "Baseado no valor do Risco:\n" +
            "- Baixa: Risco < 8\n" +
            "- Média: Risco entre 8 e 24\n" +
            "- Alta: Risco > 24\n\n" +
            "**5. Campos obrigatórios:**\n" +
            "- Título, Descrição, Local, Data, Status, Departamento e Sugestão de Correção\n\n" +
            "O que mais posso ajudar?", 
      isBot: true,
      options: ["Continuar", "Recomeçar"]
    }]);
  };
  
  const processUserInput = (message: string) => {
    if (currentStep === ChatStep.HELP) {
      if (message.toLowerCase().includes("recomeçar")) {
        resetChat();
        return;
      } else {
        setCurrentStep(previousStep);
        return;
      }
    }
    
    switch (currentStep) {
      case ChatStep.NAME:
        setCurrentIncident(prev => ({ ...prev, reporterName: message }));
        setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            text: `Obrigado, ${message}! Em que data ocorreu o quase acidente?`, 
            isBot: true,
            calendar: true
          }]);
          setCurrentStep(ChatStep.DATE);
        }, 500);
        break;
        
      case ChatStep.DATE:
        // This is handled by the calendar component
        break;
        
      case ChatStep.DEPARTMENT:
        const selectedDepartment = departments.find(d => 
          message.toLowerCase().includes(d.name.toLowerCase())
        )?.name || departments[0].name;
        
        setCurrentIncident(prev => ({ ...prev, department: selectedDepartment }));
        setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            text: "Em qual área da fábrica ocorreu o quase acidente?", 
            isBot: true,
            options: factoryLocations
          }]);
          setCurrentStep(ChatStep.LOCATION);
        }, 500);
        break;
        
      case ChatStep.LOCATION:
        setCurrentIncident(prev => ({ ...prev, factoryArea: message }));
        setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            text: "Por favor, descreva com mais detalhes o local específico onde ocorreu o quase acidente:", 
            isBot: true 
          }]);
          setCurrentStep(ChatStep.INCIDENT_LOCATION);
        }, 500);
        break;
        
      case ChatStep.INCIDENT_LOCATION:
        setCurrentIncident(prev => ({ ...prev, location: message }));
        setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            text: "Agora, por favor descreva com detalhes a situação de risco que você observou:", 
            isBot: true 
          }]);
          setCurrentStep(ChatStep.DESCRIPTION);
        }, 500);
        break;
        
      case ChatStep.DESCRIPTION:
        setCurrentIncident(prev => ({ ...prev, description: message }));
        setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            text: "Que sugestão você tem para corrigir ou prevenir esta situação? (Este campo é obrigatório)", 
            isBot: true 
          }]);
          setCurrentStep(ChatStep.SUGGESTION);
        }, 500);
        break;
        
      case ChatStep.SUGGESTION:
        if (!message.trim() || message.length < 5) {
          setTimeout(() => {
            setChatMessages(prev => [...prev, { 
              text: "Por favor, forneça uma sugestão mais detalhada para correção. Este campo é obrigatório para registrar o quase acidente.", 
              isBot: true 
            }]);
          }, 500);
          return;
        }
        
        setCurrentIncident(prev => ({ ...prev, suggestionToFix: message }));
        setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            text: "Qual a gravidade potencial deste quase acidente?", 
            isBot: true,
            options: ["Baixo", "Médio", "Alto"]
          }]);
          setCurrentStep(ChatStep.SEVERITY);
        }, 500);
        break;
        
      case ChatStep.SEVERITY:
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
        
        const incidentDescription = currentIncident.description || "Sem descrição";
        const incidentLocation = currentIncident.location || "Local não especificado";
        const departmentName = currentIncident.department || departments[0].name;
        const suggestionToFix = currentIncident.suggestionToFix || "Sem sugestão";
        
        const finalIncident: Incident = {
          ...currentIncident as Partial<Incident>,
          title: currentIncident.description?.substring(0, 50) + "...",
          description: incidentDescription,
          location: incidentLocation,
          department: departmentName,
          severity: severity as "Baixo" | "Médio" | "Alto",
          date: date || new Date(),
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
          resolutionDeadline,
          suggestionToFix,
          images: []
        };
        
        setCurrentIncident(finalIncident);
        
        setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            text: "Obrigado pelo seu relato! Aqui está um resumo do quase acidente reportado:\n\n" +
                  `Nome: ${finalIncident.reporterName}\n` +
                  `Data: ${format(finalIncident.date, 'dd/MM/yyyy')}\n` +
                  `Departamento: ${finalIncident.department}\n` +
                  `Área da fábrica: ${finalIncident.factoryArea}\n` +
                  `Local específico: ${finalIncident.location}\n` +
                  `Descrição: ${finalIncident.description}\n` +
                  `Sugestão: ${finalIncident.suggestionToFix}\n` +
                  `Gravidade: ${finalIncident.severity}\n\n` +
                  "Deseja confirmar este relato?", 
            isBot: true,
            options: ["Confirmar", "Cancelar"]
          }]);
          setCurrentStep(ChatStep.CONFIRMATION);
        }, 500);
        break;
        
      case ChatStep.CONFIRMATION:
        if (message.toLowerCase().includes("confirmar")) {
          setTimeout(() => {
            setChatMessages(prev => [...prev, { 
              text: "Quase acidente registrado com sucesso! Obrigado por contribuir para a segurança de todos.", 
              isBot: true 
            }]);
            
            if (Object.keys(currentIncident).length > 0) {
              onSubmitIncident(currentIncident as Incident);
              setTimeout(() => onClose(), 2000);
            }
          }, 500);
        } else {
          setTimeout(() => {
            setChatMessages(prev => [...prev, { 
              text: "Registro cancelado. Deseja começar novamente?", 
              isBot: true,
              options: ["Sim", "Não"]
            }]);
            
            setCurrentStep(ChatStep.NAME);
          }, 500);
        }
        break;
      
      default:
        break;
    }
  };
  
  const handleOptionClick = (option: string) => {
    setChatMessages(prev => [...prev, { text: option, isBot: false }]);
    processUserInput(option);
  };
  
  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    setDate(selectedDate);
    setCurrentIncident(prev => ({ ...prev, date: selectedDate }));
    
    setChatMessages(prev => [
      ...prev, 
      { text: format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }), isBot: false }
    ]);
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        text: "A qual departamento você pertence?", 
        isBot: true,
        options: departments.map(d => d.name)
      }]);
      setCurrentStep(ChatStep.DEPARTMENT);
    }, 500);
  };
  
  const renderMessages = () => {
    return chatMessages.map((message, index) => (
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
          
          {message.calendar && (
            <div className="mt-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full flex justify-between items-center bg-white border border-gray-300"
                  >
                    <span>{date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione uma data'}</span>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleCalendarSelect}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          {message.options && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.options.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-100"
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    ));
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
          {renderMessages()}
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-4 border-t">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              className="mr-2"
              onClick={showHelpInformation}
              title="Preciso de ajuda"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <input
              type="text"
              className="flex-1 border rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-robbialac focus:border-transparent"
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={currentStep === ChatStep.DATE}
            />
            <Button 
              className="rounded-l-none bg-robbialac hover:bg-robbialac-dark"
              onClick={handleSendMessage}
              disabled={currentStep === ChatStep.DATE}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500 text-center">
              O chatbot ajudará a coletar todas as informações necessárias
            </p>
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs text-robbialac p-0"
              onClick={showHelpInformation}
            >
              Preciso de ajuda
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
