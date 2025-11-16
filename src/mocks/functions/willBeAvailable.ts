import { mockProfessionals } from '../data/professionals';
import { mockAvailability } from '../data/availability';

/**
 * Verifica se um profissional estará disponível em uma data específica
 * Retorna os horários disponíveis
 */
export function willBeAvailable(args: {
  professionalId: string;
  date: string; // Formato: YYYY-MM-DD
}) {
  const { professionalId, date } = args;

  const professional = mockProfessionals.find(p => p.id === professionalId);

  if (!professional) {
    return {
      success: false,
      message: `Profissional com ID "${professionalId}" não encontrado`,
      availableProfessionalIds: mockProfessionals.map(p => p.id)
    };
  }

  // Verifica se tem horários disponíveis para essa data
  const availability = mockAvailability[professionalId as keyof typeof mockAvailability];

  if (!availability) {
    return {
      success: false,
      message: `Não há informações de disponibilidade para ${professional.name}`
    };
  }

  const availableSlots = availability[date as keyof typeof availability];

  if (!availableSlots || availableSlots.length === 0) {
    // Encontra as próximas datas disponíveis
    const nextDates = Object.keys(availability)
      .filter(d => d > date)
      .sort()
      .slice(0, 3);

    return {
      success: false,
      message: `${professional.name} não está disponível em ${date}`,
      data: {
        professional: {
          id: professional.id,
          name: professional.name,
          specialty: professional.specialty
        },
        requestedDate: date,
        available: false,
        nextAvailableDates: nextDates.length > 0 ? nextDates : ['Nenhuma data próxima disponível']
      }
    };
  }

  return {
    success: true,
    message: `${professional.name} está disponível em ${date} com ${availableSlots.length} horários`,
    data: {
      professional: {
        id: professional.id,
        name: professional.name,
        specialty: professional.specialty,
        rating: professional.rating
      },
      date,
      available: true,
      timeSlots: availableSlots,
      totalSlots: availableSlots.length
    }
  };
}
