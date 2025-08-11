import { OpenAI } from 'openai'; // OpenAI SDK is used for OpenRouter API
import { LLMProvider } from './LLMProvider.js';

/**
 * @class OpenRouterProvider
 * @classdesc Provides an interface to the OpenRouter API using the OpenAI SDK.
 */
export class OpenRouterProvider extends LLMProvider {
    /**
     * Create a new OpenRouter provider instance.
     * @param {string} apiKey - OpenRouter API key.
     * @param {string} modelName - The name of the OpenRouter model to use (e.g., 'deepseek/deepseek-chat-v3-0324').
     * @param {object} [llmConfig={}] - Additional configuration for the LLM, including baseURL and defaultHeaders.
     */
    constructor(apiKey, modelName = 'deepseek/deepseek-chat-v3-0324', llmConfig = {}) {
        super();
        if (!apiKey) {
            throw new Error("API key is required for OpenRouterProvider.");
        }

        const openaiConfig = {
            apiKey: apiKey,
            baseURL: llmConfig.baseURL || 'https://openrouter.ai/api/v1', // Default to OpenRouter base URL
        };

        // Remove undefined properties to avoid OpenAI client errors
        Object.keys(openaiConfig).forEach(key => openaiConfig[key] === undefined && delete openaiConfig[key]);

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
     * Generates content using the OpenRouter LLM via the OpenAI SDK.
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
            console.error('Error calling OpenRouter API:', error);
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
