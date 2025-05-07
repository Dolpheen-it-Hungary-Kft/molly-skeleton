import { test } from '@playwright/test'
import MollyHelper from '../../../../common/utils/mollyHelper'

test('Example user setup', async ({ browser }, testInfo) => {
	testInfo.annotations.push({ type: 'test_key', description: 'setup-test-key' })

	await MollyHelper.loginAndSaveStorageState(
		browser,
		'user',
		process.env.USER_NAME,
		process.env.USER_PASSWORD
	)
})
