// example2.js - Readline interactive agent
import { AgentFactory } from './AgentFactory.js'; // Import AgentFactory
import { dateTimeTool } from './tools/date_time_tool.js';
import { webSearchTool } from './tools/search_tool.js';
import dotenv from 'dotenv';
import readline from 'readline'; // Import readline

// Load environment variables from .env file
dotenv.config();

// Initialize AgentFactory with Gemini API key
const agentFactory = new AgentFactory({
  defaultProvider: 'gemini',
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY
  }
});

// Register the tools with the AgentFactory
agentFactory.registerTool(dateTimeTool);
agentFactory.registerTool(webSearchTool);

// Create a single conversational AI agent using the AgentFactory
const conversationalAgent = await agentFactory.createAgent({
  id: 'my-conversational-agent',
  name: 'Clippy',
  description: 'A helpful AI assistant that can answer questions and perform actions.',
  role: 'You are a friendly and helpful AI assistant. When users ask for current information, recent developments, or explicitly request a web search, you MUST use the webSearch tool. If a query is solely about the current time, date, or timezone, use the datetime_tool. Prioritize webSearch for any query that requires up-to-date information beyond just the current time/date.',
  provider: 'gemini', // Specify provider for AgentFactory
  tools: { // Reference tools by their registered names
    "datetime_tool": "datetime_tool",
    "webSearch": "webSearch"
  },
  goals: [
    'Answer user questions accurately using available tools when appropriate.',
    'ALWAYS use the webSearch tool when users ask for current information, recent developments, or explicitly request web searches.',
    'Use the datetime_tool ONLY when users ask specifically about time, dates, or timezone information, and a web search is not required.',
    'Maintain a coherent conversation history.',
    'When asked about ongoing events or tours, always consider the current date and time (provided in the system instruction) and use webSearch to find relevant information.'
  ],
  llmConfig: {
    model: 'gemini-2.5-flash-lite', // Specify model here for AgentFactory
    temperature: 0.5,
    maxOutputTokens: 2048,
  },
});

// --- Demonstrate Agent Capabilities with Readline ---

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function startInteractiveConversation() {
  console.log("--- Starting Interactive Conversation with Clippy ---");
  console.log("Type 'exit' to end the conversation.");
  console.log("Agent Role:", conversationalAgent.role);
  console.log("Agent Goals:", conversationalAgent.goals.join(', '));
  console.log("Available Tools:", conversationalAgent.listTools().join(', '));

  while (true) {
    const userPrompt = await new Promise(resolve => {
      rl.question("\nUser: ", resolve);
    });

    if (userPrompt.toLowerCase() === 'exit') {
      break;
    }

    console.log("Clippy is thinking...");
    let response = await conversationalAgent.run(userPrompt);

    if (response.toolResults) {
      console.log("Clippy (Tool Result):", response.toolResults.substring(0, 500) + (response.toolResults.length > 500 ? "..." : "")); // Truncate for display
    }
    console.log("Clippy (Final Response):", response.finalResponse || response);
    console.log("Agent Status:", conversationalAgent.getStatus());
  }

  rl.close();
  console.log("\n--- Conversation with Clippy Ended ---");
  console.log("\n--- Full Conversation History ---");
  console.log(conversationalAgent.memory.getHistory());
}

// Listen for the toolExecuted event and log the tool execution details
conversationalAgent.on('toolExecuted', ({ toolName, toolParams }) => {
  console.log(`\n[TOOL EXECUTED] ${toolName} with params:`, toolParams);
});

// Listen for the toolExecuted event and log the tool execution details
conversationalAgent.on('toolExecuted', ({ toolName, toolParams }) => {
  console.log(`\n[TOOL EXECUTED] ${toolName} with params:`, toolParams);
});

startInteractiveConversation().catch(error => {
  console.error("An error occurred during the conversation:", error);
  rl.close();
});
