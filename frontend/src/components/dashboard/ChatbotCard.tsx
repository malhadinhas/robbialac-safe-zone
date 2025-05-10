import { Card, CardContent } from "@/components/ui/card";
import { Bot, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ChatbotCard() {
  const navigate = useNavigate();

  return (
    <Card 
      className="h-fit cursor-pointer group hover:shadow-md transition-all duration-300"
      onClick={() => navigate('/chatbot')}
    >
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-robbialac/10 flex items-center justify-center mr-4">
            <Bot className="w-6 h-6 text-robbialac" />
          </div>
          <div>
            <h3 className="font-medium text-lg mb-1">Precisa de ajuda?</h3>
            <p className="text-sm text-gray-500">
              Converse com nosso assistente virtual e tire suas dúvidas
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-robbialac group-hover:translate-x-1 transition-all" />
      </CardContent>
    </Card>
  );
} 