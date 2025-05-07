import { APIRequestContext, APIResponse } from '@playwright/test'

export default class BackendService {
	readonly request: APIRequestContext
	public response: APIResponse

	constructor(public apiRequestContext: APIRequestContext) {
		this.request = apiRequestContext
	}
}

// Template:

// async function awesomeFunction(parameter){
//     return await test.step(`test name with ${parameter}`, async()=>{
//         awesome logic
//     })
// }
