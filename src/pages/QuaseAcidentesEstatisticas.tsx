import React, { useState, useEffect } from 'react';
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DepartmentIncidentsChart from '@/components/analytics/DepartmentIncidentsChart';
import DepartmentProgressList from '@/components/analytics/DepartmentProgressList';
import { useAuth } from "@/contexts/AuthContext";
import { getDepartmentsWithEmployees, getSystemConfig } from '@/services/departmentService';
import { getIncidentsByDepartment } from '@/services/incidentService';
import { DepartmentWithEmployees } from '@/services/departmentService';
import { toast } from 'sonner';

interface DepartmentData {
  department: DepartmentWithEmployees;
  incidents: number;
  target: number;
  percentage: number;
}

export default function QuaseAcidentesEstatisticas() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [targetPercentage, setTargetPercentage] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [departments, config, incidents] = await Promise.all([
        getDepartmentsWithEmployees(),
        getSystemConfig(),
        getIncidentsByDepartment()
      ]);
      if (!Array.isArray(departments)) {
        throw new Error('Departamentos não é um array');
      }
      if (!config?.annualIncidentTargetPerEmployee) {
        throw new Error('Configuração inválida');
      }
      const data: DepartmentData[] = departments.map(dept => {
        const deptIncidents = incidents[dept.id] || 0;
        const target = dept.employeeCount * config.annualIncidentTargetPerEmployee;
        return {
          department: dept,
          incidents: deptIncidents,
          target: target,
          percentage: target > 0 ? (deptIncidents / target) * 100 : 0
        };
      });
      const total = data.reduce((sum, d) => sum + d.incidents, 0);
      const targetTotal = data.reduce((sum, d) => sum + d.target, 0);
      const percentage = targetTotal > 0 ? (total / targetTotal) * 100 : 0;
      const today = new Date();
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      const remaining = Math.ceil((endOfYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setDepartmentData(data);
      setTotalIncidents(total);
      setTotalTarget(targetTotal);
      setTargetPercentage(Math.round(percentage));
      setDaysRemaining(remaining);
    } catch (error) {
      setHasError(true);
      toast.error("Erro ao carregar dados. Por favor, tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    loadData();
  };

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Estatísticas de Quase Acidentes</h1>
          <p className="text-gray-500">
            Análise e metas de quase acidentes por departamento
          </p>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reportado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalIncidents}</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Carregando..." : ""}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meta Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTarget}</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Carregando..." : ""}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">% da Meta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{targetPercentage}%</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Carregando..." : ""}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dias Restantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{daysRemaining}</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Carregando..." : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Quase Acidentes por Departamento</CardTitle>
                <CardDescription>
                  Comparação entre quase acidentes reportados e a meta por departamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-[600px]">
                    <p>Carregando dados...</p>
                  </div>
                ) : hasError ? (
                  <div className="flex flex-col items-center justify-center h-[600px] gap-4">
                    <p className="text-red-500">Erro ao carregar dados</p>
                    <button 
                      onClick={handleRetry}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : (
                  <DepartmentIncidentsChart data={departmentData} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 