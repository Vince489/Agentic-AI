import 'dotenv/config';
import { AgentFactory } from './AgentFactory.js';

async function main() {
  // 1. Create and configure the AgentFactory
  const factory = new AgentFactory({
    apiKeys: {
      gemini: process.env.GEMINI_API_KEY,
    }
  });

  // 2. Define the configuration for the agent
  const agentConfig = {
    id: 'gemini-agent',
    name: 'Gemini Agent',
    description: 'An agent that uses the Gemini API.',
    provider: 'gemini',
    llmConfig: {
      model: 'gemini-2.5-flash-lite', // Or any other Gemini model
    },
    role: 'A helpful assistant.',
    tools: {}, // No tools for this example
  };

  // 3. Create the agent
  const agent = factory.createAgent(agentConfig);

  // 4. Run the agent
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
