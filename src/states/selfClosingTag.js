import { atomic } from 'hine';

export const selfClosingTagState = atomic({
	name: 'selfClosingTag',
	always: [
		{
			transitionTo: 'done',
			condition: 'isDone',
		},
	],
	on: {
		CHARACTER: [
			{
				transitionTo: 'fragment',
				condition: 'isTagClose',
				actions: [
					'$index.increment',
					'$stack.popSelfClosingElement',
				],
			},
		],
	},
});
