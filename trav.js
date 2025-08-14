// travel-search-run.js - Orchestrator for the travel search workflow

import { AgencyFactory } from './AgencyFactory.js';
import { TeamFactory } from './TeamFactory.js';
import { AgentFactory } from './AgentFactory.js';
import { webSearchTool } from './tools/search_tool.js';
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
    const configPath = path.join(__dirname, 'trav.json');

    // Load the agency configuration from the JSON file.
    const agency = await agencyFactory.loadAgencyFromFile(configPath);

    // Get the brief ID from command line arguments or use default
    const briefId = process.argv[2] || 'travel-search-brief';

    // Get destination from command line arguments or default
    const destination = process.argv[3] || "Paris, France";

    if (!briefId || !agency.brief[briefId]) {
      console.error(`Error: Brief with ID "${briefId}" not found`);
      return;
    }

    if (!destination.trim()) {
      console.error('Error: No destination provided');
      return;
    }

    // Get the workflow definition from the team
    const team = agency.team.travelSearchTeam;
    const workflowDefinition = team.workflow.map(step => {
      if (typeof step === 'string') {
        const job = team.jobs[step];
        return {
          jobId: step,
          assigneeId: job.agent,
          assigneeType: 'agent',
          inputs: {
            ...job.inputs,
            destination: destination
          },
          brief: {
            title: job.description,
            overview: job.description,
            objective: job.description,
            ...agency.brief[briefId],
            destination: destination
          }
        };
      }
      return step;
    });

    // Run the workflow
    const workflowResult = await agency.executeWorkflow(
      workflowDefinition, 
      `travel-search-workflow-${Date.now()}`, 
      { ...agency.brief[briefId], destination: destination }
    );
    
    const results = workflowResult.results;

    // Return clean JSON output
    const jobName = 'searchTravelInfo';
    if (results[jobName]) {
      try {
        const parsedResult = typeof results[jobName] === 'string' 
          ? JSON.parse(results[jobName]) 
          : results[jobName];
        
        // Output only the clean JSON
        console.log(JSON.stringify(parsedResult, null, 2));
      } catch (parseError) {
        // If not valid JSON, try to extract from the raw text
        const resultText = results[jobName];
        console.log(resultText);
      }
    } else {
      console.error('Error: No travel search results found');
    }

  } catch (error) {
    console.error('Error during workflow execution:', error);
  }
}

main();
