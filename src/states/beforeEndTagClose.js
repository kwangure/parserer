import { atomic } from 'hine';

export const createBeforeEndTagClose = () => atomic({
	on: {
		CHARACTER: [
			{
				transitionTo: 'fragment',
				condition: 'isTagClose',
				actions: [
					'$index.increment',
					'$stack.popElement',
				],
			},
			{
				transitionTo: 'beforeEndTagClose',
				condition: 'isWhitespace',
				actions: [
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
