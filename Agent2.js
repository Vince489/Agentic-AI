/**
 * Event System for Agent Framework
 */
/**
 * @class EventEmitter
 * @classdesc A simple event emitter.
 */
class EventEmitter {
  /**
   * Creates an instance of EventEmitter.
   */
  constructor() {
    this.events = {};
    this.wildcardEvents = {}; // New object for wildcard listeners
  }

  /**
   * Registers an event listener.
   * @param {string} eventName - The name of the event to listen for.
   * @param {function} listener - The function to call when the event is emitted.
   * @returns {function} - A function to remove the listener.
   */
  on(eventName, listener) {
    if (eventName.includes('*')) {
      if (!this.wildcardEvents[eventName]) {
        this.wildcardEvents[eventName] = [];
      }
      this.wildcardEvents[eventName].push(listener);
      return () => this.off(eventName, listener, true);
    } else {
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }
      this.events[eventName].push(listener);
      return () => this.off(eventName, listener);
    }
  }

  /**
   * Removes an event listener.
   * @param {string} eventName - The name of the event.
   * @param {function} listenerToRemove - The listener function to remove.
   * @param {boolean} [isWildcard=false] - Whether to remove all listeners for the event name.
   */
  off(eventName, listenerToRemove, isWildcard = false) {
    const eventStore = isWildcard ? this.wildcardEvents : this.events;
    if (!eventStore[eventName]) return;
    
    const index = eventStore[eventName].indexOf(listenerToRemove);
    if (index > -1) {
      eventStore[eventName].splice(index, 1);
    }
  }

  /**
   * Emits an event, calling all registered listeners.
   * @param {string} eventName - The name of the event to emit.
   * @param {*} data - The data to pass to the listeners.
   */
  emit(eventName, data) {
    // 1. Get and run specific listeners
    if (this.events[eventName]) {
      const listeners = [...this.events[eventName]];
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }

    // 2. Get and run wildcard listeners
    for (const wildcard in this.wildcardEvents) {
      // Simple wildcard check for '*' at the end
      if (wildcard.endsWith('*')) {
        const prefix = wildcard.slice(0, -1);
        if (eventName.startsWith(prefix)) {
          this.wildcardEvents[wildcard].forEach(listener => {
            try {
              listener(data);
            } catch (error) {
              console.error(`Error in wildcard event listener for ${wildcard}:`, error);
            }
          });
        }
      } else if (wildcard === '*') {
        this.wildcardEvents['*'].forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error(`Error in wildcard event listener for '*':`, error);
          }
        });
      }
    }
  }

  /**
   * Registers a one-time event listener.
   * @param {string} eventName - The name of the event to listen for.
   * @param {function} listener - The function to call when the event is emitted.
   */
  once(eventName, listener) {
    const onceWrapper = (data) => {
      listener(data);
      this.off(eventName, onceWrapper);
    };
    return this.on(eventName, onceWrapper);
  }

  /**
   * Gets the number of listeners for an event.
   * @param {string} eventName - The name of the event.
   * @returns {number} The number of listeners.
   */
  listenerCount(eventName) {
    const specificListeners = this.events[eventName] ? this.events[eventName].length : 0;
    let wildcardListeners = 0;
    if (eventName.includes('*')) {
      wildcardListeners = this.wildcardEvents[eventName] ? this.wildcardEvents[eventName].length : 0;
    }
    return specificListeners + wildcardListeners;
  }

  /**
   * Removes all listeners for an event.
   * @param {string} eventName - The name of the event.
   */
  removeAllListeners(eventName) {
    if (eventName) {
      delete this.events[eventName];
      // Also remove wildcard listeners if they match
      if (eventName.includes('*')) {
        delete this.wildcardEvents[eventName];
      }
    } else {
      this.events = {};
      this.wildcardEvents = {};
    }
  }

  /**
   * Emits an event asynchronously.
   * @param {string} eventName - The name of the event to emit.
   * @param {*} data - The data to pass to the listeners.
   * @returns {Promise<void>} A promise that resolves when all listeners have been called.
   */
  async emitAsync(eventName, data) {
    const listenerPromises = [];

    // Get specific listeners
    if (this.events[eventName]) {
      listenerPromises.push(...this.events[eventName].map(listener => {
        return Promise.resolve().then(() => listener(data));
      }));
    }

    // Get wildcard listeners
    for (const wildcard in this.wildcardEvents) {
      if (wildcard.endsWith('*')) {
        const prefix = wildcard.slice(0, -1);
        if (eventName.startsWith(prefix)) {
          listenerPromises.push(...this.wildcardEvents[wildcard].map(listener => {
            return Promise.resolve().then(() => listener(data));
          }));
        }
      } else if (wildcard === '*') {
        listenerPromises.push(...this.wildcardEvents['*'].map(listener => {
          return Promise.resolve().then(() => listener(data));
        }));
      }
    }
    
    // Run all listeners in parallel
    return Promise.all(listenerPromises);
  }
}

