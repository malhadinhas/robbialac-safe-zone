
import { useState, useEffect } from "react";
import { Department, Incident, SystemConfig } from "@/types";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

interface DepartmentAnalyticsChartProps {
  incidents: Incident[];
  departments: Department[];
  systemConfig: SystemConfig;
  onUpdateDepartments?: (departments: Department[]) => void;
  onUpdateConfig?: (config: SystemConfig) => void;
}

type DepartmentDataItem = {
  name: string;
  reportCount: number;
  targetCount: number;
  employeeCount: number;
  color: string;
};

const targetFormSchema = z.object({
  annualIncidentTargetPerEmployee: z.coerce.number().min(1, "Deve ser pelo menos 1").max(20, "Deve ser no máximo 20"),
});

const employeeFormSchema = z.record(z.coerce.number().min(0, "Não pode ser negativo"));

export default function DepartmentAnalyticsChart({
  incidents,
  departments,
  systemConfig,
  onUpdateDepartments,
  onUpdateConfig
}: DepartmentAnalyticsChartProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin_app' || user?.role === 'admin_qa';
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
  const [isEmployeesDialogOpen, setIsEmployeesDialogOpen] = useState(false);
  const [chartData, setChartData] = useState<DepartmentDataItem[]>([]);

  const targetForm = useForm<z.infer<typeof targetFormSchema>>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      annualIncidentTargetPerEmployee: systemConfig.annualIncidentTargetPerEmployee
    }
  });

  const employeeForm = useForm<any>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: departments.reduce((acc, dept) => {
      acc[dept.name] = dept.employeeCount;
      return acc;
    }, {} as Record<string, number>)
  });

  useEffect(() => {
    // Calculate incident counts by department
    const departmentCounts: Record<string, number> = {};
    incidents.forEach(incident => {
      if (incident.department) {
        departmentCounts[incident.department] = (departmentCounts[incident.department] || 0) + 1;
      }
    });

    // Format data for the chart
    const data = departments.map(dept => {
      const reportCount = departmentCounts[dept.name] || 0;
      const targetCount = dept.employeeCount * systemConfig.annualIncidentTargetPerEmployee;
      
      return {
        name: dept.name,
        reportCount,
        targetCount,
        employeeCount: dept.employeeCount,
        color: dept.color
      };
    });

    setChartData(data);
  }, [incidents, departments, systemConfig]);

  const handleUpdateTarget = (values: z.infer<typeof targetFormSchema>) => {
    if (onUpdateConfig) {
      onUpdateConfig({
        ...systemConfig,
        annualIncidentTargetPerEmployee: values.annualIncidentTargetPerEmployee
      });
      toast.success("Meta anual atualizada com sucesso!");
      setIsTargetDialogOpen(false);
    }
  };

  const handleUpdateEmployeeCounts = (values: Record<string, number>) => {
    if (onUpdateDepartments) {
      const updatedDepartments = departments.map(dept => ({
        ...dept,
        employeeCount: values[dept.name]
      }));
      
      onUpdateDepartments(updatedDepartments);
      toast.success("Contagem de funcionários atualizada com sucesso!");
      setIsEmployeesDialogOpen(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded shadow-md">
          <p className="font-bold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">Funcionários: {data.employeeCount}</p>
          <p className="text-sm text-[#7E69AB]">Reportes: {data.reportCount}</p>
          <p className="text-sm text-[#9b87f5]">Meta: {data.targetCount}</p>
          <p className="text-sm font-medium mt-1">
            {data.reportCount >= data.targetCount ? (
              <span className="text-green-600">✅ Meta alcançada</span>
            ) : (
              <span className="text-amber-600">⚠️ Abaixo da meta</span>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom PieChart label that shows only percentages
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="relative h-full">
      {isAdmin && (
        <div className="absolute top-0 right-0 z-10 flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsTargetDialogOpen(true)}
            className="bg-white"
          >
            <Settings className="h-4 w-4 mr-1" />
            Alterar Meta ({systemConfig.annualIncidentTargetPerEmployee} por colaborador)
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEmployeesDialogOpen(true)}
            className="bg-white"
          >
            <Settings className="h-4 w-4 mr-1" />
            Nº de Colaboradores
          </Button>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 30, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end"
            height={70}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            label={{ 
              value: "Número de Reportes", 
              angle: -90, 
              position: "insideLeft",
              style: { textAnchor: "middle" }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="targetCount" name="Meta Anual" fill="#9b87f5" />
          <Bar dataKey="reportCount" name="Reportes Atuais">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Dialog for updating annual target */}
      <Dialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Meta Anual</DialogTitle>
          </DialogHeader>
          <Form {...targetForm}>
            <form onSubmit={targetForm.handleSubmit(handleUpdateTarget)} className="space-y-4">
              <FormField
                control={targetForm.control}
                name="annualIncidentTargetPerEmployee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta de Reportes Anual por Colaborador</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        className="w-full"
                        min={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsTargetDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog for updating employee counts */}
      <Dialog open={isEmployeesDialogOpen} onOpenChange={setIsEmployeesDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atualizar Número de Colaboradores por Departamento</DialogTitle>
          </DialogHeader>
          <Form {...employeeForm}>
            <form onSubmit={employeeForm.handleSubmit(handleUpdateEmployeeCounts)} className="space-y-4">
              {departments.map(dept => (
                <FormField
                  key={dept.name}
                  control={employeeForm.control}
                  name={dept.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dept.name}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          className="w-full"
                          min={0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEmployeesDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
