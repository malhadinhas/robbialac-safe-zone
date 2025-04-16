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
  "Uf1-Enchimento",
  "Uf1-Fabrico",
  "Uf1-Piso Intermédio",
  "Uf1-Controlo Qualidade",
  "Uf2 Enchimento",
  "Uf2 Fabrico",
  "Uf3",
  "Expedição",
  "Armazêm de matérias Primas",
  "Armazêm de Embalagens 1",
  "Armazêm de Embalagens 2",
  "Rotulagem",
  "Etar",
  "Zona de Residuos",
  "Manutenção",
  "Edificio Administrativo",
  "Edificio de Escritórios",
  "Portaria",
  "Silos", 
  "Parques de Estacionamento"
];

enum ChatStep {
  NAME,
  DATE,
  DEPARTMENT,
  LOCATION,
  INCIDENT_LOCATION,
  DESCRIPTION,
  SUGGESTION,
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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
        const selectedDepartmentObject = departments.find(d => 
          d.label && message.toLowerCase() === d.label.toLowerCase()
        );
        
        const selectedDepartmentLabel = selectedDepartmentObject?.label || message;
        
        setCurrentIncident(prev => ({ ...prev, department: selectedDepartmentLabel }));
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

        const incidentDescription = currentIncident.description || "Sem descrição";
        const incidentLocation = currentIncident.location || "Local não especificado";
        const departmentName = currentIncident.department || departments[0].label;
        const suggestionToFix = message;

        const finalIncident: Partial<Incident> = {
          ...currentIncident as Partial<Incident>,
          title: incidentDescription?.substring(0, 50) + "...",
          description: incidentDescription,
          location: incidentLocation,
          department: departmentName,
          date: date || new Date(),
          reportedBy: user?.email || "",
          reporterName: currentIncident.reporterName,
          factoryArea: currentIncident.factoryArea,
          suggestionToFix: suggestionToFix,
          status: "Reportado",
          severity: "Não Definido",
          images: []
        };

        setCurrentIncident(finalIncident);
        
        setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            text: "Obrigado pelo seu relato! Aqui está um resumo do quase acidente reportado:\n\n" +
                  `Nome: ${finalIncident.reporterName || 'N/A'}\n` +
                  `Data: ${format(finalIncident.date!, 'dd/MM/yyyy')}\n` +
                  `Departamento: ${finalIncident.department}\n` +
                  `Área da fábrica: ${finalIncident.factoryArea || 'N/A'}\n` +
                  `Local específico: ${finalIncident.location}\n` +
                  `Descrição: ${finalIncident.description}\n` +
                  `Sugestão: ${finalIncident.suggestionToFix}\n\n` +
                  "A gravidade será avaliada posteriormente pela equipa de segurança.\n\n" +
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
  
  const proceedToDepartmentStep = (selectedDate: Date) => {
    setCurrentIncident(prev => ({ ...prev, date: selectedDate }));
    const userDateMessage = { text: format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }), isBot: false };
    
    setChatMessages(prev => [...prev, userDateMessage]);
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        text: "A qual departamento você pertence?", 
        isBot: true,
        options: departments.map(d => d.label) 
      }]);
      setCurrentStep(ChatStep.DEPARTMENT);
    }, 300);
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    setDate(selectedDate);
    setIsCalendarOpen(false);
    proceedToDepartmentStep(selectedDate);
  };

  const handleUseToday = () => {
    const today = new Date();
    setDate(today);
    proceedToDepartmentStep(today);
  };
  
  const renderMessages = () => {
    return chatMessages.map((msg, index) => {
      const messageKey = `msg-${index}`;

      if (msg.isBot) {
        return (
          <div key={messageKey} className="flex flex-col gap-2 mb-4">
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                <MessageSquare size={16} />
              </span>
              <div className="flex flex-col w-full max-w-[480px] leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl">
                <p className="text-sm font-normal text-gray-900 whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
            {msg.options && (
              <div className="flex flex-wrap gap-2 mt-2 ml-10">
                {msg.options.map((option) => (
                  <Button 
                    key={option} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOptionClick(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}
            {msg.calendar && (
              <div className="mt-2 ml-10 flex items-center gap-2">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleCalendarSelect}
                      locale={ptBR}
                      initialFocus
                      disabled={{ before: undefined, after: undefined }}
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="secondary" size="sm" onClick={handleUseToday}>
                  Hoje
                </Button>
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div key={messageKey} className="flex items-start justify-end gap-2.5 mb-4">
            <div className="flex flex-col w-full max-w-[480px] leading-1.5 p-4 border-gray-200 bg-blue-500 rounded-s-xl rounded-ee-xl">
              <p className="text-sm font-normal text-white">{msg.text}</p>
            </div>
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
              {user?.email?.[0].toUpperCase() || 'U'}
            </span>
          </div>
        );
      }
    });
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
