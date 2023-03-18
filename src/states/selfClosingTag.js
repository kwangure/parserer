import { atomic } from 'hine';

export const createSelfClosingTag = () => atomic({
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
