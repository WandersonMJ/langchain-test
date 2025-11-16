import dotenv from 'dotenv';
import { createApp } from './app';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Define a porta do servidor
const PORT = process.env.PORT || 3000;

// Cria a aplicação Express
const app = createApp();

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`
  🚀 Servidor iniciado com sucesso!

  📡 Rodando em: http://localhost:${PORT}

  📋 Rotas disponíveis:
     GET  /health - Verifica a saúde da aplicação
     POST /chat   - Conversa com o assistente IA

  💡 Exemplo de uso do chat:
     curl -X POST http://localhost:${PORT}/chat \\
       -H "Content-Type: application/json" \\
       -d '{"message": "Olá, como você está?"}'
  `);
});
