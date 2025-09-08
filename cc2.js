import { Agency } from './Agency.js';
import { AgentFactory } from './AgentFactory.js';
import { Team } from './Team.js';
import dotenv from 'dotenv';
import { webSearchTool } from './tools/search_tool.js';
import { writeFileSync } from 'fs';

// Load environment variables
dotenv.config();

// Load the configuration for the parallel content creation agency
import { readFileSync } from 'fs';
const cc2Config = JSON.parse(readFileSync(new URL('./cc2.json', import.meta.url)));

// Create an agency instance
const agency = new Agency(cc2Config.agency);

// Create agents based on the configuration
const agentFactory = new AgentFactory({
  defaultProvider: 'gemini',
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY
  }
});

// Register the web search tool with the agent factory
agentFactory.registerTool(webSearchTool);
for (const [agentId, agentConfig] of Object.entries(cc2Config.agents)) {
  const agent = agentFactory.createAgent({
    id: agentId,
    name: agentConfig.name,
    description: agentConfig.description,
    role: agentConfig.role,
    goals: agentConfig.goals,
    provider: agentConfig.provider,
    llmConfig: agentConfig.llmConfig,
    tools: agentConfig.tools
  });

  agency.addAgent(agentId, agent);
}

// Create the team
const teamConfig = cc2Config.teams['content-creation-team'];
const team = new Team({
  id: 'content-creation-team',
  name: teamConfig.name,
  description: teamConfig.description,
  agents: teamConfig.agents
});

// Add the team to the agency
agency.addTeam('content-creation-team', team);

// Define the workflow
const workflowDefinition = teamConfig.workflow;

// Define initial inputs
const initialInputs = {
  prompt: "Write about the impact of AI on modern music production."
};

async function runParallelWorkflow() {
  try {
    console.log('Starting parallel content creation workflow...');

    // Execute the workflow
    const workflowResult = await agency.executeWorkflow(
      workflowDefinition,
      'parallel-content-creation-workflow',
      { initialInputs }
    );

    console.log('Workflow completed successfully:', workflowResult);

    // Save results to a markdown file
    const markdownContent = `
# Parallel Workflow Execution Results

## Overview
This document contains the results of executing the parallel workflow defined in \`cc2.json\` and \`cc2.js\`.

---

## Workflow Results
\`\`\`json
${JSON.stringify(workflowResult, null, 2)}
\`\`\`

---
`;

    writeFileSync('cc2_results.md', markdownContent);
    console.log('Results saved to cc2_results.md');
  } catch (error) {
    console.error('Error executing workflow:', error);
  }
}

// Run the workflow
runParallelWorkflow();
