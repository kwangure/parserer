import { atomic } from 'hine';

export const createDone = () => atomic({
	always: [
		{
			condition: 'isAutoclosedEOF',
			actions: [
				'$stack.popAutoclosedEOF',
			],
		},
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
