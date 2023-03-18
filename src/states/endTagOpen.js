import { atomic } from 'hine';

export const createEndTagOpen = () => atomic({
	on: {
		CHARACTER: [
			{
				transitionTo: 'endTagName',
				condition: 'isAlphaCharacter',
				actions: [
					'$maybeStack.pop',
					'$stack.addName',
					'$index.increment',
				],
			},
			{
				transitionTo: 'invalid',
				actions: [
					'$error.invalidTagName',
					'$stack.pushInvalid',
					'$index.increment',
				],
			},
		],
	},
});
