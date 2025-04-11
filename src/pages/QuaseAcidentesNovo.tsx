
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import ChatbotModal from "@/components/incidents/ChatbotModal";
import { Incident, Department } from "@/types";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { createIncident } from "@/services/incidentService";

// Define mock departments
const mockDepartments: Department[] = [
  { name: "Operações", employeeCount: 20, color: "#FF5733" },
  { name: "Qualidade", employeeCount: 10, color: "#33FF57" },
  { name: "Manutenção", employeeCount: 15, color: "#3357FF" },
  { name: "Logística", employeeCount: 12, color: "#F033FF" },
  { name: "Produção", employeeCount: 30, color: "#FF9933" },
  { name: "Administrativo", employeeCount: 8, color: "#33FFF9" },
  { name: "Engenharia", employeeCount: 5, color: "#FFD133" },
  { name: "Segurança", employeeCount: 3, color: "#7D33FF" }
];

const QuaseAcidentesNovo = () => {
  const navigate = useNavigate();
  const [isChatbotOpen, setIsChatbotOpen] = useState(true);
  const [departments] = useState<Department[]>(mockDepartments);

  const handleSubmitIncident = async (incident: Incident) => {
    try {
      await createIncident(incident);
      toast.success("Quase acidente reportado com sucesso!");
      navigate('/quase-acidentes');
    } catch (error) {
      console.error("Error creating incident:", error);
      toast.error("Erro ao reportar quase acidente");
    }
  };

  const handleCloseChatbot = () => {
    navigate('/quase-acidentes');
  };

  return (
    <Layout>
      <div className="container p-4">
        <ChatbotModal 
          isOpen={isChatbotOpen}
          onClose={handleCloseChatbot}
          onSubmitIncident={handleSubmitIncident}
          departments={departments}
        />
      </div>
    </Layout>
  );
};

export default QuaseAcidentesNovo;
