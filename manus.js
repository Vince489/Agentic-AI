/**
 * Manus.ai replication
 */

import { Agent } from './Agent2.js';
import { AgentFactory } from './AgentFactory.js';
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
    role: 'You are a sophisticated orchestrator for a multi-agent system. You receive high-level tasks, break them down into sub-tasks, and delegate them to specialized agents. You rely on powerful, third-party large language models (LLMs) like Anthropic\'s Claude or Alibaba\'s Qwen as your "brain."',
    isOrchestrator: true,
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  // 3. Create the orchestrator agent
  const orchestrator = agentFactory.createAgent(orchestratorConfig);

  // 4. Define specialized agent configurations
  const researcherConfig = {
    id: 'researcher-agent',
    name: 'Researcher Agent',
    description: 'An agent that specializes in information retrieval and research.',
    role: 'You are an expert researcher. You are responsible for gathering information and conducting research on various topics.',
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  const coderConfig = {
    id: 'coder-agent',
    name: 'Coder Agent',
    description: 'An agent that specializes in code generation and debugging.',
    role: 'You are an expert coder. You are responsible for generating and debugging code.',
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  const analystConfig = {
    id: 'analyst-agent',
    name: 'Analyst Agent',
    description: 'An agent that specializes in data analysis and reporting.',
    role: 'You are an expert analyst. You are responsible for analyzing data and generating reports.',
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  const contentConfig = {
    id: 'content-agent',
    name: 'Content Agent',
    description: 'An agent that specializes in content generation and writing.',
    role: 'You are an expert content creator. You are responsible for generating high-quality content and writing compelling narratives.',
    llmConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  // 5. Create the specialized agents
  const researcher = agentFactory.createAgent(researcherConfig);
  const coder = agentFactory.createAgent(coderConfig);
  const analyst = agentFactory.createAgent(analystConfig);
  const content = agentFactory.createAgent(contentConfig);

  // 6. Register the agents with the orchestrator
  orchestrator.registerAgent(researcher);
  orchestrator.registerAgent(coder);
  orchestrator.registerAgent(analyst);
  orchestrator.registerAgent(content);

  return orchestrator;
}

export { createManus };

async function testManus() {
  const orchestrator = await createManus();

  // Test the orchestrator by giving it a high-level task
  const task = 'Plan a 7-day trip to Japan, including a detailed itinerary and flight options.';
  const result = await orchestrator.run(task);

  console.log('Orchestrator result:', result);
}

// Call the testManus function
testManus();
