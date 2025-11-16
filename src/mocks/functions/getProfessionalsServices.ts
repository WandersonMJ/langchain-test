import { mockProfessionals } from '../data/professionals';
import { mockServices } from '../data/services';

/**
 * Retorna todos os profissionais e seus serviços
 * Útil para visualizar quem faz o quê
 */
export function getProfessionalsServices(args?: { professionalId?: string }) {
  const { professionalId } = args || {};

  if (professionalId) {
    const professional = mockProfessionals.find(p => p.id === professionalId);

    if (!professional) {
      return {
        success: false,
        message: `Profissional com ID "${professionalId}" não encontrado`
      };
    }

    const services = mockServices.filter(service =>
      professional.servicesOffered.includes(service.id)
    );

    return {
      success: true,
      message: `Serviços oferecidos por ${professional.name}`,
      data: {
        professional,
        services
      }
    };
  }

  // Retorna todos os profissionais com seus serviços
  const allProfessionalsWithServices = mockProfessionals.map(prof => {
    const services = mockServices.filter(service =>
      prof.servicesOffered.includes(service.id)
    );

    return {
      professional: prof,
      services
    };
  });

  return {
    success: true,
    message: 'Lista completa de profissionais e seus serviços',
    data: allProfessionalsWithServices
  };
}
