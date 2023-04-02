import { compound } from 'hine';
import { createAfterCommentBang } from './afterCommentBang.js';
import { createAfterCommentContent } from './afterCommentContent.js';
import { createBeforeCommentEnd } from './beforeCommentEnd.js';
import { createBeforeCommentStart } from './beforeCommentStart.js';
import { createCommentContent } from './commentContent.js';
import { createCommentEnd } from './commentEnd.js';
import { createInvalidComment } from './invalidComment.js';

export const createComment = () => compound({
	always: [{
		transitionTo: 'done',
		condition: 'isDone',
	}],
	on: {
		DONE: [{
			transitionTo: 'fragment',
		}],
	},
	states: {
		afterCommentBang: createAfterCommentBang(),
		afterCommentContent: createAfterCommentContent(),
		beforeCommentStart: createBeforeCommentStart(),
		beforeCommentEnd: createBeforeCommentEnd(),
		commentContent: createCommentContent(),
		commentEnd: createCommentEnd(),
		invalidComment: createInvalidComment(),
	},
});
