/**
 * Interface para serviço de chat
 * Define o contrato que qualquer serviço de chat deve seguir
 * (Dependency Inversion Principle - SOLID)
 */
export interface IChatService {
  /**
   * Processa uma mensagem e retorna a resposta do chat
   * @param message - Mensagem do usuário
   * @param sessionId - ID da sessão (opcional) para manter contexto
   * @returns Promise com a resposta do assistente
   */
  processMessage(message: string, sessionId?: string): Promise<string>;
}
