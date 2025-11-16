import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, ToolMessage, BaseMessage } from '@langchain/core/messages';
import { IChatService } from '../interfaces/IChatService';
import { allTools } from '../config/tools';
import { sessionManager } from './SessionManager';

/**
 * Serviço de chat usando LangChain e OpenAI com Tool Calling
 * OTIMIZADO: System prompt com exemplos claros de quando usar cada tool
 */
export class LangChainChatService implements IChatService {
  private model: any;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.3, // Reduzido para ser mais preciso
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).bindTools(allTools);
  }

  async processMessage(message: string, sessionId?: string): Promise<string> {
    try {
      // Gerenciamento de contexto de sessão
      let sessionContext = '';
      if (sessionId) {
        // Salva mensagem do usuário
        sessionManager.addMessage(sessionId, 'user', message);

        // Pega histórico formatado
        sessionContext = sessionManager.getSessionContext(sessionId);
      }

      // Injeta data e hora atual
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dayOfWeek = now.toLocaleDateString('pt-BR', { weekday: 'long' });
      
      const systemMessage = new SystemMessage(
        `Você é um assistente virtual de uma clínica de beleza e bem-estar.

📅 INFORMAÇÕES DE CONTEXTO ATUAL:
- Data de hoje: ${currentDate} (${dayOfWeek})
- Horário atual: ${currentTime}
- Use essas informações quando o usuário falar "hoje", "agora", "amanhã", etc.

${sessionContext}

💡 Use o histórico acima para entender o contexto da conversa.
Se o usuário disser "e ele?" ou "esse profissional", consulte o histórico.

🎨 REGRAS DE FORMATAÇÃO DE RESPOSTA:

1. Seja EXTREMAMENTE CONCISO
2. Ao listar profissionais, retorne APENAS nome e especialidade:
   ✅ "Carlos Silva (Barbeiro), Maria Santos (Esteticista)"
   ❌ NÃO inclua: bio, foto, experiência, avaliação

3. Ao listar serviços, retorne APENAS nome e preço:
   ✅ "Corte Masculino (R$ 45), Barba (R$ 30)"
   ❌ NÃO inclua: descrição, duração

4. Use bullet points SOMENTE quando listar 5+ itens

5. Se o usuário pedir "detalhes" ou "mais informações", AÍ SIM retorne tudo

EXEMPLO BOM:
Pergunta: "Quem trabalha hoje?"
Resposta: "Temos Carlos (Barbeiro), Maria (Esteticista), Ana (Massoterapeuta), Juliana (Cabeleireira) e Roberto (Barbeiro)."

EXEMPLO RUIM:
Resposta: "1. **Carlos Silva** (Barbearia)
   - Experiência: 8 anos
   - Avaliação: 4.9..."

🎯 REGRAS DE OURO:
1. SEMPRE use as ferramentas para buscar informações - NUNCA invente dados
2. Escolha a ferramenta CERTA baseado na pergunta do usuário
3. Seja direto e objetivo nas respostas

📋 EXEMPLOS DE USO DAS FERRAMENTAS:

❓ Pergunta: "Quais serviços vocês têm?"
✅ Use: get_services (sem parâmetros)

❓ Pergunta: "Quanto custa corte de cabelo?"
✅ Use: get_services (sem parâmetros) → depois responda o preço

❓ Pergunta: "Quem trabalha aí?"
✅ Use: get_available_professionals (sem parâmetros)

❓ Pergunta: "O que o Carlos faz?" / "Quais serviços o Carlos oferece?"
✅ Use: get_specific_professional_services com professionalId="prof-001"

❓ Pergunta: "O Carlos faz barba?" / "A Maria faz manicure?"
✅ Use: get_professionals_services com professionalId="prof-001" (para confirmar SE oferece)

❓ Pergunta: "O Carlos está livre dia 15?"
✅ Use: will_be_available com professionalId="prof-001" e date="2025-01-15"

❓ Pergunta: "Quem faz massagem?"
✅ Use: get_services_by_professional com serviceId="serv-003"

❓ Pergunta: "Quais barbeiros trabalham na segunda?"
✅ Use: get_available_professionals com specialty="Barbearia" e dayOfWeek="segunda"

🗓️ DATAS DISPONÍVEIS: 14/01/2025 até 18/01/2025

💡 MAPEAMENTO DE IDs (memorize isso):
Profissionais:
- prof-001: Carlos Silva (Barbeiro)
- prof-002: Maria Santos (Esteticista)  
- prof-003: Ana Costa (Massoterapeuta)
- prof-004: Juliana Oliveira (Cabeleireira)
- prof-005: Roberto Almeida (Barbeiro)

Serviços:
- serv-001: Corte Masculino (R$ 45, 30min)
- serv-002: Barba Completa (R$ 30, 20min)
- serv-003: Massagem Relaxante (R$ 120, 60min)
- serv-004: Manicure (R$ 35, 40min)
- serv-005: Pedicure (R$ 40, 45min)
- serv-006: Limpeza de Pele (R$ 150, 90min)
- serv-007: Coloração (R$ 200, 120min)
- serv-008: Escova Progressiva (R$ 350, 180min)

⚠️ Quando o usuário falar "Carlos", "Maria", etc, converta para o ID correto antes de chamar a ferramenta!`
      );

      const humanMessage = new HumanMessage(message);
      const messages: BaseMessage[] = [systemMessage, humanMessage];

      let iteration = 0;
      const MAX_ITERATIONS = 5;

      while (iteration < MAX_ITERATIONS) {
        iteration++;

        const response = await this.model.invoke(messages);

        if (response.tool_calls && response.tool_calls.length > 0) {
          // Log apenas nomes das tools (não os resultados gigantes)
          const toolNames = response.tool_calls.map(tc => tc.name).join(', ');
          console.log(`[${iteration}] Tools chamadas: ${toolNames}`);

          messages.push(response);

          for (const toolCall of response.tool_calls) {
            const tool = allTools.find(t => t.name === toolCall.name);

            if (tool) {
              try {
                const result = await tool.func(toolCall.args as any);
                messages.push(
                  new ToolMessage({
                    content: result,
                    tool_call_id: toolCall.id,
                  })
                );
              } catch (error) {
                console.error(`Erro ao executar ${toolCall.name}:`, error);
                messages.push(
                  new ToolMessage({
                    content: JSON.stringify({ error: 'Erro ao executar ferramenta' }),
                    tool_call_id: toolCall.id,
                  })
                );
              }
            }
          }
          continue;
        }

        const contentStr = response.content.toString();
        if (!contentStr || contentStr.trim() === '') {
          return 'Desculpe, não consegui gerar uma resposta adequada.';
        }

        // Salva resposta do assistente no histórico
        if (sessionId) {
          sessionManager.addMessage(sessionId, 'assistant', contentStr);
        }

        return contentStr;
      }

      return 'Desculpe, a solicitação está muito complexa. Por favor, tente reformular sua pergunta.';

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      throw new Error('Não foi possível processar sua mensagem');
    }
  }
}