import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function runComplexAgent(highLevelGoal) {
  console.log("----------------------------------------------");
  console.log(`Starting agent with high-level goal: "${highLevelGoal}"`);
  console.log("----------------------------------------------");

  // Step 1: Decompose the high-level goal into a plan.
  // This is the "thinking" or "planning" phase of the agent.
  console.log("[AGENT] Decomposing the high-level goal into a plan...");
  const planResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: `Decompose the following high-level goal into a clear, numbered plan of action. Do not provide any details, just the list of steps.\n\nGoal: ${highLevelGoal}`,
    config: {
      systemInstruction: "You are a professional strategist. Your only task is to break down complex goals into a numbered list of actionable steps.",
    },
  });

  const rawPlan = planResponse.text;
  const planSteps = rawPlan
    .split("\n")
    .filter(step => step.trim().length > 0)
    .map(step => step.replace(/^\d+\.\s*/, "")); // Clean up numbering

  console.log("\n[AGENT] Plan created:");
  planSteps.forEach((step, index) => console.log(`  ${index + 1}. ${step}`));
  console.log("----------------------------------------------");

  // The agent's task is complete. We stop here.
  console.log("[AGENT] Plan generation complete. Agent's task is finished.");
  console.log("----------------------------------------------");
}

// Call the agent with your high-level goal
runComplexAgent("I want to create a sign up and login for html using jwt, bcrypt, mongoose, and express.");
