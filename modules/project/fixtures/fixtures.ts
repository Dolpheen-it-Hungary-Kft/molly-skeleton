import { test as baseTest, Page, Browser } from '@playwright/test'
import Utils from '../utils/utils'
import Metrics from '../../../common/utils/metricsIntegration'
import BackendService from '../services/backendService'
import ExamplePage from '../pages/examplePage'

const metrics = new Metrics()

class User {
	page: Page
	examplePage: ExamplePage
	utils: Utils

	constructor(page: Page) {
		this.page = page
		this.examplePage= new ExamplePage(page)
	}

	static async create(browser: Browser) {
		const context = await browser.newContext({
			storageState: 'storageStates/userStorageState.json'
		})
		const page = await context.newPage()
		metrics.monitorNetworkTraffic(page, 'User')
		return new User(page)
	}
}

const test = baseTest.extend<{
	User: User
	backendService: BackendService
	utils: Utils
}>({
	User: async ({ browser }, use) => {
		await use(await User.create(browser))
	},
	backendService: async ({ request }, use) => {
		await use(new BackendService(request))
	},
	// eslint-disable-next-line no-empty-pattern
	utils: async ({}, use) => {
		await use(new Utils())
	}
})

export default test
export const expect = test.expect
