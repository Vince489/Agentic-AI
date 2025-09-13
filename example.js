// example.js
import { AgentFactory } from './AgentFactory.js'; // Import AgentFactory
import { dateTimeTool } from './tools/date_time_tool.js';
import { webSearchTool } from './tools/search_tool.js';
import dotenv from 'dotenv';

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
  role: 'You are a friendly and helpful AI assistant. When users ask for current information, time-related queries, or request web searches, you MUST use the appropriate tools. Always use the webSearch tool when users ask for current information, recent developments, or explicitly request a web search.',
  provider: 'gemini', // Specify provider for AgentFactory
  tools: { // Reference tools by their registered names
    "datetime_tool": "datetime_tool",
    "webSearch": "webSearch"
  },
  goals: [
    'Answer user questions accurately using available tools when appropriate.',
    'ALWAYS use the webSearch tool when users ask for current information, recent developments, or explicitly request web searches.',
    'Use the datetime_tool when users ask about time, dates, or timezone information.',
    'Maintain a coherent conversation history.'
  ],
  llmConfig: {
    model: 'gemini-2.0-flash', // Specify model here for AgentFactory
    temperature: 0.5,
    maxOutputTokens: 2048,
  },
});

// --- Demonstrate Agent Capabilities ---

async function runConversation() {
  console.log("--- Starting Conversation with Clippy ---");
  console.log("Agent Role:", conversationalAgent.role);
  console.log("Agent Goals:", conversationalAgent.goals.join(', '));
  console.log("Available Tools:", conversationalAgent.listTools().join(', '));

  // Example 1: Simple conversational turn (no tools needed)
  console.log("\n--- Scenario 1: Simple Greeting ---");
  const userPrompt1 = "Hello, what is your name?";
  console.log("User:", userPrompt1);
  let response1 = await conversationalAgent.run(userPrompt1);
  console.log("Clippy:", response1);
  console.log("Agent Status:", conversationalAgent.getStatus());

  // Example 2: Using the dateTimeTool
  console.log("\n--- Scenario 2: Using DateTime Tool ---");
  const userPrompt2 = "What is the current time in Tokyo?";
  console.log("User:", userPrompt2);
  let response2 = await conversationalAgent.run(userPrompt2);
  console.log("Clippy (Tool Result):", response2.toolResults || "No tool results.");
  console.log("Clippy (Final Response):", response2.finalResponse || response2);
  console.log("Agent Status:", conversationalAgent.getStatus());

  // Example 3: Using the webSearchTool with explicit instruction
  console.log("\n--- Scenario 3: Using Web Search Tool ---");
  const userPrompt3 = "Please search the web for current information about the latest developments in artificial intelligence and summarize what you find.";
  console.log("User:", userPrompt3);
  let response3 = await conversationalAgent.run(userPrompt3);
  console.log("Clippy (Tool Result):", response3.toolResults ? response3.toolResults.substring(0, 200) + "..." : "No tool results."); // Truncate for display
  console.log("Clippy (Final Response):", response3.finalResponse || response3);
  console.log("Agent Status:", conversationalAgent.getStatus());

  // Example 4: Another web search test with explicit instruction
  console.log("\n--- Scenario 4: Explicit Web Search Request ---");
  const userPrompt4 = "Use the web search tool to find information about the latest developments in artificial intelligence.";
  console.log("User:", userPrompt4);
  let response4 = await conversationalAgent.run(userPrompt4);
  console.log("Clippy (Tool Result):", response4.toolResults ? response4.toolResults.substring(0, 200) + "..." : "No tool results."); // Truncate for display
  console.log("Clippy (Final Response):", response4.finalResponse || response4);
  console.log("Agent Status:", conversationalAgent.getStatus());

  // Example 5: Demonstrating Memory (storing and recalling information)
  console.log("\n--- Scenario 4: Demonstrating Memory ---");
  const userName = "Alice";
  console.log(`Clippy remembers user's name: ${userName}`);
  conversationalAgent.memory.remember("user_name", userName);
  console.log("Clippy recalls user's name:", conversationalAgent.memory.recall("user_name"));

  // Example 6: Follow-up question leveraging memory (requires LLM to be aware of context)
  // For the LLM to truly leverage this, the prompt construction in Agent.run would need
  // to include memory.getHistory() and memory.recall() in the system instruction or conversation history.
  // This example primarily shows the MemoryManager's capability.
  console.log("\n--- Scenario 6: Follow-up Question (Memory-aware) ---");
  const userPrompt5 = "What was my name again?";
  console.log("User:", userPrompt5);
  // To make the agent truly memory-aware for this, we'd need to modify Agent.run
  // to inject memory into the prompt. For now, we'll simulate a direct recall.
  const recalledName = conversationalAgent.memory.recall("user_name");
  let response5;
  if (recalledName) {
    response5 = `Your name is ${recalledName}.`;
  } else {
    response5 = await conversationalAgent.run(userPrompt5); // Fallback to LLM if not directly recalled
  }
  console.log("Clippy:", response5);
  console.log("Agent Status:", conversationalAgent.getStatus());

  console.log("\n--- Full Conversation History ---");
  console.log(conversationalAgent.memory.getHistory());

  console.log("\n--- Conversation with Clippy Ended ---");
}

runConversation().catch(error => {
  console.error("An error occurred during the conversation:", error);
});
