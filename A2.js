/**
 * Comprehensive example demonstrating Agent2.js with reasoning, planning, and Chain of Thought (CoT)
 * This example showcases the advanced cognitive capabilities of Agent2.js using GeminiProvider
 */

import { Agent } from './Agent2.js';
import { GeminiProvider } from './GeminiProvider.js';
import { webSearchTool } from './tools/search_tool.js';
import { calculatorTool } from './tools/calculator_tool.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the Gemini provider
const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY, 'gemini-2.0-flash');

// Create a sophisticated agent with reasoning capabilities
const reasoningAgent = new Agent({
  id: 'reasoning-agent',
  name: 'Sophia',
  description: 'An advanced AI agent capable of complex reasoning, planning, and chain-of-thought analysis',
  role: `You are Sophia, an advanced AI reasoning agent with expertise in:
- Systematic problem analysis and decomposition
- Multi-criteria decision making
- Strategic planning and task orchestration
- Chain-of-thought reasoning for complex problems
- Evidence-based conclusions and recommendations

You approach every problem methodically, considering multiple perspectives and providing clear rationale for your decisions.`,
  goals: [
    'Provide structured, logical reasoning for complex problems',
    'Break down complex goals into actionable sub-tasks',
    'Use available tools effectively to gather information',
    'Apply chain-of-thought methodology when solving multi-step problems',
    'Maintain transparency in decision-making processes'
  ],
  llmProvider: geminiProvider,
  llmConfig: {
    temperature: 0.3, // Lower temperature for more consistent reasoning
    maxOutputTokens: 2048,
    topP: 0.9,
    topK: 40
  },
  tools: {},
  memoryConfig: {
    maxHistoryLength: 50
  }
});

// Add tools to the agent
reasoningAgent.addTool(webSearchTool);
reasoningAgent.addTool(calculatorTool);

// Set up event listeners to track the agent's cognitive processes
reasoningAgent.on('reasonStarted', (data) => {
  console.log(`🧠 [REASONING STARTED] Agent ${data.agent} evaluating options:`, data.options);
  console.log(`📋 [CRITERIA] Using criteria:`, data.criteria);
});

reasoningAgent.on('reasonCompleted', (data) => {
  console.log(`✅ [REASONING COMPLETED] Decision made:`, data.decision);
});

reasoningAgent.on('planStarted', (data) => {
  console.log(`📋 [PLANNING STARTED] Agent ${data.agent} planning for goal: "${data.goal}"`);
});

reasoningAgent.on('planCreated', (data) => {
  console.log(`🎯 [PLAN CREATED] Task plan generated:`, JSON.stringify(data.plan, null, 2));
});

reasoningAgent.on('runStarted', (data) => {
  console.log(`🚀 [EXECUTION STARTED] Processing: "${data.input.substring(0, 100)}..."`);
});

reasoningAgent.on('toolCallsDetected', (data) => {
  console.log(`🔧 [TOOLS DETECTED] Agent will use tools:`, data.toolCalls.map(tc => tc.functionCall.name));
});

reasoningAgent.on('runCompleted', (data) => {
  console.log(`✅ [EXECUTION COMPLETED] Task finished successfully`);
});

async function demonstrateReasoning() {
  console.log('\n🧠 === REASONING DEMONSTRATION ===\n');
  
  const options = [
    'Invest in renewable energy stocks',
    'Invest in technology stocks', 
    'Invest in real estate',
    'Keep money in savings account'
  ];
  
  const criteria = [
    'Expected return on investment',
    'Risk level',
    'Environmental impact',
    'Liquidity',
    'Market volatility'
  ];
  
  try {
    const reasoningResult = await reasoningAgent.reason(options, criteria);
    console.log('\n📊 REASONING RESULT:');
    console.log('Steps taken:', reasoningResult.steps);
    console.log('Final decision:', reasoningResult.decision);
    
    return reasoningResult;
  } catch (error) {
    console.error('❌ Reasoning failed:', error.message);
  }
}

async function demonstratePlanning() {
  console.log('\n📋 === PLANNING DEMONSTRATION ===\n');
  
  const goal = "Launch a sustainable e-commerce business selling eco-friendly products";
  
  try {
    const planResult = await reasoningAgent.plan(goal);
    console.log('\n🎯 PLANNING RESULT:');
    console.log('Sub-tasks:', planResult.subTasks);
    console.log('Execution sequence:', planResult.sequence);
    
    return planResult;
  } catch (error) {
    console.error('❌ Planning failed:', error.message);
  }
}

