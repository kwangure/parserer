import { atomic } from 'hine';

export const createAfterCommentBang = () => atomic({
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
