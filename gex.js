import 'dotenv/config';
import { Agent, MemoryManager, ToolHandler } from './Agent.js';
import { GeminiProvider } from './GeminiProvider.js';

async function main() {
  // 1. Manually create the LLM provider
  const geminiProvider = new GeminiProvider(
    process.env.GEMINI_API_KEY,
    'gemini-2.5-flash-lite'
  );

  // 2. Define the agent configuration object
  const agentConfig = {
    id: 'gemini-agent',
    name: 'Gemini Agent',
    description: 'An agent that uses the Gemini API.',
    provider: 'gemini', // This is still here but not used by the Agent class itself
    llmConfig: {
      model: 'gemini-2.5-flash-lite',
    },
    role: 'A helpful assistant.',

    // 3. You must manually inject the dependencies
    llmProvider: geminiProvider,
    memoryManager: new MemoryManager(),
    toolHandler: new ToolHandler(),
    tools: {}, // No tools for this example
  };

  // 4. Create the agent instance directly
  const agent = new Agent(agentConfig);

  // 5. The rest of the code is the same
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