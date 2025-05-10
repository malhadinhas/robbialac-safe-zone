import React, { useState } from 'react';
import { apiService } from '../lib/api';

export default function TestApi() {
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = async (apiFunction: () => Promise<any>, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFunction();
      setResult({ name, data });
    } catch (err: any) {
      setError(err.message || 'Erro ao executar operação');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.login(email, password);
      setResult({ name: 'login', data });
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Teste da API</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Login</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 mr-2"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="border p-2 mr-2"
        />
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Login'}
        </button>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => handleApiCall(apiService.healthCheck, 'Health Check')}
          className="bg-green-500 text-white px-4 py-2 rounded block"
          disabled={loading}
        >
          Verificar Status da API
        </button>

        <button
          onClick={() => handleApiCall(apiService.getVideos, 'Listar Vídeos')}
          className="bg-purple-500 text-white px-4 py-2 rounded block"
          disabled={loading}
        >
          Listar Vídeos
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h3 className="font-semibold">Resultado de {result.name}:</h3>
          <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 