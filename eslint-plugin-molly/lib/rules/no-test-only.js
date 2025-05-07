module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description: 'disallow committing test.only and test.describe.only in .spec.ts files',
			category: 'Possible Errors',
			recommended: false
		},
		schema: [],
		hasSuggestions: true,
		fixable: 'code'
	},
	create(context) {
		return {
			MemberExpression(node) {
				// Check for `test.only`
				if (node.object.name === 'test' && node.property.name === 'only') {
					context.report({
						node,
						message:
							'[Molly] Committing `test.only` is not allowed. It can cause issues for colleagues and disrupt the azure-pipeline by running only this test. Use `test.only` locally but ensure it is removed before committing.',
						fix(fixer) {
							return fixer.removeRange([node.object.range[1], node.range[1]])
						},
						suggest: [
							{
								desc: 'Remove `test.only` to allow all tests to run.',
								fix: fixer => fixer.removeRange([node.object.range[1], node.range[1]])
							}
						]
					})
				}

				// Check for `test.describe.only`
				if (
					node.object.type === 'MemberExpression' &&
					node.object.object.name === 'test' &&
					node.object.property.name === 'describe' &&
					node.property.name === 'only'
				) {
					context.report({
						node,
						message:
							'[Molly] Committing `test.describe.only` is not allowed. It can cause issues for colleagues and disrupt the azure-pipeline by running only this test suite. Use `test.describe.only` locally but ensure it is removed before committing.',
						fix(fixer) {
							return fixer.removeRange([node.object.property.range[1], node.range[1]])
						},
						suggest: [
							{
								desc: 'Remove `test.describe.only` to allow all tests to run.',
								fix: fixer => fixer.removeRange([node.object.property.range[1], node.range[1]])
							}
						]
					})
				}
			}
		}
	}
}
