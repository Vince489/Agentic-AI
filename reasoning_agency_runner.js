/**
 * Runner script for the Reasoning Agency using Agent2.js
 * Demonstrates how to use the reasoning agents configuration with the Agency system
 */

import { Agency } from './Agency.js';
import { AgentFactory } from './AgentFactory.js';
import { Team } from './Team.js';
import { webSearchTool } from './tools/search_tool.js';
import { calculatorTool } from './tools/calculator_tool.js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Load the reasoning agents configuration
const reasoningConfig = JSON.parse(readFileSync('./reasoning_agents_config.json', 'utf8'));

// Create an agency instance
const agency = new Agency(reasoningConfig.agency);

// Create agent factory with Gemini provider
const agentFactory = new AgentFactory({
  defaultProvider: 'gemini',
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY
  }
});

// Register tools
agentFactory.registerTool(webSearchTool);
agentFactory.registerTool(calculatorTool);

// Create agents from configuration
for (const [agentId, agentConfig] of Object.entries(reasoningConfig.agents)) {
  const agent = agentFactory.createAgent({
    id: agentId,
    name: agentConfig.name,
    description: agentConfig.description,
    role: agentConfig.role,
    goals: agentConfig.goals,
    provider: agentConfig.provider,
    llmConfig: agentConfig.llmConfig,
    tools: agentConfig.tools
  });
  
  agency.addAgent(agentId, agent);
}

// Create the reasoning council team
const teamConfig = reasoningConfig.teams['reasoning-council'];
const reasoningCouncil = new Team({
  id: 'reasoning-council',
  name: teamConfig.name,
  description: teamConfig.description,
  agents: teamConfig.agents
});

agency.addTeam('reasoning-council', reasoningCouncil);

async function demonstrateIndividualReasoning() {
  console.log('\n🧠 === INDIVIDUAL AGENT REASONING ===\n');
  
  const masterReasoner = agency.agents['master-reasoner'];
  
  // Test reasoning capability
  const options = [
    'Implement AI-powered customer service chatbot',
    'Hire additional human customer service representatives',
    'Outsource customer service to third-party provider',
    'Develop self-service knowledge base and FAQ system'
  ];
  
  const criteria = [
    'Cost effectiveness',
    'Customer satisfaction impact',
    'Implementation timeline',
    'Scalability potential',
    'Quality consistency'
  ];
  
  try {
    console.log('🔍 Master Reasoner evaluating customer service options...');
    const reasoningResult = await masterReasoner.reason(options, criteria);
    
    console.log('\n📊 REASONING RESULT:');
    console.log('Decision process:', reasoningResult.steps);
    console.log('Final recommendation:', reasoningResult.decision);
    
    return reasoningResult;
  } catch (error) {
    console.error('❌ Individual reasoning failed:', error.message);
  }
}

async function demonstrateStrategicPlanning() {
  console.log('\n📋 === STRATEGIC PLANNING ===\n');
  
  const strategicPlanner = agency.agents['strategic-planner'];
  
  const goal = "Launch a new AI-powered productivity tool for remote teams within 12 months";
  
  try {
    console.log('🎯 Strategic Planner creating comprehensive plan...');
    const planResult = await strategicPlanner.plan(goal);
    
    console.log('\n📋 STRATEGIC PLAN:');
    console.log('Sub-tasks:', planResult.subTasks);
    console.log('Execution sequence:', planResult.sequence);
    
    return planResult;
  } catch (error) {
    console.error('❌ Strategic planning failed:', error.message);
  }
}

async function demonstrateChainOfThought() {
  console.log('\n🔗 === CHAIN OF THOUGHT REASONING ===\n');
  
  const cotSpecialist = agency.agents['cot-specialist'];
  
  const complexProblem = `Our SaaS platform is experiencing a 40% monthly churn rate. 
  Current MRR is $500K with 2,000 customers. We need to reduce churn to 15% within 6 months 
  while maintaining growth. What's the optimal approach considering our limited budget of $200K?`;
  
  try {
    console.log('🔗 CoT Specialist applying systematic reasoning...');
    const cotResult = await cotSpecialist.run(complexProblem, {}, true);
    
    console.log('\n🔗 CHAIN OF THOUGHT RESULT:');
    if (cotResult.steps) {
      console.log('Reasoning steps:', cotResult.steps);
      console.log('Solution:', cotResult.result);
    } else {
      console.log('Analysis:', cotResult);
    }
    
    return cotResult;
  } catch (error) {
    console.error('❌ Chain of thought failed:', error.message);
  }
}

