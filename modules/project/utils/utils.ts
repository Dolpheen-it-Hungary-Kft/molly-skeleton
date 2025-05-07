import { Locator, Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import jp from 'jsonpath'
import { faker } from '@faker-js/faker'

export default class Utils {
	constructor() {
		return
	}

	/**
	 * Generates a random train number.
	 *
	 * This function creates a random number intended to represent a train number. It generates
	 * a random number between 0 and 999999, inclusive, and then rounds it down to the nearest
	 * integer to ensure it is a whole number.
	 *
	 * @returns {number} A randomly generated train number as a whole number.
	 *
	 * The function uses `Math.random()` to generate a random floating-point number, multiplies it
	 * by 999999 to scale it, and then applies `Math.floor()` to round down to the nearest whole
	 * number. Finally, `Math.round()` is used to ensure the number is properly rounded, although
	 * this might be redundant after applying `Math.floor()`. The resulting number is suitable
	 * for scenarios where a unique or random identifier for a train is needed.
	 */
	generateTrainNumber(): number {
		return Math.round(Math.floor(Math.random() * 999999))
	}

	/**
	 * Asynchronously reads and parses a JSON file from resource directories.
	 *
	 * This function constructs the path to a JSON file based on the given environment and filename,
	 * then reads the file synchronously and parses its contents as JSON. It's designed to retrieve
	 * configuration or data files that are stored in an environment-specific directory structure.
	 *
	 * @param {string} env - The environment name which is part of the file path.
	 * @param {string} filename - The name of the file to be read.
	 * @returns {Promise<any>} A promise that resolves to the parsed JSON content of the file.
	 *
	 * The function uses Node.js's `path.join` to build the file path, ensuring correct path handling
	 * across different operating systems. It then uses `fs.readFileSync` to read the file contents
	 * synchronously, with an 'utf-8' encoding specified to correctly handle text content.
	 * The content is then parsed as JSON and returned. This function is useful for applications
	 * that require configuration or data loading based on the runtime environment.
	 */
	async readFromResources(env: string, filename: string): Promise<any> {
		const jsonFile = path.join(__dirname, `../services/resources/${env}/${filename}`)
		return JSON.parse(fs.readFileSync(jsonFile, { encoding: 'utf-8' }))
	}

	/**
	 * Creates a delay for the specified duration.
	 *
	 * @param {number} ms - The duration of the delay in milliseconds.
	 * @returns {Promise<void>} A promise that resolves after the specified delay.
	 *
	 * This utility function uses `setTimeout` to create an asynchronous delay,
	 * making it useful for pausing execution in async functions.
	 */
	async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	/**
	 * Generates a random integer within a specified range.
	 *
	 * @param {number} min - The lower bound of the range (inclusive).
	 * @param {number} max - The upper bound of the range (exclusive).
	 * @returns {number} A random integer between the min and max values.
	 *
	 * This function calculates a random number within the specified range using `Math.random()`.
	 * It's suitable for scenarios where a random integer is needed within specific bounds.
	 */
	getRandomNUMBER(min: number, max: number) {
		return Math.floor(Math.random() * (max - min) + min)
	}

	/**
	 * Waits for a specific response on a web page and extracts data using a JSONPath query.
	 *
	 * @param {Page} page - The Puppeteer page object.
	 * @param {string} jpQuery - The JSONPath query string to extract data from the response.
	 * @returns {Promise<any>} A promise that resolves to the data extracted from the first response
	 *          that matches the JSONPath query.
	 *
	 * This function continuously monitors responses on the provided `page` until it finds a response
	 * where the JSONPath query returns a defined value. It uses `page.waitForResponse` to intercept
	 * each response, then applies the JSONPath query to the response body. The function resolves once
	 * it finds a response that satisfies the query.
	 */
	async waitForThisResponseBy(page: Page, jpQuery: string) {
		let actualValue, body

		while (actualValue[0] == undefined) {
			page.waitForResponse(async resp => {
				body = await resp.json()
				actualValue = await jp.query(body, jpQuery)
				if (actualValue[0] != undefined) {
					return actualValue
				}
			})
		}

		return actualValue
	}

	/**
	 * Writes data to a JSON file at the specified path.
	 *
	 * @param {string} PathPlusfileName - The full file path including the filename where the data should be saved.
	 * @param {any} data - The data to be written to the file.
	 *
	 * This function takes any data object, converts it to a JSON string, and writes it to a file
	 * at the specified path. It uses `fs.writeFileSync`, ensuring the operation completes before
	 * the function exits. This is useful for saving data in a structured JSON format.
	 */
	writeJsonFile(PathPlusfileName: string, data) {
		fs.writeFileSync(PathPlusfileName, JSON.stringify(data))
	}

	/**
	 * Reads and parses a JSON file.
	 *
	 * @param {string} name - The file path of the JSON file to be read.
	 * @returns {any} The parsed JSON object from the file.
	 *
	 * This function reads the contents of a file at the given path and parses it as JSON. It uses
	 * `fs.readFileSync` to read the file synchronously with 'utf8' encoding, ensuring proper handling
	 * of text data. This is useful for loading configuration data or other structured information
	 * stored in JSON files.
	 */
	readJsonFile(name: string) {
		return JSON.parse(fs.readFileSync(name, 'utf8'))
	}

	/**
	 * Checks if a network response meets certain criteria based on status and JSONPath query.
	 *
	 * @param {Response} response - The network response object to evaluate.
	 * @param {string} query - A JSONPath query string to apply to the response body.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if the response status is 200
	 *          and the JSONPath query yields a non-undefined result, otherwise `false`.
	 *
	 * This asynchronous function first checks if the HTTP response status is 200 (OK). It then
	 * parses the response body as JSON and applies the provided JSONPath query. The function
	 * resolves to `true` if the first element obtained from the query is defined, indicating
	 * that the query successfully found matching data in the response.
	 */
	async waitForQuery(response, query) {
		return response.status() === 200 && (await jp.query(await response.json(), query)[0]) != undefined
	}

	/**
	 * Waits for a specific network response on a web page, then extracts and returns data based on a JSONPath query.
	 *
	 * @param {Page} page - The Puppeteer page object.
	 * @param {string} query - The JSONPath query string to apply to the response.
	 * @param {Locator} locator - The Puppeteer Locator object for an element whose interaction triggers the response.
	 * @returns {Promise<any>} A promise that resolves to the data extracted from the response matching the JSONPath query.
	 *
	 * This function initiates a wait for a network response that satisfies a specific JSONPath query.
	 * It then triggers an action (e.g., a click) on the specified page element and waits for the
	 * expected response. Once the response is received and matches the query criteria, the function
	 * extracts and returns the relevant data from the response.
	 */
	async getSpecificResponse(page: Page, query: string, locator: Locator) {
		const promise = page.waitForResponse(async response => await this.waitForQuery(response, query))
		await locator.click({ timeout: 10000 })
		const result = await promise
		return await jp.query(await result.json(), query)[0]
	}

	/**
	 * Waits for a specific network request to finish based on the operation name and returns its response.
	 *
	 * @param {string} operationName - The name of the operation to wait for in the network request.
	 * @param {Page} page - The Puppeteer page object.
	 * @returns {Promise<any>} A promise that resolves to the response body of the matching request as a string.
	 *
	 * This asynchronous function listens for the "requestfinished" event on a web page and checks each
	 * finished request to see if its operation name matches the specified `operationName`. Once a
	 * matching request is found, the function retrieves and returns the response body as a string.
	 * The operation name is typically part of the request body and is used here to identify the specific request.
	 */
	async waitForResponseByOperationName(operationName: string, page: Page): Promise<any> {
		return await page.waitForEvent('requestfinished', async (data: any) => {
			const requestBody = await data.postDataJSON()
			if (requestBody.operationName == operationName) {
				const response = await data.response()
				return await response.body().toString('utf8')
			}
		})
	}

	generateHackerJargon(charCount: number) {
		let phrase = faker.hacker.phrase()
		while (phrase.length < charCount) {
			phrase += ' ' + faker.hacker.phrase()
		}
		return phrase.substring(0, charCount)
	}

	generateRandId(): number {
		return Math.round(Math.floor(Math.random() * 9999999))
	}
}