async function demonstrateChainOfThought() {
  console.log('\n🔗 === CHAIN OF THOUGHT DEMONSTRATION ===\n');
  
  const complexProblem = `A company has 3 factories. Factory A produces 150 units/day, Factory B produces 200 units/day, 
  and Factory C produces 175 units/day. If the company needs to fulfill an order of 10,000 units and wants to minimize 
  production time while ensuring no single factory works more than 25 days, what's the optimal production strategy?`;
  
  try {
    // Using Chain of Thought reasoning (useCoT = true)
    const cotResult = await reasoningAgent.run(complexProblem, {}, true);
    console.log('\n🔗 CHAIN OF THOUGHT RESULT:');
    if (cotResult.steps) {
      console.log('Reasoning steps:', cotResult.steps);
      console.log('Final result:', cotResult.result);
    } else {
      console.log('Result:', cotResult);
    }
    
    return cotResult;
  } catch (error) {
    console.error('❌ Chain of Thought failed:', error.message);
  }
}

async function demonstrateToolIntegration() {
  console.log('\n🔧 === TOOL INTEGRATION DEMONSTRATION ===\n');
  
  const researchQuery = `Research the current market trends for electric vehicles in 2024 and calculate 
  the projected growth rate if the market grows from $500 billion to $800 billion over 3 years.`;
  
  try {
    const toolResult = await reasoningAgent.run(researchQuery);
    console.log('\n🔧 TOOL INTEGRATION RESULT:');
    if (toolResult.toolResults) {
      console.log('Tool outputs:', toolResult.toolResults);
      console.log('Final synthesis:', toolResult.finalResponse);
    } else {
      console.log('Result:', toolResult);
    }
    
    return toolResult;
  } catch (error) {
    console.error('❌ Tool integration failed:', error.message);
  }
}

async function demonstrateMemoryAndContext() {
  console.log('\n🧠 === MEMORY AND CONTEXT DEMONSTRATION ===\n');
  
  // Store some context in memory
  reasoningAgent.memory.remember('user_preference', 'sustainable and ethical business practices');
  reasoningAgent.memory.remember('budget_constraint', '$50,000 initial investment');
  reasoningAgent.memory.remember('timeline', '6 months to launch');
  
  const contextualQuery = `Based on my previous preferences and constraints, recommend a specific business model 
  for my e-commerce venture and explain how it aligns with my requirements.`;
  
  try {
    const contextResult = await reasoningAgent.run(contextualQuery);
    console.log('\n🧠 MEMORY-INFORMED RESULT:');
    console.log('Response:', contextResult);
    
    // Show memory contents
    console.log('\n📚 CURRENT MEMORY STATE:');
    console.log('Key-Value Store:', reasoningAgent.memory.keyValueStore);
    console.log('History entries:', reasoningAgent.memory.getHistory().length);
    
    return contextResult;
  } catch (error) {
    console.error('❌ Memory demonstration failed:', error.message);
  }
}

async function runComprehensiveDemo() {
  console.log('🚀 Starting comprehensive Agent2.js demonstration with reasoning, planning, and CoT...\n');
  
  try {
    // 1. Demonstrate reasoning capabilities
    await demonstrateReasoning();
    
    // 2. Demonstrate planning capabilities  
    await demonstratePlanning();
    
    // 3. Demonstrate Chain of Thought reasoning
    await demonstrateChainOfThought();
    
    // 4. Demonstrate tool integration
    await demonstrateToolIntegration();
    
    // 5. Demonstrate memory and context awareness
    await demonstrateMemoryAndContext();
    
    console.log('\n🎉 === DEMONSTRATION COMPLETED SUCCESSFULLY ===');
    console.log('\nAgent2.js has demonstrated:');
    console.log('✅ Structured reasoning with multiple criteria');
    console.log('✅ Goal decomposition and strategic planning');
    console.log('✅ Chain-of-thought problem solving');
    console.log('✅ Intelligent tool usage and integration');
    console.log('✅ Memory-informed decision making');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run the demonstration
runComprehensiveDemo().catch(console.error);
