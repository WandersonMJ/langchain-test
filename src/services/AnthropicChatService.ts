import Anthropic from '@anthropic-ai/sdk';
import { IChatService } from '../interfaces/IChatService';
import { sessionManager } from './SessionManager';
import { ToolDefinition } from '../types/tools';

/**
 * Serviço de chat usando Anthropic Claude com Tool Calling
 * Implementação paralela ao LangChainChatService para testes de comparação
 */
export class AnthropicChatService implements IChatService {
  private client: Anthropic;
  private model: string;

  constructor(modelName: string = 'claude-3-haiku-20240307') {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = modelName;
  }

  /**
   * Converte tools do formato LangChain para formato Anthropic
   */
  private convertToolsToAnthropicFormat(tools: any[]): any[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: this.convertZodSchemaToJsonSchema(tool.schema),
        required: this.getRequiredFields(tool.schema),
      },
    }));
  }

  /**
   * Converte schema Zod para JSON Schema (simplificado)
   */
  private convertZodSchemaToJsonSchema(zodSchema: any): any {
    const shape = zodSchema._def?.shape?.() || {};
    const properties: any = {};

    for (const [key, value] of Object.entries(shape)) {
      const field = value as any;
      properties[key] = {
        type: 'string',
        description: field._def?.description || '',
      };
    }

    return properties;
  }

  /**
   * Obtém campos obrigatórios do schema Zod
   */
  private getRequiredFields(zodSchema: any): string[] {
    const shape = zodSchema._def?.shape?.() || {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const field = value as any;
      if (!field.isOptional || !field.isOptional()) {
        required.push(key);
      }
    }

    return required;
  }

  async processMessage(message: string, sessionId?: string): Promise<string> {
    try {
      // Importa as tools dinamicamente
      const { allTools } = await import('../config/tools');

      // Gerenciamento de contexto de sessão
      let sessionContext = '';
      if (sessionId) {
        sessionManager.addMessage(sessionId, 'user', message);
        sessionContext = sessionManager.getSessionContext(sessionId);
      }

      // Injeta data e hora atual
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dayOfWeek = now.toLocaleDateString('pt-BR', { weekday: 'long' });

      const systemPrompt = `Você é um assistente virtual de uma clínica de beleza e bem-estar.

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

🎯 REGRAS DE OURO:
1. SEMPRE use as ferramentas para buscar informações - NUNCA invente dados
2. Escolha a ferramenta CERTA baseado na pergunta do usuário
3. Seja direto e objetivo nas respostas

📋 EXEMPLOS DE USO DAS FERRAMENTAS:

❓ Pergunta: "Quais serviços vocês têm?"
✅ Use: get_services (sem parâmetros)

❓ Pergunta: "Quem trabalha aí?"
✅ Use: get_available_professionals (sem parâmetros)

❓ Pergunta: "Quem trabalha HOJE?" / "Quem está trabalhando hoje?"
✅ Use: get_available_professionals com dayOfWeek="${dayOfWeek}"

❓ Pergunta: "O que o Carlos faz?" / "Quais serviços o Carlos oferece?"
✅ Use: get_specific_professional_services com professionalId="prof-001"

❓ Pergunta: "O Carlos está livre dia 15?" / "Horários do Carlos dia 15/01"
✅ Use: will_be_available com professionalId="prof-001" e date="2025-01-15"

❓ Pergunta: "O Carlos está livre HOJE?" / "Que horários o Carlos tem hoje?"
✅ Use: will_be_available com professionalId="prof-001" e date="${currentDate}"

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

⚠️ Quando o usuário falar "Carlos", "Maria", etc, converta para o ID correto antes de chamar a ferramenta!`;

      // Converte tools para formato Anthropic
      const anthropicTools = this.convertToolsToAnthropicFormat(allTools);

      const messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: message,
        },
      ];

      let iteration = 0;
      const MAX_ITERATIONS = 5;

      while (iteration < MAX_ITERATIONS) {
        iteration++;

        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages,
          tools: anthropicTools,
        });

        // Verifica se há tool calls
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        if (toolUseBlocks.length > 0) {
          console.log(`[${iteration}] Tools chamadas: ${toolUseBlocks.map(t => t.name).join(', ')}`);

          // Adiciona resposta do assistente
          messages.push({
            role: 'assistant',
            content: response.content,
          });

          // Executa as tools
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const toolUse of toolUseBlocks) {
            const tool = allTools.find(t => t.name === toolUse.name);

            if (tool) {
              try {
                const result = await tool.func(toolUse.input as any);
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: result,
                });
              } catch (error) {
                console.error(`Erro ao executar ${toolUse.name}:`, error);
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({ error: 'Erro ao executar ferramenta' }),
                  is_error: true,
                });
              }
            }
          }

          // Adiciona os resultados das tools
          messages.push({
            role: 'user',
            content: toolResults,
          });

          continue;
        }

        // Se não há tool calls, retorna a resposta
        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );

        if (textBlock) {
          const contentStr = textBlock.text;

          if (sessionId) {
            sessionManager.addMessage(sessionId, 'assistant', contentStr);
          }

          return contentStr;
        }

        return 'Desculpe, não consegui gerar uma resposta adequada.';
      }

      return 'Desculpe, a solicitação está muito complexa. Por favor, tente reformular sua pergunta.';
    } catch (error) {
      console.error('Erro ao processar mensagem com Anthropic:', error);
      throw new Error('Não foi possível processar sua mensagem');
    }
  }
}
