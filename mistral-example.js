import 'dotenv/config';
import { AgentFactory } from './AgentFactory.js';

async function main() {
  // 1. Create and configure the AgentFactory
  const factory = new AgentFactory({
    apiKeys: {
      mistral: process.env.MISTRAL_API_KEY,
    }
  });

  // 2. Define the configuration for the agent
  const agentConfig = {
    id: 'mistral-agent',
    name: 'Mistral Agent',
    description: 'An agent that uses the Mistral API.',
    provider: 'mistral',
    llmConfig: {
      model: 'mistral-large-latest',
    },
    role: 'A helpful assistant.',
    tools: {}, // No tools for this example
  };

  // 3. Create the agent
  const agent = factory.createAgent(agentConfig);

  // 4. Run the agent
  const prompt = 'Tell me about yourself.';
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
