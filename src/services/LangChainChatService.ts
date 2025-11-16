import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { IChatService } from '../interfaces/IChatService';
import { allTools } from '../config/tools';

/**
 * Serviço de chat usando LangChain e OpenAI com Tool Calling
 * Responsável por processar mensagens usando LLM com ferramentas disponíveis
 * (Single Responsibility Principle - SOLID)
 */
export class LangChainChatService implements IChatService {
  private model: any;

  constructor() {
    // Inicializa o modelo de chat da OpenAI com tools
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).bindTools(allTools);
  }

  /**
   * Processa uma mensagem do usuário e retorna a resposta do LLM
   * O LLM pode usar ferramentas (tools) para buscar informações
   *
   * @param message - Mensagem do usuário
   * @returns Promise com a resposta do assistente
   */
  async processMessage(message: string): Promise<string> {
    try {
      const systemMessage = new SystemMessage(
        `Você é um assistente virtual de uma clínica de beleza e bem-estar.

Você tem acesso a várias ferramentas para ajudar os clientes:
- Consultar serviços disponíveis e preços
- Verificar profissionais disponíveis
- Checar horários disponíveis
- Encontrar quem oferece determinado serviço

Seja amigável, prestativo e sempre use as ferramentas disponíveis para fornecer informações precisas.
Quando o usuário perguntar sobre serviços, profissionais ou horários, USE AS FERRAMENTAS para buscar as informações.

Importante: As datas disponíveis vão de 2025-01-14 a 2025-01-18.`
      );

      const humanMessage = new HumanMessage(message);

      // Array de mensagens que vamos construir iterativamente
      const messages = [systemMessage, humanMessage];

      // Loop de execução de tools (máximo 5 iterações para evitar loops infinitos)
      let iteration = 0;
      const MAX_ITERATIONS = 5;

      while (iteration < MAX_ITERATIONS) {
        iteration++;
        console.log(`[Tool Calling] Iteração ${iteration}`);

        // Chama o modelo com as mensagens acumuladas
        const response = await this.model.invoke(messages);

        // Verifica se o modelo chamou alguma tool
        if (response.tool_calls && response.tool_calls.length > 0) {
          console.log(`[Tool Calling] ${response.tool_calls.length} tool(s) chamada(s)`);

          // Adiciona a resposta do AI às mensagens
          messages.push(response);

          // Executa as tools chamadas e cria ToolMessages
          for (const toolCall of response.tool_calls) {
            const tool = allTools.find(t => t.name === toolCall.name);

            if (tool) {
              try {
                console.log(`[Tool Calling] Executando: ${toolCall.name}`, toolCall.args);
                const result = await tool.func(toolCall.args as any);
                console.log(`[Tool Calling] Resultado de ${toolCall.name}:`, result.substring(0, 150) + '...');

                // Adiciona o resultado como ToolMessage
                messages.push(
                  new ToolMessage({
                    content: result,
                    tool_call_id: toolCall.id,
                  })
                );
              } catch (error) {
                console.error(`[Tool Calling] Erro ao executar tool ${toolCall.name}:`, error);
                messages.push(
                  new ToolMessage({
                    content: JSON.stringify({ error: 'Erro ao executar ferramenta' }),
                    tool_call_id: toolCall.id,
                  })
                );
              }
            } else {
              console.error(`[Tool Calling] Tool não encontrada: ${toolCall.name}`);
            }
          }

          // Continua o loop para processar mais tools se necessário
          continue;
        }

        // Se não há mais tool_calls, retorna a resposta final
        const contentStr = response.content.toString();
        console.log(`[Tool Calling] Resposta final (${contentStr.length} caracteres)`);

        if (!contentStr || contentStr.trim() === '') {
          console.error('[Tool Calling] AVISO: Resposta vazia');
          return 'Desculpe, não consegui gerar uma resposta adequada.';
        }

        return contentStr;
      }

      // Se chegou ao limite de iterações
      console.error(`[Tool Calling] ERRO: Limite de ${MAX_ITERATIONS} iterações atingido`);
      return 'Desculpe, a solicitação está muito complexa. Por favor, tente reformular sua pergunta.';

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      throw new Error('Não foi possível processar sua mensagem');
    }
  }
}
