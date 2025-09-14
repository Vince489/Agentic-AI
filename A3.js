import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { AgentFactory } from './AgentFactory.js';
import { TeamFactory } from './TeamFactory.js';
import { AgencyFactory } from './AgencyFactory.js';

import { webSearchTool } from './tools/search_tool.js';
import path from 'path';

// Load environment variables
dotenv.config();

// Resolve base directory
const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const baseDir = path.resolve(__dirname);

// --- 1. Load Configuration ---
const config = JSON.parse(readFileSync(path.join(baseDir, 'config', 'cc2.json'), 'utf-8'));

// --- 2. Initialize Factories ---
const agentFactory = new AgentFactory({
  defaultProvider: 'gemini',
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY
  },
  tools: {
    webSearchTool: webSearchTool
  }
});

const teamFactory = new TeamFactory({ agentFactory });
const agencyFactory = new AgencyFactory({ teamFactory, agentFactory });

// --- 3. Create the Agency from Config ---
const agency = agencyFactory.createAgency(config);

// --- 4. The High-Level Goal ---
const userGoal = "Create a brief on the current state and future of self-driving cars.";

// --- 5. Execute the Workflow ---
(async () => {
  try {
    console.log(`[Virtra AI] Orchestrating plan for goal: "${userGoal}"`);
    
    // The orchestrator agent dynamically generates a plan based on the goal
    const plan = await agentFactory.orchestrate(userGoal);
    
    if (!plan || !plan.workflows || !plan.workflows.dynamicWorkflow) {
      throw new Error("Orchestrator failed to produce a valid workflow plan.");
    }
    console.log("\n[Virtra AI] Plan generated successfully:\n", JSON.stringify(plan, null, 2));

    // Add the dynamically created workflow to the agency
    agencyFactory.addDynamicWorkflow(agency, plan);

    console.log("\n--- Executing Dynamic Workflow ---\n");
    const finalResult = await agencyFactory.executeWorkflow(agency, 'dynamicWorkflow', {});
    
    console.log("\n--- Workflow Execution Completed ---\n");
    console.log("Final Output:", finalResult);

  } catch (error) {
    console.error("An error occurred during workflow execution:", error);
  }
})();
