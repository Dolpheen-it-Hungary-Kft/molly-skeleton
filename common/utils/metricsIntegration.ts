/* eslint-disable @typescript-eslint/no-namespace */
import fs from 'fs'
import { Page } from '@playwright/test'
import path from 'path'
import lighthouse from 'lighthouse'
import { Flags } from 'lighthouse/types/externs'
import DesktopConfig from 'lighthouse/lighthouse-core/config/desktop-config.js'
import MollyConfig from '../../molly.config'
import moment from 'moment'
import MollyHelper from './mollyHelper'

interface CollectedData {
	overallInformation: {
		avgResponseTime: number
		totalRequests: number
		totalTime: number
		contextTime: number
	}
	requests: RequestData[]
}

interface RequestData {
	statusCode: number
	requestUrl: string
	requestHeaders: Record<string, string>
	requestBody: any
	responseUrl: string
	responseHeaders: Record<string, string>
	responseBody: any
	responseTime: number
	responseStatusCode: number
	jaegerTraceIdLink?: string
}

interface Operations {
	[key: string]: {
		requests: RequestData[]
	}
}

interface mergedMetrics {
	roles: {
		[key: string]: {
			overallInformation: object
			gql?: {
				operations: Operations
			}
			rest?: {
				requests: RequestData[]
			}
		}
	}
	errors?: {
		gql: object
		rest: object
	}
}

declare global {
	namespace NodeJS {
		interface Global {
			usedPorts: Set<number>
		}
	}
}
const usedPortsSet = new Set<number>()
Object.defineProperty(global, 'usedPorts', {
	value: usedPortsSet,
	writable: false,
	configurable: false,
	enumerable: true
})

export default class Metrics {
	public readonly networkMetricsSavePath: string
	public readonly mergedNetworkMetricsReportPath: string
	public readonly lightHouseSavePath: string

	constructor() {
		this.networkMetricsSavePath = path.join(`${process.cwd()}/test-results/network_metrics`)
		if (!fs.existsSync(this.networkMetricsSavePath)) {
			fs.mkdirSync(this.networkMetricsSavePath, { recursive: true })
		}

		this.mergedNetworkMetricsReportPath = path.join(`${process.cwd()}/playwright-report/network_metrics`)
		if (!fs.existsSync(this.mergedNetworkMetricsReportPath)) {
			fs.mkdirSync(this.mergedNetworkMetricsReportPath, { recursive: true })
		}

		this.lightHouseSavePath = path.join(`${process.cwd()}/test-results/lighthouse_metrics`)
		if (!fs.existsSync(this.lightHouseSavePath)) {
			fs.mkdirSync(this.lightHouseSavePath, { recursive: true })
		}
	}

	static getFreeDebugPort(): number {
		const minPort = 49152
		const maxPort = 65535
		let randomPort: number

		do {
			randomPort = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort
		} while (usedPortsSet.has(randomPort))

		usedPortsSet.add(randomPort)
		return randomPort
	}

	async performLighthouseAnalysis(url: string, reportName: string, flags: Flags) {
		if (url == 'about:blank')
			MollyHelper.log.error(
				`Invalid URL -> ${url}. Please navigate to a correct page.`,
				`Metrics > performLighthouseAnalysis`
			)

		const runnerResult = await lighthouse(url, flags, DesktopConfig)
		const report: string | string[] = runnerResult.report
		if (flags.output) {
			if (Array.isArray(report)) {
				for (const [idx, result] of report.entries()) {
					fs.writeFileSync(path.join(`${this.lightHouseSavePath}/${reportName}.${flags.output[idx]}`), result)
				}
			} else {
				fs.writeFileSync(path.join(`${this.lightHouseSavePath}/${reportName}.${flags.output}`), report)
			}
		} else {
			MollyHelper.log.warn(`Output is not specified for ${reportName}`, `Metrics > performLighthouseAnalysis`)
		}
	}

