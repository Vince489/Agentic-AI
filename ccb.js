/**
 * Content Creation Workflow Demo of the AI Agent Framework
 *
 * This example demonstrates a multi-agent workflow for content creation:
 * 1. Prompt Researcher: Gathers relevant information using the search tool.
 * 2. Writer: Drafts content based on the research.
 * 3. Refiner: Refines and polishes the draft.
 */

import { webSearchTool } from './tools/index.js';
import { AgencyFactory } from './agency/AgencyFactory.js';
import { TeamFactory } from './agency/TeamFactory.js';
import { AgentFactory } from './agency/AgentFactory.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default config path
const DEFAULT_CONFIG_PATH = path.join(__dirname, './ccb.json');

// Initialize AgentFactory with Groq API key
const agentFactory = new AgentFactory({
  defaultProvider: 'groq',
  apiKeys: {
    groq: process.env.GROQ_API_KEY
  }
});

// Register the web search tool with the agent factory
agentFactory.registerTool(webSearchTool);

// Create the team and agency factories, passing the agentFactory instance
const teamFactory = new TeamFactory({ agentFactory });
const agencyFactory = new AgencyFactory({
  teamFactory,
  agentFactory,
  logging: {
    level: 'debug',
    tracing: true
  }
});

// Function to run the demo
async function runContentCreationWorkflow(agency, team, prompt) {
  console.log('🚀 Starting Content Creation Workflow Demo');
  console.log('----------------------------------------------');
  console.log(`Prompt: ${prompt}`);

  try {
    // Run the team with the provided brief
    console.log('📋 Executing content creation workflow...');
    const teamResult = await team.run(
      { brief: 'content-creation-brief', prompt },
      { agency }
    );

    // Log the team result for debugging
    console.log('Team result:', JSON.stringify(teamResult, null, 2));

    console.log('✅ Content creation workflow completed successfully!');

    // Display the team results
    // Standard JS
    console.log('\n📊 Content Creation Workflow Results:');
    for (const [jobId, jobResult] of Object.entries(teamResult)) {
      console.log(`\n📌 ${jobId}:`);
      if (typeof jobResult === 'string') {
        console.log(jobResult);
      } else if (jobResult && jobResult.candidates && jobResult.candidates[0] && jobResult.candidates[0].content) {
        console.log(jobResult.candidates[0].content.parts[0].text);
      } else if (jobResult && jobResult.results) {
        console.log('Result:', jobResult.results);
      } else if (jobResult && jobResult.error) {
        console.log('Error:', jobResult.error);
      } else {
        console.log('Result:', JSON.stringify(jobResult, null, 2));
      }
    }

    // Clean up
    await agency.cleanupWorkflow('content-creation-workflow');
  } catch (error) {
    console.error('❌ Content creation workflow failed:', error.message);

    // Show error handling
    console.log('🔄 The framework includes error handling and replanning capabilities');
    console.log('   that would automatically handle errors in production.');

    throw error;
  }
}

// Main execution
(async () => {
  try {
    const agency = await agencyFactory.loadAgencyFromFile(DEFAULT_CONFIG_PATH);

    // Extract the first team from the agency
    const teamId = Object.keys(agency.teams)[0];
    const team = agency.teams[teamId];

    const examplePrompt = 'Write a blog post about kendrick lamar vs Drake rap beef.';
    await runContentCreationWorkflow(agency, team, examplePrompt);
    console.log('🎉 Content creation workflow completed!');
  } catch (error) {
    console.error('⚠️ Content creation workflow completed with errors:', error.message);
  }
})();