/**
 * Memory System for Agent Framework
 */
/**
 * @class MemoryManager
 * @classdesc Manages the agent's memory, including history and key-value storage.
 */
class MemoryManager {
  constructor(config = {}) {
    this.conversationHistory = [];
    this.keyValueStore = {};
    this.maxHistoryLength = config.maxHistoryLength || 100;
    this.events = new EventEmitter();
  }

  /**
   * Adds an entry to the history.
   * @param {object} entry - The entry to add.
   */
  addToHistory(entry) {
    this.conversationHistory.push({
      ...entry,
      timestamp: entry.timestamp || new Date()
    });
    
    // Trim history if it exceeds max length
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
    
    this.events.emit('historyUpdated', this.conversationHistory);
  }

  /**
   * Adds an entry to the history asynchronously.
   * @param {object} entry - The entry to add.
   * @returns {Promise<void>}
   */
  async addToHistoryAsync(entry) {
    return new Promise((resolve) => {
      this.addToHistory(entry);
      // Wait for all listeners to finish via emitAsync
      this.events.emitAsync('historyUpdated', this.conversationHistory).finally(() => {
        resolve(this.conversationHistory);
      });
    });
  }

  /**
   * Gets the history.
   * @param {number} [limit=this.maxHistoryLength] - The maximum number of entries to return.
   * @returns {object[]} The history entries.
   */
  getHistory(limit = this.maxHistoryLength) {
    return this.conversationHistory.slice(-limit);
  }

  /**
   * Gets a range of history entries.
   * @param {number} startIndex - The starting index.
   * @param {number} endIndex - The ending index.
   * @returns {object[]} The history entries within the specified range.
   */
  getHistoryRange(startIndex, endIndex) {
    return this.conversationHistory.slice(startIndex, endIndex);
  }

  /**
   * Remembers a key-value pair.
   * @param {string} key - The key.
   * @param {*} value - The value.
   */
  remember(key, value) {
    const oldValue = this.keyValueStore[key];
    this.keyValueStore[key] = value;

    // Only emit event if the value has changed
    if (oldValue !== value) {
      this.events.emit('memoryUpdated', { key, value, oldValue });
    }
  }

  /**
   * Remembers a key-value pair asynchronously.
   * @param {string} key - The key.
   * @param {*} value - The value.
   * @returns {Promise<void>}
   */
  async rememberAsync(key, value) {
    return new Promise((resolve) => {
      const oldValue = this.keyValueStore[key];
      this.keyValueStore[key] = value;

      if (oldValue !== value) {
        // Wait for all listeners to finish via emitAsync
        this.events.emitAsync('memoryUpdated', { key, value, oldValue }).finally(() => {
          resolve({ key, value });
        });
      } else {
        resolve({ key, value });
      }
    });
  }

  /**
   * Recalls a value by its key.
   * @param {string} key - The key.
   * @returns {*} The value, or undefined if not found.
   */
  recall(key) {
    return this.keyValueStore[key];
  }

  /**
   * Forgets a key-value pair.
   * @param {string} key - The key to forget.
   */
  forget(key) {
    if (this.keyValueStore.hasOwnProperty(key)) {
      const value = this.keyValueStore[key];
      delete this.keyValueStore[key];
      this.events.emit('memoryForgotten', { key, value });
      return true;
    }
    return false;
  }

  /**
   * Clears all memory.
   */
  clear() {
    this.conversationHistory = [];
    this.keyValueStore = {};
    this.events.emit('memoryCleared');
  }

