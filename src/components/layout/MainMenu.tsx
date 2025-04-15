import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, Star, Film, AlertTriangle, Settings, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Adicionar uma entrada para estatísticas no menu
const MainMenu = () => {
  const menuItems = [
    { 
      name: "Dashboard", 
      href: "/", 
      icon: Box 
    },
    { 
      name: "Formações", 
      href: "/formacoes", 
      icon: Film 
    },
    { 
      name: "Quase Acidentes", 
      href: "/quase-acidentes", 
      icon: AlertTriangle 
    },
    {
      name: "Estatísticas", 
      href: "/quase-acidentes/estatisticas", 
      icon: BarChart,
      // Se precisar restringir, pode adicionar: roles: ["admin_app", "admin_qa"]
    },
    { 
      name: "Pontuação", 
      href: "/pontuacao", 
      icon: Star 
    },
    { 
      name: "Definições", 
      href: "/definicoes", 
      icon: Settings 
    }
  ];
} 