/**
 * Team class for managing multiple agents working together
 */
/**
 * @class Team
 * @classdesc Represents a team of agents.
 */
export class Team {
  /**
   * Create a new team
   * @param {Object} config - Team configuration
   * @param {string} config.name - Team name
   * @param {string} config.description - Team description
   * @param {Object} config.agents - Map of agent names to agent instances
   * @param {Object} config.jobs - Job definitions
   * @param {Array} config.workflow - Order of job execution
   */
  constructor(config) {
    this.name = config.name || 'Unnamed Team';
    this.description = config.description || '';
    this.agents = config.agents || {};
    this.jobs = config.jobs || {};
    this.workflow = config.workflow || [];

    // Debug logging
    console.log('Team constructor called with:');
    console.log('- name:', this.name);
    console.log('- agents:', Object.keys(this.agents));
    console.log('- jobs:', Object.keys(this.jobs));
    console.log('- workflow:', this.workflow);
  }

  /**
   * Add an agent to the team
   * @param {string} name - Agent name
   * @param {Agent} agent - Agent instance
   */
  /**
   * Adds an agent to the team.
   * @param {string} name - The name of the agent.
   * @param {Agent} agent - The agent object.
   */
  addAgent(name, agent) {
    this.agents[name] = agent;
  }

  /**
   * Add a job to the team
   * @param {string} name - Job name
   * @param {Object} job - Job definition
   */
  /**
   * Adds a job to the team.
   * @param {string} name - The name of the job.
   * @param {object} job - The job object.
   */
  addJob(name, job) {
    this.jobs[name] = job;
  }

  /**
   * Define the workflow for the team
   * @param {Array} workflow - Array of job names in execution order
   */
  /**
   * Sets the workflow for the team.
   * @param {object} workflow - The workflow object.
   */
  setWorkflow(workflow) {
    this.workflow = workflow;
  }

  /**
   * Run the team with specific inputs
   * @param {Object} inputs - Input data for the team
   * @param {Object} context - Additional context for the team
   * @returns {Promise<Object>} - Results from all jobs
   */
  /**
   * Runs the team with the given inputs and context.
   * @param {object} inputs - The inputs for the team.
   * @param {object} [context={}] - The context for the team.
   * @returns {Promise<*>} The results of the team's execution.
   */
  async run(inputs = {}, context = {}) {
    console.log(`Starting team run for: ${this.name}`);
    console.log('- inputs:', JSON.stringify(inputs));
    console.log('- context:', Object.keys(context));

    // Initialize results and context
    this.results = {};
    this.context = { ...context };

    console.log(`🚀 Starting team: ${this.name}`);

    // Execute each job in the workflow
    for (const jobName of this.workflow) {
      const job = this.jobs[jobName];

      if (!job) {
        console.error(`Job ${jobName} not found in team ${this.name}`);
        continue;
      }

      console.log(`⏳ Running job: ${jobName}`);

      try {
        // Get the agent for this job
        const agent = this.agents[job.agent];

        if (!agent) {
          throw new Error(`Agent ${job.agent} not found for job ${jobName}`);
        }

        // Create a brief for the job
        const briefId = jobName; // Use the job name as the brief ID
        const brief = {
          title: job.description, // Use the job description as the brief title
          overview: job.description, // Use the job description as the brief overview
        };
        context.agency.createBrief(briefId, brief);

        // Assign the job to the agent
        // Assuming the agency instance is available in the context
        if (!context.agency) {
          throw new Error("Agency instance not found in the context.");
        }
        const agency = context.agency;
        agency.assignJob(briefId, job.agent, 'agent');

        // Prepare the input for the agent
        const jobInput = this.prepareJobInput(job, inputs);

        console.log(`- Agent: ${job.agent}`);
        console.log(`- Job input:`, jobInput);

        // Run the agent with the prepared input
        const result = await agent.run(jobInput, this.context);

        // Store the result
        this.results[jobName] = result;

        // Update the context with the result
        this.context[jobName] = result;

        console.log(`✅ Job ${jobName} completed`);
      } catch (error) {
        console.error(`❌ Job ${jobName} failed:`, error);
        this.results[jobName] = { error: error.message };
      }
    }

    console.log(`🏁 Team ${this.name} completed`);
    return this.results;
  }

  /**
   * Prepare the input for a job
   * @param {Object} job - Job definition
   * @param {Object} initialInputs - The initial inputs for the entire workflow
   * @returns {Object} - Prepared input for the agent
   */
  /**
   * Prepares the input for a job.
   * @param {object} job - The job object.
   * @param {object} initialInputs - The initial inputs for the job.
   * @returns {object} The prepared input.
   */
  prepareJobInput(job, initialInputs) {
    const jobInputs = {};

        // Process each input defined in the job's configuration
        for (const [key, value] of Object.entries(job.inputs)) {
            if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                const placeholder = value.substring(2, value.length - 2); // Remove {{ and }}

                if (placeholder.startsWith('initialInputs.')) {
                    const inputKey = placeholder.substring('initialInputs.'.length);
                    jobInputs[key] = initialInputs[inputKey];
                } else {
                    // Assume it's a reference to a previous job's output, e.g., "jobId.outputKey"
                    const [sourceJobName, outputKey] = placeholder.split('.');
                    if (this.results[sourceJobName]) {
                        if (outputKey && this.results[sourceJobName][outputKey] !== undefined) {
                            jobInputs[key] = this.results[sourceJobName][outputKey];
                        } else if (!outputKey) {
                            // If no outputKey is specified, pass the entire job result
                            jobInputs[key] = this.results[sourceJobName];
                        } else {
                            console.warn(`Warning: Output key '${outputKey}' not found in job '${sourceJobName}' for input '${key}' in job '${job.name}'.`);
                            jobInputs[key] = ''; // Assign a default empty value
                        }
                    } else {
                        console.warn(`Warning: Output from job '${sourceJobName}' not found for input '${key}' in job '${job.name}'.`);
                        jobInputs[key] = ''; // Assign a default empty value
                    }
                }
            } else {
                // If it's not a placeholder, it's a direct value from the initial inputs
                jobInputs[key] = initialInputs[key] || value;
            }
        }
    
    // Combine the job description and the resolved inputs to form the final prompt
    let finalInput = `${job.description}\n\n`;
    for (const [key, value] of Object.entries(jobInputs)) {
      finalInput += `${key}: ${value}\n`;
    }

    return finalInput;
  }

  /**
   * Process a template string with variables
   * @param {string} template - Template string with {variable} placeholders
   * @param {Object} variables - Variables to replace in the template
   * @returns {string} - Processed template
   */
  /**
   * Processes a template with variables.
   * @param {string} template - The template string.
   * @param {object} variables - The variables to substitute.
   * @returns {string} The processed template.
   */
  processTemplate(template, variables) {
    return template.replace(/{([^}]+)}/g, (match, variable) => {
      return variables[variable] || '';
    });
  }
}
