/**
 * @class LLMProvider
 * @classdesc Abstract base class for LLM providers.
 */
export class LLMProvider {
  /**
   * Generates content using the LLM.
   * @param {string} prompt - The prompt for the LLM.
   * @param {object} options - Options for the LLM.
   * @param {object[]} tools - Tools to provide to the LLM.
   * @returns {Promise<object>} The generated content.
   */
  async generateContent(prompt, options, tools) {
    throw new Error("Subclasses must implement generateContent.");
  }

  /**
   * Updates the tool schemas.
   * @param {object[]} schemas - The tool schemas to update.
   */
  updateToolSchemas(schemas) {
    // Default implementation does nothing. Subclasses can override this.
  }
}
