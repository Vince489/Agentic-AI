/**
 * WorkflowManager - A high-level abstraction for managing workflows.
 *
 * This class provides a simplified API for defining, executing, and managing workflows,
 * abstracting away the low-level details of workflow execution.
 */
export class WorkflowManager {
  /**
   * Create a new WorkflowManager instance.
   * @param {Object} options - Configuration options for the WorkflowManager.
   * @param {AgencyFactory} options.agencyFactory - The agency factory instance.
   * @param {TeamFactory} options.teamFactory - The team factory instance.
   * @param {AgentFactory} options.agentFactory - The agent factory instance.
   */
  constructor({ agencyFactory, teamFactory, agentFactory }) {
    this.agencyFactory = agencyFactory;
    this.teamFactory = teamFactory;
    this.agentFactory = agentFactory;
    this.agency = null;
  }

  /**
   * Initialize the WorkflowManager with an agency configuration.
   * @param {string} configPath - Path to the agency configuration file.
   */
  async initialize(configPath) {
    this.agency = await this.agencyFactory.loadAgencyFromFile(configPath);
  }

  /**
   * Define a workflow template.
   * @param {string} name - The name of the workflow template.
   * @param {Object} template - The workflow template definition.
   */
  defineWorkflowTemplate(name, template) {
    if (!this.workflowTemplates) {
      this.workflowTemplates = {};
    }
    this.workflowTemplates[name] = template;
  }

  /**
   * Execute a workflow using a predefined template.
   * @param {string} templateName - The name of the workflow template to use.
   * @param {Object} inputs - Inputs for the workflow.
   * @param {Object} options - Additional options for workflow execution.
   */
  async executeWorkflow(templateName, inputs, options = {}) {
    if (!this.workflowTemplates || !this.workflowTemplates[templateName]) {
      throw new Error(`Workflow template "${templateName}" not found.`);
    }

    if (!this.agency) {
      throw new Error('WorkflowManager not initialized. Call initialize() first.');
    }

    const template = this.workflowTemplates[templateName];
    const { teamName, briefId, transformWorkflowDefinition } = template;

    // Get the team based on the template
    const team = this.agency.team[teamName];
    if (!team) {
      throw new Error(`Team "${teamName}" not found in agency.`);
    }

    // Create a shared memory scope for the workflow
    const sharedMemoryScopeId = options.sharedMemoryScopeId || `${templateName}-${Date.now()}`;
    const sharedMemoryScope = this.agency.createMemoryScope(sharedMemoryScopeId);

    // Store relevant data in shared memory
    if (inputs) {
      for (const [key, value] of Object.entries(inputs)) {
        sharedMemoryScope.remember(key, value);
      }
    }

    // Transform the workflow definition
    const workflowDefinition = transformWorkflowDefinition(
      team,
      this.agency,
      briefId,
      inputs
    );

    // Run the workflow with shared memory context
    const workflowContext = {
      ...this.agency.brief[briefId],
      sharedMemoryScope: sharedMemoryScope,
      ...inputs
    };

    const workflowResult = await this.agency.executeWorkflow(
      workflowDefinition,
      `${templateName}-workflow-${Date.now()}`,
      workflowContext
    );

    return workflowResult;
  }

  /**
   * Register a tool with the agent factory.
   * @param {Object} tool - The tool to register.
   */
  registerTool(tool) {
    this.agentFactory.registerTool(tool);
  }
}
