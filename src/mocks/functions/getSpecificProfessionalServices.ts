import { mockProfessionals } from '../data/professionals';
import { mockServices } from '../data/services';

/**
 * Retorna os serviços de um profissional específico
 * Similar ao getProfessionalsServices mas focado em um único profissional
 */
export function getSpecificProfessionalServices(args: {
  professionalId: string;
}) {
  const { professionalId } = args;

  const professional = mockProfessionals.find(p => p.id === professionalId);

  if (!professional) {
    return {
      success: false,
      message: `Profissional com ID "${professionalId}" não encontrado`,
      availableProfessionalIds: mockProfessionals.map(p => p.id)
    };
  }

  const services = mockServices.filter(service =>
    professional.servicesOffered.includes(service.id)
  );

  // Calcula o preço total se contratar todos os serviços
  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
  const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);

  return {
    success: true,
    message: `${professional.name} oferece ${services.length} serviços`,
    data: {
      professionalInfo: {
        id: professional.id,
        name: professional.name,
        specialty: professional.specialty,
        experience: professional.experience,
        rating: professional.rating,
        bio: professional.bio
      },
      services,
      summary: {
        totalServices: services.length,
        totalPrice: `R$ ${totalPrice.toFixed(2)}`,
        totalDuration: `${totalDuration} minutos`,
        categories: [...new Set(services.map(s => s.category))]
      }
    }
  };
}
