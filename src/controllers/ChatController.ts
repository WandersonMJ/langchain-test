import { Request, Response } from 'express';
import { IChatService } from '../interfaces/IChatService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Controlador para a rota de chat
 * Recebe requisições HTTP e delega a lógica para o serviço de chat
 * (Single Responsibility Principle - responsável apenas por lidar com HTTP)
 * (Dependency Inversion Principle - depende de interface, não de implementação)
 */
export class ChatController {
  private services: Map<string, IChatService>;

  constructor(services: Map<string, IChatService>) {
    this.services = services;
  }

  /**
   * Handler para POST /chat
   * Processa mensagens do usuário e retorna resposta do chat
   *
   * Aceita parâmetro "model" no body para escolher o serviço:
   * - "langchain" | "openai": GPT-4o-mini via LangChain
   * - "anthropic" | "claude": Claude 3 Haiku via Anthropic
   * - "orchestration" (padrão): Sistema completo com validação de agendamento
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, model } = req.body;

      // Validação básica
      if (!message || typeof message !== 'string') {
        res.status(400).json({
          error: 'Campo "message" é obrigatório e deve ser uma string',
        });
        return;
      }

      // Seleciona o serviço baseado no parâmetro model
      const selectedModel = model || 'orchestration';
      const chatService = this.services.get(selectedModel);

      if (!chatService) {
        res.status(400).json({
          error: `Modelo "${selectedModel}" não encontrado. Modelos disponíveis: ${Array.from(this.services.keys()).join(', ')}`,
        });
        return;
      }

      // Gerenciamento de sessionId
      let sessionId = req.headers['x-session-id'] as string;

      // Se não existe sessionId, cria um novo
      if (!sessionId) {
        sessionId = uuidv4();
      }

      console.log(`[ChatController] Usando modelo: ${selectedModel}`);

      // Delega o processamento para o serviço com sessionId
      const response = await chatService.processMessage(message, sessionId);

      res.status(200).json({
        message: response,
        sessionId,
        model: selectedModel,
      });
    } catch (error) {
      console.error('Erro no ChatController:', error);
      res.status(500).json({
        error: 'Erro ao processar mensagem',
      });
    }
  };
}
