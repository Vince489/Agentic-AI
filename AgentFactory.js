import { Agent } from './Agent.js';
import { GeminiProvider } from './GeminiProvider.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Import fileURLToPath

/**
 * Factory class for creating agents with agent.js,
 * leveraging the refined Agent class for structured tool calling.
 */
/**
 * @class AgentFactory
 * @classdesc Factory class for creating and configuring agents.
 */
export class AgentFactory {
    /**
     * Create a new AgentFactory
     * @param {Object} config - Configuration object
     * @param {string} config.defaultProvider - Default LLM provider to use
     * @param {Object} config.apiKeys - API keys for different providers
     * @param {Object} [config.tools={}] - A registry of available tool objects.
     */
    constructor(config = {}) {
        this.defaultProvider = config.defaultProvider || 'gemini';
        this.apiKeys = config.apiKeys || {};
    this.tools = config.tools || {}; // This is now a registry of complete tool objects.
  }

    /**
     * Loads agent configurations from a JSON file using a relative path.
     * This method abstracts away the need for the user to calculate __dirname.
     * @param {string} fileName - The name of the JSON configuration file (e.g., 'myConfig.json').
     * @returns {Object} - The loaded agent configurations.
     * @throws {Error} - If the file cannot be read or parsed.
     */
  /**
   * Loads a configuration file.
   * @param {string} fileName - The name of the configuration file.
   * @returns {object} The loaded configuration.
   */
    loadConfig(fileName) {
        // Resolve __dirname dynamically for the current module (AgentFactory.js)
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const configFilePath = path.join(__dirname, fileName);
        
        return this.loadConfigFromFile(configFilePath);
    }

    /**
     * Loads agent configurations from a JSON file.
     * @param {string} filePath - The absolute path to the JSON configuration file.
     * @returns {Object} - The loaded agent configurations.
     * @throws {Error} - If the file cannot be read or parsed.
     */
  /**
   * Loads a configuration from a file path.
   * @param {string} filePath - The path to the configuration file.
   * @returns {Promise<object>} A promise that resolves with the loaded configuration.
   */
    loadConfigFromFile(filePath) {
        try {
            const absolutePath = path.resolve(filePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            throw new Error(`Failed to load agent configuration from ${filePath}: ${error.message}`);
        }
    }

    /**
     * Register a tool with the factory's tool registry.
     * Tools must be a structured object with 'name', 'schema', and a callable function.
     * @param {Object} tool - The tool object to register.
     * @param {string} tool.name - The unique name of the tool.
     * @param {Object} tool.schema - The OpenAPI schema for the tool.
     * @param {Function} tool.call - The executable function of the tool.
     */
  /**
   * Registers a tool.
   * @param {object} tool - The tool to register.
   */
    registerTool(tool) {
        if (!tool || !tool.name || !tool.schema || typeof tool.call !== 'function') {
            throw new Error("Invalid tool registration. A tool must have 'name', 'schema', and a 'call' function.");
        }
        this.tools[tool.name] = tool;
    }

    /**
     * Create multiple agents from a configuration object.
     * @param {Object} agentsConfig - An object with agent configurations.
     * @returns {Object} - An object with created agent instances, keyed by their ID.
     * @throws {Error} - If agent creation fails for any agent.
     */
  /**
   * Creates multiple agents from a configuration.
   * @param {object} agentsConfig - The configuration for the agents.
   * @returns {object} An object containing the created agents, keyed by their IDs.
   */
    createAgents(agentsConfig) {
        const agents = {};
        for (const [agentId, agentConfig] of Object.entries(agentsConfig)) {
            try {
                // Ensure the agent config has a provider, if not use the default
                if (!agentConfig.provider) {
                    agentConfig.provider = this.defaultProvider;
                }
                const agent = this.createAgent(agentConfig);
                agents[agentId] = agent;
            } catch (error) {
                console.error(`Error creating agent ${agentId}:`, error);
                throw error;
            }
        }
        return agents;
    }

    /**
     * Create a single agent from a configuration.
     * This method now focuses on dependency injection and validation.
     * @param {Object} agentConfig - The agent configuration.
     * @returns {Agent} - The created agent instance.
     * @throws {Error} - If configuration is invalid or provider is unsupported.
     */
  /**
   * Creates a single agent from a configuration.
   * @param {object} agentConfig - The configuration for the agent.
   * @returns {Agent} The created agent.
   */
    createAgent(agentConfig) {
        // Step 1: Validate and set default ID
        if (!agentConfig.id) {
            agentConfig.id = `agent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        const provider = agentConfig.provider || this.defaultProvider;
        const apiKey = this._getApiKey(provider);

        // Step 2: Create the appropriate LLM provider instance
        let llmProvider;
        switch (provider.toLowerCase()) {
            case 'gemini':
                const modelName = agentConfig.llmConfig?.model || 'gemini-2.5-flash-lite';
                llmProvider = new GeminiProvider(apiKey, modelName); 
                break;
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }

        // Step 3: Prepare the agent's full configuration, including the LLM provider
        const agentFullConfig = {
            ...agentConfig,
            llmProvider,
            tools: {} // Start with an empty tools object
        };

        // Step 4: Instantiate the core Agent class
        const agent = new Agent(agentFullConfig);

       // Step 5: Add tools from the factory's registry to the agent instance
        if (agentConfig.tools) {
            for (const toolName in agentConfig.tools) {
                const toolRef = agentConfig.tools[toolName];
                const tool = this.tools[toolRef];
                if (tool) {
                    agent.addTool(tool);
                } else {
                    console.warn(`Warning: Tool reference '${toolRef}' not found in factory registry. Skipping.`);
                }
            }
        }
        
        return agent;
    }

    /**
     * Helper method to get the API key from config or environment variables.
     * @param {string} provider - The name of the LLM provider.
     * @returns {string} The API key.
     * @throws {Error} If no API key is found.
     * @private
     */
  /**
   * Gets the API key for a specific provider.
   * @param {string} provider - The name of the provider.
   * @returns {string|undefined} The API key, or undefined if not found.
   * @private
   */
    _getApiKey(provider) {
        let apiKey = this.apiKeys[provider];

        if (!apiKey) {
            const envKeyName = `${provider.toUpperCase()}_API_KEY`;
            if (process.env[envKeyName]) {
                apiKey = process.env[envKeyName];
                // console.log(`Using ${envKeyName} from environment variables.`); // Removed verbose log
            }
        }

        if (!apiKey) {
            throw new Error(`No API key found for provider: ${provider}. Please set it in the factory config or as an environment variable.`);
        }

        return apiKey;
    }
}
