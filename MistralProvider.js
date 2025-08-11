import { OpenAI } from 'openai'; // Mistral API is compatible with OpenAI SDK
import { LLMProvider } from './LLMProvider.js';

/**
 * @class MistralProvider
 * @classdesc Provides an interface to the Mistral API using the OpenAI SDK.
 */
export class MistralProvider extends LLMProvider {
    /**
     * Create a new Mistral provider instance.
     * @param {string} apiKey - Mistral API key.
     * @param {string} modelName - The name of the Mistral model to use.
     * @param {object} [llmConfig={}] - Additional configuration for the LLM.
     */
    constructor(apiKey, modelName = 'mistral-large-latest', llmConfig = {}) {
        super();
        if (!apiKey) {
            throw new Error("API key is required for MistralProvider.");
        }

        const openaiConfig = {
            apiKey: apiKey,
            baseURL: 'https://api.mistral.ai/v1/',
        };

        this.openai = new OpenAI(openaiConfig);
        this.modelName = modelName;
        this.toolSchemas = [];
    }

    /**
     * Updates the tool schemas.
     * @param {object[]} schemas - The tool schemas to update.
     */
    updateToolSchemas(schemas) {
        this.toolSchemas = schemas.map(schema => ({
            type: 'function',
            function: {
                name: schema.name,
                description: schema.description,
                parameters: schema.parameters,
            }
        }));
    }

    /**
     * Generates content using the Mistral LLM via the OpenAI SDK.
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

            if (prompt.systemInstruction) {
                messages.unshift({ role: 'system', content: prompt.systemInstruction });
            }

            const request = {
                model: this.modelName,
                messages: messages,
                temperature: prompt.temperature || options.temperature || 0.7,
                max_tokens: prompt.maxOutputTokens || options.maxOutputTokens || 1024,
            };

            if (this.toolSchemas && this.toolSchemas.length > 0) {
                request.tools = this.toolSchemas;
            }

            const response = await this.openai.chat.completions.create(request);
            return this.formatResponse(response);
        } catch (error) {
            console.error('Error calling Mistral API:', error);
            throw error;
        }
    }

    /**
     * Formats the OpenAI API response to a common structure.
     * @param {object} response - The response from the OpenAI API.
     * @returns {object} The formatted response.
     */
    formatResponse(response) {
        const choice = response.choices[0];
        if (choice.message.tool_calls) {
            const toolCalls = choice.message.tool_calls.map(toolCall => ({
                functionCall: {
                    name: toolCall.function.name,
                    args: JSON.parse(toolCall.function.arguments),
                }
            }));
            return {
                candidates: [{
                    content: {
                        parts: toolCalls
                    }
                }]
            };
        } else {
            return {
                candidates: [{
                    content: {
                        parts: [{ text: choice.message.content }]
                    }
                }]
            };
        }
    }
}
