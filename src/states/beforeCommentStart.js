import { atomic } from 'hine';

export const createBeforeCommentStart = () => atomic({
	always: [
		{
			transitionTo: 'done',
			condition: 'isDone',
		},
	],
	on: {
		CHARACTER: [
			{
				transitionTo: 'commentContent',
				condition: 'isMinus',
				actions: [
					'$index.increment',
				],
			},
			{
				transitionTo: 'invalid',
				actions: [
					'$error.incompleteComment',
					'$stack.pushInvalid',
					'$index.increment',
				],
			},
		],
	},
});
