import { Page, Locator } from '@playwright/test'

export default class LoginPage {
	readonly page: Page
	readonly externalUser_emailAddressTextbox: Locator
	readonly externalUser_passwordTextbox: Locator
	readonly externalUser_signInButton: Locator

	constructor(page: Page) {
		this.page = page
		this.externalUser_emailAddressTextbox = this.page.getByPlaceholder('Username')
		this.externalUser_passwordTextbox = this.page.getByPlaceholder('Password')
		this.externalUser_signInButton = this.page.getByRole('button', { name: 'Login' })
	}

	async navigateHere(): Promise<void> {
		await this.page.goto(process.env.URL, { waitUntil: 'domcontentloaded' })
	}

	async loginForExternalUser(email: string, password: string): Promise<void> {
		await this.externalUser_emailAddressTextbox.fill(email)
		await this.externalUser_passwordTextbox.fill(password)
		await this.externalUser_signInButton.click()
	}

	async login(
		email: string,
		password: string,
		waitForLoadState?: 'load' | 'domcontentloaded' | 'networkidle'
	): Promise<void> {
		await this.loginForExternalUser(email, password)
		if (waitForLoadState) await this.page.waitForLoadState(waitForLoadState)
	}
}
