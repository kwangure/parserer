import { Action, atomic } from 'hine';

export const createCommentEnd = () => atomic({
	entry: [{
		actions: ['updateParent'],
	}],
	actions: {
		updateParent: new Action({
			run() {
				this.parent?.dispatch('DONE');
			},
		}),
	},
});
