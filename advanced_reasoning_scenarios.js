/**
 * Advanced reasoning scenarios demonstrating specialized Agent2.js capabilities
 * This file shows how to create domain-specific reasoning agents and complex workflows
 */

import { Agent } from './Agent2.js';
import { GeminiProvider } from './GeminiProvider.js';
import { webSearchTool } from './tools/search_tool.js';
import { calculatorTool } from './tools/calculator_tool.js';
import dotenv from 'dotenv';

dotenv.config();

const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY, 'gemini-2.0-flash');

// Create a strategic planner agent
const strategicPlanner = new Agent({
  id: 'strategic-planner',
  name: 'Athena',
  description: 'Strategic planning and decision-making specialist',
  role: `You are Athena, a master strategic planner. You excel at:
- Breaking down complex objectives into actionable strategies
- Identifying dependencies and critical path analysis
- Risk assessment and mitigation planning
- Resource allocation optimization
- Timeline and milestone planning

Always provide structured, implementable plans with clear success metrics.`,
  goals: [
    'Create comprehensive strategic plans with clear milestones',
    'Identify potential risks and mitigation strategies',
    'Optimize resource allocation and timeline efficiency',
    'Provide actionable next steps with success criteria'
  ],
  llmProvider: geminiProvider,
  llmConfig: { temperature: 0.2, maxOutputTokens: 3072 }
});

// Create a research analyst agent
const researchAnalyst = new Agent({
  id: 'research-analyst',
  name: 'Darwin',
  description: 'Research and data analysis specialist',
  role: `You are Darwin, a meticulous research analyst. Your expertise includes:
- Comprehensive information gathering and synthesis
- Data analysis and pattern recognition
- Evidence-based reasoning and conclusions
- Comparative analysis and benchmarking
- Trend identification and forecasting

You always provide well-researched, data-driven insights with proper citations.`,
  goals: [
    'Gather comprehensive, accurate information from multiple sources',
    'Analyze data to identify patterns and trends',
    'Provide evidence-based conclusions and recommendations',
    'Maintain objectivity and cite sources appropriately'
  ],
  llmProvider: geminiProvider,
  llmConfig: { temperature: 0.1, maxOutputTokens: 4096 }
});

// Create a creative problem solver agent
const creativeSolver = new Agent({
  id: 'creative-solver',
  name: 'Leonardo',
  description: 'Creative problem-solving and innovation specialist',
  role: `You are Leonardo, a creative problem-solving genius. You specialize in:
- Innovative thinking and out-of-the-box solutions
- Design thinking methodology
- Brainstorming and ideation techniques
- Cross-domain knowledge application
- Prototype and concept development

You approach problems with creativity while maintaining practical feasibility.`,
  goals: [
    'Generate innovative and creative solutions to complex problems',
    'Apply design thinking principles to problem-solving',
    'Combine ideas from different domains for novel approaches',
    'Balance creativity with practical implementation considerations'
  ],
  llmProvider: geminiProvider,
  llmConfig: { temperature: 0.8, maxOutputTokens: 2048 }
});

// Add tools to agents
[strategicPlanner, researchAnalyst, creativeSolver].forEach(agent => {
  agent.addTool(webSearchTool);
  agent.addTool(calculatorTool);
});

