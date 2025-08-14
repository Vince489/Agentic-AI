// trav3.js - Orchestrator for the travel search workflow

import { AgencyFactory } from './AgencyFactory.js';
import { TeamFactory } from './TeamFactory.js';
import { AgentFactory } from './AgentFactory.js';
import { webSearchTool } from './tools/search_tool.js';
import { InputHandler } from './InputHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from a .env file.
dotenv.config();

async function main() {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set. Please create a .env file with GEMINI_API_KEY=your_key_here');
    }

    // Initialize the AgentFactory with the Gemini API key.
    const agentFactory = new AgentFactory({
      defaultProvider: 'gemini',
      apiKeys: {
        gemini: GEMINI_API_KEY
      }
    });

    // Create the team and agency factories, passing the agentFactory instance.
    const teamFactory = new TeamFactory({ agentFactory });
    const agencyFactory = new AgencyFactory({
      teamFactory,
      agentFactory,
      logging: {
        level: 'debug',
        tracing: true
      }
    });

    agentFactory.registerTool(webSearchTool);

    // Get the directory name of the current module.
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    // Define the path to the travel search configuration file.
    const configPath = path.join(__dirname, 'trav3.json');

// Load the agency configuration from the JSON file.
    const agency = await agencyFactory.loadAgencyFromFile(configPath);

    // Define workflow input configurations
    const workflowConfigs = {
      'generate-itinerary': {
        destination: {
          argIndex: 0,
          required: true,
          defaultValue: "Miami, Florida"
        }
      },
      'travel-itinerary': {
        travelData: {
          argIndex: 0,
          required: true,
          parser: (value) => value ? JSON.parse(value) : null
        },
        tripDuration: {
          argIndex: 1,
          required: false,
          defaultValue: 3,
          parser: (value) => value ? parseInt(value) : 3
        },
        travelerPreferences: {
          argIndex: 2,
          required: false,
          defaultValue: {},
          parser: (value) => value ? JSON.parse(value) : {}
        }
      }
    };

    // Initialize InputHandler with the agency and workflow configurations
    const inputHandler = new InputHandler(agency, workflowConfigs);

    // Get the brief ID from command line arguments or use default
    const briefId = process.argv[2] || 'generate-itinerary';

    if (!briefId || !agency.brief[briefId]) {
      console.error(`Error: Brief with ID "${briefId}" not found`);
      return;
    }

    // Parse inputs for the brief using the new dynamic method
    const workflowInputs = inputHandler.parseInputsForBrief(briefId, process.argv.slice(3), workflowConfigs);

    // Execute the brief using the new abstractions
    const result = await agencyFactory.executeBrief(agency, briefId, workflowInputs);

    // Output the result
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error during workflow execution:', error);
  }
}

main();
