import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DepartmentIncidentsChart from '@/components/analytics/DepartmentIncidentsChart';
import DepartmentProgressList from '@/components/analytics/DepartmentProgressList';
import { useAuth } from "@/contexts/AuthContext";
import { getDepartmentsWithEmployees, getSystemConfig } from '@/services/departmentService';
import { getIncidentsByDepartment } from '@/services/incidentService';
import { DepartmentWithEmployees } from '@/services/departmentService';
import { toast } from 'sonner';
import { Layout } from '@/components/Layout';
import { DepartmentIncidents } from '@/components/dashboard/DepartmentIncidents';
import { Button } from "@/components/ui/button";

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
      // Buscar departamentos e configuração do sistema
      const [departments, config] = await Promise.all([
        getDepartmentsWithEmployees(),
        getSystemConfig()
      ]);

      // Validar departamentos e configuração
      if (!Array.isArray(departments)) {
        throw new Error('Departamentos não é um array');
      }
      if (!config?.annualIncidentTargetPerEmployee) {
        throw new Error('Configuração inválida');
      }

      // Buscar incidentes por departamento
      let incidents;
      try {
        incidents = await getIncidentsByDepartment(year);
      } catch (err) {
        console.error('Erro ao buscar incidentes por departamento:', err);
        toast.error(err instanceof Error ? err.message : 'Erro ao buscar incidentes');
        incidents = []; // Usar um array vazio como fallback
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
      if (error instanceof Error) {
        toast.error(`Erro ao carregar dados: ${error.message}`);
      } else {
        toast.error("Erro ao carregar dados. Por favor, tente novamente mais tarde.");
      }
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    loadData(currentYear);
  };

  return (
    <Layout>
      <div className="h-full bg-[#f7faff] p-3 sm:p-6 overflow-y-auto">
        <div className="container mx-auto">
          {/* Header Section */}
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">
                  Estatísticas
                </h1>
                <p className="text-gray-500 text-sm mt-1">
            Análise e metas por departamento
          </p>
              </div>
            </div>
        </div>

          {/* Content Section */}
          <div className="mt-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle>
              </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-[#1E90FF]">{totalIncidents}</div>
              </CardContent>
            </Card>

              <Card className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium text-gray-500">Meta</CardTitle>
              </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-[#1E90FF]">{totalTarget}</div>
              </CardContent>
            </Card>

              <Card className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium text-gray-500">Percentual</CardTitle>
              </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-[#1E90FF]">{targetPercentage}%</div>
              </CardContent>
            </Card>

              <Card className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium text-gray-500">Dias Restantes</CardTitle>
              </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-[#1E90FF]">{daysRemaining}</div>
              </CardContent>
            </Card>
          </div>

            {/* Chart Card */}
            <Card className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all">
              <CardHeader className="p-6">
                <CardTitle className="text-xl font-bold text-gray-800">Quase Acidentes</CardTitle>
                <CardDescription className="text-gray-500">
                Reportados vs Meta
              </CardDescription>
            </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="min-h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Carregando...</p>
                </div>
              ) : hasError ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <p className="text-red-500">Erro ao carregar dados</p>
                      <Button
                    onClick={handleRetry}
                        className="bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold rounded-full px-6 py-2 shadow-lg"
                  >
                    Recarregar
                      </Button>
                </div>
              ) : (
                <DepartmentIncidentsChart data={departmentData} />
              )}
                </div>
            </CardContent>
          </Card>

            {/* Department Incidents Table */}
            <Card className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all">
              <CardHeader className="p-6">
                <CardTitle className="text-xl font-bold text-gray-800">Incidentes por Departamento</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
            <DepartmentIncidents />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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