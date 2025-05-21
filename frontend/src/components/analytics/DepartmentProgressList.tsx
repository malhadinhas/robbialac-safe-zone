import React from 'react';
import { Progress } from "@/components/ui/progress";

interface DepartmentData {
  department: {
    id: string;
    name: string;
    color: string;
    employeeCount: number;
  };
  incidents: number;
  target: number;
  percentage: number;
}

interface Props {
  data: DepartmentData[];
}

export default function DepartmentProgressList({ data }: Props) {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.department.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{item.department.name}</span>
            <span className="text-sm text-muted-foreground">
              {item.incidents} / {item.target}
            </span>
          </div>
          <Progress 
            value={item.percentage} 
            className="h-2"
            style={{ 
              '--progress-background': item.department.color 
            } as React.CSSProperties}
          />
          <p className="text-sm text-muted-foreground text-right">
            {Math.round(item.percentage)}% da meta
          </p>
        </div>
      ))}
    </div>
  );
} 