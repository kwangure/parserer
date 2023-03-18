import { atomic } from 'hine';

export const afterCommentBangState = atomic({
	name: 'afterCommentBang',
	always: [
		{
			transitionTo: 'done',
			condition: 'isDone',
		},
	],
	on: {
		CHARACTER: [
			{
				transitionTo: 'beforeCommentStart',
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
