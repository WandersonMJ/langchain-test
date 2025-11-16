import express, { Express } from 'express';
import cors from 'cors';
import { HealthController } from './controllers/HealthController';
import { ChatController } from './controllers/ChatController';
import { HealthService } from './services/HealthService';
import { LangChainChatService } from './services/LangChainChatService';
import { AnthropicChatService } from './services/AnthropicChatService';
import { OrchestrationChatService } from './services/OrchestrationChatService';
import { IChatService } from './interfaces/IChatService';
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

  // Criação dos serviços de IA disponíveis
  const services = new Map<string, IChatService>();

  // LangChain com GPT-4o-mini
  services.set('langchain', new LangChainChatService());
  services.set('openai', new LangChainChatService());

  // Anthropic com Claude 3 Haiku
  services.set('anthropic', new AnthropicChatService('claude-3-haiku-20240307'));
  services.set('claude', new AnthropicChatService('claude-3-haiku-20240307'));

  // Orquestração completa (padrão) - Sistema híbrido com validação
  services.set('orchestration', new OrchestrationChatService());

  console.log(`[App] Serviços disponíveis: ${Array.from(services.keys()).join(', ')}`);

  // Criação dos serviços de negócio
  const healthService = new HealthService();

  // Criação dos controladores com injeção de dependências
  const healthController = new HealthController(healthService);
  const chatController = new ChatController(services);

  // Configuração das rotas
  app.use(createHealthRoutes(healthController));
  app.use(createChatRoutes(chatController));

  // Rota padrão para endpoints não encontrados
  app.use((_req, res) => {
    res.status(404).json({
      error: 'Endpoint não encontrado',
      availableRoutes: [
        'GET /health - Verifica a saúde da aplicação',
        'POST /chat - Envia uma mensagem para o chat',
      ],
      chatEndpointInfo: {
        method: 'POST',
        path: '/chat',
        body: {
          message: 'string (obrigatório)',
          model: 'string (opcional) - Opções: langchain, openai, anthropic, claude, orchestration (padrão)',
        },
        headers: {
          'x-session-id': 'string (opcional) - ID da sessão para manter contexto',
        },
      },
    });
  });

  return app;
}
