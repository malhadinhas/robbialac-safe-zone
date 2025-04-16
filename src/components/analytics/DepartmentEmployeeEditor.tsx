import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getDepartmentsWithEmployees, updateDepartmentEmployeeCount } from '@/services/departmentService';
import { DepartmentWithEmployees } from '@/services/departmentService';

export default function DepartmentEmployeeEditor() {
  const [departments, setDepartments] = useState<DepartmentWithEmployees[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await getDepartmentsWithEmployees();
      setDepartments(data);
    } catch (error) {
      toast.error("Erro ao carregar departamentos");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeCountChange = (department_Id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setDepartments(prev => prev.map(dept => 
      dept._id === department_Id ? { ...dept, employeeCount: numValue } : dept
    ));
  };

  const handleSave = async (department_Id: string, employeeCount: number) => {
    setSaving(true);
    try {
      const success = await updateDepartmentEmployeeCount(department_Id, employeeCount);
      if (success) {
        toast.success("Número de funcionários atualizado com sucesso");
      } else {
        toast.error("Erro ao atualizar número de funcionários");
      }
    } catch (error) {
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Carregando departamentos...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <h3 className="text-lg font-semibold md:col-span-2">Funcionários por Departamento</h3>
      {departments.map((department) => (
        <Card key={department._id} className="border-l-4 flex flex-col" style={{ borderLeftColor: department.color || '#ccc' }}>
          <CardHeader>
            <CardTitle className="text-xl">{department.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 flex-grow flex flex-col justify-between">
            <div className="flex items-center justify-between gap-4 mb-4">
              <Label htmlFor={`employee-count-${department._id}`} className="sr-only">
                Número de funcionários para {department.label}
              </Label>
              <div className="flex items-center gap-2 flex-grow justify-end">
                <Input
                  id={`employee-count-${department._id}`}
                  type="number"
                  min="0"
                  value={department.employeeCount}
                  onChange={(e) => handleEmployeeCountChange(department._id, e.target.value)}
                  className="max-w-[100px] text-right"
                  aria-label={`Número de funcionários para ${department.label}`}
                />
                <span className="text-sm text-muted-foreground">funcionários</span>
              </div>
            </div>
            <div className="flex justify-end mt-auto">
              <Button 
                onClick={() => handleSave(department._id, department.employeeCount)}
                disabled={saving}
                size="sm"
              >
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 