import { Agency } from './Agency.js';
import { TeamFactory } from './TeamFactory.js';
import fs from 'fs/promises';

/**
 * Factory for creating Agency instances from configuration
 */
/**
 * @class AgencyFactory
 * @classdesc Factory class for creating and loading Agency instances.
 */
export class AgencyFactory {
  /**
   * Create a new AgencyFactory
   * @param {Object} config - Factory configuration
   * @param {TeamFactory} config.teamFactory - TeamFactory instance for creating team
   * @param {AgentFactory} config.agentFactory - AgentFactory instance for creating agents
   */
  constructor(config) {
    this.teamFactory = config.teamFactory;
    this.agentFactory = config.agentFactory;
  }

  /**
   * Create an agency from a configuration object
   * @param {Object} config - Agency configuration
   * @returns {Agency} - Created agency instance
   */
  /**
   * Creates an agency instance from a configuration object.
   * @param {object} config - The agency configuration.
   * @returns {Agency} The created agency instance.
   */
  createAgency(config) {
    // Create the agency with updated configuration options
    const agency = new Agency({
      name: config.agency.name,
      description: config.agency.description,
      logging: config.agency.logging || {
        level: 'none',
        tracing: false,
        format: 'text',
        destination: 'console'
      },
      memoryConfig: config.agency.memoryConfig
    });

    // Create and add agents directly if specified
    if (config.agents) {
      const agents = this.agentFactory.createAgents(config.agents);
      for (const [agentId, agent] of Object.entries(agents)) {
        agency.addAgent(agentId, agent);
      }
    }

    // Create and add teams
    if (config.teams) {
      for (const [teamId, teamConfig] of Object.entries(config.teams)) {
        const team = this.teamFactory.createTeamFromConfig(config, teamId);
        agency.addTeam(teamId, team);
      }
    }
    // Backward compatibility for singular team
    else if (config.team) {
      for (const [teamId, teamConfig] of Object.entries(config.team)) {
        const team = this.teamFactory.createTeamFromConfig(config, teamId);
        agency.addTeam(teamId, team);
      }
    }

    // Create and add brief if specified
    if (config.brief) {
      for (const [briefId, briefData] of Object.entries(config.brief)) {
        agency.createBrief(briefId, briefData);
      }
    }

    // Set up workflows if defined
    if (config.workflows) {
      for (const [workflowId, workflowConfig] of Object.entries(config.workflows)) {
        // Store workflow configuration for later use
        agency.workflows[workflowId] = workflowConfig;
      }
    }

    // Set up job schemas if defined
    if (config.jobSchemas) {
      for (const [schemaId, schema] of Object.entries(config.jobSchemas)) {
        agency.defineJobSchema(schemaId, schema.input, schema.output);
      }
    }

    // Set up error handlers if defined
    if (config.errorHandlers) {
      for (const [handlerId, handler] of Object.entries(config.errorHandlers)) {
        if (typeof handler === 'function') {
          agency.setErrorHandler(handlerId, handler);
        } else {
          agency.log('warn', `Error handler ${handlerId} is not a function`);
        }
      }
    }

    // Set up workflow error handlers if defined
    if (config.workflowErrorHandlers) {
      for (const [workflowId, handler] of Object.entries(config.workflowErrorHandlers)) {
        if (typeof handler === 'function') {
          agency.setWorkflowErrorHandler(workflowId, handler);
        } else {
          agency.log('warn', `Workflow error handler ${workflowId} is not a function`);
        }
      }
    }

    return agency;
  }

  /**
   * Load an agency from a JSON file
   * @param {string} filePath - Path to the JSON file
   * @returns {Promise<Agency>} - Created agency instance
   */
  /**
   * Loads an agency from a file.
   * @param {string} filePath - The path to the agency configuration file.
   * @returns {Promise<Agency>} A promise that resolves with the loaded agency instance.
   */
  async loadAgencyFromFile(filePath) {
    try {
      const configData = await fs.readFile(filePath, 'utf8');
      const config = JSON.parse(configData);
      return this.createAgency(config);
    } catch (error) {
      throw new Error(`Failed to load agency from file: ${error.message}`);
    }
  }

  /**
   * Execute a workflow defined in the configuration
   * @param {Agency} agency - Agency instance
   * @param {string} workflowId - ID of the workflow to execute
   * @param {Object} context - Context data for the workflow
   * @param {Object} options - Workflow execution options
   * @returns {Promise<Object>} - Workflow results
   */
  /**
   * Executes a workflow using a pre-configured agency.
   * @param {Agency} agency - The agency instance.
   * @param {string} workflowId - The ID of the workflow to execute.
   * @param {object} [context={}] - Optional context data to pass to the workflow.
   * @param {object} [options={}] - Optional execution options.
   * @returns {Promise<*>} A promise that resolves with the workflow execution results.
   */
  async executeWorkflow(agency, workflowId, context = {}, options = {}) {
    if (!agency.workflows[workflowId]) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const workflowConfig = agency.workflows[workflowId];
    const workflowSteps = workflowConfig.steps || [];

    // Generate a unique execution ID
    const executionId = `${workflowId}-${Date.now()}`;

    // Execute the workflow
    return agency.executeWorkflow(workflowSteps, executionId, context, options);
  }
}
