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
 * Task Queue for managing async task execution.
 */
class TaskQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.events = new EventEmitter();
    this.maxConcurrentTasks = 5;
    this.activeTasks = new Map();
  }

  /**
   * Adds a task to the queue.
   * @param {object} task - The task to add.
   * @returns {Promise} Promise that resolves when task completes.
   */
  async enqueue(task) {
    return new Promise((resolve, reject) => {
      const taskWithCallbacks = {
        ...task,
        resolve,
        reject,
        id: task.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        enqueuedAt: new Date()
      };

      this.queue.push(taskWithCallbacks);
      this.events.emit('taskEnqueued', { taskId: taskWithCallbacks.id, queueLength: this.queue.length });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Processes the task queue.
   * @private
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    this.events.emit('queueProcessingStarted', { queueLength: this.queue.length });

    while (this.queue.length > 0 && this.activeTasks.size < this.maxConcurrentTasks) {
      const task = this.queue.shift();
      this.executeTask(task);
    }

    // Check if we need to continue processing
    if (this.queue.length > 0) {
      // Wait a bit and try again
      setTimeout(() => {
        this.processing = false;
        this.processQueue();
      }, 100);
    } else {
      this.processing = false;
      this.events.emit('queueProcessingCompleted');
    }
  }

  /**
   * Executes a single task.
   * @private
   * @param {object} task - The task to execute.
   */
  async executeTask(task) {
    this.activeTasks.set(task.id, task);
    this.events.emit('taskStarted', { taskId: task.id, startedAt: new Date() });

    try {
      const result = await task.execute();
      this.activeTasks.delete(task.id);
      this.events.emit('taskCompleted', { taskId: task.id, result, completedAt: new Date() });
      task.resolve(result);
    } catch (error) {
      this.activeTasks.delete(task.id);
      this.events.emit('taskFailed', { taskId: task.id, error: error.message, failedAt: new Date() });
      task.reject(error);
    }

    // Continue processing queue
    if (!this.processing && this.queue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Gets queue status.
   * @returns {object} Queue status information.
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeTasks: this.activeTasks.size,
      maxConcurrentTasks: this.maxConcurrentTasks,
      processing: this.processing
    };
  }
}

/**
 * Agent Registry for scalable agent discovery and management.
 */
class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.events = new EventEmitter();
    this.healthCheckInterval = 30000; // 30 seconds
    this.startHealthMonitoring();
  }

  /**
   * Registers an agent in the registry.
   * @param {Agent} agent - The agent to register.
   */
  register(agent) {
    this.agents.set(agent.id, {
      agent,
      registeredAt: new Date(),
      lastSeen: new Date(),
      isHealthy: true
    });

    this.events.emit('agentRegistered', {
      agentId: agent.id,
      timestamp: new Date()
    });
  }

  /**
   * Unregisters an agent from the registry.
   * @param {string} agentId - The ID of the agent to unregister.
   * @returns {boolean} True if agent was removed.
   */
  unregister(agentId) {
    const removed = this.agents.delete(agentId);
    if (removed) {
      this.events.emit('agentUnregistered', {
        agentId,
        timestamp: new Date()
      });
    }
    return removed;
  }

  /**
   * Gets an agent by ID.
   * @param {string} agentId - The agent ID.
   * @returns {Agent|null} The agent or null if not found.
   */
  getAgent(agentId) {
    const entry = this.agents.get(agentId);
    return entry?.agent || null;
  }

  /**
   * Gets all registered agents.
   * @returns {Array} Array of agent information.
   */
  getAllAgents() {
    return Array.from(this.agents.values()).map(entry => ({
      id: entry.agent.id,
      name: entry.agent.name,
      description: entry.agent.description,
      status: entry.agent.status,
      capabilities: entry.agent.goals,
      currentLoad: entry.agent.currentLoad,
      performanceMetrics: entry.agent.performanceMetrics,
      isHealthy: entry.isHealthy
    }));
  }

  /**
   * Finds agents by capability.
   * @param {string} capability - The capability to search for.
   * @returns {Array} Array of matching agents.
   */
  findByCapability(capability) {
    return this.getAllAgents().filter(agent =>
      agent.capabilities.some(cap =>
        cap.toLowerCase().includes(capability.toLowerCase())
      ) || agent.description.toLowerCase().includes(capability.toLowerCase())
    );
  }

  /**
   * Updates agent heartbeat.
   * @param {string} agentId - The agent ID.
   */
  updateHeartbeat(agentId) {
    const entry = this.agents.get(agentId);
    if (entry) {
      entry.lastSeen = new Date();
      entry.agent.performanceMetrics.lastHeartbeat = new Date();
    }
  }

  /**
   * Starts health monitoring for all agents.
   * @private
   */
  startHealthMonitoring() {
    setInterval(() => {
      const now = new Date();
      for (const [agentId, entry] of this.agents.entries()) {
        const timeSinceLastSeen = now - entry.lastSeen;
        const wasHealthy = entry.isHealthy;
        entry.isHealthy = timeSinceLastSeen < this.healthCheckInterval * 2;

        if (wasHealthy && !entry.isHealthy) {
          this.events.emit('agentUnhealthy', { agentId, timestamp: now });
        } else if (!wasHealthy && entry.isHealthy) {
          this.events.emit('agentHealthy', { agentId, timestamp: now });
        }
      }
    }, this.healthCheckInterval);
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
    this.currentLoad = 0; // Track current workload
    this.performanceMetrics = {
      tasksCompleted: 0,
      averageExecutionTime: 0,
      successRate: 1.0,
      lastHeartbeat: new Date()
    };

    // Multi-agent orchestration properties
    this.isOrchestrator = config.isOrchestrator || false;
    this.agentRegistry = new AgentRegistry(); // Enhanced agent discovery service
    this.taskQueue = new TaskQueue(); // Async task queue
    this.activeExecutions = new Map(); // Track ongoing task executions
    this.retryPolicy = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      backoffMultiplier: config.backoffMultiplier || 2
    };

    // Circuit breaker for error handling
    this.circuitBreaker = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 60000, // 1 minute
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failures: 0,
      lastFailureTime: null,
      successCount: 0
    };
    
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

    // Add orchestration tools if this is an orchestrator
    if (this.isOrchestrator) {
      this._addOrchestrationTools();
    }
  }

  /**
   * Gets an agent by ID.
   * @param {string} agentId - The agent ID.
   * @returns {Agent|null} The agent or null if not found.
   */
  getAgent(agentId) {
    return this.agentRegistry.getAgent(agentId);
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
      // 1. Reasoning Step
      const reasoningResult = await this.reason([input], ["feasibility", "relevance", "potential impact"]);
      console.log("Reasoning Result:", reasoningResult);

      // 2. Planning Step
      const plan = await this.plan(input);
      console.log("Plan:", plan);

      // 3. Delegate sub-tasks to agents
      const results = [];
      for (const subTask of plan.subTasks) {
        try {
          // Find best agent for this task based on role/capabilities
          const availableAgents = this.agentRegistry.getAllAgents().filter(a => a.isHealthy);
          const bestAgent = this._selectBestAgent(subTask, availableAgents);

          if (!bestAgent) {
            console.warn(`No suitable agent found for task: ${subTask.task}`);
            results.push({ taskId: subTask.taskId, error: `No suitable agent found for task: ${subTask.task}` });
            continue;
          }

          const result = await this.delegateTaskAsync(bestAgent.id, subTask.task);
          results.push({ taskId: subTask.taskId, result });

        } catch (error) {
          console.error(`Error delegating task ${subTask.taskId}:`, error);
          results.push({ taskId: subTask.taskId, error: error.message });
        }
      }

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
   * Adds orchestration tools to enable LLM-driven delegation.
   * @private
   */
  _addOrchestrationTools() {
    const delegateTaskTool = {
      name: "delegate_task",
      schema: {
        function_declaration: {
          name: "delegate_task",
          description: "Delegate a task to another agent in the system based on their capabilities",
          parameters: {
            type: "object",
            properties: {
              task_description: {
                type: "string",
                description: "Clear description of the task to delegate"
              },
              preferred_agent_type: {
                type: "string",
                description: "Type of agent or capability needed (e.g., 'researcher', 'coder', 'analyst')"
              },
              context: {
                type: "object",
                description: "Additional context and parameters for the task"
              },
              use_cot: {
                type: "boolean",
                description: "Whether to use Chain of Thought reasoning for this task"
              }
            },
            required: ["task_description"]
          }
        }
      },
      call: async (params) => {
        try {
          // Find best agent for the task
          const availableAgents = this.agentRegistry.getAllAgents().filter(a => a.isHealthy);

          let selectedAgent;
          if (params.preferred_agent_type) {
            const matchingAgents = this.agentRegistry.findByCapability(params.preferred_agent_type);
            selectedAgent = this._selectBestAgentFromList(matchingAgents);
          }

          if (!selectedAgent && availableAgents.length > 0) {
            selectedAgent = this._selectBestAgentFromList(availableAgents);
          }

          if (!selectedAgent) {
            throw new Error("No suitable agent available for delegation");
          }

          return await this.delegateTask(
            selectedAgent.id,
            params.task_description,
            params.context || {},
            params.use_cot || false
          );
        } catch (error) {
          return { error: `Delegation failed: ${error.message}` };
        }
      }
    };

    const getAgentInfoTool = {
      name: "get_agent_info",
      schema: {
        function_declaration: {
          name: "get_agent_info",
          description: "Get information about available agents and their current status",
          parameters: {
            type: "object",
            properties: {
              filter_by_capability: {
                type: "string",
                description: "Filter agents by specific capability or role"
              },
              include_performance: {
                type: "boolean",
                description: "Include performance metrics in the response"
              }
            }
          }
        }
      },
      call: async (params) => {
        let agents = this.agentRegistry.getAllAgents();

        if (params.filter_by_capability) {
          agents = this.agentRegistry.findByCapability(params.filter_by_capability);
        }

        return agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          status: agent.status,
          capabilities: agent.capabilities,
          currentLoad: agent.currentLoad,
          isHealthy: agent.isHealthy,
          ...(params.include_performance && { performanceMetrics: agent.performanceMetrics })
        }));
      }
    };

    this.addTool(delegateTaskTool);
    this.addTool(getAgentInfoTool);
  }

  /**
   * Checks if circuit breaker allows execution.
   * @private
   * @returns {boolean} True if execution is allowed.
   */
  _canExecute() {
    const now = Date.now();

    switch (this.circuitBreaker.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        if (now - this.circuitBreaker.lastFailureTime >= this.circuitBreaker.resetTimeout) {
          this.circuitBreaker.state = 'HALF_OPEN';
          this.circuitBreaker.successCount = 0;
          this.events.emit('circuitBreakerHalfOpen', { agent: this.id, timestamp: new Date() });
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return true;
    }
  }

  /**
   * Records a successful execution for circuit breaker.
   * @private
   */
  _recordSuccess() {
    this.circuitBreaker.failures = 0;

    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.successCount++;
      if (this.circuitBreaker.successCount >= 3) {
        this.circuitBreaker.state = 'CLOSED';
        this.events.emit('circuitBreakerClosed', { agent: this.id, timestamp: new Date() });
      }
    }
  }

  /**
   * Records a failure for circuit breaker.
   * @private
   */
  _recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
      this.events.emit('circuitBreakerOpen', {
        agent: this.id,
        failures: this.circuitBreaker.failures,
        timestamp: new Date()
      });
    }
  }

  /**
   * Enhanced task delegation with circuit breaker and queue management.
   * @param {string} agentId - The ID of the agent to delegate to.
   * @param {string} task - The task description.
   * @param {object} context - Additional context for the task.
   * @param {boolean} useCoT - Whether to use Chain of Thought reasoning.
   * @param {boolean} useQueue - Whether to use the task queue for async execution.
   * @returns {Promise<object>} The result from the delegated agent.
   */
  async delegateTaskAsync(agentId, task, context = {}, useCoT = false, useQueue = true) {
    if (!this.isOrchestrator) {
      throw new Error(`Agent ${this.name} is not configured as an orchestrator.`);
    }

    if (!this._canExecute()) {
      throw new Error(`Circuit breaker is OPEN for agent ${this.id}. Service temporarily unavailable.`);
    }

    const agent = this.agentRegistry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} is not registered with this orchestrator.`);
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    if (useQueue) {
      // Use async task queue
      return await this.taskQueue.enqueue({
        id: taskId,
        agentId,
        task,
        context,
        useCoT,
        execute: async () => {
          return await this._executeTaskWithCircuitBreaker(agent, task, context, useCoT, taskId);
        }
      });
    } else {
      // Direct execution
      return await this._executeTaskWithCircuitBreaker(agent, task, context, useCoT, taskId);
    }
  }

  /**
   * Executes a task with circuit breaker protection.
   * @private
   */
  async _executeTaskWithCircuitBreaker(agent, task, context, useCoT, taskId) {
    try {
      const result = await this.delegateTask(agent.id, task, context, useCoT);
      this._recordSuccess();
      return result;
    } catch (error) {
      this._recordFailure();
      throw error;
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

    this.agentRegistry.register(agent);
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

    const removed = this.agentRegistry.unregister(agentId);
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

    return this.agentRegistry.getAllAgents();
  }

  /**
   * Selects the best agent from a list based on current load and capabilities.
   * @private
   * @param {Array} agentList - List of agent information objects.
   * @returns {object|null} The best agent or null if none suitable.
   */
  _selectBestAgentFromList(agentList) {
    if (!agentList || agentList.length === 0) return null;

    // Filter healthy and available agents
    const availableAgents = agentList.filter(agent =>
      agent.isHealthy && agent.status !== 'error'
    );

    if (availableAgents.length === 0) return null;

    // Sort by current load (ascending) and success rate (descending)
    return availableAgents.sort((a, b) => {
      const loadDiff = a.currentLoad - b.currentLoad;
      if (loadDiff !== 0) return loadDiff;

      return b.performanceMetrics.successRate - a.performanceMetrics.successRate;
    })[0];
  }

  /**
   * Delegates a task to a specific agent with enhanced error handling and retry logic.
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

    const agent = this.agentRegistry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} is not registered with this orchestrator.`);
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    this.events.emit('taskDelegated', {
      orchestrator: this.id,
      agent: agentId,
      taskId,
      task,
      context,
      timestamp: new Date()
    });

    let attempt = 0;
    const maxRetries = this.retryPolicy.maxRetries;

    while (attempt <= maxRetries) {
      try {
        // Update agent load
        agent.currentLoad++;
        this.agentRegistry.updateHeartbeat(agentId);

        this.activeExecutions.set(taskId, {
          agentId,
          task,
          startTime: new Date(),
          attempt: attempt + 1
        });

        const startTime = Date.now();
        const result = await agent.run(task, context, useCoT);
        const executionTime = Date.now() - startTime;

        // Update performance metrics
        agent.performanceMetrics.tasksCompleted++;
        agent.performanceMetrics.averageExecutionTime =
          (agent.performanceMetrics.averageExecutionTime + executionTime) / 2;

        agent.currentLoad--;
        this.activeExecutions.delete(taskId);

        this.events.emit('taskCompleted', {
          orchestrator: this.id,
          agent: agentId,
          taskId,
          result,
          executionTime,
          attempt: attempt + 1,
          timestamp: new Date()
        });

        return {
          taskId,
          agentId,
          result,
          executionTime,
          attempt: attempt + 1,
          completedAt: new Date()
        };

      } catch (error) {
        attempt++;
        agent.currentLoad = Math.max(0, agent.currentLoad - 1);

        // Update success rate
        const totalAttempts = agent.performanceMetrics.tasksCompleted + attempt;
        agent.performanceMetrics.successRate =
          agent.performanceMetrics.tasksCompleted / totalAttempts;

        if (attempt > maxRetries) {
          this.activeExecutions.delete(taskId);

          this.events.emit('taskFailed', {
            orchestrator: this.id,
            agent: agentId,
            taskId,
            error: error.message,
            totalAttempts: attempt,
            timestamp: new Date()
          });

          // Try to delegate to another agent if available
          if (this.retryPolicy.maxRetries > 0) {
            const alternativeAgents = this.agentRegistry.getAllAgents()
              .filter(a => a.id !== agentId && a.isHealthy && a.status !== 'error');

            if (alternativeAgents.length > 0) {
              const alternativeAgent = this._selectBestAgentFromList(alternativeAgents);
              if (alternativeAgent) {
                this.events.emit('taskRedelegated', {
                  orchestrator: this.id,
                  originalAgent: agentId,
                  newAgent: alternativeAgent.id,
                  taskId,
                  reason: 'Original agent failed after retries',
                  timestamp: new Date()
                });

                return await this.delegateTask(alternativeAgent.id, task, context, useCoT);
              }
            }
          }

          throw error;
        }

        // Wait before retry with exponential backoff
        const delay = this.retryPolicy.retryDelay * Math.pow(this.retryPolicy.backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        this.events.emit('taskRetrying', {
          orchestrator: this.id,
          agent: agentId,
          taskId,
          attempt,
          maxRetries,
          delay,
          error: error.message,
          timestamp: new Date()
        });
      }
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
      const availableAgents = this.getManagedAgents().filter(agent => agent.isHealthy);
      const reasoningOptions = availableAgents.map(agent =>
        `Delegate to ${agent.name} (${agent.id}): ${agent.description} (Load: ${agent.currentLoad}, Success Rate: ${(agent.performanceMetrics.successRate * 100).toFixed(1)}%)`
      );

      const reasoningCriteria = [
        'Agent expertise alignment',
        'Task complexity match',
        'Current agent availability and load',
        'Agent performance history',
        'Expected execution time',
        'Dependencies between tasks'
      ];

      const reasoning = await this.reason(reasoningOptions, reasoningCriteria);

      // Step 2: Create a detailed plan
      const plan = await this.plan(goal);

      // Step 3: Execute the plan by delegating tasks
      const results = [];
      const executionSequence = plan.sequence || [];
      const parallelTasks = options.allowParallel !== false; // Default to true

      if (parallelTasks && executionSequence.length > 1) {
        // Execute tasks in parallel where possible
        const taskPromises = executionSequence.map(async (taskId) => {
          const task = plan.subTasks?.find(t => t.id === taskId || t.task === taskId);
          if (!task) return null;

          // Find best agent for this task based on role/capabilities
          const bestAgent = this._selectBestAgent(task, availableAgents);
          if (!bestAgent) {
            throw new Error(`No suitable agent found for task: ${task.task || taskId}`);
          }

          return await this.delegateTask(
            bestAgent.id,
            task.task || taskId,
            {
              ...options.context,
              taskContext: task,
              orchestrationGoal: goal
            },
            options.useCoT || false
          );
        });

        const parallelResults = await Promise.allSettled(taskPromises);

        // Process results and handle any failures
        for (let i = 0; i < parallelResults.length; i++) {
          const result = parallelResults[i];
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
          } else if (result.status === 'rejected') {
            this.events.emit('parallelTaskFailed', {
              orchestrator: this.id,
              taskIndex: i,
              error: result.reason?.message || 'Unknown error',
              timestamp: new Date()
            });
            // Continue with other tasks unless critical failure
            if (options.failFast) {
              throw result.reason;
            }
          }
        }
      } else {
        // Execute tasks sequentially
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
   * Enhanced agent selection with sophisticated matching algorithm.
   * @private
   * @param {object} task - The task to assign.
   * @param {Array} availableAgents - List of available agents.
   * @returns {object|null} The best agent or null if none suitable.
   */
  _selectBestAgent(task, availableAgents) {
    if (!availableAgents || availableAgents.length === 0) return null;

    const taskRole = task.role?.toLowerCase() || '';
    const taskDescription = (task.task || '').toLowerCase();
    const taskKeywords = this._extractKeywords(taskDescription);

    // Filter healthy and available agents
    const healthyAgents = availableAgents.filter(agent =>
      agent.isHealthy && agent.status !== 'error'
    );

    if (healthyAgents.length === 0) return null;

    // Score agents based on multiple weighted criteria
    const scoredAgents = healthyAgents.map(agent => {
      const scores = this._calculateAgentScores(agent, task, taskRole, taskDescription, taskKeywords, healthyAgents);
      const totalScore = this._calculateWeightedScore(scores);

      return {
        agent,
        score: totalScore,
        breakdown: scores
      };
    });

    // Sort by score (descending) and return the best agent
    scoredAgents.sort((a, b) => b.score - a.score);

    // Log selection reasoning for debugging
    this.events.emit('agentSelectionCompleted', {
      orchestrator: this.id,
      task: taskDescription,
      selectedAgent: scoredAgents[0]?.agent.id,
      scoreBreakdown: scoredAgents[0]?.breakdown,
      allScores: scoredAgents.map(s => ({
        agentId: s.agent.id,
        score: s.score,
        breakdown: s.breakdown
      })),
      timestamp: new Date()
    });

    return scoredAgents[0]?.agent || null;
  }

  /**
   * Extracts keywords from task description for better matching.
   * @private
   * @param {string} description - Task description.
   * @returns {Array} Array of keywords.
   */
  _extractKeywords(description) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }

  /**
   * Calculates detailed scores for an agent against a task.
   * @private
   */
  _calculateAgentScores(agent, task, taskRole, taskDescription, taskKeywords, healthyAgents) {
    const scores = {};

    // 1. Role matching (0-100)
    scores.roleMatch = 0;
    if (taskRole) {
      if (agent.name.toLowerCase().includes(taskRole)) scores.roleMatch += 100;
      else if (agent.description.toLowerCase().includes(taskRole)) scores.roleMatch += 80;

      // Check capabilities for role match
      const roleInCapabilities = (agent.capabilities || []).some(cap =>
        cap.toLowerCase().includes(taskRole)
      );
      if (roleInCapabilities) scores.roleMatch += 60;
    }

    // 2. Keyword matching (0-100)
    scores.keywordMatch = 0;
    if (taskKeywords.length > 0) {
      const agentText = `${agent.name} ${agent.description} ${(agent.capabilities || []).join(' ')}`.toLowerCase();
      const matchedKeywords = taskKeywords.filter(keyword => agentText.includes(keyword));
      scores.keywordMatch = (matchedKeywords.length / taskKeywords.length) * 100;
    }

    // 3. Performance score (0-100)
    scores.performance = agent.performanceMetrics.successRate * 100;

    // 4. Load balancing score (0-100)
    const maxLoad = Math.max(...healthyAgents.map(a => a.currentLoad), 1);
    scores.loadBalance = maxLoad > 0 ? ((maxLoad - agent.currentLoad) / maxLoad) * 100 : 100;

    // 5. Availability score (0-100)
    scores.availability = 0;
    switch (agent.status) {
      case 'idle': scores.availability = 100; break;
      case 'working': scores.availability = 50; break;
      case 'busy': scores.availability = 20; break;
      default: scores.availability = 0;
    }

    // 6. Experience score based on tasks completed (0-100)
    const maxTasks = Math.max(...healthyAgents.map(a => a.performanceMetrics.tasksCompleted), 1);
    scores.experience = maxTasks > 0 ? (agent.performanceMetrics.tasksCompleted / maxTasks) * 100 : 0;

    // 7. Response time score (0-100) - lower average execution time is better
    const avgTimes = healthyAgents.map(a => a.performanceMetrics.averageExecutionTime).filter(t => t > 0);
    if (avgTimes.length > 0) {
      const maxTime = Math.max(...avgTimes);
      const agentTime = agent.performanceMetrics.averageExecutionTime || maxTime;
      scores.responseTime = maxTime > 0 ? ((maxTime - agentTime) / maxTime) * 100 : 100;
    } else {
      scores.responseTime = 100;
    }

    return scores;
  }

  /**
   * Calculates weighted total score from individual scores.
   * @private
   */
  _calculateWeightedScore(scores) {
    const weights = {
      roleMatch: 0.25,        // 25% - Most important
      keywordMatch: 0.20,     // 20% - Very important
      performance: 0.20,      // 20% - Very important
      loadBalance: 0.15,      // 15% - Important for scaling
      availability: 0.10,     // 10% - Moderately important
      experience: 0.05,       // 5% - Nice to have
      responseTime: 0.05      // 5% - Nice to have
    };

    return Object.entries(scores).reduce((total, [key, score]) => {
      return total + (score * (weights[key] || 0));
    }, 0);
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
      duration: Date.now() - execution.startTime.getTime(),
      attempt: execution.attempt || 1
    }));
  }

  /**
   * Gets comprehensive orchestrator status including queue and circuit breaker info.
   * @returns {object} Detailed orchestrator status.
   */
  getOrchestratorStatus() {
    if (!this.isOrchestrator) {
      throw new Error(`Agent ${this.name} is not configured as an orchestrator.`);
    }

    return {
      id: this.id,
      name: this.name,
      status: this.status,
      managedAgents: this.getManagedAgents().length,
      healthyAgents: this.getManagedAgents().filter(a => a.isHealthy).length,
      activeExecutions: this.getActiveExecutions().length,
      taskQueue: this.taskQueue.getStatus(),
      circuitBreaker: {
        state: this.circuitBreaker.state,
        failures: this.circuitBreaker.failures,
        lastFailureTime: this.circuitBreaker.lastFailureTime,
        successCount: this.circuitBreaker.successCount
      },
      performanceMetrics: this.performanceMetrics,
      timestamp: new Date()
    };
  }

  /**
   * Gracefully shuts down the orchestrator.
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (!this.isOrchestrator) {
      throw new Error(`Agent ${this.name} is not configured as an orchestrator.`);
    }

    this.events.emit('orchestratorShuttingDown', {
      orchestrator: this.id,
      timestamp: new Date()
    });

    // Wait for active executions to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (this.activeExecutions.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Force cleanup if timeout reached
    if (this.activeExecutions.size > 0) {
      this.events.emit('orchestratorForceShutdown', {
        orchestrator: this.id,
        remainingTasks: this.activeExecutions.size,
        timestamp: new Date()
      });
      this.activeExecutions.clear();
    }

    this.events.emit('orchestratorShutdownComplete', {
      orchestrator: this.id,
      timestamp: new Date()
    });
  }
}

// Export all classes
export { EventEmitter, MemoryManager, ToolHandler, TaskQueue, AgentRegistry };
