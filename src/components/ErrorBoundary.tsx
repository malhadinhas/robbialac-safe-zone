import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Remover console.error deste arquivo, mantendo apenas tratamento de erro visual, throw ou logs via logger customizado, se houver.
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertTitle>Algo deu errado</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="mb-2">Ocorreu um erro ao renderizar a aplicação:</p>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40 mb-4">
                  {this.state.error?.message || "Erro desconhecido"}
                </pre>
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Recarregar Aplicação
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;

