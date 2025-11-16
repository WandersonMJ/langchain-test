import { IHealthService } from '../interfaces/IHealthService';

/**
 * Serviço responsável por verificar a saúde da aplicação
 * (Single Responsibility Principle - SOLID)
 */
export class HealthService implements IHealthService {
  /**
   * Verifica o status de saúde da aplicação
   * Retorna informações básicas sobre o estado do servidor
   */
  checkHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
}
