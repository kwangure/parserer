import { atomic } from 'hine';

export const createCommentEnd = () => atomic({
	entry: [{
		actions: ['updateParent'],
	}],
	actions: {
		updateParent() {
			this.parent?.dispatch('DONE');
		},
	},
});
