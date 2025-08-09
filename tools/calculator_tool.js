// calculator_tool.js
import * as math from 'mathjs'; 

// At module level for memory functions
let memory = 0;
let previousResult = 0;

/**
 * Processes the mathematical expression.
 * This function contains the core logic previously in 'execute'.
 * @param {Object} params - Parameters object containing the expression
 * @param {string} params.expression - The mathematical expression to evaluate
 * @param {string} params.query - Alternative parameter name for the expression
 * @returns {string} The result of the calculation or an error message
 */
function processExpression(params) {
  // Support both 'expression' and 'query' parameter names for compatibility
  const expression = params.expression || params.query;
  try {
    // Validate that we have an expression
    if (!expression) {
      throw new Error('No expression provided. Use either "expression" or "query" parameter.');
    }
    // Add logging for tool execution start
    console.log(`🧮 Calculator tool called with expression: "${expression}"`);
    // Clean the expression
    const cleanExpression = expression.trim();
    // Handle special cases
    let processedExpression = cleanExpression;
    // Handle memory operations
    if (processedExpression.toUpperCase() === 'MS' || processedExpression.toLowerCase() === 'memory store') {
      memory = previousResult;
      console.log(`💾 Memory store operation: ${memory}`);
      return `Value ${memory} stored in memory`;
    }
    if (processedExpression.toUpperCase() === 'MR' || processedExpression.toLowerCase() === 'memory recall') {
      console.log(`💾 Memory recall operation: ${memory}`);
      return memory.toString();
    }
    if (processedExpression.toUpperCase() === 'MC' || processedExpression.toLowerCase() === 'memory clear') {
      memory = 0;
      console.log(`💾 Memory cleared`);
      return 'Memory cleared';
    }
    // Replace "sine of X degrees" with sin(X deg)
    if (processedExpression.match(/sine of (\d+(\.\d+)?) degrees/i)) {
      processedExpression = processedExpression.replace(
        /sine of (\d+(\.\d+)?) degrees/i,
        'sin($1 deg)'
      );
    }
    // Handle natural language expressions
    if (processedExpression.match(/^(calculate|compute|evaluate|what is|find|solve)\s+/i)) {
      processedExpression = processedExpression.replace(
        /^(calculate|compute|evaluate|what is|find|solve)\s+/i,
        ''
      );
    }
    // Handle more mathematical phrases
    const mathTerms = {
      'square root of': 'sqrt',
      'cube root of': 'cbrt',
      'log base (\\d+(\\.\\d+)?) of (\\d+(\\.\\d+)?)': (match) => `log(${match[2]}, ${match[1]})`, // Use function for replacement
      'factorial of': 'factorial',
      'percent of': '* 0.01 *',
      'to the power of': '^'
    };
    Object.entries(mathTerms).forEach(([pattern, replacement]) => {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(processedExpression)) {
        if (typeof replacement === 'function') {
            processedExpression = processedExpression.replace(regex, replacement);
        } else if (replacement === 'sqrt' || replacement === 'cbrt' || replacement === 'factorial') {
          const numberMatch = processedExpression.match(new RegExp(`${pattern}\\s*(\\d+(\\.\\d+)?)`, 'i'));
          if (numberMatch && numberMatch[1]) {
            processedExpression = processedExpression.replace(
              new RegExp(`${pattern}\\s*(\\d+(\\.\\d+)?)`, 'i'),
              `${replacement}(${numberMatch[1]})`
            );
          }
        } else {
           processedExpression = processedExpression.replace(regex, replacement);
        }
      }
    });

    // Handle unit conversions
    const unitConversionMatch = processedExpression.match(/convert\s+([\d.]+)\s*([a-zA-Z]+)\s+to\s+([a-zA-Z]+)/i);
    if (unitConversionMatch) {
      const value = unitConversionMatch[1];
      const fromUnit = unitConversionMatch[2];
      const toUnit = unitConversionMatch[3];
      processedExpression = `${value} ${fromUnit} to ${toUnit}`;
    }
    // Handle rounding requests
    const roundingMatch = processedExpression.match(/round\s+([\d.]+)\s+to\s+(\d+)\s+decimal places/i);
    if (roundingMatch) {
      const number = parseFloat(roundingMatch[1]);
      const places = parseInt(roundingMatch[2]);
      const result = (Math.round(number * Math.pow(10, places)) / Math.pow(10, places));
      previousResult = result;
      return result.toString();
    }
    // Evaluate the expression using mathjs
    console.log(`🔢 Evaluating with mathjs: "${processedExpression}"`);
    let result = math.evaluate(processedExpression);
    previousResult = result;
    console.log(`✅ Calculation result: ${result}`);
    // Handle floating-point precision issues for trigonometric functions
    if (typeof result === 'number' && (processedExpression.includes('sin') ||
        processedExpression.includes('cos') ||
        processedExpression.includes('tan') ||
        cleanExpression.includes('sine of'))) {
      const roundedResult = Math.round(result * 1e10) / 1e10;
      if (Math.abs(roundedResult - 0.5) < 1e-10) result = 0.5;
      else if (Math.abs(roundedResult - 1) < 1e-10) result = 1;
      else if (Math.abs(roundedResult - 0) < 1e-10) result = 0;
      else result = roundedResult;
    }
    if (math.typeOf(result) === 'Complex') {
      return `${result.toString()}`;
    } else if (math.typeOf(result) === 'BigNumber') {
      return result.toString();
    } else if (Array.isArray(result)) {
      return JSON.stringify(result);
    } else if (typeof result === 'object' && result !== null && typeof result.toString === 'function' && !result.isUnit) {
        // Check for mathjs result objects that are not units
        return JSON.stringify(result);
    } else if (result && typeof result.toString === 'function') { // Handles units and numbers
        return result.toString();
    }

    return String(result); // Ensure it's always a string
  } catch (error) {
    console.error(`❌ Calculator tool error: ${error.message} for expression "${expression}" (processed: "${processedExpression}")`);
    if (error.message.includes('Undefined symbol')) {
      const symbolMatch = error.message.match(/Undefined symbol\s+(\w+)/);
      const symbol = symbolMatch ? symbolMatch[1] : "unknown";
      return `Error: '${symbol}' is not recognized. Did you mean to use a supported function like sin(), cos(), sqrt()?`;
    } else if (error.message.includes('Unexpected token')) {
      return `Error: Your expression has syntax errors. Please check for missing parentheses or operators.`;
    }
    return `Calculator error: ${error.message}`;
  }
}


