import { atomic } from 'hine';

export const createCommentContent = () => atomic({
	always: [
		{
			transitionTo: 'done',
			condition: 'isDone',
		},
	],
	on: {
		CHARACTER: [
			{
				transitionTo: 'afterCommentContent',
				condition: 'isMinus',
				actions: [
					'$stack.addData',
					'$index.increment',
				],
			},
			{
				actions: [
					'$stack.addData',
					'$index.increment',
				],
			},
		],
	},
});
