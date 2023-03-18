import { atomic } from 'hine';

export const createText = () => atomic({
	always: [
		{
			transitionTo: 'done',
			condition: 'isDone',
			actions: [
				'$stack.popText',
			],
		},
	],
	on: {
		CHARACTER: [
			{
				transitionTo: 'tagOpen',
				condition: 'isTagOpen',
				actions: [
					'$maybeStack.pushText',
					'$maybeStack.addRaw',
					'$stack.popText',
					'$stack.pushTag',
					'$index.increment',
				],
			},
			{
				actions: [
					'$stack.addRaw',
					'$index.increment',
				],
			},
		],
	},
});
