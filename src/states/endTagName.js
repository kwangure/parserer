import { atomic } from 'hine';

export const createEndTagName = () => atomic({
	on: {
		CHARACTER: [
			{
				transitionTo: 'beforeEndTagClose',
				condition: 'isWhitespace',
				actions: [
					'$index.increment',
				],
			},
			{
				transitionTo: 'endTagVoid',
				condition: 'isVoidTag',
				actions: [
					'$stack.addName',
					'$index.increment',
				],
			},
			{
				condition: 'isTagCloseAndAutoclosedByParent',
				actions: [
					'$stack.popAutoclosedSibling',
				],
			},
			{
				transitionTo: 'fragment',
				condition: 'isTagClose',
				actions: [
					'$index.increment',
					'$stack.popElement',
				],
			},
			{
				actions: [
					'$stack.addName',
					'$index.increment',
				],
			},
		],
	},
});
