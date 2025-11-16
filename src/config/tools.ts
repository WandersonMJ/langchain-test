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
 * Configuração das ferramentas (tools) para o LangChain
 * Cada tool tem um nome, descrição e schema de validação
 * (Single Responsibility - cada tool faz apenas uma coisa)
 */

/**
 * Tool para listar serviços
 * Permite filtrar por categoria
 */
export const getServicesTool = new DynamicStructuredTool({
  name: 'get_services',
  description: 'Lista todos os serviços disponíveis. Pode filtrar por categoria (Barbearia, Spa, Estética, Cabeleireiro). Use esta ferramenta quando o usuário perguntar sobre serviços disponíveis, preços ou tipos de atendimento.',
  schema: z.object({
    category: z.string()
      .optional()
      .describe('Categoria do serviço (opcional): Barbearia, Spa, Estética, Cabeleireiro')
  }),
  func: async (input: { category?: string }) => {
    const result = getServices(input);
    return JSON.stringify(result, null, 2);
  }
});

/**
 * Tool para listar profissionais disponíveis
 * Permite filtrar por especialidade e dia da semana
 */
export const getAvailableProfessionalsTool = new DynamicStructuredTool({
  name: 'get_available_professionals',
  description: 'Lista profissionais disponíveis. Pode filtrar por especialidade (Barbearia, Spa, Estética, Cabeleireiro) ou dia da semana. Use quando o usuário perguntar sobre quem trabalha no estabelecimento ou qual profissional está disponível.',
  schema: z.object({
    specialty: z.string()
      .optional()
      .describe('Especialidade do profissional (opcional): Barbearia, Spa, Estética, Cabeleireiro'),
    dayOfWeek: z.string()
      .optional()
      .describe('Dia da semana (opcional): segunda, terça, quarta, quinta, sexta, sábado, domingo')
  }),
  func: async (input: { specialty?: string; dayOfWeek?: string }) => {
    const result = getAvailableProfessionals(input);
    return JSON.stringify(result, null, 2);
  }
});

/**
 * Tool para listar profissionais e seus serviços
 */
export const getProfessionalsServicesTool = new DynamicStructuredTool({
  name: 'get_professionals_services',
  description: 'Retorna a lista de profissionais com os serviços que cada um oferece. Útil para descobrir o que cada profissional faz.',
  schema: z.object({
    professionalId: z.string()
      .optional()
      .describe('ID do profissional específico (opcional). Ex: prof-001')
  }),
  func: async (input: { professionalId?: string }) => {
    const result = getProfessionalsServices(input);
    return JSON.stringify(result, null, 2);
  }
});

/**
 * Tool para ver serviços de um profissional específico
 */
export const getSpecificProfessionalServicesTool = new DynamicStructuredTool({
  name: 'get_specific_professional_services',
  description: 'Retorna informações detalhadas sobre um profissional específico e todos os serviços que ele oferece, incluindo preços e duração.',
  schema: z.object({
    professionalId: z.string()
      .describe('ID do profissional. Ex: prof-001, prof-002, etc.')
  }),
  func: async (input: { professionalId: string }) => {
    const result = getSpecificProfessionalServices(input);
    return JSON.stringify(result, null, 2);
  }
});

/**
 * Tool para verificar disponibilidade de um profissional
 */
export const willBeAvailableTool = new DynamicStructuredTool({
  name: 'will_be_available',
  description: 'Verifica se um profissional estará disponível em uma data específica e retorna os horários disponíveis. Use quando o usuário perguntar sobre disponibilidade ou quiser marcar um horário.',
  schema: z.object({
    professionalId: z.string()
      .describe('ID do profissional. Ex: prof-001'),
    date: z.string()
      .describe('Data no formato YYYY-MM-DD. Ex: 2025-01-15')
  }),
  func: async (input: { professionalId: string; date: string }) => {
    const result = willBeAvailable(input);
    return JSON.stringify(result, null, 2);
  }
});

/**
 * Tool para encontrar profissionais que oferecem um serviço
 */
export const getServicesByProfessionalTool = new DynamicStructuredTool({
  name: 'get_services_by_professional',
  description: 'Encontra todos os profissionais que oferecem um serviço específico, ordenados por avaliação. Use quando o usuário quiser saber quem faz determinado serviço.',
  schema: z.object({
    serviceId: z.string()
      .describe('ID do serviço. Ex: serv-001, serv-002, etc.')
  }),
  func: async (input: { serviceId: string }) => {
    const result = getServicesByProfessional(input);
    return JSON.stringify(result, null, 2);
  }
});

/**
 * Array com todas as ferramentas configuradas
 * Facilita a injeção no LangChain
 */
export const allTools = [
  getServicesTool,
  getAvailableProfessionalsTool,
  getProfessionalsServicesTool,
  getSpecificProfessionalServicesTool,
  willBeAvailableTool,
  getServicesByProfessionalTool
];
