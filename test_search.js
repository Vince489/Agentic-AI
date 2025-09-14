// test_search.js - Simple test for the search tool
import { AgentFactory } from './AgentFactory.js';
import { webSearchTool } from './tools/search_tool.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize AgentFactory
const agentFactory = new AgentFactory({
  defaultProvider: 'gemini',
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY
  }
});

// Register the search tool
agentFactory.registerTool(webSearchTool);

// Create a simple agent
const agent = agentFactory.createAgent({
  id: 'search-test-agent',
  name: 'Search Tester',
  description: 'An agent for testing the search tool',
  role: 'You are a search assistant. When asked to search for information, you MUST use the webSearch tool. Always use the webSearch tool for any information requests.',
  provider: 'gemini',
  tools: {
    "webSearch": "webSearch"
  },
  goals: [
    'Use the webSearch tool for all information requests',
    'Provide accurate search results'
  ],
  llmConfig: {
    model: 'gemini-2.5-flash-lite',
    temperature: 0.3,
    maxOutputTokens: 1024,
  },
});

async function testSearch() {
  console.log('🔍 Testing Search Tool');
  console.log('======================');
  
  try {
    console.log('\n📋 Test 1: Explicit search request');
    const prompt1 = "Please use the webSearch tool to find information about artificial intelligence news today.";
    console.log('User:', prompt1);
    
    const response1 = await agent.run(prompt1);
    console.log('\n🤖 Agent Response:');
    if (response1.toolResults) {
      console.log('Tool Results:', response1.toolResults.substring(0, 300) + '...');
      console.log('Final Response:', response1.finalResponse);
    } else {
      console.log('Response:', response1);
    }
    
  } catch (error) {
    console.error('❌ Error during search test:', error.message);
  }
}

testSearch().catch(console.error);
