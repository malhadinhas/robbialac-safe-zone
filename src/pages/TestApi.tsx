import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestApi() {
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState('admin@robbialac.pt');
  const [password, setPassword] = useState('Admin@123');

  const testApi = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/test');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
  };

  const login = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
  };

  const createUser = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'novo@robbialac.pt',
          password: 'Senha123',
          name: 'Novo Usuário',
          role: 'user',
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
  };

  const getMedals = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/medals');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Teste da API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testApi}>Testar API</Button>
            <Button onClick={login}>Login</Button>
            <Button onClick={createUser}>Criar Usuário</Button>
            <Button onClick={getMedals}>Buscar Medalhas</Button>
          </div>

          <div className="mt-4">
            <h3 className="font-bold">Resultado:</h3>
            <pre className="bg-gray-100 p-4 rounded-lg mt-2 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 