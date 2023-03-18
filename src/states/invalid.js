import { atomic } from 'hine';

export const createInvalid = () => atomic({
	always: [
		{
			transitionTo: 'done',
			condition: 'isDone',
		},
	],
	on: {
		CHARACTER: [
			{
				transitionTo: 'tagOpen',
				condition: 'isTagOpen',
				actions: [
					'$stack.pushTag',
					'$index.increment',
				],
			},
			{
				actions: [
					'$index.increment',
				],
			},
		],
	},
	exit: [
		{
			actions: [
				'$stack.popInvalid',
			],
		},
	],
});
