import 'dotenv/config';
import { AgentFactory } from './AgentFactory.js';

async function main() {
  // 1. Create and configure the AgentFactory
  const factory = new AgentFactory({
    apiKeys: {
      gemini: process.env.GEMINI_API_KEY,
    }
  });

  // 2. Load agent configuration from an external JSON file
  let agentConfig;
  try {
    agentConfig = factory.loadConfig('gemini-agent-config.json');
  } catch (error) {
    console.error('Failed to load agent configuration:', error);
    process.exit(1); // Exit if config loading fails
  }

  // 3. Create the agent using the loaded configuration
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
