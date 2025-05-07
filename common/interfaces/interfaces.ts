import { Locator } from 'playwright'
import { Browser } from '@playwright/test'
import { MomentInput } from 'moment'
import signale from 'signale'

export interface MollyConfiguration {
	global: {
		logging: signale.SignaleOptions
		env: {
			enabled: string[]
		}
		metrics?: {
			networkTraffic: {
				URLQuery: string[]
				threshold_ms: number
			}
		}
	}

	modules: MollyModule[]
}

export interface MollyModule {
	name: string
	xray: {
		token?: string | null /* Autoload from KeyVault */
		projectKey: string
		testPlanKey: string
		product?: string
	}
}

// Builder is a creation design pattern that lets you construct complex objects step by step.
// The pattern allows you to produce different types and representations of an object using the same construction code.
// Reference: https://refactoring.guru/design-patterns/builder

export interface Director {
	setBuilder(builder: Builder): void
}

export interface Builder {
	reset(): void
	getProduct(): any
}

export interface ASQLCOptions {
	database: string
	encrypt?: boolean
	trustServerCertificate?: boolean
	port?: number
	connectionTimeout: number
}

export enum Language {
	English = 'English',
	German = 'German',
	Hungarian = 'Hungarian',
	Italian = 'Italian'
}

export enum Stage {
	mik = 'mik',
	mce = 'mce'
}

/** Azure report generator */

interface BuildLinks {
	self: { href: string }
	web: { href: string }
	sourceVersionDisplayUri: { href: string }
	timeline: { href: string }
	badge: { href: string }
}

interface Plan {
	planId: string
}

interface TemplateParameters {
	report: string
	stage: string
	worker: string
	storybook: string
	bobo: string
	transport_network_manager: string
	transport_network_service: string
	platform_portal: string
	notification_office: string
	user_management: string
	adapters: string
	translation_dictionary: string
	ordering: string
	dispocockpit: string
}

interface Project {
	id: string
	name: string
	url: string
	state: string
	revision: number
	visibility: string
	lastUpdateTime: string
}

interface Definition {
	drafts: any[]
	id: number
	name: string
	url: string
	uri: string
	path: string
	type: string
	queueStatus: string
	revision: number
	project: Project
}

interface Queue {
	id: number
	name: string
	pool: {
		id: number
		name: string
		isHosted: boolean
	}
}

interface RequestedUser {
	displayName: string
	url: string
	_links: { avatar: { href: string } }
	id: string
	uniqueName: string
	imageUrl: string
	descriptor: string
}

interface Logs {
	id: number
	type: string
	url: string
}

interface Repository {
	id: string
	type: string
	name: string
	url: string
	clean: boolean | null
	checkoutSubmodules: boolean
}

export interface AzureBuild {
	_links: BuildLinks
	properties: object
	tags: string[]
	validationResults: any[]
	plans: Plan[]
	templateParameters: TemplateParameters
	triggerInfo: object
	id: number
	buildNumber: string
	status: string
	result: string
	queueTime: string
	startTime: string
	finishTime: string
	url: string
	definition: Definition
	buildNumberRevision: number
	project: Project
	uri: string
	sourceBranch: string
	sourceVersion: string
	queue: Queue
	priority: string
	reason: string
	requestedFor: RequestedUser
	requestedBy: RequestedUser
	lastChangedDate: string
	lastChangedBy: RequestedUser
	orchestrationPlan: Plan
	logs: Logs
	repository: Repository
	retainedByRelease: boolean
	triggeredByBuild: any
	appendCommitMessageToRunName: boolean
	testRuns: AzureBuildTestRun[] | null
}

interface ProjectInfo {
	id: string
	name: string
	url: string
}

interface TestCase {
	name: string
}

interface TestRun {
	id: string
	name: string
	url: string
}

interface BuildInfo {
	id: string
	name: string
	url: string
}

interface LastUpdatedBy {
	displayName: string
	url: string
	_links: { avatar: { href: string } }
	id: string
	uniqueName: string
	imageUrl: string
	descriptor: string
}

export interface AzureBuildTestResult {
	id: number
	project: ProjectInfo
	startedDate: string
	completedDate: string
	durationInMs: number
	outcome: string
	revision: number
	state: string
	testCase: TestCase
	testRun: TestRun
	lastUpdatedDate: string
	priority: number
	computerName: string
	build: BuildInfo
	createdDate: string
	url: string
	failureType: string
	automatedTestStorage: string
	automatedTestType: string
	testCaseTitle: string
	customFields: any[]
	testCaseReferenceId: number
	lastUpdatedBy: LastUpdatedBy
	automatedTestName: string
}

export interface AzureBuildTestRun {
	id: number
	name: string
	url: string
	isAutomated: boolean
	state: string
	totalTests: number
	incompleteTests: number
	notApplicableTests: number
	passedTests: number
	unanalyzedTests: number
	revision: number
	webAccessUrl: string
	results: AzureBuildTestResult[] | null
}

