import { Browser, expect, Locator, Page, TestInfo } from '@playwright/test'
import { parse } from 'csv-parse/sync' // This will be used to parse CSV file
import * as xml2js from 'xml2js'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import * as crypto from 'crypto'
import * as xlsx from 'xlsx'
import LoginPage from '../pages/loginPage'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { StorageState } from '../interfaces/interfaces'
import lockfile from 'proper-lockfile'
import { Signale } from 'signale'
import MollyConfig from '../../molly.config'

const PATH_TO_STORAGE_STATES_DIRECTORY = path.join(__dirname, '/../../storageStates')
const STORAGE_STATE_FILE_NAME = 'StorageState.json'

export default class MollyHelper {
	/**
	 * Reads and parses a JSON file.
	 *
	 * @param {string} pathPlusFileName - The file path of the JSON file to be read.
	 * @returns {any} The parsed JSON object from the file.
	 *
	 * This function reads the contents of a file at the given path and parses it as JSON. It uses
	 * `fs.readFileSync` to read the file synchronously with 'utf8' encoding, ensuring proper handling
	 * of text data. This is useful for loading configuration data or other structured information
	 * stored in JSON files.
	 */
	static readJsonFile(pathPlusFileName: string): any {
		try {
			return JSON.parse(fs.readFileSync(pathPlusFileName, 'utf8'))
		} catch (error) {
			MollyHelper.logger.error(`Failed to read JSON file: ${error}`, `MollyHelper > readJsonFile`)
		}
	}

	/**
	 * Writes data to a JSON file at the specified path.
	 *
	 * @param {string} pathPlusFileName - The full file path including the filename where the data should be saved.
	 * @param {any} data - The data to be written to the file.
	 */
	static writeJsonFile(pathPlusFileName: string, data: any): void {
		try {
			fs.writeFileSync(pathPlusFileName, JSON.stringify(data))
			MollyHelper.logger.success(`File created ${pathPlusFileName}`, `MollyHelper > writeJsonFile`)
		} catch (error) {
			MollyHelper.logger.error(`Failed to write JSON file: ${error}`, `MollyHelper > writeJsonFile`)
		}
	}

	/**
	 * Reads and parses a CSV file from the specified module's resources directory.
	 *
	 * @param {string} module - The name of the module.
	 * @param {string} filePathFromResources - The relative file path from the resources directory.
	 * @returns {Promise<any[]>} A promise that resolves to an array of parsed records.
	 * @throws {Error} If the file cannot be read or parsed.
	 */
	static async readCsvFile(module: string, filePathFromResources: string): Promise<any[]> {
		const fullPath = path.join(__dirname, `../../modules/${module}/services/resources/${filePathFromResources}`)
		const readFile = util.promisify(fs.readFile)
		try {
			const csvString = await readFile(fullPath, { encoding: 'utf8' })
			const records = parse(csvString, {
				columns: true, // Automatically infer columns from the first row
				skip_empty_lines: true
			})
			return records
		} catch (error) {
			MollyHelper.logger.error(
				`Failed to read or parse CSV file at ${fullPath}: ${error.message}`,
				`MollyHelper > readCsvFile`
			)
		}
	}

	/**
	 * Generates a random string of a specified length.
	 * @param length The length of the string.
	 * @returns A random string.
	 */
	static generateRandomString(length: number): string {
		return crypto.randomBytes(length).toString('hex').slice(0, length)
	}

	/**
	 * Wait for a response defined by GraphQL operation name
	 * @param operationName  GraphQL operation name where you have to wait for its responses
	 * @param page current page Object.
	 *
	 * Usage:
	 *
	 * 	- const event = mollyHelper.waitForResponseByOperationName(PlatformPortalAdmin.EnviromentPage.page, 'DeactivateEnvironment')
	 *	- await PlatformPortalAdmin.EnviromentPage.ConfirmDeactivataiton.click()
	 *	- await event
	 */
	static async waitForResponseByOperationName(page: Page, operationName: string): Promise<any> {
		let result: any
		await page.waitForEvent('requestfinished', async request => {
			if (request.url().includes('graphql')) {
				const requestBody = await request.postDataJSON()
				if (requestBody?.operationName === operationName) {
					MollyHelper.log.success(
						`Caught finished event: ${operationName}`,
						`MollyHelper > waitForResponseByOperationName`
					)
					const response = await request.response()
					const responseBody = await response.json()
					result = responseBody
					return responseBody
				}
			}
		})
		return result
	}

