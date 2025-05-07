import type { MollyConfiguration } from './common/interfaces/interfaces'

const MollyConfig: MollyConfiguration = {
	global: {
		logging: {
			disabled: process.env.DISABLE_LOGS == 'true',
			logLevel: process.env.LOG_LEVEL || 'info' /* info, success, warn, error, debug */,
			config: {
				displayBadge: true,
				displayDate: false,
				displayFilename: false,
				displayLabel: true,
				displayTimestamp: true
			},
			types: {
				info: {
					badge: 'ⓘ',
					color: 'blue',
					label: 'info'
				}
			}
		},
		env: {
			enabled: ['local-kv-test', 'local-kv-int', 'test', 'int']
		},
		metrics: {
			networkTraffic: {
				URLQuery: ['graphql'],
				threshold_ms: 2000
			}
		}
	},
	modules: [
		{
			name: 'project',
			xray: {
				projectKey: null,
				testPlanKey: null
			}
		}
	]
}

export default MollyConfig