async function demonstrateCreativeReasoning() {
  console.log('\n🎨 === CREATIVE REASONING ===\n');
  
  const creativeReasoner = agency.agents['creative-reasoner'];
  
  const creativeProblem = `Design an innovative user onboarding experience that increases 
  activation rates from 60% to 85% while reducing time-to-value from 2 weeks to 3 days. 
  The solution should be engaging, educational, and scalable.`;
  
  try {
    console.log('💡 Creative Reasoner generating innovative solutions...');
    const creativeResult = await creativeReasoner.run(creativeProblem, {}, true);
    
    console.log('\n🎨 CREATIVE SOLUTION:');
    if (creativeResult.steps) {
      console.log('Creative process:', creativeResult.steps);
      console.log('Innovative approach:', creativeResult.result);
    } else {
      console.log('Solution:', creativeResult);
    }
    
    return creativeResult;
  } catch (error) {
    console.error('❌ Creative reasoning failed:', error.message);
  }
}

async function demonstrateCollaborativeWorkflow() {
  console.log('\n🤝 === COLLABORATIVE REASONING WORKFLOW ===\n');
  
  const workflowDefinition = teamConfig.workflow.map(jobId => {
    const job = teamConfig.jobs[jobId];
    return {
      jobId,
      assigneeId: job.agent,
      assigneeType: "agent",
      brief: {
        goal: "Solve complex business challenge through collaborative reasoning",
        taskName: job.description,
        overview: `Execute ${jobId} as part of collaborative reasoning process`,
        inputs: Object.keys(job.inputs),
        expectedOutputs: [`${jobId}_result`],
        instructions: `You are participating in a collaborative reasoning workflow. ${job.description}`
      }
    };
  });
  
  const initialInputs = {
    problem: `Our company needs to decide whether to pivot our business model from B2B SaaS 
    to B2C marketplace. We have 18 months of runway, 50 employees, and $2M ARR. The market 
    is becoming increasingly competitive, but we have strong technology and customer relationships.`,
    context: `Technology company, 5 years old, strong engineering team, limited marketing budget, 
    facing increased competition from well-funded startups and enterprise players.`
  };
  
  try {
    console.log('🚀 Executing collaborative reasoning workflow...');
    const workflowResult = await agency.executeWorkflow(
      workflowDefinition,
      'collaborative-reasoning-workflow',
      { initialInputs }
    );
    
    console.log('\n🤝 COLLABORATIVE WORKFLOW RESULT:');
    console.log('Workflow execution:', workflowResult);
    
    return workflowResult;
  } catch (error) {
    console.error('❌ Collaborative workflow failed:', error.message);
  }
}

async function runReasoningAgencyDemo() {
  console.log('🚀 Starting Reasoning Agency demonstration with Agent2.js...\n');
  console.log(`🏢 Agency: ${agency.name}`);
  console.log(`📝 Description: ${agency.description}\n`);
  
  try {
    // Demonstrate individual agent capabilities
    const reasoningResult = await demonstrateIndividualReasoning();
    const planningResult = await demonstrateStrategicPlanning();
    const cotResult = await demonstrateChainOfThought();
    const creativeResult = await demonstrateCreativeReasoning();
    
    // Demonstrate collaborative workflow
    const collaborativeResult = await demonstrateCollaborativeWorkflow();
    
    console.log('\n🎉 === REASONING AGENCY DEMO COMPLETED ===');
    console.log('\nCapabilities demonstrated:');
    console.log('✅ Multi-criteria decision making with structured reasoning');
    console.log('✅ Strategic goal decomposition and planning');
    console.log('✅ Chain-of-thought systematic problem solving');
    console.log('✅ Creative reasoning with innovative solutions');
    console.log('✅ Collaborative multi-agent reasoning workflows');
    console.log('✅ Configuration-driven agent specialization');
    
    return {
      individual: { reasoningResult, planningResult, cotResult, creativeResult },
      collaborative: collaborativeResult
    };
    
  } catch (error) {
    console.error('❌ Reasoning agency demo failed:', error.message);
  }
}

// Example usage functions
async function solveBusinessProblem(problem, context = {}) {
  console.log(`\n🎯 Solving business problem: ${problem}\n`);
  
  const masterReasoner = agency.agents['master-reasoner'];
  const strategicPlanner = agency.agents['strategic-planner'];
  
  // Step 1: Analyze the problem
  const analysis = await masterReasoner.run(`Analyze this business problem: ${problem}. Context: ${JSON.stringify(context)}`);
  
  // Step 2: Create strategic plan
  const plan = await strategicPlanner.plan(problem);
  
  // Step 3: Apply reasoning to select best approach
  if (plan.subTasks && plan.subTasks.length > 0) {
    const options = plan.subTasks.map(task => task.task);
    const criteria = ['Impact potential', 'Resource requirements', 'Implementation difficulty', 'Risk level'];
    
    const decision = await masterReasoner.reason(options, criteria);
    
    return { analysis, plan, decision };
  }
  
  return { analysis, plan };
}

// Export for use in other modules
export {
  agency,
  reasoningConfig,
  solveBusinessProblem,
  runReasoningAgencyDemo
};

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runReasoningAgencyDemo().catch(console.error);
}
