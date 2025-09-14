/**
 * Manus.ai replication
 */

import { AgentFactory } from './AgentFactory.js';
import { Agent } from './Agent2.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function createManus() {
  // 1. Create an AgentFactory
  const agentFactory = new AgentFactory({
    defaultProvider: 'gemini',
    apiKeys: {
      gemini: process.env.GEMINI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      groq: process.env.GROQ_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
      mistral: process.env.MISTRAL_API_KEY
    }
  });

  // 2. Define the orchestrator agent configuration
  const orchestratorConfig = {
    id: 'manus-orchestrator',
    name: 'Manus Orchestrator',
    description: 'An orchestrator agent that manages a team of specialized agents to complete complex tasks.',
    role: 'You are a sophisticated orchestrator for a multi-agent system. You receive high-level tasks, break them down into sub-tasks, and delegate them to specialized agents. You rely on powerful, third-party large language models (LLMs) like Anthropic\'s Claude or Alibaba\'s Qwen as your "brain." When delegating tasks to specialized agents, provide clear and concise instructions, and use one-shot prompting to guide their behavior. Ensure that the goals are well-defined and that the agents have the necessary context to complete the task effectively.',
    goals: [
      'Receive high-level tasks and break them down into sub-tasks.',
      'Delegate sub-tasks to specialized agents with clear instructions and one-shot prompts.',
      'Ensure that the goals are well-defined and that the agents have the necessary context to complete the task effectively.',
      'Monitor the progress of the specialized agents and provide feedback as needed.',
    ],
    isOrchestrator: true,
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  // 3. Create the orchestrator agent
  const orchestrator = agentFactory.createAgent({...orchestratorConfig, agentClass: Agent});

  // 4. Define specialized agent configurations
  const researcherConfig = {
    id: 'researcher-agent',
    name: 'Researcher Agent',
    description: 'An agent that specializes in information retrieval, research, cost estimation, and data gathering.',
    role: 'You are an expert researcher. You are responsible for gathering information and conducting research on various topics, including cost estimation, flight research, accommodation research, and activity planning.',
    capabilities: ['research', 'information gathering', 'cost estimation', 'flight research', 'accommodation research', 'activity research'],
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  const plannerConfig = {
    id: 'planner-agent',
    name: 'Planner Agent',
    description: 'An agent that specializes in planning, budgeting, itinerary creation, and project management.',
    role: 'You are an expert planner. You are responsible for creating detailed plans, managing budgets, designing itineraries, and coordinating complex projects.',
    capabilities: ['planning', 'budgeting', 'itinerary creation', 'project management', 'scheduling'],
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  const analystConfig = {
    id: 'analyst-agent',
    name: 'Analyst Agent',
    description: 'An agent that specializes in data analysis, report generation, and providing data-driven insights.',
    role: 'You are an expert data analyst. You are responsible for analyzing data, generating reports, and providing actionable insights. You should be able to identify trends, patterns, and anomalies in complex datasets.',
    capabilities: ['data analysis', 'report generation', 'data interpretation', 'insights generation', 'trend analysis'],
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  const financierConfig = {
    id: 'financier-agent',
    name: 'Financier Agent',
    description: 'An agent that specializes in financial planning, budget management, and financial analysis.',
    role: 'You are an expert financier. You are responsible for financial planning, budget management, cost optimization, and financial decision making.',
    capabilities: ['financial planning', 'budget management', 'cost optimization', 'financial analysis', 'expense tracking'],
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };
  
  // New specialized agents based on Manus AI architecture
  const executionConfig = {
    id: 'execution-agent',
    name: 'Execution Agent',
    description: 'An agent that specializes in executing tasks, simulating human actions, and interacting with external tools and workflows.',
    role: 'You are an expert execution agent. You are responsible for carrying out tasks, simulating human actions like clicking or filling out forms, and interacting with external tools and APIs as instructed by the orchestrator.',
    capabilities: ['execution', 'web automation', 'tool interaction', 'api execution', 'simulation'],
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  const coderConfig = {
    id: 'coder-agent',
    name: 'Coder Agent',
    description: 'An agent that specializes in code generation, script writing, and software development.',
    role: 'You are an expert coder. You are responsible for generating code, writing scripts, and assisting with software development tasks as directed by the orchestrator.',
    capabilities: ['code generation', 'script writing', 'development', 'debugging', 'testing'],
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  const verifierConfig = {
    id: 'verifier-agent',
    name: 'Verifier Agent',
    description: 'An agent that specializes in cross-validating results, quality assurance, and fact-checking.',
    role: 'You are an expert verifier. You are responsible for ensuring the accuracy and quality of work produced by other agents. You cross-validate results and fact-check information to ensure the final output is reliable.',
    capabilities: ['verification', 'quality assurance', 'fact-checking', 'cross-validation'],
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  // 5. Create and register the specialized agents
  const researcherAgent = agentFactory.createAgent({...researcherConfig, agentClass: Agent});
  const plannerAgent = agentFactory.createAgent({...plannerConfig, agentClass: Agent});
  const analystAgent = agentFactory.createAgent({...analystConfig, agentClass: Agent});
  const financierAgent = agentFactory.createAgent({...financierConfig, agentClass: Agent});
  const executionAgent = agentFactory.createAgent({...executionConfig, agentClass: Agent});
  const coderAgent = agentFactory.createAgent({...coderConfig, agentClass: Agent});
  const verifierAgent = agentFactory.createAgent({...verifierConfig, agentClass: Agent});

  orchestrator.registerAgent(researcherAgent);
  orchestrator.registerAgent(plannerAgent);
  orchestrator.registerAgent(analystAgent);
  orchestrator.registerAgent(financierAgent);
  orchestrator.registerAgent(executionAgent);
  orchestrator.registerAgent(coderAgent);
  orchestrator.registerAgent(verifierAgent);

  return orchestrator;
}

export { createManus, Agent };

async function testManus() {
  const orchestrator = await createManus();

  // Test the orchestrator by giving it a high-level task
  const task = 'Plan a 7-day trip to Japan, including a detailed itinerary and flight options.';

  // Delegate the task to the orchestrator
  const result = await orchestrator.run(task);

  console.log('Orchestrator finished with result:', result);
}

testManus();