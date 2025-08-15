import { readFile } from 'fs/promises';
import { Team } from './Team.js';

/**
 * Factory class for creating team
 */
/**
 * @class TeamFactory
 * @classdesc Factory class for creating and configuring teams.
 */
export class TeamFactory {
  /**
   * Create a new team factory
   * @param {Object} config - Factory configuration
   * @param {AgentFactory} config.agentFactory - Agent factory instance
   */
  constructor(config) {
    this.agentFactory = config.agentFactory;
  }

  /**
   * Create a team from a JSON configuration
   * @param {Object} teamConfig - Team configuration
   * @param {string} teamConfig.name - Team name
   * @param {string} teamConfig.description - Team description
   * @param {Object} teamConfig.agents - Agent configurations
   * @param {Object} teamConfig.jobs - Job definitions
   * @param {Array<string>} teamConfig.workflow - Order of job execution
   * @returns {Team} - Created team instance
   */
  /**
   * Creates a team from a configuration object.
   * @param {object} teamConfig - The team configuration.
   * @returns {Team} The created team.
   */
  createTeam(teamConfig) {
    // Create agents from the configuration
    const agents = this.agentFactory.createAgents(teamConfig.agents || {});
    
    // Create the team
    const team = new Team({
      name: teamConfig.name,
      description: teamConfig.description,
      agents,
      jobs: teamConfig.jobs || {},
      workflow: teamConfig.workflow || []
    });
    
    return team;
  }

  /**
   * Load a team configuration from a JSON file
   * @param {string} filePath - Path to the JSON configuration file
   * @returns {Promise<Team>} - Created team instance
   * @throws {Error} - If file cannot be read or parsed
   */
  /**
   * Loads a team from a file.
   * @param {string} filePath - The path to the team configuration file.
   * @returns {Promise<Team>} A promise that resolves with the loaded team.
   */
  async loadTeamFromFile(filePath) {
    try {
      // In a browser environment, use fetch
      if (typeof window !== 'undefined') {
        const response = await fetch(filePath);
        const teamConfig = await response.json();
        return this.createTeam(teamConfig);
      } 
      // In Node.js environment, use fs/promises
      else {
        // Convert the file path to a proper URL format for ESM
        const fileUrl = filePath.startsWith('file:') ? filePath : `file://${filePath}`;
        
        // Read and parse the JSON file
        const fileContent = await readFile(new URL(fileUrl), 'utf8');
        const teamConfig = JSON.parse(fileContent);
        
        return this.createTeam(teamConfig);
      }
    } catch (error) {
      console.error(`Error loading team configuration from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Create a team from a configuration object that includes agent configurations
   * @param {Object} config - Complete configuration object
   * @param {Object} config.team - Team configurations
   * @param {Object} config.agents - Agent configurations
   * @param {string} teamId - ID of the team to create
   * @returns {Team} - Created team instance
   * @throws {Error} - If team configuration not found for the given teamId
   */
  /**
   * Creates a team from a configuration object, using the AgentFactory.
   * @param {object} config - The overall configuration object.
   * @param {string} teamId - The ID of the team to create.
   * @returns {Team} The created team.
   */
  createTeamFromConfig(config, teamId) {
    // Get the team configuration
    const teamConfig = config.teams ? config.teams[teamId] : config.team[teamId];
    if (!teamConfig) {
      throw new Error(`Team configuration not found for ID: ${teamId}`);
    }
    
    console.log('Team configuration from createTeamFromConfig:');
    console.log('- teamId:', teamId);
    console.log('- name:', teamConfig.name);
    console.log('- agents:', teamConfig.agents);
    console.log('- jobs:', Object.keys(teamConfig.jobs || {}));
    console.log('- workflow:', teamConfig.workflow);
    
    // Create all required agents
    const agents = {};
    for (const [role, agentId] of Object.entries(teamConfig.agents)) {
      const agentConfig = config.agents[agentId];
      if (!agentConfig) {
        console.warn(`Warning: Agent configuration not found for ID: ${agentId}`);
        continue;
      }
      agents[role] = this.agentFactory.createAgent(agentConfig);
    }
    
    // Create the team with the agents
    const team = new Team({
      name: teamConfig.name,
      description: teamConfig.description,
      agents: agents,
      jobs: teamConfig.jobs || {},
      workflow: teamConfig.workflow || []
    });
    
    console.log('Created team:');
    console.log('- name:', team.name);
    console.log('- agents:', Object.keys(team.agents));
    console.log('- jobs:', Object.keys(team.jobs));
    console.log('- workflow:', team.workflow);
    
    return team;
  }
}
