import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { getSystemConfig, updateIncidentTargetPerEmployee } from '@/services/departmentService';
import { useAuth } from '@/contexts/AuthContext';

export default function IncidentTargetEditor() {
  const [targetValue, setTargetValue] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const isAuthorized = user?.role === 'admin_app' || user?.role === 'admin_qa';

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    setLoading(true);
    try {
      const config = await getSystemConfig();
      setTargetValue(config.annualIncidentTargetPerEmployee);
    } catch (error) {
      toast.error('Não foi possível carregar a configuração atual');
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setTargetValue(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 20) {
      setTargetValue(value);
    }
  };

  const handleSave = async () => {
    if (!isAuthorized) {
      toast.error('Você não tem permissão para editar esta configuração');
      return;
    }

    setSaving(true);
    try {
      const success = await updateIncidentTargetPerEmployee(targetValue);
      
      if (success) {
        toast.success('Meta de quase acidentes por funcionário atualizada');
      } else {
        toast.error('Não foi possível atualizar a meta');
      }
    } catch (error) {
      toast.error('Erro ao salvar a meta');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-700">Você não tem permissão para editar a meta de quase acidentes.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meta de Quase Acidentes</CardTitle>
        <CardDescription>
          Defina a meta anual de quase acidentes por funcionário
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="target-value">Meta anual por funcionário</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Slider
                  value={[targetValue]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={handleSliderChange}
                  disabled={loading || saving}
                />
              </div>
              <div className="w-20">
                <Input
                  id="target-value"
                  type="number"
                  min={1}
                  max={20}
                  value={targetValue}
                  onChange={handleInputChange}
                  disabled={loading || saving}
                  className="text-center"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Esta meta será usada para calcular as metas de quase acidentes por departamento.
            </div>
            <Button 
              onClick={handleSave} 
              disabled={loading || saving}
            >
              {saving ? 'Salvando...' : 'Salvar Meta'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 