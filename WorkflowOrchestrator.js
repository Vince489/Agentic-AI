/**
 * WorkflowOrchestrator - A universal orchestrator for executing workflows.
 *
 * This class provides a high-level API for defining, executing, and managing workflows,
 * abstracting away all low-level details and providing a consistent interface for all workflow types.
 */
export class WorkflowOrchestrator {
  /**
   * Create a new WorkflowOrchestrator instance.
   * @param {Object} options - Configuration options for the WorkflowOrchestrator.
   * @param {WorkflowManager} options.workflowManager - The workflow manager instance.
   * @param {InputHandler} options.inputHandler - The input handler instance.
   */
  constructor({ workflowManager, inputHandler }) {
    this.workflowManager = workflowManager;
    this.inputHandler = inputHandler;
  }

  /**
   * Define a workflow configuration.
   * @param {string} name - The name of the workflow.
   * @param {Object} config - The workflow configuration.
   */
  defineWorkflow(name, config) {
    if (!this.workflows) {
      this.workflows = {};
    }
    this.workflows[name] = config;
  }

  /**
   * Execute a workflow.
   * @param {string} workflowName - The name of the workflow to execute.
   * @param {Array<string>} argv - Command line arguments.
   * @param {Object} agency - The agency instance.
   */
  async execute(workflowName, argv, agency) {
    if (!this.workflows || !this.workflows[workflowName]) {
      throw new Error(`Workflow "${workflowName}" not found.`);
    }

    const workflow = this.workflows[workflowName];

    // Parse inputs
    let inputs;
    try {
      inputs = this.inputHandler.parseInputs(workflowName, argv);
    } catch (error) {
      throw error;
    }

    // Execute the workflow
    const result = await this.workflowManager.executeWorkflow(workflow.template, inputs);

    // Process the result
    const processedResult = this.processResult(result, workflow);

    // Handle next workflow if specified
    if (workflow.nextWorkflow) {
      return this.executeNextWorkflow(workflow.nextWorkflow, processedResult, agency);
    }

    return processedResult;
  }

  /**
   * Execute the next workflow in a chain.
   * @param {Object} nextWorkflowConfig - Configuration for the next workflow.
   * @param {Object} previousResult - Result from the previous workflow.
   * @param {Object} agency - The agency instance.
   * @returns {Promise<Object>} - Result of the next workflow.
   */
  async executeNextWorkflow(nextWorkflowConfig, previousResult, agency) {
    let nextInputs;

    try {
      // Use the previous result to generate inputs for the next workflow
      nextInputs = nextWorkflowConfig.inputs(previousResult);
    } catch (error) {
      console.warn('Warning: Using fallback data due to error in previous workflow:', error.message);
      nextInputs = await this.applyFallback(nextWorkflowConfig.fallback, agency);
    }

    // Execute the next workflow
    const nextResult = await this.workflowManager.executeWorkflow(nextWorkflowConfig.template, nextInputs);
    const finalResult = this.processResult(nextResult, nextWorkflowConfig);

    // Save the final result if specified
    if (nextWorkflowConfig.saveOutput) {
      await this.saveOutput(finalResult, nextWorkflowConfig.saveOutput);
    }

    return finalResult;
  }

  /**
   * Apply fallback data if a workflow fails.
   * @param {string} fallbackPath - Path to the fallback data file.
   * @param {Object} agency - The agency instance.
   * @returns {Promise<Object>} - Fallback data.
   */
  async applyFallback(fallbackPath, agency) {
    try {
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;
      const __dirname = path.dirname((await import('url')).fileURLToPath(import.meta.url));
      const fallbackDataPath = path.join(__dirname, fallbackPath);
      const fallbackData = JSON.parse(fs.readFileSync(fallbackDataPath, 'utf8'));
      return {
        travelData: fallbackData,
        tripDuration: 3,
        travelerPreferences: {}
      };
    } catch (error) {
      console.error('Error loading fallback data:', error);
      throw new Error('Failed to load fallback data');
    }
  }

  /**
   * Save the workflow output to a file.
   * @param {Object} result - The result to save.
   * @param {string} outputPath - Path to save the output.
   */
  async saveOutput(result, outputPath) {
    try {
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;
      const __dirname = path.dirname((await import('url')).fileURLToPath(import.meta.url));
      const fullOutputPath = path.join(__dirname, outputPath);
      fs.writeFileSync(fullOutputPath, JSON.stringify(result, null, 2));
      console.log(`Result saved to: ${fullOutputPath}`);
    } catch (error) {
      console.error('Error saving output:', error);
      throw new Error('Failed to save output');
    }
  }

  /**
   * Process the workflow result.
   * @param {Object} result - The workflow result.
   * @param {Object} workflow - The workflow configuration.
   */
  processResult(result, workflow) {
    const jobName = workflow.jobName;
    const results = result.results;

    if (!results[jobName]) {
      throw new Error(`Error: No results found for job "${jobName}"`);
    }

    try {
      const parsedResult = typeof results[jobName] === 'string'
        ? JSON.parse(results[jobName])
        : results[jobName];

      return parsedResult;
    } catch (parseError) {
      // If not valid JSON, return the raw text
      return results[jobName];
    }
  }
}
