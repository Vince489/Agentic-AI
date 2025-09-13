import { AgentFactory } from './AgentFactory.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the ho.json config file
const CONFIG_PATH = path.join(__dirname, './ho.json');

// Initialize AgentFactory with Gemini API key
const agentFactory = new AgentFactory({
  defaultProvider: 'gemini',
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY
  }
});

async function runTravelPlannerAgent() {
  console.log('🚀 Starting Travel Planner Agent');
  console.log('----------------------------------------------');

  try {
    // Load the ho.json file
    const configContent = readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configContent);

    // Extract the agent configuration for 'agent-travel-planner'
    const agentConfig = config['agent-travel-planner'];
    if (!agentConfig) {
      throw new Error('Agent "agent-travel-planner" not found in ho.json');
    }

    // Create the agent with a custom responseProcessor
    const agent = agentFactory.createAgent({
      ...agentConfig,
      responseProcessor: (llmResponse) => {
        const firstCandidate = llmResponse?.candidates?.[0];
        const textContent = firstCandidate?.content?.parts?.filter(p => p.text).map(p => p.text).join('');
        
        // Attempt to parse as JSON
        try {
          const jsonOutput = JSON.parse(textContent);
          return jsonOutput; // Return the parsed JSON object
        } catch (e) {
          // Not JSON, return as plain text
          return textContent || '';
        }
      }
    });

    console.log('✅ Travel Planner Agent initialized.');
    console.log('Type "exit" to quit.');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'You: '
    });

    // State to track collected information
    const collectedInfo = {
      traveler_names: null,
      travel_dates: null,
      departure_city: null,
      destination_city: null,
      budget_per_person: null,
      travel_style: null
    };

    // Function to get a summary of collected info
    const getCollectedInfoSummary = () => {
      let summary = '';
      for (const key in collectedInfo) {
        if (collectedInfo[key]) {
          summary += `${key.replace(/_/g, ' ')}: ${collectedInfo[key]}; `;
        }
      }
      return summary.trim();
    };

    // Send an initial message to the agent to start the conversation,
    // explicitly stating the task and fields to collect.
    console.log('Agent: Hello! I am your travel planner. My goal is to collect the following details for your trip: traveler names, travel dates, departure city, destination city, budget per person, and travel style. I will ask for one piece of information at a time and will not repeat questions. Let\'s start! What are the traveler names?');
    rl.prompt();

    rl.on('line', async (line) => {
      const userInput = line.trim();

      if (userInput.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      // --- Proactive Information Extraction and Update ---
      const fieldsOrder = ['traveler_names', 'travel_dates', 'departure_city', 'destination_city', 'budget_per_person', 'travel_style'];
      let nextExpectedField = null;
      for (const field of fieldsOrder) {
        if (collectedInfo[field] === null) {
          nextExpectedField = field;
          break;
        }
      }

      if (nextExpectedField) {
        let extractedValue = null;
        // Attempt to extract based on the next expected field
        switch (nextExpectedField) {
          case 'traveler_names':
            extractedValue = userInput;
            break;
          case 'travel_dates':
            const dateMatch = userInput.match(/(\w+\s+\d{1,2},\s+\d{4}\s+to\s+\w+\s+\d{1,2},\s+\d{4})|(\d{1,2}\/\d{1,2}\/\d{2,4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{2,4})/i);
            extractedValue = dateMatch ? dateMatch[0] : userInput;
            break;
          case 'departure_city':
          case 'destination_city':
          case 'travel_style':
            extractedValue = userInput;
            break;
          case 'budget_per_person':
            const budgetMatch = userInput.match(/\d+/);
            extractedValue = budgetMatch ? parseInt(budgetMatch[0]) : null;
            break;
        }

        if (extractedValue !== null && extractedValue !== undefined && extractedValue !== '') {
          collectedInfo[nextExpectedField] = extractedValue;
          console.log(`(Debug: Collected ${nextExpectedField}: ${collectedInfo[nextExpectedField]})`);
        }
      }

      // Prepend collected info to the user's input to reinforce context
      const currentSummary = getCollectedInfoSummary();
      const inputToAgent = currentSummary ? `(Collected so far: ${currentSummary}) User: ${userInput}` : `User: ${userInput}`;

      try {
        const agentResponse = await agent.run(inputToAgent);
        
        if (typeof agentResponse === 'object' && agentResponse !== null) {
          console.log('\n🎉 Agent completed task and outputted JSON:');
          console.log(JSON.stringify(agentResponse, null, 2));
          rl.close(); // Close readline after JSON output
          return;
        } else {
          // Check if all information is collected
          const allCollected = Object.values(collectedInfo).every(val => val !== null);

          if (allCollected) {
            console.log('\nAll required information collected. Instructing agent to output JSON...');
            // Send a final prompt to the agent to output the JSON
            const finalAgentResponse = await agent.run(`All trip details have been collected: ${getCollectedInfoSummary()}. Please output the complete trip details as a JSON object.`);
            
            if (typeof finalAgentResponse === 'object' && finalAgentResponse !== null) {
              console.log('\n🎉 Agent completed task and outputted JSON:');
              console.log(JSON.stringify(finalAgentResponse, null, 2));
              rl.close(); // Close readline after JSON output
              return;
            } else {
              console.log(`Agent: ${finalAgentResponse}`); // Should ideally be JSON
            }
          } else {
            // If not all collected, determine the next question to ask (script-driven)
            let nextQuestion = '';
            for (const field of fieldsOrder) {
              if (collectedInfo[field] === null) {
                switch (field) {
                  case 'traveler_names':
                    nextQuestion = 'What are the traveler names?';
                    break;
                  case 'travel_dates':
                    nextQuestion = 'What are your desired travel dates?';
                    break;
                  case 'departure_city':
                    nextQuestion = 'What city will you be departing from?';
                    break;
                  case 'destination_city':
                    nextQuestion = 'Where would you like to go for your trip?';
                    break;
                  case 'budget_per_person':
                    nextQuestion = 'What is your budget per person for this trip?';
                    break;
                  case 'travel_style':
                    nextQuestion = 'What is your preferred travel style (e.g., adventurous, relaxing, cultural)?';
                    break;
                }
                break; // Found the next missing field, break loop
              }
            }
            console.log(`Agent: ${nextQuestion}`);
          }
        }

      } catch (error) {
        console.error('❌ Agent interaction failed:', error.message);
      }
      rl.prompt();
    }).on('close', () => {
      console.log('👋 Exiting Travel Planner Agent.');
      process.exit(0);
    });

  } catch (error) {
    console.error('⚠️ Failed to run Travel Planner Agent:', error.message);
    process.exit(1);
  }
}

// Main execution
(async () => {
  await runTravelPlannerAgent();
})();
