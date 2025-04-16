import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DepartmentIncidentsChart from '@/components/analytics/DepartmentIncidentsChart';
import DepartmentProgressList from '@/components/analytics/DepartmentProgressList';
import { useAuth } from "@/contexts/AuthContext";
import { getDepartmentsWithEmployees, getSystemConfig } from '@/services/departmentService';
import { getIncidentsByDepartment } from '@/services/incidentService';
import { DepartmentWithEmployees } from '@/services/departmentService';
import { toast } from 'sonner';
import { NoScrollLayout } from '@/components/NoScrollLayout';
import { Layout } from '@/components/Layout';

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
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData(currentYear);
  }, [currentYear]);

  const loadData = async (year: number) => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [departments, config, incidents] = await Promise.all([
        getDepartmentsWithEmployees(),
        getSystemConfig(),
        getIncidentsByDepartment(year)
      ]);

      console.log(`Incidentes recebidos para o ano ${year}:`, JSON.stringify(incidents));

      if (!Array.isArray(departments)) {
        throw new Error('Departamentos não é um array');
      }
      if (!config?.annualIncidentTargetPerEmployee) {
        throw new Error('Configuração inválida');
      }
      const data: DepartmentData[] = calculateDepartmentData(departments, incidents);
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
    loadData(currentYear);
  };

  return (
    <Layout>
      <NoScrollLayout>
        <div className="h-full">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Estatísticas de Quase Acidentes</h1>
            <p className="text-gray-500 text-sm">
              Análise e metas de quase acidentes por departamento
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reportado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-robbialac">{totalIncidents}</div>
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
                  <div className="text-2xl font-bold text-robbialac">{totalTarget}</div>
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
                  <div className="text-2xl font-bold text-robbialac">{targetPercentage}%</div>
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
                  <div className="text-2xl font-bold text-robbialac">{daysRemaining}</div>
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? "Carregando..." : ""}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Quase Acidentes por Departamento</CardTitle>
                <CardDescription>
                  Comparação entre quase acidentes reportados e a meta por departamento
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-robbialac"></div>
                  </div>
                ) : hasError ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <p className="text-red-500">Erro ao carregar dados</p>
                    <button 
                      onClick={handleRetry}
                      className="px-4 py-2 bg-robbialac text-white rounded hover:bg-robbialac-dark"
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
      </NoScrollLayout>
    </Layout>
  );
}

const calculateDepartmentData = (departments: DepartmentWithEmployees[], incidents: any[]): DepartmentData[] => {
  if (!departments || !incidents) {
    console.error('Dados de departamentos ou incidentes não disponíveis');
    return [];
  }

  return departments.map(dept => {
    if (!dept.label) {
      console.warn(`Departamento ${dept.name} não possui label definido`);
      return null;
    }

    const deptLabelNormalized = dept.label.trim().toLowerCase();
    const incidentsCount = incidents.filter(item => {
      const itemDeptNormalized = item.department?.trim().toLowerCase() ?? '';
      return itemDeptNormalized === deptLabelNormalized;
    }).length;

    const validEmployeeCount = Number(dept.employeeCount) || 0;
    const validTargetPerEmployee = Number(config.annualIncidentTargetPerEmployee) || 0;
    const target = validEmployeeCount * validTargetPerEmployee;

    return {
      department: dept,
      incidents: incidentsCount,
      target: target,
      percentage: target > 0 ? (incidentsCount / target) * 100 : 0
    };
  }).filter(Boolean) as DepartmentData[];
}; 