// user-info-run.js - Orchestrator for the user info extraction workflow

import { AgencyFactory } from './AgencyFactory.js';
import { TeamFactory } from './TeamFactory.js';
import { AgentFactory } from './AgentFactory.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables from a .env file.
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

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
      agentFactory
    });

    // Get the directory name of the current module.
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    // Define the path to the user info extraction configuration file.
    const configPath = path.join(__dirname, 'hello-world-team.json');

    // Load the agency configuration from the JSON file.
    const agency = await agencyFactory.loadAgencyFromFile(configPath);

    console.log(`User Info Extraction Agency (${agency.name}) loaded successfully.`);
    console.log(`- description: ${agency.description}`);
    console.log(
      `- team: [ ${
        agency.team
          ? Object.values(agency.team).map(t => t.name).join(', ')
          : 'No teams found'
      } ]`
    );
    console.log(
      `- brief: [ ${
        agency.brief
          ? Object.keys(agency.brief).join(', ')
          : 'No briefs found'
      } ]`
    );

    // Get the brief ID from command line arguments or use default
    const briefId = process.argv[2] || 'user-info-brief';

    if (!agency.brief[briefId]) {
      throw new Error(`Brief with ID "${briefId}" not found in team.json`);
    }

    // Interactive mode: get user input
    console.log('\n=== User Information Extraction ===');
    console.log('Please provide your information in any format. For example:');
    console.log('- "Hi, I\'m John Doe, born on March 15, 1990, email: john@example.com"');
    console.log('- "Username: Jane Smith, Birthday: 1985-07-22, Email: jane.smith@gmail.com"');
    console.log('- Or just tell me about yourself naturally!\n');

    const userPrompt = await askQuestion('Enter your information: ');

    if (!userPrompt.trim()) {
      console.log('No input provided. Exiting...');
      rl.close();
      return;
    }

    // Get the workflow definition from the team
    const team = agency.team.userInfoTeam;
    const workflowDefinition = team.workflow.map(step => {
      if (typeof step === 'string') {
        const job = team.jobs[step];
        return {
          jobId: step,
          assigneeId: job.agent,
          assigneeType: 'agent',
          inputs: {
            ...job.inputs,
            userPrompt: userPrompt // Pass the user input to the agent
          },
          brief: {
            title: job.description,
            overview: job.description,
            objective: job.description,
            ...agency.brief[briefId],
            userInput: userPrompt // Include user input in the brief
          }
        };
      }
      return step;
    });

    // Run the workflow
    console.log(`\nProcessing your information...\n`);
    const workflowResult = await agency.executeWorkflow(
      workflowDefinition, 
      `user-info-workflow-${Date.now()}`, 
      { ...agency.brief[briefId], userInput: userPrompt }
    );
    
    const results = workflowResult.results;
    console.log('\n--- Information Extraction Completed ---\n');

    // Display the results
    const jobName = 'extractUserInfo';
    if (results[jobName]) {
      const resultText = typeof results[jobName] === 'object' 
        ? JSON.stringify(results[jobName], null, 2) 
        : results[jobName];
      
      console.log('📋 Extracted Information:');
      console.log('=' .repeat(40));
      
      // Try to parse as JSON for better display
      try {
        const parsedResult = typeof results[jobName] === 'string' 
          ? JSON.parse(results[jobName]) 
          : results[jobName];
        
        if (parsedResult.username || parsedResult.birthday || parsedResult.email) {
          console.log(`👤 Username: ${parsedResult.username || 'Not provided'}`);
          console.log(`🎂 Birthday: ${parsedResult.birthday || 'Not provided'}`);
          console.log(`📧 Email: ${parsedResult.email || 'Not provided'}`);
          console.log('\n📄 Raw JSON Output:');
          console.log(JSON.stringify(parsedResult, null, 2));
        } else {
          console.log('Raw output:');
          console.log(resultText);
        }
      } catch (parseError) {
        console.log('Raw output (not valid JSON):');
        console.log(resultText);
      }
      
      console.log('\n');
    } else {
      console.log(`WARNING: No ${jobName} results found!`);
      console.log('Available results:', Object.keys(results));
    }

    // Ask if user wants to try again
    const tryAgain = await askQuestion('\nWould you like to try with different information? (y/n): ');
    
    if (tryAgain.toLowerCase() === 'y' || tryAgain.toLowerCase() === 'yes') {
      rl.close();
      // Restart the process
      main();
      return;
    }

    console.log('\nUser info extraction workflow completed successfully!');
    rl.close();

  } catch (error) {
    console.error('Error during workflow execution:', error);
    rl.close();
  }
}

main();