	async monitorNetworkTraffic(page: Page, role: string) {
		const collectedData: CollectedData = {
			overallInformation: {
				avgResponseTime: 0,
				totalRequests: 0,
				totalTime: 0,
				contextTime: 0
			},
			requests: []
		}

		const fileName = `${role}_metrics_report_${Date.now()}.json`
		page.on('requestfinished', async (data: any) => {
			const response = await data.response().catch(e => {
				if (e.includes('Target page, context or browser has been closed')) {
					MollyHelper.log.warn(
						`One of your browser context operations was not properly awaited. Aborting..`,
						`Metrics > monitorNetworkTraffic`
					)
					return
				}
			})
			const url = data.url()
			const timing = data.timing()
			const statusCode = response.status()

			const responseTime = timing.responseEnd - timing.requestStart
			if (MollyConfig.global.metrics.networkTraffic.URLQuery.some(query => url.includes(query))) {
				collectedData.overallInformation.totalRequests++
				collectedData.overallInformation.totalTime += responseTime
			}

			let responseBodyBuffer
			if (
				MollyConfig.global.metrics.networkTraffic.URLQuery.some(query => url.includes(query)) &&
				(statusCode != 200 || responseTime > MollyConfig.global.metrics.networkTraffic.threshold_ms)
			) {
				try {
					responseBodyBuffer = (await response.body()).toString('utf8')
				} catch (error) {
					MollyHelper.log.warn(`Could not get response Buffer for ${url}`, `Metrics > monitorNetworkTraffic`)
				}

				const dataObject: RequestData = {
					statusCode: response.status(),
					requestUrl: data.url(),
					requestHeaders: await data.allHeaders(),
					requestBody: await data.postDataJSON(),
					responseUrl: response.url(),
					responseHeaders: await response.allHeaders(),
					responseBody: responseBodyBuffer,
					responseTime: responseTime,
					responseStatusCode: response.responseStatusCode
				}
				collectedData.requests.push(dataObject)
			}
		})

		try {
			page.on('close', () => {
				if (collectedData.requests[0] !== undefined) {
					MollyHelper.log.info(`Saving started`, `Metrics > monitorNetworkTraffic`)

					collectedData.overallInformation.avgResponseTime =
						collectedData.overallInformation.totalTime / collectedData.overallInformation.totalRequests

					const jsonReport = JSON.stringify(collectedData, null, 2)
					fs.writeFileSync(path.join(`${this.networkMetricsSavePath}/${fileName}`), jsonReport)
					MollyHelper.log.success(
						`Metrics saved to ${this.networkMetricsSavePath}/${fileName}`,
						`Metrics > monitorNetworkTraffic`
					)
				} else {
					MollyHelper.log.info(
						`No data to save. (There was no response time over ${MollyConfig.global.metrics.networkTraffic.threshold_ms}) ms.`,
						`Metrics > monitorNetworkTraffic`
					)
				}
			})
		} catch (error) {
			MollyHelper.log.warn(`Failed to save metrics`, `Metrics > monitorNetworkTraffic`)
		}
	}