// Export the calculator tool object matching the webSearchTool structure
export const calculatorTool = {
    name: 'calculator', // This name must match the one in your agent config JSON
    description: 'Evaluates mathematical expressions using mathjs. Supports basic arithmetic, trigonometry, logarithms, and memory operations.',
    schema: {
        // This is the REQUIRED 'function_declaration' property
        function_declaration: {
            name: 'calculator', // Should ideally match the 'name' property above
            description: 'Evaluates mathematical expressions using mathjs. Supports basic arithmetic, trigonometry, logarithms, and memory operations.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    expression: { // Define the primary parameter
                        type: 'STRING',
                        description: 'The mathematical expression to evaluate (e.g., "2 + 3", "sin(45 deg)", "sqrt(16)").',
                    },
                    query: { // Optional alternative parameter name, as supported by the logic
                        type: 'STRING',
                        description: 'Alternative parameter name for the expression.',
                    }
                },
                required: [], // Neither is strictly required as the logic checks for either. You might choose one.
                // If you want to enforce one, e.g., required: ['expression'],
            },
        },
    },
    /**
     * The executable function of the tool.
     * @param {Object} params - Parameters for the tool call.
     * @param {string} [params.expression] - The mathematical expression.
     * @param {string} [params.query] - Alternative parameter name for the expression.
     * @returns {Promise<string>} - A promise that resolves with the calculation result or an error message.
     */
    call: async (params) => {
        console.log(`🧮 [CALCULATOR TOOL] Executing calculator with params:`, params);
        try {
            // The core logic is now in processExpression
            const result = processExpression(params);
            return result;
        } catch (error) {
             console.error(`🧮 [CALCULATOR TOOL] Unexpected error during calculation:`, error);
             return `An unexpected error occurred in the calculator: ${error.message}`;
        }
    },
};
