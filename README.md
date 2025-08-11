# Agentic AI Framework

The Agentic AI Framework is a powerful tool for building autonomous agents that can perform tasks, manage memory, and interact with tools. It provides a high-level API for creating and managing agents, teams, and workflows, as well as a low-level API for interacting with individual agents and tools.

## Features

- **Agent Management**: Create, configure, and manage autonomous agents.
- **Team Management**: Create and manage teams of agents.
- **Workflow Management**: Define and execute workflows for agents and teams.
- **Memory Management**: Manage agent memory and knowledge.
- **Tool Interaction**: Interact with tools and APIs.
- **Logging and Tracing**: Comprehensive logging and tracing for debugging and monitoring.

## Documentation

For detailed documentation and examples, please refer to the [documentation](https://github.com/Vince489/Agentic-AI/wiki).

## License

This project is licensed under the MIT License.

## Agent vs. AgentFactory

In this framework, you can create agents in two primary ways: directly using the `Agent` class or by using the `AgentFactory`. The choice depends on your specific needs for control versus convenience.

### Using the `AgentFactory` (The Convenient Approach)

The `AgentFactory` is a high-level utility designed to simplify the creation and configuration of agents. It abstracts away the boilerplate code required for setting up LLM providers, managing API keys, and loading configurations.

**When to use `AgentFactory`:**

-   **Rapid Prototyping:** Quickly get an agent running with a standard, supported LLM provider (e.g., Gemini, OpenAI, Anthropic).
-   **Standard Use Cases:** When your needs are met by the built-in providers and components.
-   **Managing Multiple Agents:** Easily create and manage a group of agents from a single configuration file.

### Using the `Agent` Class Directly (The Powerful Approach)

Directly instantiating the `Agent` class gives you maximum control and flexibility over the agent's components and configuration. This approach requires you to manually create and inject all dependencies.

**When to use the `Agent` class:**

-   **Custom Components:** When you need to use a custom-built LLM provider, a specialized memory manager, or a unique tool handler that isn't supported by the factory.
-   **Fine-Grained Control:** For precise control over the lifecycle and configuration of the agent and its dependencies, which is often necessary when integrating into a larger, existing application.
-   **Explicitness:** If you prefer to have a clear, explicit dependency graph without the "magic" of a factory.

### Example: Direct Instantiation

The following example demonstrates the power of using the `Agent` class directly. Here, we manually instantiate the `GeminiProvider` and inject it, along with other components, into the `Agent`. This is a perfect illustration of a scenario where direct instantiation is necessary for custom control.

```javascript
import 'dotenv/config';
import { Agent, MemoryManager, ToolHandler } from './Agent.js';
import { GeminiProvider } from './GeminiProvider.js';

async function main() {
  // 1. Manually create the LLM provider
  const geminiProvider = new GeminiProvider(
    process.env.GEMINI_API_KEY,
    'gemini-1.5-flash-latest'
  );

  // 2. Define the agent configuration object
  const agentConfig = {
    id: 'gemini-agent',
    name: 'Gemini Agent',
    description: 'An agent that uses the Gemini API.',
    provider: 'gemini', // This is still here but not used by the Agent class itself
    llmConfig: {
      model: 'gemini-1.5-flash-latest',
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
```
