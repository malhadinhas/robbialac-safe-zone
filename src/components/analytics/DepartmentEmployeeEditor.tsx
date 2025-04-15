import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeCountChange = (departmentId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setDepartments(prev => prev.map(dept => 
      dept.id === departmentId ? { ...dept, employeeCount: numValue } : dept
    ));
  };

  const handleSave = async (departmentId: string, employeeCount: number) => {
    setSaving(true);
    try {
      const success = await updateDepartmentEmployeeCount(departmentId, employeeCount);
      if (success) {
        toast.success("Número de funcionários atualizado com sucesso");
      } else {
        toast.error("Erro ao atualizar número de funcionários");
      }
    } catch (error) {
      toast.error("Erro ao salvar alterações");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Carregando departamentos...</div>;
  }

  return (
    <div className="grid gap-4">
      {departments.map((department) => (
        <Card key={department.id} className="border-l-4" style={{ borderLeftColor: department.color }}>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`employee-count-${department.id}`} className="text-base font-medium">
                  {department.name}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`employee-count-${department.id}`}
                    type="number"
                    min="0"
                    value={department.employeeCount}
                    onChange={(e) => handleEmployeeCountChange(department.id, e.target.value)}
                    className="max-w-[120px]"
                  />
                  <span className="text-sm text-muted-foreground">funcionários</span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave(department.id, department.employeeCount)}
                  disabled={saving}
                  size="sm"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 