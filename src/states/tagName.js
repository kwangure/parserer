import { atomic } from 'hine';

export const createTagName = () => atomic({
	always: [
		{
			transitionTo: 'done',
			condition: 'isDone',
		},
	],
	on: {
		CHARACTER: [
			{
				transitionTo: 'beforeAttributeName',
				condition: 'isWhitespace',
				actions: [
					'$index.increment',
				],
			},
			{
				transitionTo: 'fragment',
				condition: 'isTagClose',
				actions: [
					'$index.increment',
				],
			},
			{
				transitionTo: 'selfClosingTag',
				condition: 'isForwardSlash',
				actions: [
					'$index.increment',
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
