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
   * @param {string} eventName - The name of the event to remove the listener from.
   * @param {Function} listenerToRemove - The listener function to remove.
   * @param {boolean} [isWildcard=false] - Whether the event name is a wildcard.
   */
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
   * Emits an event to all registered listeners.
   * @param {string} eventName - The name of the event to emit.
   * @param {*} data - The data to pass to the listeners.
   */
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
   * Registers a listener that will be called only once.
   * @param {string} eventName - The name of the event to listen for.
   * @param {Function} listener - The listener function to execute once.
   * @returns {Function} - An unsubscribe function for the listener.
   */
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
   * Returns the number of listeners for a given event.
   * @param {string} eventName - The name of the event to count listeners for.
   * @returns {number} - The number of listeners.
   */
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
   * Removes all listeners for a given event, or all listeners if no eventName is provided.
   * @param {string} [eventName] - The name of the event to remove all listeners from. If omitted, all listeners are removed.
   */
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
   * Asynchronously emit an event, calling listeners in parallel.
   * @param {string} eventName - Name of the event to emit
   * @param {*} data - Data to pass to the listeners
   * @returns {Promise<any[]>} A promise that resolves when all listeners have completed.
   */
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
   * Add an entry to the conversation history
   * @param {Object} entry - Entry to add to history
   */
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
   * Asynchronously add an entry to the conversation history
   * @param {Object} entry - Entry to add to history
   * @returns {Promise<Array>} - A promise that resolves with the updated history
   */
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
   * Get the conversation history
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} - Conversation history
   */
  /**
   * Gets the history.
   * @param {number} [limit=this.maxHistoryLength] - The maximum number of entries to return.
   * @returns {object[]} The history entries.
   */
  getHistory(limit = this.maxHistoryLength) {
    return this.conversationHistory.slice(-limit);
  }

  /**
   * Get a specific range of conversation history
   * @param {number} startIndex - The starting index (inclusive)
   * @param {number} endIndex - The ending index (exclusive)
   * @returns {Array} - The specified range of conversation history
   */
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
   * Store a value in memory
   * @param {string} key - Key to store the value under
   * @param {*} value - Value to store
   */
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
   * Asynchronously store a value in memory
   * @param {string} key - Key to store the value under
   * @param {*} value - Value to store
   * @returns {Promise<Object>} - A promise that resolves with the key-value pair
   */
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
   * Retrieve a value from memory
   * @param {string} key - Key to retrieve
   * @returns {*} - Stored value or undefined
   */
  /**
   * Recalls a value by its key.
   * @param {string} key - The key.
   * @returns {*} The value, or undefined if not found.
   */
  recall(key) {
    return this.keyValueStore[key];
  }

  /**
   * Forget a specific key-value pair from memory
   * @param {string} key - Key to forget
   * @returns {boolean} - True if the key was forgotten, false otherwise
   */
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
   * Clear all memory
   */
  /**
   * Clears all memory.
   */
  clear() {
    this.conversationHistory = [];
    this.keyValueStore = {};
    this.events.emit('memoryCleared');
  }

  /**
   * Subscribe to memory events
   * @param {string} eventName - Event name to subscribe to
   * @param {Function} listener - Function to call when event is emitted
   * @returns {Function} - Unsubscribe function
   */
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
   * Processes an array of tool call objects from a Gemini model's response.
   * @param {Array<Object>} toolCalls - An array of tool call objects from the model response,
   * each expected to have a 'function' property with 'name' and 'args'.
   * @param {Object} tools - A dictionary of available tool objects, each with a 'call' function.
   * @returns {Promise<Array<Object>>} A promise that resolves with the results of the tool calls.
   */
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
   * Executes a tool function with a retry mechanism.
   * @param {Function} toolFunction - The executable function of the tool.
   * @param {Object} params - The parameters to pass to the tool function.
   * @param {number} [attempt=1] - Current retry attempt number.
   * @returns {Promise<any>} - The result of the tool function.
   * @throws {Error} - If the tool function fails after all retry attempts.
   * @private
   */
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
    
    // Formatter functions
    this.inputFormatter = config.inputFormatter || ((input) => [{ role: "user", parts: [{ text: String(input) }] }]);
    this.responseProcessor = config.responseProcessor || ((llmResponse) => {
      const firstCandidate = llmResponse?.candidates?.[0];
      const textParts = firstCandidate?.content?.parts?.filter(p => p.text).map(p => p.text).join('');
      console.log("Response processor result:", textParts);
      return textParts || '';
    });

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
   * Get the agent's current status.
   * @returns {string} - The agent's status.
   */
  /**
   * Gets the agent's status.
   * @returns {string} The agent's status.
   */
  getStatus() {
    return this.status;
  }

  /**
   * Set the agent's status and emit a status change event.
   * @param {string} newStatus - The new status for the agent.
   */
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
   * Subscribe to agent events.
   * @param {string} eventName - Event name to subscribe to.
   * @param {Function} listener - Function to call when event is emitted.
   * @returns {Function} - Unsubscribe function.
   */
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
   * Run the agent with a specific input.
   * @param {*} input - Input for the agent to process.
   * @param {Object} [context={}] - Additional context for the agent's operation.
   * @returns {Promise<*>} - Agent's response.
   */
  /**
   * Runs the agent with the given input and context.
   * @param {string} input - The input for the agent.
   * @param {object} [context={}] - The context for the agent.
   * @returns {Promise<object>} The agent's response.
   */
  async run(input, context = {}) {
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
      const formattedInput = this.inputFormatter(input);
      this.events.emit('inputFormatted', { agent: this.id, formattedInput });

      let systemInstruction = this.role;
      if (this.goals && this.goals.length > 0) {
        systemInstruction += "\n\nYour specific goals for this task are:\n" + this.goals.map((goal, index) => `${index + 1}. ${goal}`).join('\n');
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
          formattedToolCalls, // Pass the correctly formatted tool calls
          this.tools
        );

        this.events.emit('toolCallsHandled', { agent: this.id, toolResults });

        // This is a key part of the function calling loop:
        // You would typically send these results back to the LLM
        // to generate the final user-facing response.
        const responseWithResults = await this.llmProvider.generateContent({
          contents: [
            ...formattedInput,
            {
              role: "model",
              parts: toolCallsParts // Use the original toolCallsParts here for the model's turn
            },
            {
              role: "function",
              parts: toolResults.map(result => ({
                functionResponse: {
                  name: result.toolName,
                  response: { result: result.result || result.error }
                }
              }))
            }
          ],
          systemInstruction: systemInstruction,
          tools: this.toolSchemas.length > 0 ? { functionDeclarations: this.toolSchemas } : undefined,
          ...this.llmConfig,
          ...this.llmProviderSpecificConfig(),
        });

        // Process the tool results and the final response
        const toolResultsText = this.toolResponseProcessor(toolResults);
        const finalResponse = this.responseProcessor(responseWithResults);

        // Combine the tool results with the final response
        const combinedResponse = {
          toolResults: toolResultsText,
          finalResponse: finalResponse
        };

        this.memory.addToHistory({ input, response: combinedResponse, timestamp: new Date() });
        this.setStatus('idle');
        this.events.emit('runCompleted', {
          agent: this.id,
          input,
          response: combinedResponse,
          timestamp: new Date()
        });

        return combinedResponse;

      } else {
        const processedResponse = this.responseProcessor(llmResponse);
        this.memory.addToHistory({ input, response: processedResponse, timestamp: new Date() });
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
   * Optional method to provide LLM provider-specific configuration.
   * @returns {Object} - Provider-specific configuration.
   */
  /**
   * Returns LLM provider specific configuration.
   * @returns {object} The LLM provider specific configuration.
   */
  llmProviderSpecificConfig() {
    return {};
  }

  /**
   * Dynamically add a tool at runtime.
   * @param {Object} tool - The tool to add. It must have 'name', 'schema', and a 'call' function.
   * @param {string} tool.name - The unique name of the tool.
   * @param {Object} tool.schema - The OpenAPI schema for the tool, containing a 'function_declaration'.
   * @param {Function} tool.call - The executable function of the tool.
   * @returns {Agent} - The current agent instance for method chaining.
   */
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
   * Remove a tool by its name.
   * @param {string} toolName - The name of the tool to remove.
   * @returns {Agent} - The current agent instance for method chaining.
   */
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
   * Refresh tool schemas for LLM provider.
   * This method extracts the 'function_declaration' from each unified tool object.
   * @private
   */
  /**
   * Refreshes the tool schemas.
   * @private
   */
  _refreshToolSchemas() {
    this.toolSchemas = Object.values(this.tools)
      .filter(tool => tool.schema && tool.schema.function_declaration) // Ensure it has the nested declaration
      .map(tool => tool.schema.function_declaration); // Extract ONLY the function_declaration itself
    
    if (this.llmProvider.updateToolSchemas) {
      this.llmProvider.updateToolSchemas(this.toolSchemas);
    }
  }

  /**
   * Get a tool by name.
   * @param {string} toolName - The name of the tool.
   * @returns {Object|undefined} - The unified tool object, or undefined if not found.
   */
  /**
   * Gets a tool by its name.
   * @param {string} toolName - The name of the tool.
   * @returns {object|undefined} The tool, or undefined if not found.
   */
  getTool(toolName) {
    return this.tools[toolName];
  }

  /**
   * List all available tools.
   * @returns {string[]} - An array of tool names.
   */
  /**
   * Lists the tools available to the agent.
   * @returns {object[]} An array of tool objects.
   */
  listTools() {
    return Object.keys(this.tools);
  }
}

// Export all classes including new ones
export { EventEmitter, MemoryManager, ToolHandler };
