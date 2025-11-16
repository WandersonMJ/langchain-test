import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  getServices,
  getAvailableProfessionals,
  getProfessionalsServices,
  getSpecificProfessionalServices,
  willBeAvailable,
  getServicesByProfessional
} from '../mocks/functions';

/**
 * Tool para listar serviços disponíveis
 * USO: Quando perguntarem sobre serviços, preços, duração, categorias
 */
export const getServicesTool = new DynamicStructuredTool({
  name: 'get_services',
  description: `Use SOMENTE quando o usuário perguntar sobre:
- "Que serviços vocês têm?"
- "Quanto custa X?"
- "Preço de corte/barba/massagem"
- "Serviços de barbearia/spa/estética"

NÃO use para buscar profissionais ou horários.`,
  schema: z.object({
    category: z.string()
      .optional()
      .describe('Use APENAS se o usuário mencionar: Barbearia, Spa, Estética ou Cabeleireiro')
  }),
  func: async (input: { category?: string }) => {
    const result = getServices(input);
    return JSON.stringify(result, null, 2);
  }
});

/**
 * Tool para listar profissionais
 * USO: Quando perguntarem quem trabalha, lista de profissionais
 */
export const getAvailableProfessionalsTool = new DynamicStructuredTool({
  name: 'get_available_professionals',
  description: `Use SOMENTE para perguntas tipo:
- "Quem trabalha aí?"
- "Que profissionais vocês têm?"
- "Quais barbeiros/esteticistas trabalham aí?"
- "Quem trabalha na segunda-feira?"

Retorna LISTA RESUMIDA de profissionais (nome, especialidade, rating).
NÃO use para ver serviços de um profissional específico.`,
  schema: z.object({
    specialty: z.string()
      .optional()
      .describe('Use SE o usuário mencionar: Barbearia, Spa, Estética ou Cabeleireiro'),
    dayOfWeek: z.string()
      .optional()
      .describe('Use SE o usuário mencionar dia específico: segunda, terça, quarta, quinta, sexta, sábado, domingo')
  }),
  func: async (input: { specialty?: string; dayOfWeek?: string }) => {
    const result = getAvailableProfessionals(input);
    return JSON.stringify(result, null, 2);
  }
});

/**
 * Tool para ver detalhes de UM profissional específico
 * USO: Quando perguntarem sobre um profissional por nome
 */
export const getSpecificProfessionalServicesTool = new DynamicStructuredTool({
  name: 'get_specific_professional_services',
  description: `Use SOMENTE quando o usuário perguntar sobre UM profissional ESPECÍFICO:
- "O que o Carlos faz?"
- "Quais serviços a Maria oferece?"
- "Me fale sobre o profissional X"
- "Quanto custa com o Carlos?"

Retorna: biografia, experiência, rating, lista COMPLETA de serviços com preços.

IDs disponíveis:
- prof-001: Carlos Silva (Barbeiro)
- prof-002: Maria Santos (Esteticista)
- prof-003: Ana Costa (Massoterapeuta)
- prof-004: Juliana Oliveira (Cabeleireira)
- prof-005: Roberto Almeida (Barbeiro)`,
  schema: z.object({
    professionalId: z.string()
      .describe('ID do profissional. Exemplos: prof-001 (Carlos), prof-002 (Maria), prof-003 (Ana), prof-004 (Juliana), prof-005 (Roberto)')
  }),
  func: async (input: { professionalId: string }) => {
    const result = getSpecificProfessionalServices(input);
    return JSON.stringify(result, null, 2);
  }
});

/**
 * Tool para verificar disponibilidade em uma DATA específica
 * USO: Quando mencionarem data/horário
 */
export const willBeAvailableTool = new DynamicStructuredTool({
  name: 'will_be_available',
  description: `Use SOMENTE quando o usuário mencionar DATA ESPECÍFICA:
- "O Carlos está livre no dia 15?"
- "Que horários tem na quinta?"
- "Disponibilidade do profissional X em DD/MM"
- "Agenda do Carlos amanhã"
- "O Carlos trabalha hoje?"

Retorna: lista de horários disponíveis naquela data.
Datas disponíveis: próximos 7 dias a partir de hoje

IDs: prof-001 (Carlos), prof-002 (Maria), prof-003 (Ana), prof-004 (Juliana), prof-005 (Roberto)`,
  schema: z.object({
    professionalId: z.string()
      .describe('ID do profissional. Ex: prof-001 para Carlos Silva'),
    date: z.string()
      .describe('Data no formato YYYY-MM-DD. Exemplo: 2025-01-15. Converter datas faladas pelo usuário para este formato.')
  }),
  func: async (input: { professionalId: string; date: string }) => {
    const result = willBeAvailable(input);
    return JSON.stringify(result, null, 2);
  }
});

/**
 * Tool para encontrar QUEM FAZ um serviço
 * USO: Quando perguntarem quem oferece X serviço
 */
export const getServicesByProfessionalTool = new DynamicStructuredTool({
  name: 'get_services_by_professional',
  description: `Use SOMENTE quando o usuário perguntar QUEM FAZ um serviço:
- "Quem faz massagem?"
- "Que profissional corta cabelo?"
- "Quem oferece barba completa?"

Retorna: profissionais que oferecem aquele serviço (ordenados por rating).

IDs de serviços:
- serv-001: Corte Masculino
- serv-002: Barba Completa
- serv-003: Massagem Relaxante
- serv-004: Manicure
- serv-005: Pedicure
- serv-006: Limpeza de Pele
- serv-007: Coloração
- serv-008: Escova Progressiva`,
  schema: z.object({
    serviceId: z.string()
      .describe('ID do serviço. Exemplos: serv-001 (Corte), serv-002 (Barba), serv-003 (Massagem)')
  }),
  func: async (input: { serviceId: string }) => {
    const result = getServicesByProfessional(input);
    return JSON.stringify(result, null, 2);
  }
});

/**
 * Tool para verificar se um profissional FAZ determinado serviço
 * USO: Confirmar se X profissional oferece Y serviço
 */
export const getProfessionalsServicesTool = new DynamicStructuredTool({
  name: 'get_professionals_services',
  description: `Use SOMENTE para CONFIRMAR se um profissional específico FAZ determinado serviço:
- "O Carlos faz barba?" (confirmar SE oferece)
- "A Maria faz manicure?" (verificar SE presta o serviço)
- "O Roberto trabalha com coloração?" (checar SE tem esse serviço)

NÃO use para:
❌ Ver TODOS os serviços de um profissional → use get_specific_professional_services
❌ Descobrir QUEM faz um serviço → use get_services_by_professional
❌ Listar profissionais → use get_available_professionals

Use COM professionalId se souber o profissional específico.
Use SEM professionalId para ver TODOS os profissionais e seus serviços.`,
  schema: z.object({
    professionalId: z.string()
      .optional()
      .describe('ID do profissional específico (opcional). Ex: prof-001 (Carlos), prof-002 (Maria)')
  }),
  func: async (input: { professionalId?: string }) => {
    const result = getProfessionalsServices(input);
    return JSON.stringify(result, null, 2);
  }
});

export const allTools = [
  getServicesTool,
  getAvailableProfessionalsTool,
  getProfessionalsServicesTool,
  getSpecificProfessionalServicesTool,
  willBeAvailableTool,
  getServicesByProfessionalTool
];