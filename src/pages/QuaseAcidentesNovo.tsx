import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import ChatbotModal from "@/components/incidents/ChatbotModal";
import { Incident } from "@/types";
import { toast } from "sonner";
import { createIncident } from "@/services/incidentService";
import { getDepartments, Department } from "@/services/departmentService";

const QuaseAcidentesNovo = () => {
  const navigate = useNavigate();
  const [isChatbotOpen, setIsChatbotOpen] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoading(true);
        const data = await getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Erro ao buscar departamentos:", error);
        toast.error("Erro ao carregar departamentos. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

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
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <ChatbotModal 
            isOpen={isChatbotOpen}
            onClose={handleCloseChatbot}
            onSubmitIncident={handleSubmitIncident}
            departments={departments}
          />
        )}
      </div>
    </Layout>
  );
};

export default QuaseAcidentesNovo;
