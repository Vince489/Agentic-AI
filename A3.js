/**
 * Comprehensive example demonstrating Agent capabilities with reasoning, planning, and Chain of Thought (CoT)
 * This example showcases advanced cognitive capabilities using GeminiProvider, without tool access
 */

import { Agent } from './Agent2.js';
import { GeminiProvider } from './GeminiProvider.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize the Gemini provider
const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY, 'gemini-2.0-flash');

// Create a sophisticated agent with reasoning capabilities, no tools
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

You approach every problem methodically, considering multiple perspectives and providing clear rationale for your decisions.

Current Date and Time: September 13, 2025, 05:59 PM EDT`,
  goals: [
    'Provide structured, logical reasoning for complex problems',
    'Break down complex goals into actionable sub-tasks',
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
  tools: {}, // Explicitly empty to prevent tool usage
  memoryConfig: {
    maxHistoryLength: 50
  }
});

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

reasoningAgent.on('runCompleted', (data) => {
  console.log(`✅ [EXECUTION COMPLETED] Task finished successfully`);
});

// Helper function to save results to files
async function saveResultToFile(filename, data, description) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsDir = 'results';

    // Create results directory if it doesn't exist
    try {
      await fs.access(resultsDir);
    } catch {
      await fs.mkdir(resultsDir, { recursive: true });
    }

    const filepath = path.join(resultsDir, `${timestamp}_${filename}`);
    const output = {
      timestamp: new Date().toISOString(),
      description,
      result: data
    };

    await fs.writeFile(filepath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`💾 Results saved to: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error(`❌ Failed to save results to ${filename}:`, error.message);
  }
}

async function demonstrateReasoning() {
  console.log('\n🧠 === REASONING DEMONSTRATION ===\n');
  
  const options = [
    'Start with dropshipping model to minimize initial inventory costs',
    'Launch with own inventory and fulfillment center',
    'Partner with existing eco-friendly brands as a marketplace',
    'Begin with digital products and services only'
  ];

  const criteria = [
    'Initial investment required',
    'Time to market',
    'Control over product quality',
    'Scalability potential',
    'Environmental impact alignment'
  ];
  
  try {
    const reasoningResult = await reasoningAgent.reason(options, criteria);
    console.log('\n📊 REASONING RESULT:');
    console.log('Steps taken:', reasoningResult.steps);
    console.log('Final decision:', reasoningResult.decision);

    // Save results to file
    await saveResultToFile(
      'reasoning_result.json',
      {
        options,
        criteria,
        result: reasoningResult
      },
      'Business model reasoning for sustainable e-commerce business'
    );

    return reasoningResult;
  } catch (error) {
    console.error('❌ Reasoning failed:', error.message);
  }
}

async function demonstratePlanning() {
  console.log('\n📋 === PLANNING DEMONSTRATION ===\n');
  
  const goal = "I want to launch a sustainable e-commerce business selling eco-friendly products. I have a $50,000 budget,\n  6 months timeline, and want to focus on products that have genuine environmental benefits. What's the step-by-step strategy\n  to research the market, validate product ideas, set up the business infrastructure, and launch successfully while ensuring\n  authentic sustainability practices?";
  
  try {
    const planResult = await reasoningAgent.plan(goal);
    console.log('\n🎯 PLANNING RESULT:');
    console.log('Sub-tasks:', planResult.subTasks);
    console.log('Execution sequence:', planResult.sequence);

    // Save results to file
    await saveResultToFile(
      'planning_result.json',
      {
        goal,
        result: planResult
      },
      'Strategic planning for sustainable e-commerce business launch'
    );

    return planResult;
  } catch (error) {
    console.error('❌ Planning failed:', error.message);
  }
}

async function demonstrateChainOfThought() {
  console.log('\n🔗 === CHAIN OF THOUGHT DEMONSTRATION ===\n');
  
  const complexProblem = `I want to launch a sustainable e-commerce business selling eco-friendly products. I have a $50,000 budget,
  6 months timeline, and want to focus on products that have genuine environmental benefits. What's the step-by-step strategy
  to research the market, validate product ideas, set up the business infrastructure, and launch successfully while ensuring
  authentic sustainability practices?`;
  
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

    // Save results to file
    await saveResultToFile(
      'chain_of_thought_result.json',
      {
        problem: complexProblem,
        result: cotResult
      },
      'Chain of thought analysis for sustainable e-commerce business strategy'
    );

    return cotResult;
  } catch (error) {
    console.error('❌ Chain of Thought failed:', error.message);
  }
}

async function demonstrateMemoryAndContext() {
  console.log('\n🧠 === MEMORY AND CONTEXT DEMONSTRATION ===\n');
  
  // Store some context in memory
  await reasoningAgent.memory.remember('user_preference', 'sustainable and ethical business practices');
  await reasoningAgent.memory.remember('budget_constraint', '$50,000 initial investment');
  await reasoningAgent.memory.remember('timeline', '6 months to launch');
  
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

    // Save results to file
    await saveResultToFile(
      'memory_context_result.json',
      {
        query: contextualQuery,
        memoryState: {
          keyValueStore: reasoningAgent.memory.keyValueStore,
          historyLength: reasoningAgent.memory.getHistory().length
        },
        result: contextResult
      },
      'Memory-informed business recommendation for sustainable e-commerce'
    );

    return contextResult;
  } catch (error) {
    console.error('❌ Memory demonstration failed:', error.message);
  }
}

async function runComprehensiveDemo() {
  console.log('🚀 Starting comprehensive Agent demonstration with reasoning, planning, and CoT...\n');
  
  try {
    // 1. Demonstrate reasoning capabilities
    await demonstrateReasoning();
    
    // 2. Demonstrate planning capabilities  
    await demonstratePlanning();
    
    // 3. Demonstrate Chain of Thought reasoning
    await demonstrateChainOfThought();
    
    // 4. Demonstrate memory and context awareness
    await demonstrateMemoryAndContext();
    
    console.log('\n🎉 === DEMONSTRATION COMPLETED SUCCESSFULLY ===');
    console.log('\nAgent has demonstrated:');
    console.log('✅ Structured reasoning with multiple criteria');
    console.log('✅ Goal decomposition and strategic planning');
    console.log('✅ Chain-of-thought problem solving');
    console.log('✅ Memory-informed decision making');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run the demonstration
runComprehensiveDemo().catch(console.error);
