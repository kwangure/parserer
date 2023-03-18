import { atomic } from 'hine';

export const endTagNameState = atomic({
	name: 'endTagName',
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
