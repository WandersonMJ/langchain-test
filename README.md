# API Express com LangChain e Tool Calling

Uma API REST simples e bem estruturada usando Express.js e LangChain com Tool Calling, seguindo princípios SOLID.

O assistente possui acesso a ferramentas (tools) que permitem consultar informações sobre serviços, profissionais e disponibilidade de horários.

## Estrutura do Projeto

```
langchain-test/
├── src/
│   ├── controllers/      # Controladores HTTP (lidam com requisições)
│   ├── services/         # Lógica de negócio
│   ├── routes/           # Definição de rotas
│   ├── interfaces/       # Contratos e tipos TypeScript
│   ├── config/           # Configuração de tools
│   ├── mocks/            # Dados e funções mockadas
│   │   ├── data/         # Dados mockados (serviços, profissionais, etc)
│   │   └── functions/    # Funções que retornam dados mockados
│   ├── app.ts            # Configuração do Express
│   └── server.ts         # Ponto de entrada da aplicação
├── .env.example          # Exemplo de variáveis de ambiente
├── tsconfig.json         # Configuração TypeScript
└── package.json
```

## Princípios SOLID Aplicados

- **Single Responsibility**: Cada classe tem uma única responsabilidade
  - `HealthService`: apenas verifica saúde da aplicação
  - `LangChainChatService`: apenas processa mensagens com LLM
  - Controllers: apenas lidam com HTTP

- **Open/Closed**: Fácil adicionar novas rotas sem modificar código existente

- **Dependency Inversion**: Controllers dependem de interfaces, não de implementações concretas

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` e adicione sua chave da OpenAI:
```
OPENAI_API_KEY=sua-chave-aqui
PORT=3000
```

## Como Usar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## Rotas Disponíveis

### GET /health
Verifica a saúde da aplicação.

**Exemplo:**
```bash
curl http://localhost:3000/health
```

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

### POST /chat
Envia uma mensagem para o assistente IA. O assistente tem acesso a ferramentas para consultar informações.

**Exemplos de perguntas:**

1. Listar serviços disponíveis:
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quais serviços vocês oferecem?"}'
```

2. Consultar profissionais:
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quem são os barbeiros disponíveis?"}'
```

3. Verificar disponibilidade:
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "O Carlos está disponível dia 15/01/2025?"}'
```

4. Buscar quem faz um serviço:
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quem faz massagem relaxante?"}'
```

## Ferramentas (Tools) Disponíveis

O assistente tem acesso às seguintes ferramentas:

| Ferramenta | Descrição |
|-----------|-----------|
| `get_services` | Lista serviços disponíveis (pode filtrar por categoria) |
| `get_available_professionals` | Lista profissionais (pode filtrar por especialidade ou dia) |
| `get_professionals_services` | Mostra profissionais e seus serviços |
| `get_specific_professional_services` | Detalhes de um profissional específico |
| `will_be_available` | Verifica disponibilidade em uma data específica |
| `get_services_by_professional` | Encontra profissionais que fazem um serviço |

## Tecnologias Utilizadas

- **Express.js**: Framework web minimalista
- **LangChain**: Framework para aplicações com LLM
- **TypeScript**: Superset JavaScript com tipagem estática
- **OpenAI**: Provedor de modelos de linguagem (GPT-4o-mini)
- **Zod**: Validação de schemas para tool calling

## Tool Calling

Esta aplicação implementa Tool Calling (chamada de ferramentas) usando LangChain. Isso significa que:

1. O LLM pode "chamar" funções quando necessário
2. As funções retornam dados estruturados (JSON)
3. O LLM processa os dados e responde ao usuário de forma natural

**Exemplo de fluxo:**
```
Usuário: "Quais serviços de barbearia vocês têm?"
    ↓
LLM decide usar a ferramenta get_services com category="Barbearia"
    ↓
Função retorna lista de serviços de barbearia
    ↓
LLM formata a resposta de forma amigável
    ↓
Resposta: "Oferecemos corte de cabelo masculino (R$ 45, 30min) e barba completa (R$ 30, 20min)"
```
