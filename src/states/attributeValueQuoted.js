import { atomic } from 'hine';

export const createAttributeValueQuoted = () => atomic({
	always: [
		{
			transitionTo: 'done',
			condition: 'isDone',
		},
	],
	on: {
		CHARACTER: [
			{
				transitionTo: 'afterAttributeValueQuoted',
				condition: 'isQuoteClosed',
				actions: [
					'$stack.popText',
					'$index.increment',
					'$stack.popAttribute',
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
