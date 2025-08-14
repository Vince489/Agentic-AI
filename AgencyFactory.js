import { Agency } from './Agency.js';
import { TeamFactory } from './TeamFactory.js';
import fs from 'fs/promises';
import { transformWorkflowDefinition } from '../workflow-utils.js';

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

    // Create and add team
    if (config.team) {
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

  /**
   * Creates a shared memory scope for a workflow and populates it with inputs.
   * @param {Agency} agency - The agency instance.
   * @param {string} briefId - The ID of the brief.
   * @param {Object} inputs - Inputs for the workflow.
   * @returns {Object} - The shared memory scope.
   */
  createSharedMemoryForWorkflow(agency, briefId, inputs) {
    const sharedMemoryScopeId = `${briefId}SharedData-${Date.now()}`;
    const sharedMemoryScope = agency.createMemoryScope(sharedMemoryScopeId);

    // Populate shared memory with inputs
    for (const [key, value] of Object.entries(inputs)) {
      sharedMemoryScope.remember(key, value);
    }

    return sharedMemoryScope;
  }

  /**
   * Creates a workflow definition from a brief ID and inputs.
   * @param {Agency} agency - The agency instance.
   * @param {string} briefId - The ID of the brief.
   * @param {Object} inputs - Inputs for the workflow.
   * @returns {Array} - The transformed workflow definition.
   */
  createWorkflowFromBrief(agency, briefId, inputs) {
    // Dynamically determine the team and job associated with the brief
    let team = null;
    let jobId = null;

    for (const [teamId, teamObj] of Object.entries(agency.team)) {
      const jobs = teamObj.jobs || {};
      for (const [currentJobId, jobConfig] of Object.entries(jobs)) {
        if (jobConfig.brief === briefId) {
          team = teamObj;
          jobId = currentJobId;
          break;
        }
      }
      if (team) break;
    }

    if (!team || !jobId) {
      throw new Error(`No team or job found for brief ID: ${briefId}`);
    }

    return transformWorkflowDefinition(team, agency, briefId, inputs);
  }

  /**
   * Executes a brief by creating a workflow, shared memory, and running the workflow.
   * @param {Agency} agency - The agency instance.
   * @param {string} briefId - The ID of the brief to execute.
   * @param {Object} inputs - Inputs for the workflow.
   * @returns {Promise<Object>} - The workflow results.
   */
  async executeBrief(agency, briefId, inputs) {
    if (briefId === 'generate-itinerary') {
      return this.executeGenerateItinerary(agency, inputs);
    }

    // Create shared memory scope
    const sharedMemoryScope = this.createSharedMemoryForWorkflow(agency, briefId, inputs);

    // Create workflow definition
    const workflowDefinition = this.createWorkflowFromBrief(agency, briefId, inputs);

    // Execute the workflow
    const workflowContext = {
      ...agency.brief[briefId],
      sharedMemoryScope,
      ...inputs
    };

    const executionId = `${briefId}-workflow-${Date.now()}`;
    const result = await agency.executeWorkflow(workflowDefinition, executionId, workflowContext);

    // Process the result
    return this.processWorkflowResult(agency, briefId, result);
  }

  /**
   * Executes the generate-itinerary brief by chaining search and itinerary workflows.
   * @param {Agency} agency - The agency instance.
   * @param {Object} inputs - Inputs for the workflow.
   * @returns {Promise<Object>} - The workflow results.
   */
  async executeGenerateItinerary(agency, inputs) {
    // Create shared memory scope for the entire process
    const sharedMemoryScopeId = 'generateItinerarySharedData';
    const sharedMemoryScope = agency.createMemoryScope(sharedMemoryScopeId);
    sharedMemoryScope.remember('destination', inputs.destination);

    // Execute search workflow
    const searchWorkflowDefinition = transformWorkflowDefinition(
      agency.team.travelSearchTeam,
      agency,
      'travel-search-brief',
      inputs
    );

    const searchWorkflowContext = {
      ...agency.brief['travel-search-brief'],
      sharedMemoryScope,
      ...inputs
    };

    const searchExecutionId = `search-travel-workflow-${Date.now()}`;
    const searchResult = await agency.executeWorkflow(
      searchWorkflowDefinition,
      searchExecutionId,
      searchWorkflowContext
    );

    const searchResults = searchResult.results;
    if (!searchResults.searchTravelInfo) {
      throw new Error('Error: No travel search results found');
    }

    // Log the output of the searchTravelInfo job
    console.log("Output of searchTravelInfo job:");
    console.log(JSON.stringify(searchResults.searchTravelInfo, null, 2));

    // Parse the search results
    let travelData;
    try {
      let resultText = searchResults.searchTravelInfo;
      if (typeof resultText === 'string') {
        // Remove Markdown formatting if present
        resultText = resultText.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
      }
      travelData = typeof resultText === 'string'
        ? JSON.parse(resultText)
        : resultText;
    } catch (parseError) {
      throw new Error(`Error parsing travel search results: ${parseError.message}`);
    }

    // Execute itinerary workflow with the travelData
    const itineraryInputs = {
      travelData,
      tripDuration: 3,
      travelerPreferences: {}
    };

    const itineraryWorkflowDefinition = transformWorkflowDefinition(
      agency.team.travelPlanningTeam,
      agency,
      'travel-itinerary-brief',
      itineraryInputs
    );

    const itineraryWorkflowContext = {
      ...agency.brief['travel-itinerary-brief'],
      sharedMemoryScope,
      ...itineraryInputs
    };

    const itineraryExecutionId = `create-itinerary-workflow-${Date.now()}`;
    const itineraryResult = await agency.executeWorkflow(
      itineraryWorkflowDefinition,
      itineraryExecutionId,
      itineraryWorkflowContext
    );

    // Process the itinerary result
    return this.processItineraryResult(itineraryResult);
  }

  /**
   * Processes the itinerary workflow result.
   * @param {Object} result - The workflow result.
   * @returns {Object} - The processed result.
   */
  processItineraryResult(result) {
    const itineraryResults = result.results;
    if (!itineraryResults.createItinerary) {
      throw new Error('Error: No itinerary results found');
    }

    try {
      const parsedResult = typeof itineraryResults.createItinerary === 'string'
        ? JSON.parse(itineraryResults.createItinerary)
        : itineraryResults.createItinerary;
      return parsedResult;
    } catch (parseError) {
      // If not valid JSON, return the raw text
      return itineraryResults.createItinerary;
    }
  }

  /**
   * Processes the workflow result to extract and parse the relevant output.
   * @param {Agency} agency - The agency instance.
   * @param {string} briefId - The ID of the brief.
   * @param {Object} result - The workflow result.
   * @returns {Object} - The processed result.
   */
  processWorkflowResult(agency, briefId, result) {
    const results = result.results;
    let jobName;

    if (briefId === 'generate-itinerary') {
      jobName = 'createItinerary'; // Final job in the chain
    } else if (briefId === 'travel-search-brief') {
      jobName = 'searchTravelInfo';
    } else if (briefId === 'travel-itinerary-brief') {
      jobName = 'createItinerary';
    } else {
      throw new Error(`Unsupported brief ID: ${briefId}`);
    }

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
