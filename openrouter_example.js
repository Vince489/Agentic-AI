import 'dotenv/config';
import { AgentFactory } from './AgentFactory.js';

async function main() {
  // 1. Create and configure the AgentFactory
  const factory = new AgentFactory({
    apiKeys: {
      openrouter: process.env.OPENROUTER_API_KEY,
    }
  });

  // 2. Define the configuration for the agent
  const agentConfig = {
    id: 'openrouter-agent',
    name: 'OpenRouter Agent',
    description: 'An agent that uses the OpenRouter API with DeepSeek model.',
    provider: 'openrouter', // Specify the provider as 'openrouter'
    llmConfig: {
      model: 'qwen/qwen-2.5-coder-32b-instruct:free', 
      // google/gemini-2.0-flash-exp:free 
      // openai/gpt-oss-20b:free 
      // qwen/qwen3-14b:free
      baseURL: 'https://openrouter.ai/api/v1',
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
