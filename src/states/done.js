import { atomic } from 'hine';

export const doneState = atomic({
	name: 'done',
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
