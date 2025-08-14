// datetime.js
import { DateTime } from 'luxon';

/**
 * Date/Time Tool for LLM/Agent using Luxon, structured for Google Function Calling
 */
class DateTimeTool {
  constructor() {
    this.name = 'datetime_tool';
    this.description = 'Provides current date and time, and can perform date/time calculations and conversions.';
  }

  /**
   * Gets the current date and time.
   * @param {Object} params - Parameters for the function.
   * @param {string} [params.location] - The location for which to retrieve the date and time (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo', or a specific city). If not provided, defaults to the user's local time.
   * @returns {string} - The current date and time, or an error message.
   */
  getCurrentDateTime({ location } = {}) {
    try {
      let dt;
      if (location) {
        // Luxon's setZone handles IANA names and some city names if linked correctly,
        // but for simplicity, we'll assume IANA names are passed or handle mapping externally if needed.
        dt = DateTime.now().setZone(location);
      } else {
        dt = DateTime.now();
      }
      // Return a formatted string for readability, or ISO if preferred
      return dt.toFormat('MMMM d, yyyy h:mm:ss a ZZZZ'); // Example: August 8, 2025 10:30:00 AM GMT+00:00
      // return dt.toISO(); // Alternative: ISO format
    } catch (error) {
      return `Error: Invalid location: ${location}. Please specify a valid IANA time zone (e.g., 'America/New_York') or a city.`;
    }
  }

  /**
   * Converts a date/time to a different time zone.
   * @param {Object} params - Parameters for the function.
   * @param {string} params.dateTimeStr - The date/time string to convert (in ISO format).
   * @param {string} params.targetTimeZone - The target time zone (e.g., 'America/Los_Angeles').
   * @returns {string} - The converted date/time string, or an error.
   */
  convertToTimeZone({ dateTimeStr, targetTimeZone }) {
    try {
      const dt = DateTime.fromISO(dateTimeStr).setZone(targetTimeZone);
      if (!dt.isValid) {
         throw new Error(dt.invalidReason || "Invalid date/time or timezone");
      }
      return dt.toFormat('MMMM d, yyyy h:mm:ss a ZZZZ');
      // return dt.toISO();
    } catch (error) {
      return `Error: Could not convert ${dateTimeStr} to time zone ${targetTimeZone}. ${error.message}`;
    }
  }

  /**
   * Formats a date/time string.
   * @param {Object} params - Parameters for the function.
   * @param {string} params.dateTimeStr - The date/time string to format (in ISO format).
   * @param {string} params.format - The desired Luxon format (e.g., 'yyyy-MM-dd HH:mm:ss', 'MMMM dd, yyyy', 'h:mm a').
   * @returns {string} - The formatted date/time string, or an error message.
   */
  formatDateTime({ dateTimeStr, format }) {
    try {
      const dt = DateTime.fromISO(dateTimeStr);
      if (!dt.isValid) {
         throw new Error(dt.invalidReason || "Invalid date/time string");
      }
      return dt.toFormat(format);
    } catch (error) {
      return `Error: Invalid date/time string or format: ${dateTimeStr}, ${format}. ${error.message}`;
    }
  }

  /**
   * Calculates the difference between two date/time values.
   * @param {Object} params - Parameters for the function.
   * @param {string} params.startDateTimeStr - The starting date/time string (in ISO format).
   * @param {string} params.endDateTimeStr - The ending date/time string (in ISO format).
   * @param {string} [params.unit=days] - The unit of time for the difference (e.g., 'years', 'months', 'days', 'hours', 'minutes', 'seconds').
   * @returns {string} - The difference between the two date/time values in the specified unit, or an error message.
   */
  dateTimeDifference({ startDateTimeStr, endDateTimeStr, unit = 'days' }) {
    try {
      const startDt = DateTime.fromISO(startDateTimeStr);
      const endDt = DateTime.fromISO(endDateTimeStr);

      if (!startDt.isValid) {
         throw new Error(`Invalid start date/time: ${startDateTimeStr}`);
      }
      if (!endDt.isValid) {
         throw new Error(`Invalid end date/time: ${endDateTimeStr}`);
      }

      const diff = endDt.diff(startDt, unit);
      const value = diff.toObject()[unit];

      if (value === undefined) {
          throw new Error(`Invalid unit: ${unit}`);
      }

      return `The difference is ${value} ${unit}.`;
    } catch (error) {
      return `Error calculating difference: ${error.message}`;
    }
  }

  /**
   * Adds a specified amount of time to a date/time.
   * @param {Object} params - Parameters for the function.
   * @param {string} params.dateTimeStr - The date/time string to add to (in ISO format).
   * @param {number} params.amount - The amount of time to add.
   * @param {string} params.unit - The unit of time to add (e.g., 'years', 'months', 'days', 'hours', 'minutes', 'seconds').
   * @returns {string} The resulting date/time string, or an error.
   */
  addTimeToDateTime({ dateTimeStr, amount, unit }) {
    try {
      const dt = DateTime.fromISO(dateTimeStr).plus({ [unit]: amount });
       if (!dt.isValid) {
         throw new Error(dt.invalidReason || "Invalid date/time or calculation result");
      }
      return dt.toFormat('MMMM d, yyyy h:mm:ss a ZZZZ');
      // return dt.toISO();
    } catch (error) {
      return `Error: Could not add ${amount} ${unit} to ${dateTimeStr}. ${error.message}`;
    }
  }

