import { atomic } from 'hine';

export const createAfterCommentContent = () => atomic({
	always: [
		{
			transitionTo: 'done',
			condition: 'isDone',
		},
	],
	on: {
		CHARACTER: [
			{
				transitionTo: 'beforeCommentEnd',
				condition: 'isMinus',
				actions: [
					'$stack.addData',
					'$index.increment',
				],
			},
			{
				transitionTo: 'commentContent',
				actions: [
					'$stack.addData',
					'$index.increment',
				],
			},
		],
	},
});
