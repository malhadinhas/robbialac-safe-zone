import express from 'express';
import cors from 'cors';
import { connectToDatabase, getDatabaseStatus } from './services/database';
import incidentRoutes from './routes/incidents';
import videoRoutes from './routes/videos';

const app = express();
const port = 3000;

// Middleware para logar todas as requisições
app.use((req, res, next) => {
  console.log('=== Nova Requisição ===');
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  console.log('=== Fim dos Detalhes ===');
  next();
});

app.use(cors());
app.use(express.json());

// Middleware para tratar erros
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Erro:', err);
  res.status(500).json({ error: err.message });
});

// Rotas da API
app.use('/api/incidents', incidentRoutes);
app.use('/api/videos', videoRoutes);

// Rota para verificar status do banco
app.get('/api/database/status', (req, res) => {
  const status = getDatabaseStatus();
  res.json(status);
});

// Inicializa o servidor
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}).catch(error => {
  console.error('Erro ao iniciar o servidor:', error);
}); 