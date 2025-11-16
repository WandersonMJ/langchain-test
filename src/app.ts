import express, { Express } from 'express';
import cors from 'cors';
import { HealthController } from './controllers/HealthController';
import { ChatController } from './controllers/ChatController';
import { HealthService } from './services/HealthService';
import { LangChainChatService } from './services/LangChainChatService';
import { createHealthRoutes } from './routes/healthRoutes';
import { createChatRoutes } from './routes/chatRoutes';

/**
 * Configura e cria a aplicação Express
 * Aqui fazemos a injeção de dependências manualmente
 * (Dependency Injection - SOLID)
 */
export function createApp(): Express {
  const app = express();
  app.use(cors());

  // Middleware para parsear JSON
  app.use(express.json());

  // Middleware de logging simples
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Criação dos serviços (camada de lógica de negócio)
  const healthService = new HealthService();
  const chatService = new LangChainChatService();

  // Criação dos controladores com injeção de dependências
  const healthController = new HealthController(healthService);
  const chatController = new ChatController(chatService);

  // Configuração das rotas
  app.use(createHealthRoutes(healthController));
  app.use(createChatRoutes(chatController));

  // Rota padrão para endpoints não encontrados
  app.use((_req, res) => {
    res.status(404).json({
      error: 'Endpoint não encontrado',
      availableRoutes: [
        'GET /health - Verifica a saúde da aplicação',
        'POST /chat - Envia uma mensagem para o chat (body: { message: string })',
      ],
    });
  });

  return app;
}
