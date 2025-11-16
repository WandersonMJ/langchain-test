import { Request, Response } from 'express';
import { IHealthService } from '../interfaces/IHealthService';

/**
 * Controlador para a rota de health check
 * Recebe requisições HTTP e delega a lógica para o serviço
 * (Single Responsibility Principle - responsável apenas por lidar com HTTP)
 * (Dependency Inversion Principle - depende de interface, não de implementação)
 */
export class HealthController {
  constructor(private healthService: IHealthService) {}

  /**
   * Handler para GET /health
   * Retorna o status de saúde da aplicação
   */
  checkHealth = (_req: Request, res: Response): void => {
    const healthStatus = this.healthService.checkHealth();
    res.status(200).json(healthStatus);
  };
}
