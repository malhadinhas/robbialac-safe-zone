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

      if (!Array.isArray(departments)) {
        throw new Error('Departamentos não é um array');
      }
      if (!config?.annualIncidentTargetPerEmployee) {
        throw new Error('Configuração inválida');
      }
      const data: DepartmentData[] = calculateDepartmentData(departments, incidents, config);
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
          <div className="mb-1 sm:mb-6">
            <h1 className="text-base sm:text-2xl font-semibold">Estatísticas</h1>
            <p className="text-gray-500 text-[8px] sm:text-sm">
              Análise e metas por departamento
            </p>
          </div>

          <div className="space-y-1 sm:space-y-4">
            <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-0.5 sm:gap-4">
              <Card className="p-0.5 sm:p-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:pb-2">
                  <CardTitle className="text-[8px] sm:text-sm font-medium">Tot</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-2">
                  <div className="text-sm sm:text-2xl font-bold text-robbialac leading-none">{totalIncidents}</div>
                </CardContent>
              </Card>

              <Card className="p-0.5 sm:p-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:pb-2">
                  <CardTitle className="text-[8px] sm:text-sm font-medium">Meta</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-2">
                  <div className="text-sm sm:text-2xl font-bold text-robbialac leading-none">{totalTarget}</div>
                </CardContent>
              </Card>

              <Card className="p-0.5 sm:p-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:pb-2">
                  <CardTitle className="text-[8px] sm:text-sm font-medium">%</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-2">
                  <div className="text-sm sm:text-2xl font-bold text-robbialac leading-none">{targetPercentage}%</div>
                </CardContent>
              </Card>

              <Card className="p-0.5 sm:p-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:pb-2">
                  <CardTitle className="text-[8px] sm:text-sm font-medium">Dias</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-2">
                  <div className="text-sm sm:text-2xl font-bold text-robbialac leading-none">{daysRemaining}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="flex-1">
              <CardHeader className="p-1 sm:p-4">
                <CardTitle className="text-xs sm:text-lg">Quase Acidentes</CardTitle>
                <CardDescription className="text-[8px] sm:text-sm">
                  Reportados vs Meta
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[150px] sm:min-h-[300px] p-0.5 sm:p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-12 sm:w-12 border-t-2 border-b-2 border-robbialac"></div>
                  </div>
                ) : hasError ? (
                  <div className="flex flex-col items-center justify-center h-full gap-1 sm:gap-4">
                    <p className="text-red-500 text-[8px] sm:text-sm">Erro ao carregar</p>
                    <button 
                      onClick={handleRetry}
                      className="px-1 py-0.5 sm:px-4 sm:py-2 bg-robbialac text-white rounded hover:bg-robbialac-dark text-[8px] sm:text-sm"
                    >
                      Recarregar
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

const calculateDepartmentData = (departments: DepartmentWithEmployees[], incidents: any[], config: any): DepartmentData[] => {
  if (!departments || !incidents || !config?.annualIncidentTargetPerEmployee) {
    console.error('Dados de departamentos, incidentes ou configuração inválidos para cálculo');
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