  /**
   * Subtracts a specified amount of time from a date/time.
   * @param {Object} params - Parameters for the function.
   * @param {string} params.dateTimeStr - The date/time string to subtract from (in ISO format).
   * @param {number} params.amount - The amount of time to subtract.
   * @param {string} params.unit - The unit of time to subtract (e.g., 'years', 'months', 'days', 'hours', 'minutes', 'seconds').
   * @returns {string} The resulting date/time string, or an error.
   */
  subtractTimeFromDateTime({ dateTimeStr, amount, unit }) {
    try {
      const dt = DateTime.fromISO(dateTimeStr).minus({ [unit]: amount });
       if (!dt.isValid) {
         throw new Error(dt.invalidReason || "Invalid date/time or calculation result");
      }
      return dt.toFormat('MMMM d, yyyy h:mm:ss a ZZZZ');
      // return dt.toISO();
    } catch (error) {
      return `Error: Could not subtract ${amount} ${unit} from ${dateTimeStr}. ${error.message}`;
    }
  }
}

// --- Google Function Calling Structure ---

const dateTimeToolInstance = new DateTimeTool();

// Export the tool object structured for Google Function Calling
export const dateTimeTool = {
  name: 'datetime_tool',
  description: dateTimeToolInstance.description,
  schema: {
    function_declaration: {
      name: 'datetime_tool',
      description: dateTimeToolInstance.description,
      parameters: {
        type: 'OBJECT',
        properties: {
          action: {
            type: 'STRING',
            description: "The specific date/time operation to perform.",
            enum: [
              "getCurrentDateTime",
              "convertToTimeZone",
              "formatDateTime",
              "dateTimeDifference",
              "addTimeToDateTime",
              "subtractTimeFromDateTime"
            ]
          },
          location: {
            type: 'STRING',
            description: "The location for getCurrentDateTime (e.g., 'America/New_York')."
          },
          dateTimeStr: {
            type: 'STRING',
            description: "The date/time string in ISO format for conversion, formatting, difference, add, or subtract operations."
          },
          targetTimeZone: {
            type: 'STRING',
            description: "The target time zone for convertToTimeZone (e.g., 'Europe/London')."
          },
          format: {
            type: 'STRING',
            description: "The Luxon format string for formatDateTime (e.g., 'yyyy-MM-dd HH:mm:ss')."
          },
          startDateTimeStr: {
            type: 'STRING',
            description: "The starting date/time string in ISO format for dateTimeDifference."
          },
          endDateTimeStr: {
            type: 'STRING',
            description: "The ending date/time string in ISO format for dateTimeDifference."
          },
          unit: {
            type: 'STRING',
            description: "The time unit for dateTimeDifference, addTimeToDateTime, or subtractTimeFromDateTime (e.g., 'days', 'hours', 'months')."
          },
          amount: {
            type: 'NUMBER',
            description: "The numerical amount of time for addTimeToDateTime or subtractTimeFromDateTime."
          }
        },
        required: ['action'], // Action is always required to determine which method to call
      },
    },
  },
  /**
   * The executable function of the tool, called by the agent framework.
   * @param {Object} params - Parameters for the tool call, matching the schema.
   * @returns {Promise<string>} - A promise that resolves with the result of the date/time operation.
   */
  call: async (params) => {
    console.log(`🕒 [DATETIME TOOL] Executing datetime_tool with params:`, params);
    const { action, ...actionParams } = params;

    try {
      switch (action) {
        case 'getCurrentDateTime':
          return dateTimeToolInstance.getCurrentDateTime(actionParams);
        case 'convertToTimeZone':
          // Validate required parameters for this action
          if (!actionParams.dateTimeStr || !actionParams.targetTimeZone) {
              return "Error: convertToTimeZone requires 'dateTimeStr' and 'targetTimeZone' parameters.";
          }
          return dateTimeToolInstance.convertToTimeZone(actionParams);
        case 'formatDateTime':
           if (!actionParams.dateTimeStr || !actionParams.format) {
              return "Error: formatDateTime requires 'dateTimeStr' and 'format' parameters.";
          }
          return dateTimeToolInstance.formatDateTime(actionParams);
        case 'dateTimeDifference':
           if (!actionParams.startDateTimeStr || !actionParams.endDateTimeStr) {
              return "Error: dateTimeDifference requires 'startDateTimeStr' and 'endDateTimeStr' parameters.";
          }
          return dateTimeToolInstance.dateTimeDifference(actionParams);
        case 'addTimeToDateTime':
           if (!actionParams.dateTimeStr || actionParams.amount === undefined || !actionParams.unit) {
              return "Error: addTimeToDateTime requires 'dateTimeStr', 'amount', and 'unit' parameters.";
          }
          return dateTimeToolInstance.addTimeToDateTime(actionParams);
        case 'subtractTimeFromDateTime':
           if (!actionParams.dateTimeStr || actionParams.amount === undefined || !actionParams.unit) {
              return "Error: subtractTimeFromDateTime requires 'dateTimeStr', 'amount', and 'unit' parameters.";
          }
          return dateTimeToolInstance.subtractTimeFromDateTime(actionParams);
        default:
          return `Error: Unknown action '${action}'. Please use one of the defined actions.`;
      }
    } catch (error) {
      console.error(`🕒 [DATETIME TOOL] Unexpected error during execution:`, error);
      return `An unexpected error occurred in the datetime tool: ${error.message}`;
    }
  },
};

