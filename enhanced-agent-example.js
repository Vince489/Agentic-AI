/**
 * Enhanced Agent Framework Example
 * Demonstrates the improved multi-agent orchestration capabilities
 */

import { Agent } from './Agent2.js';
import { GeminiProvider } from './GeminiProvider.js';
import { webSearchTool } from './tools/search_tool.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

// Example coding tool for demonstration
const codingTool = {
  name: "code_generator",
  schema: {
    function_declaration: {
      name: "code_generator",
      description: "Generate code based on specifications",
      parameters: {
        type: "object",
        properties: {
          language: { type: "string", description: "Programming language" },
          specification: { type: "string", description: "Code specification" }
        },
        required: ["language", "specification"]
      }
    }
  },
  call: async (params) => {
    // Simulate code generation
    const codeTemplates = {
      javascript: `// ${params.specification}\nfunction solution() {\n  // Implementation here\n  return result;\n}`,
      python: `# ${params.specification}\ndef solution():\n    # Implementation here\n    return result`,
      java: `// ${params.specification}\npublic class Solution {\n    public static void main(String[] args) {\n        // Implementation here\n    }\n}`
    };

    const template = codeTemplates[params.language.toLowerCase()] ||
                    `// ${params.specification}\n// Code implementation for ${params.language}`;

    return `Generated ${params.language} code:\n\n${template}`;
  }
};

async function demonstrateEnhancedAgentFramework() {
  console.log('🚀 Enhanced Agent Framework Demonstration\n');

  // Create LLM providers
  const orchestratorLLM = new GeminiProvider(GEMINI_API_KEY, 'gemini-2.5-flash-lite');
  const researcherLLM = new GeminiProvider(GEMINI_API_KEY, 'gemini-2.5-flash-lite');
  const coderLLM = new GeminiProvider(GEMINI_API_KEY, 'gemini-2.5-flash-lite');

  // Create orchestrator agent
  const orchestrator = new Agent({
    id: 'orchestrator-001',
    name: 'Master Orchestrator',
    description: 'Coordinates and delegates tasks to specialized agents',
    role: 'You are a master orchestrator agent responsible for breaking down complex tasks and delegating them to appropriate specialized agents. You have access to delegate_task and get_agent_info tools. When you receive complex requests that involve multiple domains (research, coding, analysis), you should use the delegate_task tool to assign work to specialized agents rather than doing everything yourself. Only handle simple coordination tasks directly.',
    goals: ['Task decomposition', 'Agent coordination', 'Workflow optimization'],
    llmProvider: orchestratorLLM,
    isOrchestrator: true,
    maxRetries: 2,
    failureThreshold: 3
  });

  // Create specialized worker agents
  const researcher = new Agent({
    id: 'researcher-001',
    name: 'Research Specialist',
    description: 'Specialized in research, data analysis, and information gathering',
    role: 'You are a research specialist focused on gathering and analyzing information. Provide detailed research findings and insights.',
    goals: ['Information gathering', 'Data analysis', 'Research synthesis'],
    llmProvider: researcherLLM,
    tools: { webSearch: webSearchTool }
  });

  const coder = new Agent({
    id: 'coder-001',
    name: 'Code Specialist',
    description: 'Specialized in software development and code implementation',
    role: 'You are a coding specialist focused on implementing robust software solutions. Provide detailed implementation plans and code solutions.',
    goals: ['Code implementation', 'Software architecture', 'Best practices'],
    llmProvider: coderLLM,
    tools: { code_generator: codingTool }
  });

  // Register agents with orchestrator
  orchestrator.registerAgent(researcher);
  orchestrator.registerAgent(coder);

  // Set up event listeners for monitoring
  orchestrator.on('*', (data) => {
    console.log(`📡 Event: ${data.type || 'unknown'}`, data);
  });

  try {
    console.log('📊 Initial Orchestrator Status:');
    console.log(JSON.stringify(orchestrator.getOrchestratorStatus(), null, 2));

    console.log('\n🔧 Testing Enhanced Agent Features...');

    // // Test 1: Direct agent capabilities
    // console.log('\n1️⃣ Testing Research Agent:');
    // const researchResult = await researcher.run("Research the latest trends in artificial intelligence for 2024");
    // console.log('Research Result:', researchResult);

    // console.log('\n2️⃣ Testing Code Agent:');
    // const codeResult = await coder.run("Create a simple REST API for user management");
    // console.log('Code Result:', codeResult);

    console.log('\n3️⃣ Testing Agent Registry and Selection:');
    const availableAgents = orchestrator.getManagedAgents();
    console.log('Available Agents:', availableAgents.map(a => ({ id: a.id, name: a.name, status: a.status, load: a.currentLoad })));

    console.log('\n4️⃣ Testing Direct Task Delegation:');
    const delegationResult = await orchestrator.delegateTask(
      'researcher-001',
      'Analyze market trends for AI startups in 2024',
      { priority: 'high', domain: 'technology' }
    );
    console.log('Delegation Result:', delegationResult);

    console.log('\n5️⃣ Testing Orchestration Tools (LLM-driven delegation):');
    // Test the new orchestration tools that allow LLM to decide delegation
    const toolBasedResult = await orchestrator.run(
      "Use the delegate_task tool to assign this research task to a research specialist: 'Provide a comprehensive overview of blockchain technology including key concepts, consensus mechanisms, and current market trends.' Then use delegate_task again to assign this coding task to a coding specialist: 'Create a simple Python blockchain implementation with basic mining functionality.'",
      {},
      false
    );
    console.log('Tool-based delegation result:', toolBasedResult);

    console.log('\n📈 Final Orchestrator Status:');
    console.log(JSON.stringify(orchestrator.getOrchestratorStatus(), null, 2));

  } catch (error) {
    console.error('❌ Error during demonstration:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('\n🛑 Shutting down orchestrator...');
    await orchestrator.shutdown();
    console.log('✅ Shutdown complete!');
  }
}

// Run the demonstration
demonstrateEnhancedAgentFramework().catch(console.error);