	/**
	 * Creates a delay for the specified duration.
	 *
	 * @param {number} ms - The duration of the delay in milliseconds.
	 * @returns {Promise<void>} A promise that resolves after the specified delay.
	 */
	static async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	/**
	 * Reads and parses the first sheet of an Excel file.
	 *
	 * @param {string} path - The file path to the Excel file.
	 * @returns {Promise<any[]>} A promise that resolves to an array of objects representing the parsed Excel sheet.
	 */
	static async readExcel(path: string): Promise<any> {
		const workbook = xlsx.readFile(path)
		const sheet = workbook.Sheets[workbook.SheetNames[0]]
		const jsonSheet = xlsx.utils.sheet_to_json(sheet)
		return jsonSheet
	}

	/**
	 * Reads an XML file and returns its content as a string.
	 * @param {string} xmlPath - The path to the XML file.
	 * @returns {Promise<string>} The content of the XML file.
	 */
	static async readXml(xmlPath: string): Promise<string> {
		try {
			const xmlFilePath = path.join(xmlPath)
			return fs.readFileSync(xmlFilePath, 'utf-8')
		} catch (error) {
			MollyHelper.logger.error(`Error while reading XML file: ${error}`, `MollyHelper > readXml`)
		}
	}

	/**
	 * Parses an XML string into a JavaScript object.
	 * @param {string} xmlContent - The XML content as a string.
	 * @returns {Promise<any>} The parsed XML content as a JavaScript object.
	 */
	static async parseXml(xmlContent: any): Promise<any> {
		try {
			const parser = new xml2js.Parser()
			return await parser.parseStringPromise(xmlContent)
		} catch (error) {
			MollyHelper.logger.error(`Error while parsing XML file: ${error}`, `MollyHelper > parseXml`)
		}
	}

	/**
	 * Builds an XML string from a JavaScript object.
	 * @param {any} xmlData - The JavaScript object representing the XML data.
	 * @returns {Promise<string>} The XML content as a string.
	 */
	static async buildXml(xmlData: any): Promise<string> {
		try {
			const builder = new xml2js.Builder()
			return builder.buildObject(xmlData)
		} catch (error) {
			MollyHelper.logger.error(`Error while building XML file: ${error}`, `MollyHelper > buildXml`)
		}
	}