	mergeNetworkTraces(): void {
		MollyHelper.log.info(`Merging network metrics...`, `Metrics > mergeNetworkTraces`)
		let mergedMetrics: mergedMetrics = {
			roles: {}
		}

		let files: string[]
		try {
			files = fs.readdirSync(path.join(this.networkMetricsSavePath))
		} catch (error) {
			MollyHelper.log.warn(`Metrics folder was not found`, `Metrics > mergeNetworkTraces`)
		}

		files.forEach((file: string) => {
			const filePath = path.join(`${this.networkMetricsSavePath}/${file}`)
			const fileContents = fs.readFileSync(filePath, 'utf8')

			let metrics: CollectedData
			try {
				metrics = JSON.parse(fileContents)
			} catch (error) {
				MollyHelper.log.warn(`Cannot parse ${filePath}`, `Metrics > mergeNetworkTraces`)
				return
			}

			const role = file.split('_')[0]

			if (!mergedMetrics.roles[role]) {
				mergedMetrics.roles[role] = {
					overallInformation: metrics.overallInformation,
					gql: {
						operations: {}
					},
					rest: {
						requests: []
					}
				}
			}

			if (!metrics.requests) {
				MollyHelper.log.warn(`No requests found.`, `Metrics > mergeNetworkTraces`)
				return
			}

			for (const request of metrics.requests) {
				// eslint-disable-next-line no-prototype-builtins
				if (request.responseBody == null) {
					MollyHelper.log.warn(
						`Metrics files include requests with no response bodies!`,
						`Metrics > mergeNetworkTraces`
					)
					continue
				}

				if (request.requestUrl.includes('graphql')) {
					if (request.requestBody == null) {
						continue
					}

					if (!mergedMetrics.roles[role].gql.operations[request.requestBody.operationName]) {
						mergedMetrics.roles[role].gql.operations[request.requestBody.operationName] = {
							requests: []
						}
					}

					mergedMetrics.roles[role].gql.operations[request.requestBody.operationName].requests.push({
						statusCode: request.statusCode,
						requestUrl: request.requestUrl,
						requestHeaders: request.requestHeaders,
						requestBody: request.requestBody,
						responseUrl: request.responseUrl,
						responseHeaders: request.responseHeaders,
						responseBody: request.responseBody,
						responseTime: request.responseTime,
						responseStatusCode: request.statusCode
					})
				} else {
					mergedMetrics.roles[role].rest.requests.push({
						statusCode: request.statusCode,
						requestUrl: request.requestUrl,
						requestHeaders: request.requestHeaders,
						requestBody: request.requestBody,
						responseUrl: request.responseUrl,
						responseHeaders: request.responseHeaders,
						responseBody: request.responseBody,
						responseTime: request.responseTime,
						responseStatusCode: request.statusCode
					})
				}
			}
		})

		function extendJsonWithErrors(initialJson: any) {
			MollyHelper.log.info(`Gathering errors...`, `Metrics > extendJsonWithErrors`)
			const updatedJson = <mergedMetrics>JSON.parse(JSON.stringify(initialJson))

			if (!('errors' in updatedJson)) {
				updatedJson.errors = {
					gql: {},
					rest: {}
				}
			}

			for (const roleName in updatedJson.roles) {
				const role = updatedJson.roles[roleName]

				/* Handling gql operations*/
				for (const operationName of Object.keys(role.gql.operations)) {
					const operation = role.gql.operations[operationName]

					for (const request of operation.requests) {
						let hasError: boolean
						if (request.responseBody) {
							hasError =
								JSON.stringify(request.responseBody).includes('error') ||
								request.responseStatusCode != 200
						} else {
							continue
						}

						try {
							if (hasError) {
								if (!(operationName in updatedJson.errors)) {
									updatedJson.errors.gql[operationName] = {}
								}

								const errorStatusCodesArray = operation.requests
									.filter(
										(request: { responseStatusCode: number; responseBody: string }) =>
											JSON.stringify(request.responseBody).includes('error') ||
											request.responseStatusCode != 200
									)
									.map((request: { responseStatusCode: number }) => request.responseStatusCode)

								const statusCodeCounts: Record<number, number> = {}
								errorStatusCodesArray.forEach((statusCode: string | number) => {
									statusCodeCounts[statusCode] = (statusCodeCounts[statusCode] || 0) + 1
								})

								let mostCommonStatusCode: string | number | null = null
								const keys = Object.keys(statusCodeCounts)
								if (keys.length > 0) {
									mostCommonStatusCode = keys.reduce((a, b) =>
										statusCodeCounts[a] > statusCodeCounts[b] ? a : b
									)
								}

								updatedJson.errors.gql[operationName] = {
									count: errorStatusCodesArray.length,
									mostCommonStatusCode: mostCommonStatusCode || null,
									allStatusCodes: errorStatusCodesArray.reduce((a, b) =>
										statusCodeCounts[a] > statusCodeCounts[b] ? a : b
									)
								}
							}
						} catch (e) {
							continue
						}
					}
				}

				/* Handling rest */
				for (const request of role.rest.requests) {
					const hasError = request.responseStatusCode != 200

					if (hasError) {
						if (!updatedJson.errors.rest[`${request.requestUrl}`]) {
							updatedJson.errors.rest[`${request.requestUrl}`] = {
								count: 1,
								mostCommonStatusCode: request.responseStatusCode,
								allStatusCodes: [request.responseStatusCode]
							}
						} else {
							updatedJson.errors.rest[`${request.requestUrl}`].count += 1

							const statusCodeCounts: Record<number, number> = {}
							updatedJson.errors.rest[`${request.requestUrl}`].allStatusCodes.forEach(
								(statusCode: string | number) => {
									statusCodeCounts[statusCode] = (statusCodeCounts[statusCode] || 0) + 1
								}
							)

							let mostCommonStatusCode: string | number | null = null
							const keys = Object.keys(statusCodeCounts)
							if (keys.length > 0) {
								mostCommonStatusCode = keys.reduce((a, b) =>
									statusCodeCounts[a] > statusCodeCounts[b] ? a : b
								)
							}
							updatedJson.errors.rest[`${request.requestUrl}`].mostCommonStatusCode = mostCommonStatusCode

							updatedJson.errors.rest[`${request.requestUrl}`].allStatusCodes = [
								...new Set(updatedJson.errors[`rest-${request.requestUrl}`])
							]
						}
					}
				}
			}

			return updatedJson
		}

		mergedMetrics = extendJsonWithErrors(mergedMetrics)

		// Deleting User level metrics to reduce report size
		const usrMetricsFiles = fs.readdirSync(path.join(this.networkMetricsSavePath))
		for (const file of usrMetricsFiles) {
			fs.rmSync(path.join(this.networkMetricsSavePath, file))
		}
		fs.rmSync(path.join(this.networkMetricsSavePath), { recursive: true, force: true })

		const mergedJsonReport = JSON.stringify(mergedMetrics, null, 2)
		fs.writeFileSync(
			path.join(
				`${this.mergedNetworkMetricsReportPath}/merged_metrics_report${moment().format('YYYY-MM-DD-HH-mm-ss-SSS')}.json`
			),
			mergedJsonReport
		)
	}
}
