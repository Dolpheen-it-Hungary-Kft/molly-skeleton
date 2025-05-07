import type { PlaywrightTestConfig } from '@playwright/test'
import { devices } from '@playwright/test'

const xrayOptions = {
	// Whether to add <properties> with all annotations; default is false
	embedAnnotationsAsProperties: true,

	// By default, annotation is reported as <property name='' value=''>.
	// These annotations are reported as <property name=''>value</property>.
	textContentAnnotations: ['test_description', 'testrun_comment'],

	// This will create a "testrun_evidence" property that contains all attachments. Each attachment is added as an inner <item> element.
	// Disables [[ATTACHMENT|path]] in the <system-out>.

	embedAttachmentsAsProperty: 'testrun_evidence',

	// Where to put the report.
	outputFile: './xml/xray-report.xml'
}

const config: PlaywrightTestConfig = {
	/* Default timeout for actions and assertions */
	expect: {
		timeout: 10_000
	},
	reporter: [
		['junit', xrayOptions],
		['html', { open: 'never' }],
		['json', { outputFile: 'test-results.json' }],
		['list']
	],
	use: {
		ignoreHTTPSErrors: true,
		actionTimeout: 10000,
		timezoneId: 'Europe/Vienna',
		screenshot: 'only-on-failure',
		video: 'off',
		trace: { mode: 'on-first-retry', screenshots: false, attachments: false }
	},

	globalSetup: `common/utils/globalSetup.ts`,

	projects: [
		{
			name: 'project-setup',
			testDir: './modules/project/tests/setup/',
			testMatch: 'project.setup.ts',
			retries: 0,
			timeout: 100 * 1000,
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1440, height: 1080 }
			}
		},
		{
			name: 'project',
			testDir: './modules/project/tests/',
			testMatch: '**.spec.ts',
			retries: 0,
			timeout: 100 * 1000,
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1440, height: 1080 }
			},
			dependencies: ['project-setup']
		}
	]
}

export default config
