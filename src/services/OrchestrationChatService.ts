import { IChatService } from '../interfaces/IChatService';
import { IntentClassifier, IntentType } from './IntentClassifier';
import { BookingValidationController, BookingSlots } from '../controllers/BookingValidationController';
import { sessionManager } from './SessionManager';
import { AnthropicChatService } from './AnthropicChatService';

/**
 * Serviço de orquestração que combina:
 * - IntentClassifier: Determina se é QUERY (informativa) ou BOOK_SLOT (transacional)
 * - BookingValidationController: Valida regras de negócio do agendamento
 * - AnthropicChatService: Gera respostas conversacionais
 *
 * Implementa o fluxo descrito em ideia.txt:
 * User → LLM extrai intenção/slots → Node.js valida regras → LLM responde naturalmente
 */
export class OrchestrationChatService implements IChatService {
  private intentClassifier: IntentClassifier;
  private bookingValidator: BookingValidationController;
  private aiService: IChatService;

  constructor(aiService?: IChatService) {
    this.intentClassifier = new IntentClassifier();
    this.bookingValidator = new BookingValidationController();
    // Usa Anthropic por padrão (melhor function calling segundo ideia.txt)
    this.aiService = aiService || new AnthropicChatService('claude-3-haiku-20240307');
  }

  async processMessage(message: string, sessionId?: string): Promise<string> {
    if (!sessionId) {
      throw new Error('SessionId é obrigatório para OrchestrationChatService');
    }

    try {
      // 1. Classifica a intenção
      const hasActiveBooking = sessionManager.hasActiveBooking(sessionId);
      const classification = this.intentClassifier.classify(message, hasActiveBooking);

      console.log(`[Orchestration] Intenção: ${classification.type} (${(classification.confidence * 100).toFixed(0)}%)`);

      // 2. Processa baseado na intenção
      switch (classification.type) {
        case IntentType.QUERY:
          return await this.handleQuery(message, sessionId);

        case IntentType.BOOK_SLOT:
          return await this.handleBooking(message, sessionId, classification);

        case IntentType.CHANGE_MIND:
          return await this.handleChangeMind(sessionId);

        default:
          return await this.handleQuery(message, sessionId);
      }
    } catch (error) {
      console.error('Erro no OrchestrationChatService:', error);
      throw error;
    }
  }

  /**
   * QUERY: Perguntas informativas - não altera estado de agendamento
   * Exemplos: "Que serviços vocês têm?", "A Dra Ana atende sábado?"
   */
  private async handleQuery(message: string, sessionId: string): Promise<string> {
    console.log('[Orchestration] Processando QUERY (informativa)');

    // Delega para o serviço de IA responder normalmente
    return await this.aiService.processMessage(message, sessionId);
  }

  /**
   * BOOK_SLOT: Ação transacional - avança no agendamento
   * Exemplos: "Quero agendar massagem", "Prefiro com a Dra Ana"
   */
  private async handleBooking(
    message: string,
    sessionId: string,
    classification: any
  ): Promise<string> {
    console.log('[Orchestration] Processando BOOK_SLOT (transacional)');

    // Obtém estado atual do agendamento
    let bookingState = sessionManager.getBookingState(sessionId);

    if (!bookingState) {
      bookingState = {
        slots_coletados: [],
      };
    }

    // Extrai slots da mensagem (se houver)
    const extractedSlots = classification.extractedSlots || {};
    console.log('[Orchestration] Slots extraídos:', extractedSlots);

    // Atualiza slots coletados
    let updated = false;
    if (extractedSlots.servico) {
      // TODO: Converter nome do serviço para ID
      // Por enquanto, assume que já vem no formato correto
      bookingState.servico = extractedSlots.servico;
      if (!bookingState.slots_coletados.includes('servico')) {
        bookingState.slots_coletados.push('servico');
      }
      updated = true;
    }

    if (extractedSlots.profissional) {
      // TODO: Converter nome do profissional para ID
      bookingState.profissional = extractedSlots.profissional;
      if (!bookingState.slots_coletados.includes('profissional')) {
        bookingState.slots_coletados.push('profissional');
      }
      updated = true;
    }

    if (extractedSlots.data) {
      bookingState.data = extractedSlots.data;
      if (!bookingState.slots_coletados.includes('data')) {
        bookingState.slots_coletados.push('data');
      }
      updated = true;
    }

    if (extractedSlots.horario) {
      bookingState.horario = extractedSlots.horario;
      if (!bookingState.slots_coletados.includes('horario')) {
        bookingState.slots_coletados.push('horario');
      }
      updated = true;
    }

    // Valida o estado atual com as regras de negócio
    const validation = this.bookingValidator.validateBookingState(bookingState);
    console.log('[Orchestration] Validação:', validation);

    // Atualiza estado na sessão
    sessionManager.setBookingState(sessionId, bookingState);

    // Prepara contexto de validação para a IA
    let validationContext = '';

    if (!validation.valid) {
      validationContext = `
⚠️ VALIDAÇÃO DE AGENDAMENTO:
Erros encontrados:
${validation.errors?.map(e => `- ${e}`).join('\n')}

${validation.suggestions && validation.suggestions.length > 0 ?
`Sugestões:
${validation.suggestions.map(s => `- ${s}`).join('\n')}` : ''}
`;
    } else {
      // Gera sugestões inteligentes
      const smartSuggestions = this.bookingValidator.generateSmartSuggestions(bookingState);

      if (smartSuggestions.length > 0) {
        validationContext = `
✅ INFORMAÇÕES DE AGENDAMENTO:
${smartSuggestions.map(s => `- ${s}`).join('\n')}
`;
      }

      // Verifica se está completo
      if (this.bookingValidator.isBookingComplete(bookingState)) {
        validationContext += `
🎯 AGENDAMENTO COMPLETO!
Todos os dados necessários foram coletados:
- Serviço: ${bookingState.servico}
- Profissional: ${bookingState.profissional}
- Data: ${bookingState.data}
- Horário: ${bookingState.horario}

Confirme com o usuário se está tudo certo e se pode finalizar o agendamento.
`;
      } else {
        const missingSlots = ['servico', 'profissional', 'data', 'horario']
          .filter(slot => !bookingState.slots_coletados.includes(slot));

        validationContext += `
📋 INFORMAÇÕES PENDENTES:
${missingSlots.map(slot => `- ${slot}`).join('\n')}

Pergunte ao usuário sobre a próxima informação necessária de forma natural.
`;
      }
    }

    // Adiciona contexto de validação à mensagem do usuário
    const enhancedMessage = `${message}

${validationContext}`;

    // Delega para a IA responder naturalmente com base no contexto de validação
    sessionManager.addMessage(sessionId, 'user', message);
    const response = await this.aiService.processMessage(enhancedMessage, sessionId);

    return response;
  }

  /**
   * CHANGE_MIND: Usuário quer cancelar/mudar agendamento
   * Exemplos: "Cancelar", "Mudar de ideia", "Recomeçar"
   */
  private async handleChangeMind(sessionId: string): Promise<string> {
    console.log('[Orchestration] Processando CHANGE_MIND');

    // Limpa o estado de agendamento
    sessionManager.clearBookingState(sessionId);

    return 'Tudo bem! Limpei as informações do agendamento. Em que posso ajudar agora?';
  }
}
