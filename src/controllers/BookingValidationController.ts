import { mockProfessionals } from '../mocks/data/professionals';
import { mockServices } from '../mocks/data/services';
import { mockAvailability } from '../mocks/data/availability';

/**
 * Tipos para o estado de agendamento
 */
export interface BookingSlots {
  servico?: string;         // ID do serviço
  profissional?: string;    // ID do profissional
  data?: string;            // Data no formato YYYY-MM-DD
  horario?: string;         // Horário no formato HH:MM
  slots_coletados: string[]; // Lista de slots já preenchidos
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  suggestions?: string[];
  availableOptions?: {
    professionals?: any[];
    services?: any[];
    dates?: string[];
    times?: string[];
  };
}

/**
 * Controlador para validação de regras de negócio do agendamento
 * Valida constraints interdependentes: profissional ↔ serviço ↔ horário ↔ agenda
 */
export class BookingValidationController {
  /**
   * Valida o estado atual do agendamento e retorna opções válidas
   */
  validateBookingState(slots: BookingSlots): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      availableOptions: {},
    };

    // 1. Se tem serviço, valida e retorna profissionais que oferecem esse serviço
    if (slots.servico) {
      const service = mockServices.find(s => s.id === slots.servico);

      if (!service) {
        result.valid = false;
        result.errors?.push(`Serviço ${slots.servico} não encontrado`);
        return result;
      }

      // Filtra profissionais que oferecem esse serviço
      const availableProfessionals = mockProfessionals.filter(prof =>
        prof.servicesOffered.includes(slots.servico!)
      );

      result.availableOptions!.professionals = availableProfessionals.map(prof => ({
        id: prof.id,
        name: prof.name,
        specialty: prof.specialty,
        rating: prof.rating,
      }));

      // Se já tem profissional, valida se ele oferece esse serviço
      if (slots.profissional) {
        const professionalOffersService = availableProfessionals.some(
          p => p.id === slots.profissional
        );

        if (!professionalOffersService) {
          result.valid = false;
          result.errors?.push(
            `Profissional ${slots.profissional} não oferece o serviço ${service.name}`
          );
          result.suggestions?.push(
            `Profissionais disponíveis para ${service.name}: ${availableProfessionals
              .map(p => p.name)
              .join(', ')}`
          );
          return result;
        }
      }
    }

    // 2. Se tem profissional, valida e retorna serviços que ele oferece
    if (slots.profissional) {
      const professional = mockProfessionals.find(p => p.id === slots.profissional);

      if (!professional) {
        result.valid = false;
        result.errors?.push(`Profissional ${slots.profissional} não encontrado`);
        return result;
      }

      // Busca os serviços que o profissional oferece
      const professionalServices = mockServices.filter(s =>
        professional.servicesOffered.includes(s.id)
      );

      result.availableOptions!.services = professionalServices.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
      }));

      // Se já tem serviço, valida se o profissional oferece
      if (slots.servico) {
        const professionalOffersService = professional.servicesOffered.includes(slots.servico);

        if (!professionalOffersService) {
          result.valid = false;
          const service = mockServices.find(s => s.id === slots.servico);
          result.errors?.push(
            `Profissional ${professional.name} não oferece o serviço ${service?.name}`
          );
          result.suggestions?.push(
            `Serviços oferecidos por ${professional.name}: ${professionalServices
              .map(s => s.name)
              .join(', ')}`
          );
          return result;
        }
      }
    }

    // 3. Se tem data e profissional, valida disponibilidade
    if (slots.data && slots.profissional) {
      const professionalAvailability = mockAvailability[slots.profissional];

      if (!professionalAvailability || !professionalAvailability[slots.data]) {
        result.valid = false;
        result.errors?.push(
          `Profissional não está disponível na data ${slots.data}`
        );

        // Sugere próximas datas disponíveis
        if (professionalAvailability) {
          const nextAvailableDates = Object.keys(professionalAvailability)
            .filter(date => date > slots.data!)
            .sort()
            .slice(0, 3);

          if (nextAvailableDates.length > 0) {
            result.suggestions?.push(
              `Próximas datas disponíveis: ${nextAvailableDates.join(', ')}`
            );
          }
        }

        return result;
      }

      // Retorna horários disponíveis
      result.availableOptions!.times = professionalAvailability[slots.data];

      // Se já tem horário, valida se está disponível
      if (slots.horario) {
        const timeAvailable = professionalAvailability[slots.data].includes(slots.horario);

        if (!timeAvailable) {
          result.valid = false;
          result.errors?.push(`Horário ${slots.horario} não está disponível`);
          result.suggestions?.push(
            `Horários disponíveis: ${result.availableOptions!.times!.join(', ')}`
          );
          return result;
        }
      }
    }

    // 4. Verifica se todos os slots necessários foram preenchidos
    const requiredSlots = ['servico', 'profissional', 'data', 'horario'];
    const missingSlots = requiredSlots.filter(
      slot => !slots.slots_coletados.includes(slot)
    );

    if (missingSlots.length > 0) {
      result.warnings?.push(
        `Informações pendentes: ${missingSlots.join(', ')}`
      );
    }

    return result;
  }

  /**
   * Atualiza o estado do agendamento com um novo slot
   */
  updateBookingSlots(
    currentSlots: BookingSlots,
    slotName: keyof Omit<BookingSlots, 'slots_coletados'>,
    value: string
  ): BookingSlots {
    const updatedSlots = { ...currentSlots };
    updatedSlots[slotName] = value;

    if (!updatedSlots.slots_coletados.includes(slotName)) {
      updatedSlots.slots_coletados.push(slotName);
    }

    return updatedSlots;
  }

  /**
   * Limpa todos os slots (para CHANGE_MIND)
   */
  clearBookingSlots(): BookingSlots {
    return {
      slots_coletados: [],
    };
  }

  /**
   * Verifica se o agendamento está completo
   */
  isBookingComplete(slots: BookingSlots): boolean {
    return (
      slots.slots_coletados.includes('servico') &&
      slots.slots_coletados.includes('profissional') &&
      slots.slots_coletados.includes('data') &&
      slots.slots_coletados.includes('horario')
    );
  }

  /**
   * Gera sugestões inteligentes baseadas no estado atual
   */
  generateSmartSuggestions(slots: BookingSlots): string[] {
    const suggestions: string[] = [];

    // Se tem profissional mas não tem serviço, sugere serviços populares
    if (slots.profissional && !slots.servico) {
      const professional = mockProfessionals.find(p => p.id === slots.profissional);
      if (professional) {
        const topServices = mockServices
          .filter(s => professional.servicesOffered.includes(s.id))
          .slice(0, 3);
        suggestions.push(
          `Serviços mais procurados de ${professional.name}: ${topServices
            .map(s => s.name)
            .join(', ')}`
        );
      }
    }

    // Se tem serviço mas não tem profissional, sugere o melhor avaliado
    if (slots.servico && !slots.profissional) {
      const availableProfessionals = mockProfessionals
        .filter(prof => prof.servicesOffered.includes(slots.servico!))
        .sort((a, b) => b.rating - a.rating);

      if (availableProfessionals.length > 0) {
        const best = availableProfessionals[0];
        suggestions.push(
          `Recomendamos ${best.name} (avaliação ${best.rating}) para este serviço`
        );
      }
    }

    // Se tem profissional e serviço mas não tem data, sugere próximas datas
    if (slots.profissional && slots.servico && !slots.data) {
      const today = new Date().toISOString().split('T')[0];
      const professionalAvailability = mockAvailability[slots.profissional];

      if (professionalAvailability) {
        const nextDates = Object.keys(professionalAvailability)
          .filter(date => date >= today)
          .sort()
          .slice(0, 3);

        if (nextDates.length > 0) {
          suggestions.push(`Próximas datas disponíveis: ${nextDates.join(', ')}`);
        }
      }
    }

    return suggestions;
  }
}