	/**
	 * Generates a random integer within a specified range.
	 *
	 * @param {number} min - The lower bound of the range (inclusive).
	 * @param {number} max - The upper bound of the range (exclusive).
	 * @returns {number} A random integer between the min and max values.
	 */
	static getRandomNumber(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min) + min)
	}

	/**
	 * Modifies requests sent from the browser for a specific GraphQL operation.
	 *
	 * This function intercepts requests to the GraphQL endpoint, modifies the request
	 * headers or body based on the specified action, and then continues the request.
	 *
	 * @param {object} page - The page instance.
	 * @param {string} operationName - The name of the GraphQL operation to intercept.
	 * @param {string} action - The action to perform on the request. Can be 'deleteHeader' or 'replaceBody'.
	 * @param {string} [headerName] - The name of the header to delete (required if action is 'deleteHeader').
	 * @param {string} [requestBodyFilePath] - The file path to the new request body (required if action is 'replaceBody').
	 * @returns {Promise<object>} - A promise that resolves with the response to the modified request.
	 * @throws Will log errors if there are issues reading or parsing the request body file.
	 */
	static async modifyRequestSentFromBrowser(page, operationName, action, headerName, requestBodyFilePath) {
		let result
		await page.route('**/graphql', async route => {
			MollyHelper.logger.success(
				`Caught request for operation: ${operationName}`,
				`MollyHelper > modifyRequestSentFromBrowser`
			)
			const requestBody = route.request().postDataJSON()

			if (requestBody?.operationName === operationName) {
				const headers = { ...route.request().headers() }
				let newRequestBody = requestBody
				switch (action) {
					case 'deleteHeader':
						if (headerName) {
							delete headers[headerName]
						} else {
							MollyHelper.logger.warn(
								`Header name not specified for deletion.`,
								`MollyHelper > modifyRequestSentFromBrowser`
							)
						}
						break

					case 'replaceBody':
						if (requestBodyFilePath) {
							try {
								const fileContent = fs.readFileSync(requestBodyFilePath, 'utf8')
								newRequestBody = JSON.parse(fileContent)
							} catch (error) {
								MollyHelper.logger.warn(
									`Error reading or parsing the request body file: ${error}`,
									`MollyHelper > modifyRequestSentFromBrowser`
								)
							}
						} else {
							MollyHelper.logger.warn(
								`Request body file path not specified.`,
								`MollyHelper > modifyRequestSentFromBrowser`
							)
						}
						break

					default:
						MollyHelper.logger.warn(
							`Invalid action: ${action}`,
							`MollyHelper > modifyRequestSentFromBrowser`
						)
						break
				}

				await route.continue({
					headers: headers,
					method: route.request().method(),
					postData: JSON.stringify(newRequestBody)
				})

				// Wait for the response to the request
				result = route.request().response()
			} else {
				route.continue()
			}
		})

		return result
	}

	/**
	 * Asserts that all static and instance properties of the provided environment instance are set correctly.
	 *
	 * This function checks if any static or instance properties of the `environmentInstance` object
	 * are `undefined` or an empty string. If any invalid properties are found, an error is thrown
	 * listing the names of these properties.
	 *
	 * @param {object} environmentInstance - The instance of the environment object to verify.
	 * @throws Will throw an error if any environment variable is `undefined` or an empty string.
	 */
	static async verifyEnvironmentVariables(environmentInstance: object): Promise<void> {
		const staticProperties = Object.getOwnPropertyNames(environmentInstance.constructor).filter(
			prop => typeof environmentInstance.constructor[prop] !== 'function'
		)
		const instanceProperties = Object.getOwnPropertyNames(environmentInstance).filter(
			prop => typeof environmentInstance[prop] !== 'function'
		)

		const invalidStaticProperties = staticProperties.filter(
			prop => environmentInstance.constructor[prop] === undefined || environmentInstance.constructor[prop] === ''
		)
		const invalidInstanceProperties = instanceProperties.filter(
			prop => environmentInstance[prop] === undefined || environmentInstance[prop] === ''
		)

		const invalidProps = [...invalidStaticProperties, ...invalidInstanceProperties].filter(
			prop => prop !== 'name' && prop !== 'length' && prop !== 'prototype'
		)

		if (invalidProps.length > 0) {
			MollyHelper.logger.warn(
				`
				\n\nInvalid or missing values detected in the following variables:
				\n\t${invalidProps.join('\n\t')}
				`,
				`MollyHelper > verifyEnvironmentVariables`
			)
		} else {
			MollyHelper.log.success(`All variables are set.`, `MollyHelper > verifyEnvironmentVariables`)
		}
	}

	/**
	 * Retrieves the module name if the function is called from a file in the "modules" directory.
	 *
	 * @returns {string | null} The name of the module if found, or null if not found.
	 */
	static getModuleName(): string | null {
		try {
			const fullPath = new Error().stack.split('\n').find(line => line.includes('modules')) || null

			if (fullPath) {
				let parts: string[]
				switch (process.platform) {
					case 'win32':
						parts = fullPath.split('\\')
						break
					case 'linux':
						parts = fullPath.split('/')
						break
					case 'darwin':
						MollyHelper.log.warn(`MacOS detected, this could fail.`, `MollyHelper > getModuleName`)
						parts = fullPath.split('/')
						break
				}

				const moduleIndex = parts.indexOf('modules')
				return parts[moduleIndex + 1] || null
			}

			return null
		} catch {
			return null
		}
	}

	/**
	 * Checks whether a dialog is visible. If so, it closes the dialog.
	 *
	 * @param {Locator} dialog - The dialog locator, this should work in most cases: page.getByRole('dialog')
	 * @param {Locator} closeDialogButton - The closeDialogButton locator, this should work when dialog has only one button: page.getByRole('dialog').getByRole('button')
	 * 										If dialog has more than one button, button text is required in locator.
	 * @param {Locator[]} locatorsPossiblyHiddenByDialog - The locators that are possibly hidden by the dialog.
	 * 													   This is required to check very quickly whether the dialog OR the locatorPossiblyHiddenByDialog is visible.
	 * @param timeout
	 */
	static async closeDialogIfPresent(
		dialog: Locator,
		closeDialogButton: Locator,
		locatorsPossiblyHiddenByDialog: Locator[],
		timeout = 10_000
	): Promise<void> {
		await Promise.race([
			dialog.waitFor({ timeout: timeout }),
			...locatorsPossiblyHiddenByDialog.map(locator => locator.waitFor({ timeout: timeout }))
		])

		if (await dialog.isVisible()) {
			await closeDialogButton.click()
		}

		await expect(dialog).toBeHidden()
		await expect(closeDialogButton).toBeHidden()
	}

	/**
	 * Performs user login and saves storage state
	 *
	 * @param {Browser} browser - The browser fixture
	 * @param {string} role - The name of the user role
	 * @param {string} email - The email address of the user
	 * @param {string} password - The password of the user. If omitted, a general user password stored in Azure Key Vault is used.
	 */
	static async loginAndSaveStorageState(
		browser: Browser,
		role: string,
		email: string,
		password: string = process.env['password-generalTestUser']
	): Promise<void> {
		const context = await browser.newContext({ locale: 'en-GB' })
		const page = await context.newPage()
		const loginPage = new LoginPage(page)

		await loginPage.navigateHere()
		await loginPage.login(email, password)


		const storageState: StorageState = await loginPage.page.context().storageState()
		MollyHelper.writeJsonFile(MollyHelper.pathToStorageStateFile(role), storageState)
		process.env[MollyHelper.getTokenVariableName(role)] = storageState.bearer_token
	}

	/**
	 * Converts a role name to a token variable name
	 *
	 * @param role The name of the user role
	 * @returns The name of the token variable
	 */
	static getTokenVariableName(role: string): string {
		return `${role.toUpperCase()}_TOKEN`
	}

	/**
	 * Create storage states directory, if directory is missing.
	 *
	 */
	static createStorageStatesDirectoryIfMissing(): void {
		if (!fs.existsSync(PATH_TO_STORAGE_STATES_DIRECTORY)) {
			fs.mkdirSync(PATH_TO_STORAGE_STATES_DIRECTORY)
		}
	}

	/**
	 * Creates storage state file for given role, if file is missing.
	 *
	 * @param {string} role - The name of the user role
	 */
	static createEmptyStorageStateFileIfMissing(role: string): void {
		this.createStorageStatesDirectoryIfMissing()

		if (!fs.existsSync(MollyHelper.pathToStorageStateFile(role))) {
			MollyHelper.writeJsonFile(MollyHelper.pathToStorageStateFile(role), {})
		}
	}

	/**
	 * Verifies that storage state is present
	 *
	 * @param {string} role - The name of the user role
	 */
	static verifyStorageState(role: string): void {
		const storageState = JSON.parse(
			JSON.stringify(MollyHelper.readJsonFile(MollyHelper.pathToStorageStateFile(role)))
		)
		expect(storageState.bearer_token).toBeTruthy()
	}

	/**
	 * Returns path to storage state file from file system root, including the file name
	 *
	 * @param {string} role - The name of the user role
	 * @returns {string} - The path including the file name
	 */
	static pathToStorageStateFile(role: string): string {
		return path.join(PATH_TO_STORAGE_STATES_DIRECTORY, `${role}${STORAGE_STATE_FILE_NAME}`)
	}

	/**
	 * Reloads given page until given locator is visible or not visible
	 *
	 * @param {Locator} locator - The locator to be asserted
	 * @param {boolean} shouldBeVisible - should the locator be visible or not?
	 * @param {Page} page - the page object that will be reloaded
	 * @param {number} timeout - maximum amount of time until locator must be visible
	 * @param {number[]} intervals - time intervals between assertions
	 */
	static async reloadPageUntilLocatorIsVisibleOrNotVisible(
		locator: Locator,
		shouldBeVisible: boolean,
		page: Page,
		timeout: number,
		intervals: number[]
	): Promise<void> {
		await expect(async () => {
			await page.reload({ waitUntil: 'domcontentloaded' })
			await expect(locator).toBeVisible({ visible: shouldBeVisible })
		}).toPass({ timeout: timeout, intervals: intervals })
	}


	/**
	 * Executes an Axios HTTP request with retry logic and custom error handling.
	 *
	 * @param {AxiosRequestConfig} config - The Axios request configuration, including URL, method, headers, etc.
	 * @param {number} [timeout=10000] - The total timeout for the operation in milliseconds. If exceeded, the request may be interrupted.
	 * @param {number[]} [retryIntervals=[1000, 2000, 3000]] - An array defining the intervals (in milliseconds) between retry attempts.
	 * @param {boolean} [throwError=true] - Determines error handling behavior:
	 *   - If `true`: An error will be thrown when the request fails after all retries.
	 *   - If `false`: The method will return the last received Axios response, even if the status code is >= 400.
	 * @returns {Promise<AxiosResponse>} - A promise that resolves to the Axios response object upon success, or the last response received upon failure when `throwError` is false.
	 *
	 * @throws {Error} Throws an error under the following conditions:
	 *   - When `throwError = false`, HTTP errors (status >= 400) are not thrown. Instead, the response is returned for further inspection.
	 *   - When `throwError = true`, detailed error information including HTTP status, status text, and response data is included in the error message.
	 *
	 * @example
	 * const response = await MollyHelper.axiosRequest(
	 *     { method: 'get', url: 'https://api.example.com/data' },
	 *     15000,
	 *     [1000, 2000, 4000],
	 *     false
	 * );
	 *
	 * if (response.status >= 400) {
	 *     console.warn(`Request failed with status: ${response.status}`);
	 * } else {
	 *     console.log('Data received:', response.data);
	 * }
	 */
	static async axiosRequest(
		config: AxiosRequestConfig,
		timeout = 10000,
		retryIntervals: number[] = [1000, 2000, 3000],
		throwError = true
	): Promise<AxiosResponse> {
		let response: AxiosResponse
		let attempt = 0
		const axiosConfig: AxiosRequestConfig = { ...config, validateStatus: () => true }

		await expect(async () => {
			attempt++
			MollyHelper.log.info(
				`[${attempt}] | ${axiosConfig.method} | -> ${axiosConfig.url}`,
				`MollyHelper > axiosRequest`
			)
			response = await axios(axiosConfig)
			expect(response.status).toBeLessThan(400)
		})
			.toPass({
				intervals: retryIntervals,
				timeout: timeout
			})
			.catch(() => {
				if (!response)
					MollyHelper.log.error(
						`No response received. The request might be interrupted by the timeout. (Check timeout parameter. Current: ${timeout}ms)`,
						`MollyHelper > axiosRequest`
					)

				if (throwError)
					MollyHelper.log.error(
						`\nStatus: ${response.status} ${response.statusText} ${response.data ? `\nResponse data: \n${JSON.stringify(response.data, null, 2)}` : ''}`,
						`MollyHelper > axiosRequest`
					)
			})

		return response
	}

	/**
	 * Downloads a file from the specified configuration and saves it to the given file path and name.
	 *
	 * @param {AxiosRequestConfig} config - The Axios request configuration for downloading the file.
	 * @param {string} filepath - The directory where the file will be saved.
	 * @param {string} filename - The name of the file to save, including the extension.
	 * @returns {Promise<string>} - A promise that resolves to the full path of the downloaded file.
	 * @throws {Error} - Throws an error if the download or file saving fails.
	 */
	static async downloadFile(config: AxiosRequestConfig, filepath: string, filename: string): Promise<string> {
		let fullPath: string
		config.responseType = 'stream'

		try {
			const response = await axios(config)
			if (response.status < 200 || response.status >= 300) {
				MollyHelper.log.error(`Invalid response status: ${response.status}`, `MollyHelper > downloadFile`)
			}

			if (!path.extname(filename)) {
				const { 'content-disposition': disposition, 'content-type': type } = response.headers
				filename =
					disposition?.match(/filename="(.+?)"/)?.[1] ||
					(type && `${filename}.${type.split('/').pop()}`) ||
					null
				if (!filename)
					MollyHelper.log.error(
						`Unable to determine file extension from headers.`,
						`MollyHelper > downloadFile`
					)
			}
			fullPath = path.resolve(filepath, filename)

			await new Promise<void>((resolve, reject) =>
				response.data.pipe(fs.createWriteStream(fullPath)).on('finish', resolve).on('error', reject)
			)
			if (fs.statSync(fullPath).size === 0)
				MollyHelper.log.error(`Downloaded file is empty: ${fullPath}`, `MollyHelper > downloadFile`)

			MollyHelper.log.success(`File downloaded successfully to ${fullPath}`, `MollyHelper > downloadFile`)
			return fullPath
		} catch (error) {
			// Clean up in case of error
			if (fullPath && fs.existsSync(fullPath)) fs.unlinkSync(fullPath)
			MollyHelper.log.error(`Failed to download file: ${error.message}`, `MollyHelper > downloadFile`)
		}
	}

	/**
	 * Modifies the GraphQL response intercepted by the browser and replaces it based on specified conditions.
	 *
	 * @param {Page} page - The Playwright `Page` object to interact with the browser.
	 * @param {string} route - The route pattern to match GraphQL requests (e.g., '<any>/graphql').
	 * @param {string} operationName - The specific GraphQL operation name to intercept.
	 * @param {string} action - The action to perform on the response. Supported actions: ['replaceBody'].
	 * @param {string} responseBodyFilePath - The file path containing the response body to use for replacement (if applicable).
	 * @param {Function} triggerRequest - A function that triggers the GraphQL request. Must be provided.
	 * @returns {Promise<Response>} - The intercepted and modified response.
	 * @throws {Error} - Throws an error if `triggerRequest` is not a function, if the action is invalid, or if required parameters are missing.
	 *
	 * @example
	 * await modifyGraphqlResponseReceivedByBrowser(page, '<any>/graphql', 'GetUser', 'replaceBody', './response.json', async () => {
	 *   await page.click('#fetch-user')
	 * })
	 */
	static async modifyGraphqlResponseReceivedByBrowser(
		page: Page,
		route: string,
		operationName: string,
		action: string,
		responseBodyFilePath: string,
		triggerRequest: any
	) {
		if (typeof triggerRequest !== 'function') {
			MollyHelper.log.error(
				`A triggerRequest function must be provided.`,
				`MollyHelper > modifyGraphqlResponseReceivedByBrowser`
			)
		}

		// Validate action
		const validActions = ['replaceBody']
		if (!validActions.includes(action)) {
			MollyHelper.log.error(
				`Invalid action specified. Valid actions are: ${validActions.join(', ')}`,
				`MollyHelper > modifyGraphqlResponseReceivedByBrowser`
			)
		}

		// Set up the route handler to intercept responses
		await page.route(route, async (route, request) => {
			// Continue the request and get the original response
			const response = await route.fetch()
			const requestBody = request.postDataJSON()

			// Check if the operationName matches
			if (requestBody?.operationName === operationName) {
				let responseBody = await response.json()

				try {
					switch (action) {
						case 'replaceBody':
							if (responseBodyFilePath) {
								const fileContent = fs.readFileSync(responseBodyFilePath, 'utf8')
								responseBody = JSON.parse(fileContent)
							} else {
								MollyHelper.log.error(
									`Response body file path not specified.`,
									`MollyHelper > modifyGraphqlResponseReceivedByBrowser`
								)
							}
							break

						// Add more actions here if needed
						default:
							MollyHelper.log.error(
								`Invalid action: ${action}`,
								`MollyHelper > modifyGraphqlResponseReceivedByBrowser`
							)
					}

					// Fulfill the request with the modified response
					await route.fulfill({
						status: response.status(),
						headers: response.headers(),
						body: JSON.stringify(responseBody),
						contentType: 'application/json'
					})
				} catch (error) {
					MollyHelper.log.warn(
						`Error modifying response: ${error}`,
						`MollyHelper > modifyGraphqlResponseReceivedByBrowser`
					)
					await route.abort()
				}
			} else {
				// If operationName doesn't match, fulfill with the original response
				await route.fulfill({
					status: response.status(),
					headers: response.headers(),
					body: await response.text(),
					contentType: response.headers()['content-type']
				})
			}
		})

		try {
			// Trigger the request and wait for the response simultaneously
			const [interceptedResponse] = await Promise.all([
				page.waitForResponse(response => {
					const requestBody = response.request().postDataJSON()
					return response.url().includes('/graphql') && requestBody?.operationName === operationName
				}),
				triggerRequest()
			])

			return interceptedResponse
		} catch (error) {
			MollyHelper.log.warn(
				`Error during request/response handling: ${error}`,
				`MollyHelper > modifyGraphqlResponseReceivedByBrowser`
			)
			throw error
		} finally {
			// Clean up the route handler
			await page.unroute('**/graphql')
		}
	}

	/**
	 * Copies a file from the source path to the destination path.
	 * If the source file does not exist, an error is thrown.
	 *
	 * @param {string} src - The path to the source file.
	 * @param {string} dest - The path to the destination file.
	 * @throws {Error} If the source file does not exist.
	 * @returns {void}
	 */
	static copyFile(src: string, dest: string): void {
		if (!fs.existsSync(path.join(src)))
			MollyHelper.log.error(`Source (${src}) is not found`, `MollyHelper > copyFile`)

		try {
			fs.copyFileSync(path.join(src), path.join(dest))
			MollyHelper.log.success(`Copied ${src} to ${dest}.`, `MollyHelper > copyFile`)
		} catch (err) {
			MollyHelper.log.warn(`Failed to copy file. \nError: ${err.message}`, `MollyHelper > copyFile`)
		}
	}

	/**
	 * Reads a JSON file safely by acquiring a lock to prevent concurrent writes.
	 *
	 * @param {string} filePath - The path to the JSON file.
	 * @returns {Promise<any>} - A promise resolving to the parsed JSON data or an empty object if the file does not exist.
	 * @throws {Error} - Logs an error if reading the file fails.
	 *
	 */
	static async readJsonSafely(filePath: string): Promise<any> {
		try {
			await lockfile.lock(filePath, {
				stale: 10000,
				retries: 3,
				lockfilePath: `${filePath}.lock`
			})
			if (!fs.existsSync(filePath)) {
				MollyHelper.log.warn(
					`File ${filePath} does not exist, returning empty object.`,
					`MollyHelper > readJsonSafely`
				)
				return {}
			}
			const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
			await lockfile.unlock(filePath, { lockfilePath: `${filePath}.lock` })

			return data
		} catch (error) {
			MollyHelper.log.warn(`Error reading file: ${error.message}`, `MollyHelper > readJsonSafely`)
			return null
		}
	}

	/**
	 * Writes data to a JSON file safely by acquiring a lock to prevent concurrent modifications.
	 *
	 * @param {string} filePath - The path to the JSON file.
	 * @param {any} data - The data to be merged and written into the file.
	 * @returns {Promise<void>} - A promise resolving when the file is successfully written.
	 * @throws {Error} - Logs an error if writing the file fails.
	 *
	 */
	static async writeJsonSafely(filePath: string, data: any): Promise<void> {
		try {
			await lockfile.lock(filePath, {
				stale: 10000,
				retries: 3,
				lockfilePath: `${filePath}.lock`
			})

			let currentState = {}
			if (fs.existsSync(filePath)) {
				currentState = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
			}
			Object.assign(currentState, data)
			fs.writeFileSync(filePath, JSON.stringify(currentState, null, 2))

			await lockfile.unlock(filePath, { lockfilePath: `${filePath}.lock` })
		} catch (error) {
			MollyHelper.log.warn(`Error writing JSON: ${error.message}`, `MollyHelper > writeJsonSafely`)
		}
	}

	/**
	 *	Logging helper
	 */
	private static logger: Signale = new Signale(MollyConfig.global.logging)
	public static log = {
		debug: (msg: any, prefix?: string): void => {
			MollyHelper.logger.debug({ prefix: prefix ? `[${prefix}]` : null, message: msg })
		},
		info: (msg: any, prefix?: string): void => {
			MollyHelper.logger.info({ prefix: prefix ? `[${prefix}]` : null, message: msg })
		},
		warn: (msg: any, prefix?: string): void => {
			MollyHelper.logger.warn({ prefix: prefix ? `[${prefix}]` : null, message: msg })
		},
		success: (msg: any, prefix?: string): void => {
			MollyHelper.logger.success({ prefix: prefix ? `[${prefix}]` : null, message: msg })
		},
		error: (msg: any, prefix?: string): never => {
			throw Object.assign(new Error(msg), { name: `[${prefix ?? 'Unknown'}]`, stack: null })
		},
		getInteractive: (channelName: string): Signale => new Signale({ interactive: true, scope: channelName }),
		testLog: (msg: any, testInfo: TestInfo): void => {
			const stepName =
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				testInfo._steps.find((step: any) => step.stepId.includes(testInfo._lastStepId))?.title || null
			MollyHelper.logger.log({
				prefix: `[TEST: ${testInfo.title}] ${stepName ? `[STEP: ${stepName}]` : ''}`,
				message: msg
			})
		}
	}
}
