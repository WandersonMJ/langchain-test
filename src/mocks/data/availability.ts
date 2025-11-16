/**
 * Dados mockados de disponibilidade de horários
 * Gera horários dinamicamente para os próximos 7 dias baseado na data atual
 */

interface TimeSlot {
  [date: string]: string[];
}

interface AvailabilityData {
  [professionalId: string]: TimeSlot;
}

/**
 * Configuração de horários por profissional
 * Define quais dias da semana cada profissional trabalha
 */
const professionalSchedules = {
  'prof-001': {
    // Carlos Silva - Barbeiro
    workDays: ['segunda', 'terça', 'quarta', 'quinta', 'sexta'],
    timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  },
  'prof-002': {
    // Maria Santos - Esteticista
    workDays: ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'],
    timeSlots: ['10:00', '11:30', '14:00', '15:00', '16:30'],
  },
  'prof-003': {
    // Ana Costa - Massoterapeuta
    workDays: ['terça', 'quinta', 'sábado'],
    timeSlots: ['10:00', '14:00', '16:00'],
  },
  'prof-004': {
    // Juliana Oliveira - Cabeleireira
    workDays: ['segunda', 'quarta', 'quinta', 'sexta', 'sábado'],
    timeSlots: ['09:00', '11:00', '14:00', '16:00'],
  },
  'prof-005': {
    // Roberto Almeida - Barbeiro
    workDays: ['terça', 'quarta', 'quinta', 'sexta', 'sábado'],
    timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
  },
};

/**
 * Normaliza o nome do dia da semana
 */
function normalizeDayName(day: string): string {
  const dayMap: { [key: string]: string } = {
    'sunday': 'domingo',
    'monday': 'segunda',
    'tuesday': 'terça',
    'wednesday': 'quarta',
    'thursday': 'quinta',
    'friday': 'sexta',
    'saturday': 'sábado',
  };
  return dayMap[day] || day;
}

/**
 * Gera disponibilidade dinâmica para os próximos N dias
 */
function generateDynamicAvailability(daysAhead: number = 7): AvailabilityData {
  const availability: AvailabilityData = {};
  const today = new Date();

  // Para cada profissional
  for (const [profId, schedule] of Object.entries(professionalSchedules)) {
    availability[profId] = {};

    // Gera horários para os próximos N dias
    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Formata data como YYYY-MM-DD
      const dateStr = date.toISOString().split('T')[0];

      // Pega dia da semana
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayName = normalizeDayName(dayOfWeek);

      // Se o profissional trabalha nesse dia, adiciona horários
      if (schedule.workDays.includes(dayName)) {
        // Varia um pouco os horários para parecer mais realista
        const availableSlots = [...schedule.timeSlots];

        // Remove aleatoriamente 0-2 horários para simular agenda parcialmente ocupada
        const slotsToRemove = Math.floor(Math.random() * 3);
        for (let j = 0; j < slotsToRemove; j++) {
          const randomIndex = Math.floor(Math.random() * availableSlots.length);
          availableSlots.splice(randomIndex, 1);
        }

        if (availableSlots.length > 0) {
          availability[profId][dateStr] = availableSlots.sort();
        }
      }
    }
  }

  return availability;
}

/**
 * Exporta a disponibilidade gerada dinamicamente
 * Regenera a cada importação, mantendo sempre atualizado
 */
export const mockAvailability = generateDynamicAvailability(7);
