/* eslint-disable no-useless-escape */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import MollyConfig from '../../molly.config'
import MollyHelper from './mollyHelper'

function loadEnv(stage: string) {
	const stagePath = path.resolve(`./env/`)
	const modules = fs.readdirSync(stagePath)
	const mergedEnv = {}

	if (!MollyConfig.global.env.enabled.includes(stage.toLowerCase())) {
		MollyHelper.log.error(
			`Invalid environment: ${stage}. Please include enabled test_env=<ENV NAME> in your command: ${MollyConfig.global.env.enabled.join(', ')}`,
			`Global Setup > loadEnv`
		)
	}

	if (stage.includes('local')) {
		stage = stage.split('-')[0]
	}

	for (const module of modules) {
		const modulePath = path.join(stagePath, module)
		const envFile = path.join(`${modulePath}`, `.env.${stage.toLowerCase()}`)

		if (!fs.existsSync(envFile)) {
			MollyHelper.log.warn(`"${stage}" .env file not found for ${module}`, `Global Setup > loadEnv`)
			continue
		}

		const envConfig = dotenv.parse(fs.readFileSync(envFile))
		Object.assign(mergedEnv, envConfig)
	}
	Object.assign(process.env, mergedEnv)
}

function cleanUpMetrics() {
	try {
		const metrics_files = fs.readdirSync(path.resolve(path.join('./common/metrics/')))
		// Deleting old metrics
		for (const metric of metrics_files) {
			fs.unlinkSync(`./common/metrics/${path.join(metric)}`)
		}
		MollyHelper.log.success(`Deleted old metrics`, `Global Setup > cleanUpMetrics`)
	} catch (error) {
		MollyHelper.log.warn(`Metrics folder was not found. Creating in root.`, `Global Setup > cleanUpMetrics`)
		fs.mkdirSync('./common/metrics/')
	}
}

async function globalSetup() {

	// Creating storageStates directory if missing
	MollyHelper.createStorageStatesDirectoryIfMissing()

	// Merging envs
	loadEnv(process.env.test_env)

	// Cleanup task for obsolete metrics
	cleanUpMetrics()
}

export default globalSetup
