// search_tool.js
import search from './search_tool/search.js';

export const webSearchTool = {
    name: 'webSearch', // This name must match the one in your agent config JSON
    description: 'Performs a web search for a given query and returns relevant results, including snippets and content from the pages.',
    schema: {
        // This is the REQUIRED 'function_declaration' property
        function_declaration: {
            name: 'webSearch',
            description: 'Performs a web search for a given query and returns relevant results, including snippets and content from the pages.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search query (e.g., "latest news on AI", "how to bake a cake", "weather in London").',
                    },
                },
                required: ['query'],
            },
        },
    },
    /**
     * The executable function of the tool.
     * @param {Object} params - Parameters for the tool call.
     * @param {string} params.query - The search query.
     * @returns {Promise<string>} - A promise that resolves with the search results formatted as a string.
     */
    call: async (params) => {
        console.log(`🌐 [WEB SEARCH TOOL] Executing webSearch with query: "${params.query}"`);
        try {
            const results = await search(params.query);
            if (results && results.length > 0) {
                let formattedResults = `Web Search Results for "${params.query}":\n\n`;
                results.forEach((result, index) => {
                    formattedResults += `Result ${index + 1}:\n`;
                    formattedResults += `  Title: ${result.title}\n`;
                    formattedResults += `  URL: ${result.url}\n`;
                    formattedResults += `  Snippet: ${result.snippet}\n`;
                    if (result.content) {
                        formattedResults += `  Content (excerpt): ${result.content.substring(0, 300)}...\n`; // Limit content to 300 chars for brevity
                    }
                    formattedResults += '\n';
                });
                return formattedResults;
            } else {
                return `No web search results found for "${params.query}".`;
            }
        } catch (error) {
            console.error(`🌐 [WEB SEARCH TOOL] Error during web search:`, error);
            return `An error occurred during web search: ${error.message}`;
        }
    },
};
