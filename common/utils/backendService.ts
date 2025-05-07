import { APIRequestContext, APIResponse, expect } from '@playwright/test'
import MollyHelper from './mollyHelper'

/**
 * Abstract class representing a backend service for sending HTTP requests.
 * Provides functionality to configure API request context, authorization, and endpoint,
 * as well as a method to send HTTP POST requests with retry logic.
 *
 * @abstract
 */
export default abstract class BackendService {
	readonly apiRequestContext: APIRequestContext
	readonly authorizationToken: string
	readonly endpoint: string

	constructor(apiRequestContext: APIRequestContext, config: { authorizationToken: string; endpoint: string }) {
		this.apiRequestContext = apiRequestContext
		this.authorizationToken = config.authorizationToken
		this.endpoint = config.endpoint
	}

	/**
	 * Sends an HTTP POST request to the configured endpoint with the provided request body.
	 * Logs the request and response details for debugging purposes.
	 * Retries the request based on the specified timeout and intervals until it passes.
	 *
	 * @param body - The request body to be sent as a string.
	 * @param timeout - The maximum time (in milliseconds) to wait for the request to succeed. Defaults to 30,000 ms.
	 * @param intervals - An array of intervals (in milliseconds) to wait between retries. Defaults to [1,000 ms].
	 * @returns A promise that resolves to the API response.
	 * @throws Will throw an error if the request does not succeed within the specified timeout and intervals.
	 */
	protected async sendHttpRequest(body: string, timeout = 30_000, intervals = [1_000]): Promise<APIResponse> {
		let response: APIResponse
		await expect(async () => {
			MollyHelper.log.debug(`request endpoint: ${this.endpoint}`, `BackendService > sendHttpRequest`)
			MollyHelper.log.debug(`request body:\n${JSON.stringify(body, null, 2)}`, `BackendService > sendHttpRequest`)
			response = await this.apiRequestContext.post(this.endpoint, {
				headers: { Authorization: this.authorizationToken },
				data: body,
				timeout: timeout
			})
			MollyHelper.log.debug(
				`response status: ${response.status()} ${response.statusText()}`,
				`BackendService > sendHttpRequest`
			)
			MollyHelper.log.debug(
				`response body:\n${JSON.stringify(await response.text(), null, 2)}`,
				`BackendService > sendHttpRequest`
			)
			await expect(response).toBeOK()
		}).toPass({ timeout: timeout, intervals: intervals })
		return response
	}
}
