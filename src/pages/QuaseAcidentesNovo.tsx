
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import ChatbotModal from "@/components/incidents/ChatbotModal";
import { Incident } from "@/types";
import { toast } from "sonner";
import { createIncident } from "@/services/incidentService";
import { mockDepartments } from "@/services/mockData";

const QuaseAcidentesNovo = () => {
  const navigate = useNavigate();
  const [isChatbotOpen, setIsChatbotOpen] = useState(true);
  const [departments] = useState(mockDepartments);

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
