import { atomic } from 'hine';

export const createFragment = () => atomic({
	always: [{
		transitionTo: 'done',
		condition: 'isDone',
	}],
	entry: [{
		condition: 'isAutoclosedSibling',
		actions: ['$stack.popAutoclosedSibling'],
	}],
	on: {
		CHARACTER: [
			{
				transitionTo: 'tagOpen',
				condition: 'isTagOpen',
				actions: [
					'$maybeStack.pushText',
					'$maybeStack.addRaw',
					'$stack.pushTag',
					'$index.increment',
				],
			},
			{
				transitionTo: 'text',
				actions: [
					'$stack.pushText',
					'$stack.addRaw',
					'$index.increment',
				],
			},
		],
	},
});
