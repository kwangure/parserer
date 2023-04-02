import { atomic } from 'hine';

export const createBeforeCommentStart = () => atomic({
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
				transitionTo: 'invalidComment',
				actions: [
					'$error.incompleteComment',
					'$stack.pushInvalid',
					'$index.increment',
				],
			},
		],
	},
});
