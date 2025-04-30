import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { getIncidentById } from "@/services/incidentService";
import { Incident } from "@/types";
import { Button } from "@/components/ui/button";

export default function QuaseAcidentesVisualizar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);

  useEffect(() => {
    if (id) {
      getIncidentById(id).then(setIncident);
    }
  }, [id]);

  if (!incident) return <Layout><div>Carregando...</div></Layout>;

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[80vh] bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-xl">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            ← Voltar
          </Button>
          <h1 className="text-3xl font-bold mb-4 text-blue-800 truncate">{incident.title}</h1>
          <div className="space-y-3">
            <div>
              <span className="text-gray-500 font-medium">Local:</span>
              <span className="ml-2 text-gray-800">{incident.location}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Data:</span>
              <span className="ml-2 text-gray-800">{new Date(incident.date).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Departamento:</span>
              <span className="ml-2 text-gray-800">{incident.department}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Status:</span>
              <span className="ml-2 text-gray-800">{incident.status}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Descrição:</span>
              <span className="ml-2 text-gray-800">{incident.description}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Sugestão de Correção:</span>
              <span className="ml-2 text-gray-800">{incident.suggestionToFix}</span>
            </div>
            {incident.images && incident.images.length > 0 && (
              <div className="mt-6">
                <span className="text-gray-500 font-medium block mb-2">Imagens:</span>
                <div className="grid grid-cols-2 gap-4">
                  {incident.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Imagem ${idx + 1}`}
                      className="w-full h-40 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 