import { Request, Response } from 'express';
import { IChatService } from '../interfaces/IChatService';

/**
 * Controlador para a rota de chat
 * Recebe requisições HTTP e delega a lógica para o serviço de chat
 * (Single Responsibility Principle - responsável apenas por lidar com HTTP)
 * (Dependency Inversion Principle - depende de interface, não de implementação)
 */
export class ChatController {
  constructor(private chatService: IChatService) {}

  /**
   * Handler para POST /chat
   * Processa mensagens do usuário e retorna resposta do chat
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message } = req.body;

      // Validação básica
      if (!message || typeof message !== 'string') {
        res.status(400).json({
          error: 'Campo "message" é obrigatório e deve ser uma string',
        });
        return;
      }

      // Delega o processamento para o serviço
      const response = await this.chatService.processMessage(message);

      res.status(200).json({
        message: response,
      });
    } catch (error) {
      console.error('Erro no ChatController:', error);
      res.status(500).json({
        error: 'Erro ao processar mensagem',
      });
    }
  };
}
