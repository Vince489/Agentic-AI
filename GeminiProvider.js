import { GoogleGenAI } from '@google/genai';
import { LLMProvider } from './LLMProvider.js';
/**
 * GeminiProvider class for generating content using Google's Gemini API,
 * integrated with the new Agent architecture.
 */
/**
 * @class GeminiProvider
 * @classdesc Provides an interface to the Gemini LLM.
 */
export class GeminiProvider extends LLMProvider {
    /**
     * Create a new Gemini provider instance.
     * @param {string} apiKey - Gemini API key.
     * @param {string} modelName
     */
    constructor(apiKey, modelName = 'gemini-2.5-flash-lite') {
        super();
        if (!apiKey) {
            throw new Error("API key is required for GeminiProvider.");
        }
        this.genAI = new GoogleGenAI({apiKey: apiKey});
        this.modelName = modelName;
        this.toolSchemas = []; // Initialize toolSchemas
    }

    /**
     * Update the provider with the latest tool schemas.
     * This method is part of the `LLMProvider` interface.
     * @param {Object[]} schemas - An array of tool schemas (function_declaration objects).
     */
  /**
   * Updates the tool schemas.
   * @param {object[]} schemas - The tool schemas to update.
   */
    updateToolSchemas(schemas) {
        this.toolSchemas = schemas;
    }

    /**
     * Generate content using Gemini.
     * @param {Object} prompt - Formatted prompt for the LLM, including contents, systemInstruction, etc.
     * @param {Object} [options={}] - Options for the generation request.
     * @returns {Promise<Object>} - LLM response object containing text or tool calls.
     */
  /**
   * Generates content using the Gemini LLM.
   * @param {string} prompt - The prompt for the LLM.
   * @param {object} [options={}] - Options for the LLM.
   * @returns {Promise<object>} The generated content.
   */
    async generateContent(prompt, options = {}) {
        try {
            return await this.retryWithBackoff(async () => {
                const request = {
                    model: this.modelName,
                    contents: prompt.contents,
                    generationConfig: {
                        temperature: prompt.temperature || options.temperature || 0.7,
                        topP: prompt.topP || options.topP || 0.95,
                        topK: prompt.topK || options.topK || 40,
                        maxOutputTokens: prompt.maxOutputTokens || options.maxOutputTokens || 1024,
                    },
                };

                // Add systemInstruction to the config object
                if (!request.config) {
                    request.config = {};
                }
                if (prompt.systemInstruction) {
                    request.config.systemInstruction = prompt.systemInstruction;
                }

                // Add tools in config object if schemas are available (matching bet44.js structure)
                if (this.toolSchemas && this.toolSchemas.length > 0) {
                    request.config = {
                        tools: [{
                            functionDeclarations: this.toolSchemas
                        }]
                    };
                }

                const response = await this.genAI.models.generateContent(request);
                return response; // Return the full response object
            });
        } catch (error) {
            console.error('Error calling Gemini:', error);
            throw error;
        }
    }

    /**
     * Generate content with a streaming response.
     * @param {Object} prompt - Formatted prompt for the LLM.
     * @param {Function} onChunk - Callback for each chunk of the response.
     * @param {Object} [options={}] - Options for the generation request.
     * @returns {Promise<Object>} - The final, complete response object.
     */
  /**
   * Generates content using the Gemini LLM with streaming.
   * @param {string} prompt - The prompt for the LLM.
   * @param {function} onChunk - The function to call for each chunk of the response.
   * @param {object} [options={}] - Options for the LLM.
   * @returns {Promise<object>} The generated content.
   */
    async generateContentStream(prompt, onChunk, options = {}) {
        try {
            return await this.retryWithBackoff(async () => {
                const request = {
                    model: this.modelName,
                    contents: prompt.contents,
                    generationConfig: {
                        temperature: prompt.temperature || options.temperature || 0.7,
                        topP: prompt.topP || options.topP || 0.95,
                        topK: prompt.topK || options.topK || 40,
                        maxOutputTokens: prompt.maxOutputTokens || options.maxOutputTokens || 1024,
                    },
                };

                // Add systemInstruction to the config object
                if (!request.config) {
                    request.config = {};
                }
                if (prompt.systemInstruction) {
                    request.config.systemInstruction = prompt.systemInstruction;
                }

                // Add tools in config object if schemas are available (matching bet44.js structure)
                if (this.toolSchemas && this.toolSchemas.length > 0) {
                    request.config = {
                        tools: [{
                            functionDeclarations: this.toolSchemas
                        }]
                    };
                }

                const responseStream = await this.genAI.models.generateContentStream(request);
                let fullResponse = '';

                for await (const chunk of responseStream) {
                    if (chunk.text) {
                        onChunk(chunk.text);
                        fullResponse += chunk.text;
                    }
                }
                return { text: fullResponse };
            });
        } catch (error) {
            console.error('Error calling Gemini stream:', error);
            throw error;
        }
    }

    /**
     * Helper function to implement retry with exponential backoff.
     * @param {Function} operation - Async operation to retry.
     * @param {number} maxRetries - Maximum number of retries.
     * @param {number} initialDelay - Initial delay in milliseconds.
     * @returns {Promise<any>} - Result of the operation.
     */
  /**
   * Retries an operation with exponential backoff.
   * @param {function} operation - The operation to retry.
   * @param {number} [maxRetries=5] - The maximum number of retries.
   * @param {number} [initialDelay=1000] - The initial delay in milliseconds.
   * @returns {Promise<*>} The result of the operation.
   */
    async retryWithBackoff(operation, maxRetries = 5, initialDelay = 1000) {
        let retries = 0;
        let delay = initialDelay;

        while (retries < maxRetries) {
            try {
                return await operation();
            } catch (error) {
                const isOverloaded =
                    error.message?.includes('UNAVAILABLE') ||
                    error.message?.includes('overloaded') ||
                    error.message?.includes('503') ||
                    (error.status === 503);

                if (!isOverloaded || retries >= maxRetries - 1) {
                    throw error;
                }
                retries++;
                console.log(`Model overloaded. Retry attempt ${retries}/${maxRetries} after ${delay}ms delay...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay = Math.min(delay * 2, 30000) * (0.8 + Math.random() * 0.4);
            }
        }
    }
}