  /**
   * Registers an event listener.
   * @param {string} eventName - The name of the event to listen for.
   * @param {function} listener - The function to call when the event is emitted.
   * @returns {function} - A function to remove the listener.
   */
  on(eventName, listener) {
    return this.events.on(eventName, listener);
  }
}

/**
 * A Tool Handler designed for structured tool calls from Gemini.
 */
/**
 * @class ToolHandler
 * @classdesc Handles tool calls and execution.
 */
class ToolHandler {
  constructor(config = {}) {
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Handles tool calls.
   * @param {object[]} toolCalls - The tool calls to handle.
   * @param {object} tools - The available tools.
   * @returns {Promise<object[]>} The results of the tool calls.
   */
  async handleToolCalls(toolCalls, tools) {
    const results = [];
    for (const call of toolCalls) {
      const toolName = call.function.name;
      const toolParams = call.function.args;
      const toolObject = tools[toolName]; // Get the full tool object from the registry
      
      if (!toolObject || typeof toolObject.call !== 'function') {
        console.error(`Tool '${toolName}' not found or its 'call' function is missing/invalid.`);
        results.push({
          toolName,
          error: `Tool '${toolName}' not found or is not callable.`
        });
        continue;
      }

      try {
        console.log(`Executing tool: ${toolName} with params:`, toolParams);
        // Pass the executable function (toolObject.call) directly to _executeWithRetry
        const result = await this._executeWithRetry(toolObject.call, toolParams); 
        results.push({
          toolName,
          result
        });
      } catch (error) {
        console.error(`Error executing tool ${toolName}:`, error);
        results.push({
          toolName,
          error: error.message
        });
      }
    }
    return results;
  }

  /**
   * Executes a tool function with retry logic.
   * @param {function} toolFunction - The tool function to execute.
   * @param {object} params - The parameters for the tool function.
   * @param {number} [attempt=1] - The current attempt number.
   * @returns {Promise<*>} The result of the tool function.
   */
  async _executeWithRetry(toolFunction, params, attempt = 1) {
    try {
      return await toolFunction(params);
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`Tool execution failed, retrying (${attempt}/${this.retryAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this._executeWithRetry(toolFunction, params, attempt + 1);
      }
      throw error; // Re-throw the error if max retries are reached
    }
  }
}

/**
 * Base Agent (Composable with LLM Provider, Tool Handler, and Event System).
 */
/**
 * @class Agent
 * @classdesc Represents an autonomous agent with memory, tools, and LLM interaction.
 */
export class Agent {
  constructor(config) {
    if (!config.id || !config.name || !config.description || !config.role || !config.llmProvider) {
      throw new Error("Agent configuration must include id, name, description, role, and llmProvider.");
    }
    
    // Core properties
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.role = config.role;
    this.goals = config.goals || []; 
    this.tools = config.tools || {}; 
    this.toolSchemas = []; 
    this.llmConfig = {
      temperature: 0.7,
      maxOutputTokens: 1024,
      ...config.llmConfig,
    };
    this.llmProvider = config.llmProvider;
    
    this.toolHandler = new ToolHandler(config.toolHandlerConfig);
    this.memory = config.memoryManager || new MemoryManager(config.memoryConfig);
    this.events = new EventEmitter();
    
    // Context for current operation
    this.context = {};
    this.status = 'idle';

    // Multi-agent orchestration properties
    this.isOrchestrator = config.isOrchestrator || false;
    this.managedAgents = new Map(); // Map of agent ID to agent instance
    this.taskQueue = [];
    this.activeExecutions = new Map(); // Track ongoing task executions
    
    // Formatter functions
    this.inputFormatter = config.inputFormatter || ((input) => [{ role: "user", parts: [{ text: String(input) }] }]);
    this.responseProcessor = config.responseProcessor || ((llmResponse) => {
      const firstCandidate = llmResponse?.candidates?.[0];
      const textParts = firstCandidate?.content?.parts?.filter(p => p.text).map(p => p.text).join('');
      console.log("Response processor result:", textParts);
      return textParts || '';
    });

    // Method to get the current date
    this.getCurrentDate = config.getCurrentDate || (() => new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }));

    // Special response processor for tool results
    this.toolResponseProcessor = config.toolResponseProcessor || ((toolResults) => {
      // Extract the results from the tool calls
      const results = toolResults.map(result => {
        if (result.error) {
          return `Error from tool ${result.toolName}: ${result.error}`;
        } else {
          return result.result;
        }
      });

      // Join all results with newlines
      return results.join('\n\n');
    });

    // Initialize tool schemas
    this._refreshToolSchemas();
  }

  /**
   * Evaluates options based on criteria, providing structured reasoning.
   * @param {Array} options - The list of options to evaluate.
   * @param {Array} criteria - The criteria for evaluation.
   * @returns {Promise<object>} The reasoning steps and final decision.
   */
  async reason(options, criteria) {
    try {
      this.setStatus('reasoning');
      this.events.emit('reasonStarted', { agent: this.id, options, criteria, timestamp: new Date() });

      const prompt = `Evaluate the following options: ${JSON.stringify(options)} based on these criteria: ${JSON.stringify(criteria)}. Provide a step-by-step rationale and a final decision in JSON format with keys "steps" and "decision".`;
      const formattedInput = this.inputFormatter(prompt);
      const response = await this.llmProvider.generateContent({
        contents: formattedInput,
        config: {
          systemInstruction: this.role,
          ...this.llmConfig,
        },
      });

      let responseText = this.responseProcessor(response);

      // Clean up response for JSON parsing
      responseText = this._cleanJsonResponse(responseText);

      const decision = JSON.parse(responseText);
      this.memory.addToHistory({ input: prompt, response: decision, type: "reasoning", timestamp: new Date() });
      this.events.emit('reasonCompleted', { agent: this.id, decision, timestamp: new Date() });
      this.setStatus('idle');

      return decision;
    } catch (error) {
      this.setStatus('error');
      this.events.emit('reasonError', { agent: this.id, error: error.message, timestamp: new Date() });
      console.error(`Agent ${this.name} encountered an error during reasoning:`, error);
      throw error;
    }
  }

  /**
   * Decomposes a goal into sub-tasks and creates a task plan.
   * @param {string} goal - The high-level goal to plan for.
   * @returns {Promise<object>} A JSON object representing the task plan.
   */
  async plan(goal) {
    try {
      this.setStatus('planning');
      this.events.emit('planStarted', { agent: this.id, goal, timestamp: new Date() });

      const prompt = `Decompose the goal "${goal}" into sub-tasks with dependencies and assign roles (e.g., researcher, coder). Output as JSON with keys "subTasks" (array of {task, role, dependencies}) and "sequence" (array of task IDs).`;
      const formattedInput = this.inputFormatter(prompt);
      const response = await this.llmProvider.generateContent({
        contents: formattedInput,
        config: {
          systemInstruction: this.role,
          ...this.llmConfig,
        },
      });

      let responseText = this.responseProcessor(response);

      // Clean up response for JSON parsing
      responseText = this._cleanJsonResponse(responseText);

      const plan = JSON.parse(responseText);
      this.context.plan = plan;
      this.memory.addToHistory({ input: prompt, response: plan, type: "planning", timestamp: new Date() });
      this.events.emit('planCreated', { agent: this.id, plan, timestamp: new Date() });
      this.setStatus('idle');

      return plan;
    } catch (error) {
      this.setStatus('error');
      this.events.emit('planError', { agent: this.id, error: error.message, timestamp: new Date() });
      console.error(`Agent ${this.name} encountered an error during planning:`, error);
      throw error;
    }
  }

  /**
   * Runs the agent with the given input and context, optionally using Chain of Thought (CoT).
   * @param {string} input - The input for the agent.
   * @param {object} [context={}] - The context for the agent.
   * @param {boolean} [useCoT=false] - Whether to enforce Chain of Thought reasoning.
   * @returns {Promise<object>} The agent's response.
   */
  async run(input, context = {}, useCoT = false) {
    if (!this.llmProvider) {
      throw new Error(`Agent ${this.name} has no LLM provider.`);
    }

    this.context = { ...this.context, ...context };
    this.setStatus('working');
    this.events.emit('runStarted', {
      agent: this.id,
      input,
      context: this.context,
      timestamp: new Date()
    });

    try {
      // Apply CoT prompt if enabled
      const prompt = useCoT
        ? `Solve "${input}" step by step: 1) Analyze input, 2) List options, 3) Select best option, 4) Explain choice. Output in JSON format with keys "steps" and "result".`
        : input;
      const formattedInput = this.inputFormatter(prompt);
      this.events.emit('inputFormatted', { agent: this.id, formattedInput });

      let systemInstruction = this.role;
      // Inject current date into the system instruction
      systemInstruction += `\n\nCurrent Date and Time: ${this.getCurrentDate()}\n`;

      if (this.goals && this.goals.length > 0) {
        systemInstruction += "\n\nYour specific goals for this task are:\n" + this.goals.map((goal, index) => `${index + 1}. ${goal}`).join('\n');
      }

      // Inject memory into the system instruction
      const history = this.memory.getHistory();
      const keyValueStore = this.memory.keyValueStore;

      if (history.length > 0 || Object.keys(keyValueStore).length > 0) {
        systemInstruction += "\n\n--- Agent Memory ---\n";
        if (history.length > 0) {
          systemInstruction += "\nConversation History:\n";
          history.forEach(entry => {
            systemInstruction += `Timestamp: ${entry.timestamp.toLocaleString()}\n`;
            systemInstruction += `Input: ${entry.input}\n`;
            if (entry.response) {
              if (typeof entry.response === 'object' && entry.response.finalResponse) {
                systemInstruction += `Response: ${entry.response.finalResponse}\n`;
              } else {
                systemInstruction += `Response: ${entry.response}\n`;
              }
            }
            systemInstruction += "---\n";
          });
        }
        if (Object.keys(keyValueStore).length > 0) {
          systemInstruction += "\nKey-Value Store:\n";
          for (const key in keyValueStore) {
            systemInstruction += `${key}: ${keyValueStore[key]}\n`;
          }
        }
        systemInstruction += "\n--- End Agent Memory ---\n";
      }

      const llmResponse = await this.llmProvider.generateContent(
        {
          contents: formattedInput,
          config: {
            systemInstruction: systemInstruction,
            tools: this.toolSchemas.length > 0 ? { functionDeclarations: this.toolSchemas } : undefined,
          },
          ...this.llmConfig,
          ...this.llmProviderSpecificConfig(),
        }
      );
      this.events.emit('llmResponseReceived', { agent: this.id, llmResponse });

      const toolCallsParts = llmResponse?.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);

      if (toolCallsParts && toolCallsParts.length > 0) {
        this.events.emit('toolCallsDetected', { agent: this.id, toolCalls: toolCallsParts });
        
        // Format the tool calls to match what ToolHandler.handleToolCalls expects
        const formattedToolCalls = toolCallsParts.map(part => ({ function: part.functionCall }));

        const toolResults = await this.toolHandler.handleToolCalls(
          formattedToolCalls,
          this.tools
        );

        this.events.emit('toolCallsHandled', { agent: this.id, toolResults });

        const toolResultsText = this.toolResponseProcessor(toolResults);

        // Construct the contents for the second LLM call
        const contentsForSecondCall = [
          ...formattedInput, // Original user input
          {
            role: "model",
            parts: toolCallsParts // Model's turn, showing it called tools
          },
          {
            role: "function",
            parts: toolResults.map(result => ({
              functionResponse: {
                name: result.toolName,
                response: { result: result.result || result.error }
              }
            }))
          },
          {
            role: "user",
            parts: [{ text: `Based on the tool results provided above, please synthesize a comprehensive and accurate final response to the user's original query. The tool results are:\n${toolResultsText}` }]
          }
        ];

        const responseWithResults = await this.llmProvider.generateContent({
          contents: contentsForSecondCall,
          systemInstruction: systemInstruction,
          tools: this.toolSchemas.length > 0 ? { functionDeclarations: this.toolSchemas } : undefined,
          ...this.llmConfig,
          ...this.llmProviderSpecificConfig(),
        });

        // Process the tool results and the final response
        const finalResponse = this.responseProcessor(responseWithResults);

        // Combine the tool results with the final response
        const combinedResponse = {
          toolResults: toolResultsText,
          finalResponse: finalResponse
        };

        this.memory.addToHistory({ input, response: combinedResponse, type: useCoT ? "cot" : "run", timestamp: new Date() });
        this.setStatus('idle');
        this.events.emit('runCompleted', {
          agent: this.id,
          input,
          response: combinedResponse,
          timestamp: new Date()
        });

        return combinedResponse;

      } else {
        let processedResponse;
        if (useCoT) {
          let responseText = this.responseProcessor(llmResponse);
          // Clean up response for JSON parsing
          responseText = this._cleanJsonResponse(responseText);
          processedResponse = JSON.parse(responseText);
        } else {
          processedResponse = this.responseProcessor(llmResponse);
        }

        this.memory.addToHistory({ input, response: processedResponse, type: useCoT ? "cot" : "run", timestamp: new Date() });
        this.setStatus('idle');
        this.events.emit('runCompleted', {
          agent: this.id,
          input,
          response: processedResponse,
          timestamp: new Date()
        });
        return processedResponse;
      }
    } catch (error) {
      this.setStatus('error');
      this.events.emit('runError', {
        agent: this.id,
        input,
        error: error.message,
        timestamp: new Date()
      });
      console.error(`Agent ${this.name} encountered an error:`, error);
      throw error;
    }
  }

  /**
   * Gets the agent's status.
   * @returns {string} The agent's status.
   */
  getStatus() {
    return this.status;
  }

  /**
   * Sets the agent's status.
   * @param {string} newStatus - The new status.
   */
  setStatus(newStatus) {
    const oldStatus = this.status;
    this.status = newStatus;
    this.events.emit('statusChanged', { 
      agent: this.id, 
      oldStatus, 
      newStatus,
      timestamp: new Date()
    });
  }

  /**
   * Registers an event listener.
   * @param {string} eventName - The name of the event to listen for.
   * @param {function} listener - The function to call when the event is emitted.
   * @returns {function} - A function to remove the listener.
   */
  on(eventName, listener) {
    return this.events.on(eventName, listener);
  }

  /**
   * Returns LLM provider specific configuration.
   * @returns {object} The LLM provider specific configuration.
   */
  llmProviderSpecificConfig() {
    return {};
  }

  /**
   * Adds a tool to the agent.
   * @param {object} tool - The tool to add.
   */
  addTool(tool) {
    if (!tool || !tool.name || !tool.schema || typeof tool.call !== 'function' || !tool.schema.function_declaration) {
      throw new Error('Invalid tool. A tool must have a "name" property, a "schema" property with a "function_declaration", and a callable "call" function.');
    }
    
    this.tools[tool.name] = tool; // Store the unified tool object
    this._refreshToolSchemas();
    
    this.events.emit('toolAdded', { 
      agent: this.id, 
      toolName: tool.name,
      schema: tool.schema
    });
    
    return this;
  }

  /**
   * Removes a tool from the agent.
   * @param {string} toolName - The name of the tool to remove.
   */
  removeTool(toolName) {
    if (this.tools[toolName]) {
      delete this.tools[toolName];
      this._refreshToolSchemas();
      
      this.events.emit('toolRemoved', { 
        agent: this.id, 
        toolName 
      });
    }
    return this;
  }

  /**
   * Refreshes the tool schemas.
   * @private
   */
  _refreshToolSchemas() {
    this.toolSchemas = Object.values(this.tools)
      .filter(tool => tool.schema && tool.schema.function_declaration)
      .map(tool => tool.schema.function_declaration);
    
    if (this.llmProvider.updateToolSchemas) {
      this.llmProvider.updateToolSchemas(this.toolSchemas);
    }
  }

  /**
   * Gets a tool by its name.
   * @param {string} toolName - The name of the tool.
   * @returns {object|undefined} The tool, or undefined if not found.
   */
  getTool(toolName) {
    return this.tools[toolName];
  }

  /**
   * Lists the tools available to the agent.
   * @returns {object[]} An array of tool objects.
   */
  listTools() {
    return Object.keys(this.tools);
  }

  /**
   * Cleans response text for JSON parsing by removing markdown blocks and control characters.
   * @param {string} responseText - The raw response text.
   * @returns {string} The cleaned response text.
   * @private
   */
  _cleanJsonResponse(responseText) {
    // Remove markdown code blocks
    if (responseText.includes('```json')) {
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    }

    // Remove any text before the first { or [
    const jsonStart = Math.min(
      responseText.indexOf('{') !== -1 ? responseText.indexOf('{') : Infinity,
      responseText.indexOf('[') !== -1 ? responseText.indexOf('[') : Infinity
    );

    if (jsonStart !== Infinity && jsonStart > 0) {
      responseText = responseText.substring(jsonStart);
    }

    // Remove any text after the last } or ]
    const lastBrace = responseText.lastIndexOf('}');
    const lastBracket = responseText.lastIndexOf(']');
    const jsonEnd = Math.max(lastBrace, lastBracket);

    if (jsonEnd !== -1 && jsonEnd < responseText.length - 1) {
      responseText = responseText.substring(0, jsonEnd + 1);
    }

    // Clean up control characters and normalize whitespace
    responseText = responseText
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
      .replace(/\n/g, '\\n') // Escape newlines in strings
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\t/g, '\\t') // Escape tabs
      .trim();

    return responseText;
  }

  // ===== ORCHESTRATOR METHODS =====

  /**
   * Registers an agent to be managed by this orchestrator.
   * @param {Agent} agent - The agent to register.
   * @returns {Agent} This agent for chaining.
   */
  registerAgent(agent) {
    if (!this.isOrchestrator) {
      throw new Error(`Agent ${this.name} is not configured as an orchestrator.`);
    }

    if (!(agent instanceof Agent)) {
      throw new Error('Only Agent instances can be registered.');
    }

    this.managedAgents.set(agent.id, agent);
    this.events.emit('agentRegistered', {
      orchestrator: this.id,
      agent: agent.id,
      timestamp: new Date()
    });

    return this;
  }

  /**
   * Removes an agent from orchestrator management.
   * @param {string} agentId - The ID of the agent to unregister.
   * @returns {boolean} True if agent was removed, false if not found.
   */
  unregisterAgent(agentId) {
    if (!this.isOrchestrator) {
      throw new Error(`Agent ${this.name} is not configured as an orchestrator.`);
    }

    const removed = this.managedAgents.delete(agentId);
    if (removed) {
      this.events.emit('agentUnregistered', {
        orchestrator: this.id,
        agent: agentId,
        timestamp: new Date()
      });
    }

    return removed;
  }

  /**
   * Gets a list of all managed agents.
   * @returns {Array} Array of agent information.
   */
  getManagedAgents() {
    if (!this.isOrchestrator) {
      throw new Error(`Agent ${this.name} is not configured as an orchestrator.`);
    }

    return Array.from(this.managedAgents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      status: agent.status,
      capabilities: agent.goals
    }));
  }

  /**
   * Delegates a task to a specific agent.
   * @param {string} agentId - The ID of the agent to delegate to.
   * @param {string} task - The task description.
   * @param {object} context - Additional context for the task.
   * @param {boolean} useCoT - Whether to use Chain of Thought reasoning.
   * @returns {Promise<object>} The result from the delegated agent.
   */
  async delegateTask(agentId, task, context = {}, useCoT = false) {
    if (!this.isOrchestrator) {
      throw new Error(`Agent ${this.name} is not configured as an orchestrator.`);
    }

    const agent = this.managedAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} is not registered with this orchestrator.`);
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.events.emit('taskDelegated', {
      orchestrator: this.id,
      agent: agentId,
      taskId,
      task,
      context,
      timestamp: new Date()
    });

    try {
      this.activeExecutions.set(taskId, { agentId, task, startTime: new Date() });

      const result = await agent.run(task, context, useCoT);

      this.activeExecutions.delete(taskId);

      this.events.emit('taskCompleted', {
        orchestrator: this.id,
        agent: agentId,
        taskId,
        result,
        timestamp: new Date()
      });

      return {
        taskId,
        agentId,
        result,
        completedAt: new Date()
      };
    } catch (error) {
      this.activeExecutions.delete(taskId);

      this.events.emit('taskFailed', {
        orchestrator: this.id,
        agent: agentId,
        taskId,
        error: error.message,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Orchestrates a complex goal by breaking it down and delegating to appropriate agents.
   * @param {string} goal - The high-level goal to orchestrate.
   * @param {object} options - Orchestration options.
   * @returns {Promise<object>} The orchestration results.
   */
  async orchestrate(goal, options = {}) {
    if (!this.isOrchestrator) {
      throw new Error(`Agent ${this.name} is not configured as an orchestrator.`);
    }

    this.events.emit('orchestrationStarted', {
      orchestrator: this.id,
      goal,
      timestamp: new Date()
    });

    try {
      // Step 1: Use reasoning to break down the goal
      const availableAgents = this.getManagedAgents();
      const reasoningOptions = availableAgents.map(agent =>
        `Delegate to ${agent.name} (${agent.id}): ${agent.description}`
      );

      const reasoningCriteria = [
        'Agent expertise alignment',
        'Task complexity match',
        'Current agent availability',
        'Expected execution time',
        'Dependencies between tasks'
      ];

      const reasoning = await this.reason(reasoningOptions, reasoningCriteria);

      // Step 2: Create a detailed plan
      const plan = await this.plan(goal);

      // Step 3: Execute the plan by delegating tasks
      const results = [];
      const executionSequence = plan.sequence || [];

      for (const taskId of executionSequence) {
        const task = plan.subTasks?.find(t => t.id === taskId || t.task === taskId);
        if (!task) continue;

        // Find best agent for this task based on role/capabilities
        const bestAgent = this._selectBestAgent(task, availableAgents);
        if (!bestAgent) {
          throw new Error(`No suitable agent found for task: ${task.task || taskId}`);
        }

        const taskResult = await this.delegateTask(
          bestAgent.id,
          task.task || taskId,
          {
            ...options.context,
            taskContext: task,
            orchestrationGoal: goal
          },
          options.useCoT || false
        );

        results.push(taskResult);
      }

      this.events.emit('orchestrationCompleted', {
        orchestrator: this.id,
        goal,
        results,
        timestamp: new Date()
      });

      return {
        goal,
        reasoning,
        plan,
        results,
        completedAt: new Date()
      };

    } catch (error) {
      this.events.emit('orchestrationFailed', {
        orchestrator: this.id,
        goal,
        error: error.message,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Selects the best agent for a given task based on capabilities and availability.
   * @private
   * @param {object} task - The task to assign.
   * @param {Array} availableAgents - List of available agents.
   * @returns {object|null} The best agent or null if none suitable.
   */
  _selectBestAgent(task, availableAgents) {
    // Simple selection logic - can be enhanced with more sophisticated matching
    const taskRole = task.role?.toLowerCase() || '';
    const taskDescription = (task.task || '').toLowerCase();

    // First, try to match by role
    let bestAgent = availableAgents.find(agent =>
      agent.name.toLowerCase().includes(taskRole) ||
      agent.description.toLowerCase().includes(taskRole)
    );

    // If no role match, find by capability keywords
    if (!bestAgent) {
      bestAgent = availableAgents.find(agent => {
        const agentCapabilities = (agent.capabilities || []).join(' ').toLowerCase();
        const agentDescription = agent.description.toLowerCase();

        return agentCapabilities.includes(taskDescription) ||
               agentDescription.includes(taskDescription) ||
               taskDescription.includes(agent.name.toLowerCase());
      });
    }

    // Fallback to first available agent
    if (!bestAgent && availableAgents.length > 0) {
      bestAgent = availableAgents.find(agent => agent.status === 'idle') || availableAgents[0];
    }

    return bestAgent;
  }

  /**
   * Gets the current status of all active task executions.
   * @returns {Array} Array of active execution information.
   */
  getActiveExecutions() {
    if (!this.isOrchestrator) {
      throw new Error(`Agent ${this.name} is not configured as an orchestrator.`);
    }

    return Array.from(this.activeExecutions.entries()).map(([taskId, execution]) => ({
      taskId,
      agentId: execution.agentId,
      task: execution.task,
      startTime: execution.startTime,
      duration: Date.now() - execution.startTime.getTime()
    }));
  }
}

// Export all classes
export { EventEmitter, MemoryManager, ToolHandler };