import React, { useEffect, useState } from 'react';
import { getIncidentsByDepartment } from '@/services/incidentService';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface DepartmentIncident {
  department: string;
  count: number;
}

export function DepartmentIncidents() {
  const [incidents, setIncidents] = useState<DepartmentIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getIncidentsByDepartment();
      setIncidents(data);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(`Erro: ${err.message}`);
      } else {
        setError('Não foi possível carregar os incidentes por departamento');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Incidentes por Departamento</h3>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Incidentes por Departamento</h3>
          <Alert variant="destructive" className="mb-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchIncidents}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Incidentes por Departamento</h3>
        <div className="space-y-2">
          {incidents.map((incident) => (
            <div key={incident.department} className="flex justify-between items-center">
              <span className="text-sm">{incident.department}</span>
              <span className="text-sm font-medium">{incident.count}</span>
            </div>
          ))}
          {incidents.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum incidente registrado</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 