# Sistema de Agendamento IA WhatsApp B2B

Sistema de agendamento conversacional com IA que combina LLMs (GPT-4o-mini e Claude 3 Haiku) com validação de regras de negócio em Node.js.

## 🎯 Arquitetura

O sistema implementa o padrão descrito em `ideia.txt`:

```
User → LLM extrai intenção/slots →
Controlador Node.js valida regras →
Retorna opções válidas →
LLM responde naturalmente
```

### Componentes Principais

1. **IntentClassifier**: Classifica a intenção do usuário
   - `QUERY`: Perguntas informativas (não muda estado)
   - `BOOK_SLOT`: Ação transacional (avança agendamento)
   - `CHANGE_MIND`: Cancelar/mudar agendamento

2. **BookingValidationController**: Valida regras de negócio
   - Profissional ↔ Serviço ↔ Horário ↔ Agenda (interdependentes)
   - Retorna opções válidas e sugestões inteligentes

3. **OrchestrationChatService**: Orquestra o fluxo completo
   - Separa ações informativas vs transacionais
   - Mantém estado de agendamento durante conversa
   - Usa IA para respostas naturais

4. **SessionManager**: Gerencia contexto da conversa
   - Histórico de mensagens
   - Estado de agendamento em andamento
   - Expiração automática (30 minutos)

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env e adicione suas chaves de API:
# - OPENAI_API_KEY=sk-...
# - ANTHROPIC_API_KEY=sk-ant-...

# Iniciar servidor em desenvolvimento
npm run dev
```

## 📡 API Endpoints

### POST /chat

Envia uma mensagem para o assistente IA.

**Body:**
```json
{
  "message": "Quero agendar massagem",
  "model": "orchestration"  // opcional
}
```

**Headers:**
```
Content-Type: application/json
x-session-id: <uuid>  // opcional, para manter contexto
```

**Modelos disponíveis:**
- `orchestration` (padrão): Sistema completo com validação de agendamento
- `langchain` / `openai`: GPT-4o-mini via LangChain
- `anthropic` / `claude`: Claude 3 Haiku via Anthropic

**Resposta:**
```json
{
  "message": "Ótimo! Temos massagem relaxante disponível. Prefere com qual profissional?",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "model": "orchestration"
}
```

## 💡 Exemplos de Uso

### 1. Perguntas Informativas (QUERY)

```bash
# Listar serviços
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quais serviços vocês têm?"}'

# Verificar disponibilidade
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "A Dra Ana atende hoje?"}'

# Quem faz um serviço específico
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quem faz massagem?"}'
```

### 2. Agendamento Transacional (BOOK_SLOT)

```bash
# Iniciar agendamento
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quero agendar massagem"}'
# Resposta: Sistema captura "massagem" e pede profissional

# Continuar conversa (use o sessionId retornado)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -H "x-session-id: <sessionId-anterior>" \
  -d '{"message": "Com a Dra Ana"}'
# Resposta: Sistema valida que Ana faz massagem e pede data

# Informar data
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -H "x-session-id: <sessionId-anterior>" \
  -d '{"message": "Dia 15 de janeiro"}'
# Resposta: Sistema verifica agenda e mostra horários disponíveis

# Escolher horário
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -H "x-session-id: <sessionId-anterior>" \
  -d '{"message": "Às 14h"}'
# Resposta: Confirmação do agendamento completo
```

### 3. Cancelar Agendamento (CHANGE_MIND)

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -H "x-session-id: <sessionId-anterior>" \
  -d '{"message": "Cancelar"}'
# Resposta: Estado de agendamento é limpo
```

### 4. Comparando Modelos

```bash
# Teste com GPT-4o-mini (LangChain)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quem trabalha hoje?", "model": "langchain"}'

# Teste com Claude 3 Haiku (Anthropic)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quem trabalha hoje?", "model": "anthropic"}'

# Teste com Sistema Completo (Orchestration)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quero agendar com o Carlos", "model": "orchestration"}'
```

