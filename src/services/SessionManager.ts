interface SessionContext {
  sessionId: string;
  lastQuery: string;
  lastProfessionals: any[];
  lastServices: any[];
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  lastAccess: Date;
}

class SessionManager {
  private sessions: Map<string, SessionContext> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos em milissegundos

  constructor() {
    // Limpar sessões expiradas a cada 5 minutos
    setInterval(() => this.cleanExpiredSessions(), 5 * 60 * 1000);
  }

  /**
   * Obtém uma sessão existente ou cria uma nova
   */
  getOrCreateSession(sessionId: string): SessionContext {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        lastQuery: '',
        lastProfessionals: [],
        lastServices: [],
        conversationHistory: [],
        createdAt: new Date(),
        lastAccess: new Date(),
      };
      this.sessions.set(sessionId, session);
    } else {
      session.lastAccess = new Date();
    }

    return session;
  }

  /**
   * Atualiza dados da sessão
   */
  updateSession(sessionId: string, data: Partial<Omit<SessionContext, 'sessionId' | 'createdAt' | 'conversationHistory'>>): void {
    const session = this.getOrCreateSession(sessionId);
    Object.assign(session, data);
    session.lastAccess = new Date();
  }

  /**
   * Adiciona uma mensagem ao histórico da sessão
   */
  addMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.getOrCreateSession(sessionId);

    session.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Limita histórico às últimas 10 mensagens
    if (session.conversationHistory.length > 10) {
      session.conversationHistory = session.conversationHistory.slice(-10);
    }

    session.lastAccess = new Date();
  }

  /**
   * Retorna o contexto da sessão formatado como string
   */
  getSessionContext(sessionId: string): string {
    const session = this.sessions.get(sessionId);

    if (!session || session.conversationHistory.length === 0) {
      return '';
    }

    const history = session.conversationHistory
      .map(msg => {
        const role = msg.role === 'user' ? 'Usuário' : 'Você';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    return `
📝 HISTÓRICO DA CONVERSA:
${history}
`;
  }

  /**
   * Remove sessões expiradas
   */
  cleanExpiredSessions(): void {
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceLastAccess = now - session.lastAccess.getTime();

      if (timeSinceLastAccess > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        console.log(`Sessão ${sessionId} expirada e removida`);
      }
    }
  }

  /**
   * Retorna estatísticas das sessões (para debugging)
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      sessions: Array.from(this.sessions.values()).map(s => ({
        sessionId: s.sessionId,
        messageCount: s.conversationHistory.length,
        createdAt: s.createdAt,
        lastAccess: s.lastAccess,
      })),
    };
  }
}

// Exporta singleton
export const sessionManager = new SessionManager();