async function demonstrateStrategicPlanning() {
  console.log('\n🎯 === STRATEGIC PLANNING SCENARIO ===\n');
  
  const businessGoal = `Create a comprehensive strategy to enter the sustainable packaging market 
  with a $2M budget over 18 months, targeting B2B customers in the food and beverage industry.`;
  
  try {
    console.log('🔍 Phase 1: Strategic Analysis and Planning');
    const strategicPlan = await strategicPlanner.plan(businessGoal);
    
    console.log('\n📋 Strategic Plan Generated:');
    console.log(JSON.stringify(strategicPlan, null, 2));
    
    // Use reasoning to evaluate different market entry strategies
    const entryOptions = [
      'Direct sales to large food manufacturers',
      'Partnership with existing packaging distributors', 
      'Online marketplace for small-medium businesses',
      'Licensing technology to established players'
    ];
    
    const strategicCriteria = [
      'Time to market',
      'Capital requirements',
      'Market penetration potential',
      'Competitive advantage sustainability',
      'Risk level'
    ];
    
    console.log('\n🧠 Phase 2: Market Entry Strategy Evaluation');
    const strategyEvaluation = await strategicPlanner.reason(entryOptions, strategicCriteria);
    
    console.log('\n📊 Strategy Evaluation Result:');
    console.log('Reasoning steps:', strategyEvaluation.steps);
    console.log('Recommended strategy:', strategyEvaluation.decision);
    
    return { strategicPlan, strategyEvaluation };
  } catch (error) {
    console.error('❌ Strategic planning failed:', error.message);
  }
}

async function demonstrateResearchAnalysis() {
  console.log('\n🔬 === RESEARCH ANALYSIS SCENARIO ===\n');
  
  const researchQuery = `Analyze the current state of the sustainable packaging market, including 
  market size, growth trends, key players, technological innovations, and regulatory drivers. 
  Provide data-driven insights and forecasts.`;
  
  try {
    console.log('🔍 Conducting comprehensive market research...');
    const researchResult = await researchAnalyst.run(researchQuery);
    
    console.log('\n📊 Research Analysis Result:');
    if (researchResult.toolResults) {
      console.log('Research findings:', researchResult.toolResults);
      console.log('Analysis synthesis:', researchResult.finalResponse);
    } else {
      console.log('Analysis:', researchResult);
    }
    
    // Follow up with specific competitive analysis
    const competitiveQuery = `Based on the market research, identify the top 5 competitors 
    in sustainable packaging and analyze their strengths, weaknesses, and market positioning.`;
    
    console.log('\n🏆 Conducting competitive analysis...');
    const competitiveAnalysis = await researchAnalyst.run(competitiveQuery);
    
    console.log('\n🎯 Competitive Analysis Result:');
    console.log(competitiveAnalysis);
    
    return { researchResult, competitiveAnalysis };
  } catch (error) {
    console.error('❌ Research analysis failed:', error.message);
  }
}

async function demonstrateCreativeProblemSolving() {
  console.log('\n🎨 === CREATIVE PROBLEM SOLVING SCENARIO ===\n');
  
  const creativeProblem = `Design an innovative sustainable packaging solution that addresses 
  the challenge of food waste reduction while being cost-effective for small restaurants. 
  The solution should be practical, scalable, and differentiated from existing options.`;
  
  try {
    console.log('💡 Generating creative solutions...');
    
    // Use Chain of Thought for systematic creative thinking
    const creativeResult = await creativeSolver.run(creativeProblem, {}, true);
    
    console.log('\n🎨 Creative Solution Result:');
    if (creativeResult.steps) {
      console.log('Creative thinking process:', creativeResult.steps);
      console.log('Innovative solution:', creativeResult.result);
    } else {
      console.log('Solution:', creativeResult);
    }
    
    // Generate multiple solution alternatives
    const alternativeOptions = [
      'Smart packaging with freshness indicators',
      'Modular reusable container system',
      'Biodegradable packaging with embedded nutrients',
      'Digital packaging with QR codes for waste tracking'
    ];
    
    const creativeCriteria = [
      'Innovation level',
      'Implementation feasibility',
      'Environmental impact',
      'Cost effectiveness',
      'Market differentiation'
    ];
    
    console.log('\n🔄 Evaluating creative alternatives...');
    const alternativeEvaluation = await creativeSolver.reason(alternativeOptions, creativeCriteria);
    
    console.log('\n⭐ Alternative Evaluation:');
    console.log('Evaluation process:', alternativeEvaluation.steps);
    console.log('Best creative option:', alternativeEvaluation.decision);
    
    return { creativeResult, alternativeEvaluation };
  } catch (error) {
    console.error('❌ Creative problem solving failed:', error.message);
  }
}

