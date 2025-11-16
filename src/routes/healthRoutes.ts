import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

/**
 * Configura as rotas de health check
 * (Open/Closed Principle - facilita extensão sem modificar código existente)
 */
export function createHealthRoutes(healthController: HealthController): Router {
  const router = Router();

  // GET /health - Verifica a saúde da aplicação
  router.get('/health', healthController.checkHealth);

  return router;
}
