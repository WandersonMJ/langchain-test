/**
 * Interface para serviço de health check
 * Define o contrato para verificação de saúde da aplicação
 * (Dependency Inversion Principle - SOLID)
 */
export interface IHealthService {
  /**
   * Verifica o status de saúde da aplicação
   * @returns Objeto com status e timestamp
   */
  checkHealth(): {
    status: string;
    timestamp: string;
  };
}
