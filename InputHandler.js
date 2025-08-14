/**
 * InputHandler - A utility class for handling and validating workflow inputs.
 */
export class InputHandler {
  /**
   * @param {Object} agency - The agency object.
   * @param {Object} workflowConfigs - Configuration object defining input requirements for each workflow type.
   */
  constructor(agency, workflowConfigs = {}) {
    this.agency = agency;
    this.workflowConfigs = workflowConfigs;
  }

  /**
   * Parse and validate inputs for a workflow.
   * @param {string} workflowType - The type of workflow.
   * @param {Array<string>} argv - Command line arguments.
   * @returns {Object} - Parsed and validated inputs.
   */
  static parseInputs(workflowType, argv, workflowConfigs = {}) {
    const inputs = {};
    const config = workflowConfigs[workflowType];

    if (!config) {
      throw new Error(`Error: No configuration found for workflow type "${workflowType}"`);
    }

    // Process each input field defined in the configuration
    for (const [fieldName, fieldConfig] of Object.entries(config)) {
      const argIndex = fieldConfig.argIndex;
      const defaultValue = fieldConfig.defaultValue;
      const required = fieldConfig.required || false;
      const parser = fieldConfig.parser || (value => value);

      // Get value from argv or use default
      let value = argv[argIndex];

      // If no value provided and field is required, throw error
      if (value === undefined && required && defaultValue === undefined) {
        throw new Error(`Error: Required field "${fieldName}" not provided`);
      }

      // Use default if no value provided
      if (value === undefined) {
        value = defaultValue;
      }

      // Parse the value according to the parser function
      try {
        inputs[fieldName] = parser(value);
      } catch (error) {
        throw new Error(`Error parsing field "${fieldName}": ${error.message}`);
      }

      // Validate required fields
      if (required && (inputs[fieldName] === undefined || inputs[fieldName] === null || inputs[fieldName] === '')) {
        throw new Error(`Error: Required field "${fieldName}" is empty`);
      }
    }

    return inputs;
  }

  /**
   * Parses inputs for a brief from command-line arguments.
   * @param {string} briefId - The ID of the brief.
   * @param {Array<string>} argv - Command-line arguments.
   * @param {Object} briefConfigs - Configuration object defining input requirements for each brief type.
   * @returns {Object} - Parsed inputs for the brief.
   */
  parseInputsForBrief(briefId, argv, briefConfigs = {}) {
    const inputs = {};
    const config = briefConfigs[briefId];

    if (!config) {
      throw new Error(`Error: No configuration found for brief ID "${briefId}"`);
    }

    // Process each input field defined in the configuration
    for (const [fieldName, fieldConfig] of Object.entries(config)) {
      const argIndex = fieldConfig.argIndex;
      const defaultValue = fieldConfig.defaultValue;
      const required = fieldConfig.required || false;
      const parser = fieldConfig.parser || (value => value);

      // Get value from argv or use default
      let value = argv[argIndex];

      // If no value provided and field is required, throw error
      if (value === undefined && required && defaultValue === undefined) {
        throw new Error(`Error: Required field "${fieldName}" not provided`);
      }

      // Use default if no value provided
      if (value === undefined) {
        value = defaultValue;
      }

      // Parse the value according to the parser function
      try {
        inputs[fieldName] = parser(value);
      } catch (error) {
        throw new Error(`Error parsing field "${fieldName}": ${error.message}`);
      }

      // Validate required fields
      if (required && (inputs[fieldName] === undefined || inputs[fieldName] === null || inputs[fieldName] === '')) {
        throw new Error(`Error: Required field "${fieldName}" is empty`);
      }
    }

    return inputs;
  }
}
