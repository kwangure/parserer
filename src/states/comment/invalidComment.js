import { atomic } from 'hine';

export const createInvalidComment = () => atomic({
	on: {
		CHARACTER: [
			{
				transitionTo: 'commentEnd',
				condition: 'isTagClose',
				actions: [
					'$index.increment',
					'$stack.popInvalid',
				],
			},
			{
				actions: [
					'$index.increment',
				],
			},
		],
	},
	exit: [
		{
			condition: 'isDone',
			actions: [
				'$stack.popInvalid',
			],
		},
	],
});
