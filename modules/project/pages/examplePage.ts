import { Page } from '@playwright/test'
import ENV from '../env/env'

export default class ExamplePage {
	readonly page: Page

	constructor(page: Page) {
		this.page = page

	}

	async navigateHere() {
		await this.page.goto(ENV.URL, {
			waitUntil: 'load'
		})
	}
}