export interface AzureModuleModel {
	name: string
	testRuns: {
		[key in 'test' | 'int']: AzureBuildTestRun[]
	}
}

/** Playwright test-results*/
export interface PlaywrightTestResults {
	config: Config
	suites: Suite[]
	errors: Error[]
}

interface Annotation {
	type: string
	description: string
}

interface Result {
	workerIndex: number
	status: string
	duration: number
	errors: string[]
	stdout: string[]
	stderr: string[]
	retry: number
	startTime: string
	attachments: any[]
}

interface Test {
	timeout: number
	annotations: Annotation[]
	expectedStatus: string
	projectId: string
	projectName: string
	results: Result[]
	status: string
}

export interface Spec {
	title: string
	ok: boolean
	tags: string[]
	tests: Test[]
	id: string
	file: string
	line: number
	column: number
}

export interface Suite {
	title: string
	file: string
	column: number
	line: number
	specs: Spec[]
	suites?: Suite[]
}

interface Metadata {
	actualWorkers: number
}

interface Reporter {
	embedAnnotationsAsProperties: boolean
	textContentAnnotations: string[]
	embedAttachmentsAsProperty: string
	outputFile: string
}

interface ReporterConfig {
	name: string
	options: Reporter
}

interface Project {
	outputDir: string
	repeatEach: number
	retries: number
	metadata: any
	id: string
	name: string
	testDir: string
	testIgnore: string[]
	testMatch: string[]
	timeout: number
}

interface Config {
	configFile: string
	rootDir: string
	forbidOnly: boolean
	fullyParallel: boolean
	globalSetup: string
	globalTeardown: string | null
	globalTimeout: number
	grep: Record<string, unknown>
	grepInvert: string | null
	maxFailures: number
	metadata: Metadata
	preserveOutput: string
	reporter: ReporterConfig[]
	reportSlowTests: { max: number; threshold: number }
	quiet: boolean
	projects: Project[]
	shard: string | null
	updateSnapshots: string
	version: string
	workers: number
	webServer: string | null
}

interface Error {
	message: string
	stack?: string
}

/** Azure Build Pipeline Artifact */
export interface AzureBuildArtifact {
	id: number
	name: string
	source: string
	resource: {
		type: string
		data: string
		properties: {
			RootId: string
			artifactsize: string
			HashType: string
			DomainId: string
		}
		url: string
		downloadUrl: string
	}
}

export interface AzureB2CRefreshTokenResponse {
	access_token: string
	token_type: string
	not_before: number
	expires_in: number
	expires_on: number
	resource: string
	profile_info: string
	scope: string
	refresh_token: string
	refresh_token_expires_in: number
}

export interface AzureB2CClientCredentialsGrantResponse {
	access_token: string
	token_type: string
	not_before: number
	expires_in: number
	expires_on: number
	resource: string
}

/** User object related*/
export interface MollyUserConfiguration {
	role: string
	browser: Browser
	tokenHandling: {
		autoUpdate: boolean
		updateProcessVar: string | false
	}
	metrics?: {
		monitorNetworkTraffic?: boolean
	}
	browserSettings?: {
		useChromeRemote: boolean
	}
}

export interface Cookie {
	name: string
	value: string
	domain: string
	path: string
	expires: number
	httpOnly: boolean
	secure: boolean
	sameSite: string
}

export interface LocalStorageItem {
	name: string
	value: string
}

export interface Origin {
	origin: string
	localStorage: LocalStorageItem[]
}

export interface StorageState {
	cookies: Cookie[]
	origins: Origin[]
	access_token?: string
	bearer_token?: string
	refresh_token?: string
	token_expires_at?: number
}

export interface LocalStorageAuthSession {
	session_state: string | null
	access_token: string
	refresh_token: string
	token_type: string
	scope: string
	profile: Record<string, unknown>
	expires_at: number
}

/** Render Assert */
export interface RenderAssertMetrics {
	module: string
	contentHash: string
	elementName: string
	locator: Locator | string
	animationPhaseScreenshotsBase64: string[] | null
	computedCssProps: object | null
	screenshot: string | null
	date: string
}
export interface RenderAssertMetricsConfig {
	timeout: number
	assertCSSProps: boolean
	assertAnimations: boolean
	assertScreenshot: boolean
}
export interface RenderAssertScreenshotResult {
	type: 'animation' | 'screenshot'
	frameIdx: number
	date: MomentInput
	stored: RenderAssertMetrics
	current: {
		screenshot: string
	}
	assertMetrics: {
		diffMinimapBase64: string
		diffBase64: string
		avgDiffPercentage: number
		diffRelativeToAllowancePercent: string
	} | null
	error?: {
		reason: string
	}
}
export interface RenderAssertResult {
	passed?: boolean
	componentName: string
	module: string
	css?: {
		stored: any
		passed: boolean
		errorMessage?: string
	}
	animation?: {
		passed: boolean
		frameResults: RenderAssertScreenshotResult[]
	}
	screenshot?: {
		passed: boolean
		result: RenderAssertScreenshotResult
	}
	[key: string]: any
}
