/**
 * Utility functions for working with workflow definitions
 */

/**
 * Transforms a team's workflow definition by expanding string-based steps into full workflow objects
 * @param {Object} team - The team object containing workflow and jobs
 * @param {Object} agency - The agency object containing briefs
 * @param {string} briefId - The ID of the brief to use
 * @param {Object} context - Additional context to include in inputs and briefs
 * @returns {Array} The transformed workflow definition
 */
export function transformWorkflowDefinition(team, agency, briefId, context = {}) {
  return team.workflow.map(step => {
    if (typeof step === 'string') {
      const job = team.jobs[step];
      return {
        jobId: step,
        assigneeId: job.agent,
        assigneeType: 'agent',
        inputs: {
          ...job.inputs,
          ...context
        },
        brief: {
          title: job.description,
          overview: job.description,
          objective: job.description,
          ...agency.brief[briefId],
          ...context
        }
      };
    }
    return step;
  });
}
