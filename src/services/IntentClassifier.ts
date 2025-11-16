/**
 * Tipos de intenção do usuário
 */
export enum IntentType {
  QUERY = 'QUERY',           // Pergunta informativa (não muda estado)
  BOOK_SLOT = 'BOOK_SLOT',   // Ação de agendamento (muda estado)
  CHANGE_MIND = 'CHANGE_MIND' // Quer mudar/cancelar agendamento
}

export interface IntentClassification {
  type: IntentType;
  confidence: number;
  extractedSlots?: {
    servico?: string;
    profissional?: string;
    data?: string;
    horario?: string;
  };
}

/**
 * Classificador de intenções usando análise de padrões
 * Determina se a mensagem é informativa (QUERY) ou transacional (BOOK_SLOT)
 */
export class IntentClassifier {
  private queryPatterns = [
    // Perguntas sobre serviços
    /que serviços|quais serviços|o que vocês fazem|preço|quanto custa|valor/i,
    // Perguntas sobre profissionais
    /quem trabalha|quem atende|quais profissionais|quem faz/i,
    // Perguntas sobre disponibilidade (informativa)
    /está disponível|tem horário|trabalha em|atende em/i,
    // Perguntas gerais
    /o que é|como funciona|pode me explicar|me fale sobre/i,
  ];

  private bookingPatterns = [
    // Intenção de agendar
    /quero agendar|gostaria de agendar|queria marcar|quero marcar/i,
    // Preferências específicas
    /prefiro|escolho|quero com|com o|com a/i,
    // Confirmação de horários
    /esse horário|esse dia|confirmo|pode ser|tá bom/i,
    // Escolha de opções
    /vou de|escolho o|pode marcar/i,
  ];

  private changeMindPatterns = [
    // Cancelamento
    /cancelar|desistir|não quero mais/i,
    // Mudança
    /mudar|trocar|alterar|na verdade|melhor não/i,
    // Recomeçar
    /começar de novo|recomeçar|esqueça|deixa pra lá/i,
  ];

  private datePatterns = [
    // Datas relativas
    /hoje|amanhã|depois de amanhã/i,
    // Dias da semana
    /segunda|terça|quarta|quinta|sexta|sábado|domingo/i,
    // Datas absolutas
    /\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}/,
  ];

  private timePatterns = [
    // Horários
    /\d{1,2}h\d{0,2}|\d{1,2}:\d{2}/,
    // Períodos
    /manhã|tarde|noite/i,
  ];

  /**
   * Classifica a intenção da mensagem
   */
  classify(message: string, hasActiveBooking: boolean = false): IntentClassification {
    const normalizedMessage = message.toLowerCase().trim();

    // 1. Verifica se é CHANGE_MIND
    const changeMindScore = this.calculatePatternScore(
      normalizedMessage,
      this.changeMindPatterns
    );
    if (changeMindScore > 0.5) {
      return {
        type: IntentType.CHANGE_MIND,
        confidence: changeMindScore,
      };
    }

    // 2. Verifica se é BOOK_SLOT
    const bookingScore = this.calculatePatternScore(
      normalizedMessage,
      this.bookingPatterns
    );

    // 3. Verifica se é QUERY
    const queryScore = this.calculatePatternScore(
      normalizedMessage,
      this.queryPatterns
    );

    // Se tem agendamento ativo e menciona data/horário, provavelmente é BOOK_SLOT
    if (hasActiveBooking) {
      const hasDate = this.datePatterns.some(p => p.test(normalizedMessage));
      const hasTime = this.timePatterns.some(p => p.test(normalizedMessage));

      if (hasDate || hasTime) {
        return {
          type: IntentType.BOOK_SLOT,
          confidence: 0.8,
          extractedSlots: this.extractSlots(message),
        };
      }

      // Se é uma resposta curta (sim, não, ok, etc), provavelmente é confirmação
      if (this.isShortConfirmation(normalizedMessage)) {
        return {
          type: IntentType.BOOK_SLOT,
          confidence: 0.7,
        };
      }
    }

    // Compara scores
    if (bookingScore > queryScore) {
      return {
        type: IntentType.BOOK_SLOT,
        confidence: bookingScore,
        extractedSlots: this.extractSlots(message),
      };
    }

    // Se menciona "quero", "gostaria" sem ser pergunta, é BOOK_SLOT
    if (/quero|gostaria|prefiro/.test(normalizedMessage) && !/\?$/.test(message)) {
      return {
        type: IntentType.BOOK_SLOT,
        confidence: 0.7,
        extractedSlots: this.extractSlots(message),
      };
    }

    // Por padrão, é QUERY
    return {
      type: IntentType.QUERY,
      confidence: Math.max(queryScore, 0.5),
    };
  }

  /**
   * Calcula score de correspondência com padrões
   */
  private calculatePatternScore(message: string, patterns: RegExp[]): number {
    const matches = patterns.filter(pattern => pattern.test(message)).length;
    return matches / patterns.length;
  }

  /**
   * Verifica se é uma resposta curta de confirmação
   */
  private isShortConfirmation(message: string): boolean {
    const confirmations = [
      /^sim$/i,
      /^não$/i,
      /^ok$/i,
      /^tá$/i,
      /^pode ser$/i,
      /^confirmo$/i,
      /^esse mesmo$/i,
      /^esse$/i,
      /^este$/i,
    ];

    return confirmations.some(pattern => pattern.test(message));
  }

  /**
   * Extrai informações de slots da mensagem
   */
  private extractSlots(message: string): {
    servico?: string;
    profissional?: string;
    data?: string;
    horario?: string;
  } {
    const slots: any = {};

    // Extrai datas
    const dateMatch = message.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      slots.data = dateMatch[0];
    }

    // Extrai horários
    const timeMatch = message.match(/\d{1,2}:\d{2}/);
    if (timeMatch) {
      slots.horario = timeMatch[0];
    }

    // Extrai nomes de profissionais conhecidos
    const professionalNames = ['carlos', 'maria', 'ana', 'juliana', 'roberto'];
    const lowerMessage = message.toLowerCase();
    for (const name of professionalNames) {
      if (lowerMessage.includes(name)) {
        slots.profissional = name;
        break;
      }
    }

    // Extrai serviços conhecidos
    const serviceNames = [
      'corte',
      'barba',
      'massagem',
      'manicure',
      'pedicure',
      'limpeza de pele',
      'coloração',
      'escova',
    ];
    for (const service of serviceNames) {
      if (lowerMessage.includes(service)) {
        slots.servico = service;
        break;
      }
    }

    return slots;
  }

  /**
   * Determina se deve avançar no agendamento ou apenas responder
   */
  shouldAdvanceBooking(classification: IntentClassification): boolean {
    return (
      classification.type === IntentType.BOOK_SLOT &&
      classification.confidence > 0.6
    );
  }

  /**
   * Determina se deve limpar o agendamento atual
   */
  shouldClearBooking(classification: IntentClassification): boolean {
    return (
      classification.type === IntentType.CHANGE_MIND &&
      classification.confidence > 0.6
    );
  }
}
