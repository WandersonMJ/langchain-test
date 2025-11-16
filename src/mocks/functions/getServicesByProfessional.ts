import { mockProfessionals } from '../data/professionals';
import { mockServices } from '../data/services';

/**
 * Busca profissionais que oferecem um serviço específico
 * Retorna lista de profissionais ordenada por rating
 */
export function getServicesByProfessional(args: { serviceId: string }) {
  const { serviceId } = args;

  const service = mockServices.find(s => s.id === serviceId);

  if (!service) {
    return {
      success: false,
      message: `Serviço com ID "${serviceId}" não encontrado`,
      availableServiceIds: mockServices.map(s => s.id)
    };
  }

  // Encontra profissionais que oferecem esse serviço
  const professionalsOffering = mockProfessionals
    .filter(prof => prof.servicesOffered.includes(serviceId))
    .sort((a, b) => b.rating - a.rating); // Ordena por rating (maior primeiro)

  if (professionalsOffering.length === 0) {
    return {
      success: false,
      message: `Nenhum profissional disponível para o serviço "${service.name}"`
    };
  }

  return {
    success: true,
    message: `${professionalsOffering.length} profissionais oferecem "${service.name}"`,
    data: {
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        category: service.category
      },
      professionals: professionalsOffering.map(prof => ({
        id: prof.id,
        name: prof.name,
        specialty: prof.specialty,
        experience: prof.experience,
        rating: prof.rating,
        availableDays: prof.availableDays
      })),
      totalProfessionals: professionalsOffering.length,
      bestRated: professionalsOffering[0].name
    }
  };
}
