import { mockProfessionals } from '../data/professionals';

/**
 * Retorna profissionais disponíveis
 * Opcionalmente filtra por especialidade ou dia da semana
 */
export function getAvailableProfessionals(args?: {
  specialty?: string;
  dayOfWeek?: string;
}) {
  const { specialty, dayOfWeek } = args || {};

  let filtered = [...mockProfessionals];

  if (specialty) {
    filtered = filtered.filter(
      prof => prof.specialty.toLowerCase() === specialty.toLowerCase()
    );
  }

  if (dayOfWeek) {
    filtered = filtered.filter(prof =>
      prof.availableDays.some(day =>
        day.toLowerCase() === dayOfWeek.toLowerCase()
      )
    );
  }

  return {
    success: true,
    message: `Encontrados ${filtered.length} profissionais`,
    filters: {
      specialty: specialty || 'todas',
      dayOfWeek: dayOfWeek || 'todos'
    },
    data: filtered
  };
}
