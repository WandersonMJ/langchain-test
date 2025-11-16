import { mockServices } from '../data/services';

/**
 * Retorna todos os serviços disponíveis
 * Opcionalmente filtra por categoria
 */
export function getServices(args?: { category?: string }) {
  const { category } = args || {};

  if (category) {
    const filtered = mockServices.filter(
      service => service.category.toLowerCase() === category.toLowerCase()
    );

    return {
      success: true,
      message: `Encontrados ${filtered.length} serviços na categoria "${category}"`,
      data: filtered
    };
  }

  return {
    success: true,
    message: `Total de ${mockServices.length} serviços disponíveis`,
    data: mockServices
  };
}
