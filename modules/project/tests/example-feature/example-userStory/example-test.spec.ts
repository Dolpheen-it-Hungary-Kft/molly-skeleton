import test from '../../../fixtures/fixtures'

test.describe(
	'Example story title',
	{
		tag: ['@TAG']
	},
	() => {
		test('Example test case title', async ({ User }, testInfo) => {
			testInfo.annotations.push({ type: 'test_key', description: 'example-test-key' })

			await test.step(`Example test step`, async () => {
				await User.examplePage.navigateHere()
			})
		})
	}
)