async function demonstrateCollaborativeReasoning() {
  console.log('\n🤝 === COLLABORATIVE REASONING SCENARIO ===\n');
  
  // Simulate a collaborative decision-making process
  const collaborativeChallenge = `Determine the optimal pricing strategy for our sustainable 
  packaging solution considering market positioning, cost structure, and competitive dynamics.`;
  
  try {
    // Step 1: Research analyst gathers market data
    console.log('📊 Step 1: Market data collection and analysis');
    researchAnalyst.memory.remember('analysis_focus', 'pricing strategy research');
    const marketData = await researchAnalyst.run(
      `Research current pricing models in the sustainable packaging industry, including premium pricing, 
      value-based pricing, and competitive pricing strategies. Include specific price points and market response data.`
    );
    
    // Step 2: Strategic planner creates pricing framework
    console.log('\n🎯 Step 2: Strategic pricing framework development');
    strategicPlanner.memory.remember('market_research', JSON.stringify(marketData));
    const pricingFramework = await strategicPlanner.plan(
      `Create a comprehensive pricing strategy framework that incorporates the market research findings 
      and aligns with our business objectives and competitive positioning.`
    );
    
    // Step 3: Creative solver generates innovative pricing models
    console.log('\n💡 Step 3: Innovative pricing model generation');
    creativeSolver.memory.remember('strategic_framework', JSON.stringify(pricingFramework));
    const innovativePricing = await creativeSolver.run(
      `Design innovative pricing models that differentiate our sustainable packaging solution while 
      ensuring profitability and market acceptance. Consider subscription models, performance-based pricing, 
      and value-sharing approaches.`, {}, true
    );
    
    // Step 4: Final collaborative decision
    console.log('\n🤝 Step 4: Collaborative decision synthesis');
    const finalDecision = await strategicPlanner.reason(
      [
        'Premium pricing with sustainability value proposition',
        'Competitive pricing with volume discounts',
        'Performance-based pricing tied to waste reduction',
        'Subscription model with service bundling'
      ],
      [
        'Revenue potential',
        'Market acceptance',
        'Competitive differentiation',
        'Implementation complexity',
        'Long-term sustainability'
      ]
    );
    
    console.log('\n🎉 COLLABORATIVE REASONING RESULT:');
    console.log('Market research insights:', marketData);
    console.log('Strategic framework:', pricingFramework);
    console.log('Creative pricing models:', innovativePricing);
    console.log('Final pricing decision:', finalDecision);
    
    return { marketData, pricingFramework, innovativePricing, finalDecision };
  } catch (error) {
    console.error('❌ Collaborative reasoning failed:', error.message);
  }
}

async function runAdvancedScenarios() {
  console.log('🚀 Starting advanced reasoning scenarios demonstration...\n');
  
  try {
    // Run all scenarios
    const strategicResults = await demonstrateStrategicPlanning();
    const researchResults = await demonstrateResearchAnalysis();
    const creativeResults = await demonstrateCreativeProblemSolving();
    const collaborativeResults = await demonstrateCollaborativeReasoning();
    
    console.log('\n🎉 === ALL SCENARIOS COMPLETED ===');
    console.log('\nAdvanced capabilities demonstrated:');
    console.log('✅ Strategic planning with risk assessment');
    console.log('✅ Comprehensive research and competitive analysis');
    console.log('✅ Creative problem solving with systematic evaluation');
    console.log('✅ Multi-agent collaborative reasoning');
    console.log('✅ Domain-specific expertise and specialized reasoning');
    
    return {
      strategic: strategicResults,
      research: researchResults,
      creative: creativeResults,
      collaborative: collaborativeResults
    };
    
  } catch (error) {
    console.error('❌ Advanced scenarios failed:', error.message);
  }
}

// Export for use in other modules
export {
  strategicPlanner,
  researchAnalyst,
  creativeSolver,
  runAdvancedScenarios
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdvancedScenarios().catch(console.error);
}
