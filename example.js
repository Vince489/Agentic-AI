import 'dotenv/config';
import { AgentFactory } from './AgentFactory.js';

async function main() {
  // 1. Create and configure the AgentFactory
  // The factory can be configured with API keys for multiple providers.
  // It can also retrieve them from environment variables (e.g., GROQ_API_KEY).
  const factory = new AgentFactory({
    apiKeys: {
      groq: process.env.GROQ_API_KEY,
      // You could add other keys here, e.g., openai: process.env.OPENAI_API_KEY
    }
  });

  // 2. Define the configuration for the agent you want to create
  // This is where you specify the provider, model, role, and other settings.
  const agentConfig = {
    id: 'groq-agent',
    name: 'Groq Agent',
    description: 'An agent that uses the Groq API.',
    provider: 'groq', // Specify the provider
    llmConfig: {
      model: 'llama3-8b-8192', // Specify the model
    },
    // Agent's persona and instructions
    role: 'A helpful assistant.',
    // You can also define goals, tools, etc.
  };

  // 3. Create the agent using the factory
  const agent = factory.createAgent(agentConfig);

  // 4. Run the agent with a prompt
  const prompt = 'Hello, tell me about yourself.';
  console.log(`Running agent with prompt: "${prompt}"`);

  try {
    const response = await agent.run(prompt);
    console.log('Agent Response:');
    console.log(response);
  } catch (error) {
    console.error('An error occurred while running the agent:', error);
  }
}

main();
