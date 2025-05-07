import { exit } from 'process'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import Metrics from './metricsIntegration'
import MollyHelper from './mollyHelper'

interface Params {
	help: boolean
	module: string
	env: 'TEST' | 'INT'
	mergeNetworkTraces: boolean
	renderAssertReport: boolean
}

// Command-line options
const optionDefinitions = [
	{
		name: 'help',
		alias: 'h',
		type: Boolean,
		description: 'Shows help'
	},
	{
		name: 'module',
		alias: 'm',
		type: String,
		description: 'Module name (mandatory)'
	},
	{
		name: 'env',
		alias: 'e',
		type: String,
		description: 'Environment (e.g., TEST, INT) (mandatory)'
	},
	{
		name: 'mergeNetworkTraces',
		type: Boolean,
		defaultValue: false,
		description: 'Merge browser traces'
	}
]

// Function to display the usage instructions
function showUsage(errors: string[] = []) {
	const sections = [
		{
			header: 'Post-Processing',
			content:
				'Executes post-processing tasks such as merging/generating metrics.'
		},
		{
			header: 'Options',
			optionList: optionDefinitions.map(option => ({
				name: option.name,
				alias: option.alias,
				typeLabel: `{underline ${option.type.name}}`,
				description: option.description
			}))
		}
	]

	if (errors.length > 0) {
		sections.unshift({
			header: 'Errors',
			content: errors.join('\n')
		})
	}

	console.warn(commandLineUsage(sections))
	exit(1)
}

// Command-line arguments
let options: Params
try {
	options = <Params>commandLineArgs(optionDefinitions)

	if (options.help) {
		showUsage()
	}

	// Mandatory parameters
	const errors: string[] = []
	if (!options.module || typeof options.module !== 'string') {
		errors.push('Parameter "module" is mandatory and has to match one of the module names in mollyConfig.')
	}
	if (!options.env || typeof options.env !== 'string' || !['test', 'int'].includes(options.env.toLowerCase())) {
		errors.push('Parameter "env" is mandatory and must be "test" or "int".')
	}
	if (errors.length > 0) {
		showUsage(errors)
	}
} catch (error: any) {
	showUsage([error.message])
}

// -----------------------------------------------------------------------------
// Main processing class

class PostProcesses {
	private metrics: Metrics

	constructor() {
		this.metrics = new Metrics()
	}

	/**
	 * Executes post-processing tasks based on provided parameters.
	 */
	async process(
		module: string,
		env: 'TEST' | 'INT',
		mergeNetworkTraces: boolean
	): Promise<void> {

		// Ensure module and environment are valid strings
		if (typeof module !== 'string' || typeof env !== 'string') {
			MollyHelper.log.warn(`Invalid parameters provided.`, `PostProcesses > process`)
			showUsage()
		}

		// Merge mergeNetworkTraces if requested
		if (mergeNetworkTraces) {
			try {
				this.metrics.mergeNetworkTraces()
			} catch (error) {
				MollyHelper.log.warn(`Metrics error: ${error}`, `PostProcesses > process`)
			}
		}
	}
}

// -----------------------------------------------------------------------------
// Main execution

MollyHelper.log.info(`[POST PROCESSES] Gathering info. Please wait...`, `PostProcesses`)

const postProcesses = new PostProcesses()

postProcesses
	.process(
		options.module,
		options.env,
		options.mergeNetworkTraces
	)
	.then(() => {
		MollyHelper.log.success(`[POST PROCESSES] Process completed`, `PostProcesses`)
	})
	.catch(error => {
		MollyHelper.log.error(error, `PostProcesses`)
	})
