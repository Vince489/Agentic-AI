import { Anthropic } from '@anthropic-ai/sdk';
import { LLMProvider } from './LLMProvider.js';

/**
 * @class AnthropicProvider
 * @classdesc Provides an interface to the Anthropic LLM.
 */
export class AnthropicProvider extends LLMProvider {
    /**
     * Create a new Anthropic provider instance.
     * @param {string} apiKey - Anthropic API key.
     * @param {string} modelName - The name of the Anthropic model to use.
     */
    constructor(apiKey, modelName = 'claude-3-opus-20240229') {
        super();
        if (!apiKey) {
            throw new Error("API key is required for AnthropicProvider.");
        }
        this.anthropic = new Anthropic({ apiKey: apiKey });
        this.modelName = modelName;
        this.toolSchemas = [];
    }

    /**
     * Updates the tool schemas.
     * @param {object[]} schemas - The tool schemas to update.
     */
    updateToolSchemas(schemas) {
        this.toolSchemas = schemas.map(schema => ({
            name: schema.name,
            description: schema.description,
            input_schema: schema.parameters
        }));
    }

    /**
     * Generates content using the Anthropic LLM.
     * @param {object} prompt - Formatted prompt for the LLM.
     * @param {object} [options={}] - Options for the generation request.
     * @returns {Promise<object>} LLM response object.
     */
    async generateContent(prompt, options = {}) {
        try {
            const messages = prompt.contents.map(content => ({
                role: content.role,
                content: content.parts.map(part => part.text).join('')
            }));

            const request = {
                model: this.modelName,
                messages: messages,
                temperature: prompt.temperature || options.temperature || 0.7,
                max_tokens: prompt.maxOutputTokens || options.maxOutputTokens || 1024,
            };

            // Merge systemInstruction into the config object
            if (!request.config) {
                request.config = {};
            }
            if (prompt.systemInstruction) {
                request.config.systemInstruction = prompt.systemInstruction;
            }

            if (this.toolSchemas && this.toolSchemas.length > 0) {
                request.tools = this.toolSchemas;
            }

            const response = await this.anthropic.messages.create(request);
            return this.formatResponse(response);
        } catch (error) {
            console.error('Error calling Anthropic:', error);
            throw error;
        }
    }

    /**
     * Formats the Anthropic API response to a common structure.
     * @param {object} response - The response from the Anthropic API.
     * @returns {object} The formatted response.
     */
    formatResponse(response) {
        const content = response.content[0];
        if (content.type === 'text') {
            return {
                candidates: [{
                    content: {
                        parts: [{ text: content.text }]
                    }
                }]
            };
        } else if (content.type === 'tool_use') {
            const toolCalls = response.content.filter(c => c.type === 'tool_use').map(c => ({
                functionCall: {
                    name: c.name,
                    args: c.input,
                }
            }));
            return {
                candidates: [{
                    content: {
                        parts: toolCalls
                    }
                }]
            };
        }
        return { candidates: [] };
    }
}
