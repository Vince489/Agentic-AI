import fs from 'fs/promises';
import path from 'path';

/**
 * Represents an AI persona, loading its configuration and providing related methods.
 */
class Persona {
  /**
   * @param {object} personaData - The raw persona data object.
   */
  constructor(personaData) {
    this.metadata = personaData.metadata || {};
    this.identity = personaData.identity || {};
    this.personality = personaData.personality || {};
    this.constraints = personaData.constraints || [];
    this.response_examples = personaData.response_examples || {};
    this.backstory = personaData.backstory || '';
    this.core_functions = personaData.core_functions || [];
    this.voice_settings = personaData.voice_settings || {};

    // Ensure essential properties have defaults if not provided
    this.id = this.metadata.id || 'default_persona';
    this.name = this.metadata.name || 'AI Assistant';
  }

  /**
   * Generates a system prompt based on the persona's attributes.
   * @returns {string} The system prompt.
   */
  generateSystemPrompt() {
    const { identity, personality, constraints, backstory } = this;

    let prompt = `You are ${identity.agent_name || this.name}, a LLM trained by ${identity.creator || 'the Virtron Labs team'}, built on the ${identity.base_model || 'a powerful AI'} model. You are a helpful ${personality.role || 'assistant'}.

As ${identity.agent_name || this.name}, your personality and response style:
- You are ${personality.tone || 'professional and helpful'}.
- Your communication style is ${personality.style || 'clear and concise'}.
- You have a ${personality.humor || 'neutral'} sense of humor.
- You identify yourself as ${identity.agent_name || this.name} when introducing yourself.
- If asked about your creator, mention you were developed by ${identity.creator || 'the Virtron Labs team'} using the ${identity.base_model || 'a powerful AI'} model.

${backstory || ''}

Hard constraints:
${constraints && constraints.length > 0 ? constraints.map(constraint => `- ${constraint}`).join('\n') : '- Provide accurate and helpful information.'}

When responding:
- Be concise and conversational, optimized for speech if applicable.
- Focus on the most important information and avoid lengthy explanations unless specifically asked.
- Use natural, conversational language.`;

    return prompt;
  }

  /**
   * Gets the voice settings for the persona.
   * @returns {object} The voice settings.
   */
  getVoiceSettings() {
    return this.voice_settings || {
      languageCode: 'en-US',
      voiceName: 'en-US-Standard-C', // A common default
      ssmlGender: 'NEUTRAL',
      speakingRate: 1.0,
      pitch: 0.0
    };
  }

  /**
   * Loads a persona configuration from a JSON file.
   * @param {string} personaId - The ID of the persona to load (e.g., 'varjis_llm').
   * @returns {Promise<Persona>} A new Persona instance.
   * @throws {Error} If the persona file cannot be read or parsed.
   */
  static async load(personaId) {
    try {
      const personaPath = path.join(process.cwd(), 'services', 'personas', `${personaId}.json`);
      const personaData = await fs.readFile(personaPath, 'utf8');
      const parsedData = JSON.parse(personaData);
      return new Persona(parsedData);
    } catch (error) {
      console.error(`Error loading persona '${personaId}':`, error);
      // Fallback to a very basic default persona if loading fails
      // This ensures the application can still run, albeit with a generic persona.
      const fallbackData = {
        metadata: { id: personaId, name: 'Default Assistant', description: 'A fallback assistant.' },
        identity: { agent_name: 'Assistant', base_model: 'default_model', creator: 'System' },
        personality: { role: 'Assistant', tone: 'Neutral', style: 'Direct', humor: 'None' },
        constraints: ['Be helpful.'],
        backstory: 'A default AI assistant.',
        voice_settings: { languageCode: 'en-US', voiceName: 'en-US-Standard-C', ssmlGender: 'NEUTRAL' }
      };
      console.warn(`Using fallback persona for '${personaId}'.`);
      return new Persona(fallbackData);
    }
  }
}

export default Persona;
