import { atomic } from 'hine';

export const createBeforeCommentEnd = () => atomic({
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
					'$stack.popComment',
				],
			},
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