## 🎨 Fluxo Conversacional

### Exemplo Completo de Agendamento

```
User: Quero agendar massagem
🤖: Ótimo! Temos massagem relaxante (R$ 120, 60min).
    Profissionais disponíveis: Ana Costa (avaliação 4.8)
    Quando você gostaria de agendar?

User: Com a Ana, dia 15
🤖: Perfeito! Dra Ana tem os seguintes horários disponíveis no dia 15/01:
    10:00, 14:00, 16:00
    Qual horário prefere?

User: 14h
🤖: ✅ Agendamento confirmado!
    • Serviço: Massagem Relaxante (R$ 120)
    • Profissional: Ana Costa
    • Data: 15/01/2025
    • Horário: 14:00

    Está tudo certo para você?
```

## 🔧 Estrutura do Projeto

```
src/
├── app.ts                                  # Configuração da aplicação Express
├── server.ts                               # Servidor HTTP
├── config/
│   └── tools.ts                            # Configuração de function calling
├── controllers/
│   ├── ChatController.ts                   # Controlador de chat (HTTP)
│   ├── BookingValidationController.ts      # Validação de regras de negócio
│   └── HealthController.ts                 # Health check
├── services/
│   ├── OrchestrationChatService.ts         # 🎯 Orquestrador principal
│   ├── AnthropicChatService.ts             # Serviço Anthropic Claude
│   ├── LangChainChatService.ts             # Serviço LangChain (OpenAI)
│   ├── IntentClassifier.ts                 # Classificador de intenções
│   └── SessionManager.ts                   # Gerenciador de sessões
├── interfaces/
│   └── IChatService.ts                     # Interface comum de serviços
├── mocks/
│   ├── data/                               # Dados mockados
│   │   ├── professionals.ts                # Profissionais
│   │   ├── services.ts                     # Serviços
│   │   └── availability.ts                 # Disponibilidade
│   └── functions/                          # Funções de negócio
└── routes/
    ├── chatRoutes.ts                       # Rotas de chat
    └── healthRoutes.ts                     # Rotas de health
```

## 📊 Comparação de Modelos

### GPT-4o-mini (LangChain)
- ✅ Barato ($0.15/1M tokens input)
- ⚠️ Function calling menos confiável
- 📉 Taxa de erro maior em validações complexas

### Claude 3 Haiku (Anthropic)
- ✅ Melhor function calling (recomendado em `ideia.txt`)
- ✅ Preço similar ao GPT-4o-mini
- ✅ Mais preciso em escolha de ferramentas
- 💰 $0.25/1M tokens input, $1.25/1M tokens output

### Sistema de Orquestração
- ✅ Separa QUERY vs BOOK_SLOT
- ✅ Valida regras de negócio antes de responder
- ✅ Mantém estado de agendamento
- ✅ Sugestões inteligentes baseadas em contexto

## 🧪 Desenvolvimento

```bash
# Modo desenvolvimento (hot reload)
npm run dev

# Build (nota: usa ts-node em desenvolvimento)
npm run build

# Iniciar produção
npm start
```

## 🔐 Variáveis de Ambiente

```env
# APIs de IA
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Servidor
PORT=3000
```

## 📝 Implementação Completa

Conforme descrito em `ideia.txt`:

- ✅ **Isolar módulo de IA atual**: LangChainChatService isolado
- ✅ **Criar módulo Anthropic paralelo**: AnthropicChatService implementado
- ✅ **Implementar controlador Node.js**: BookingValidationController criado
- ✅ **Separar ações informativas vs transacionais**: IntentClassifier + OrchestrationChatService
- ✅ **Sistema de estado intermediário**: SessionManager com BookingSlots
- ⏳ Testar Claude 3 Haiku vs GPT-4o-mini (comparar taxa de erro)
- ⏳ Adicionar persistência de agendamentos (banco de dados)
- ⏳ Integração com WhatsApp Business API
- ⏳ Sistema de notificações

## 📄 Licença

ISC
