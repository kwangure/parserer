import { atomic } from 'hine';

export const createDone = () => atomic({
	always: [
		{
			transitionTo: 'invalid',
			actions: [
				'$error.unclosedBlock',
				'$stack.pushInvalid',
			],
			condition: 'stackNotEmpty',
		},
	],
});
