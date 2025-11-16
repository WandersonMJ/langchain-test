import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';

/**
 * Configura as rotas de chat
 * (Open/Closed Principle - facilita extensão sem modificar código existente)
 */
export function createChatRoutes(chatController: ChatController): Router {
  const router = Router();

  // POST /chat - Envia uma mensagem e recebe resposta
  router.post('/chat', chatController.sendMessage);

  return router;
}
