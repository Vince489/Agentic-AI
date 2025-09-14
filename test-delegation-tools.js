import dotenv from 'dotenv';
import { Agent } from './Agent2.js';
import { GeminiProvider } from './GeminiProvider.js';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testDelegationTools() {
  console.log('🧪 Testing Delegation Tools\n');

  // Create LLM providers
  const orchestratorLLM = new GeminiProvider(GEMINI_API_KEY, 'gemini-2.5-flash-lite');
  const researcherLLM = new GeminiProvider(GEMINI_API_KEY, 'gemini-2.5-flash-lite');

  // Create orchestrator agent
  const orchestrator = new Agent({
    id: 'orchestrator-test',
    name: 'Test Orchestrator',
    description: 'Test orchestrator for delegation tools',
    role: 'You are a test orchestrator. When asked to delegate tasks, use the delegate_task function with proper parameters. Always use function calling, not code generation.',
    goals: ['Task delegation testing'],
    llmProvider: orchestratorLLM,
    isOrchestrator: true,
    maxRetries: 2,
    failureThreshold: 3
  });

  // Create researcher agent
  const researcher = new Agent({
    id: 'researcher-test',
    name: 'Test Researcher',
    description: 'Test research specialist',
    role: 'You are a research specialist. Provide detailed research findings.',
    goals: ['Research and analysis'],
    llmProvider: researcherLLM
  });

  // Register the researcher with the orchestrator
  orchestrator.registerAgent(researcher);

  try {
    console.log('📋 Available Tools:');
    const tools = orchestrator.getAvailableTools();
    console.log(tools.map(t => t.name));

    console.log('\n🎯 Testing delegate_task tool directly:');
    
    // Test the delegate_task tool directly
    const delegateTaskTool = tools.find(t => t.name === 'delegate_task');
    if (delegateTaskTool) {
      console.log('✅ delegate_task tool found');
      
      const result = await delegateTaskTool.call({
        task_description: 'Research the basics of blockchain technology',
        preferred_agent_type: 'researcher'
      });
      
      console.log('Direct delegation result:', result);
    } else {
      console.log('❌ delegate_task tool not found');
    }

    console.log('\n🤖 Testing LLM-driven delegation:');
    
    // Test LLM-driven delegation with explicit function calling instruction
    const llmResult = await orchestrator.run(
      'Please use the delegate_task function to delegate this research task: "Explain the key concepts of blockchain technology" to a research specialist.',
      {},
      false
    );
    
    console.log('LLM delegation result:', llmResult);

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('\n🛑 Shutting down...');
    await orchestrator.shutdown();
    console.log('✅ Test complete!');
  }
}

testDelegationTools().catch(console.error);
