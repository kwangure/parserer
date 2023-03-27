// based on http://developers.whatwg.org/syntax.html#syntax-tag-omission
const disallowedContents = new Map([
	['li', new Set(['li'])],
	['dt', new Set(['dt', 'dd'])],
	['dd', new Set(['dt', 'dd'])],
	[
		'p',
		new Set(
			'address article aside blockquote div dl fieldset footer form h1 h2 h3 h4 h5 h6 header hgroup hr main menu nav ol p pre section table ul'.split(
				' ',
			),
		),
	],
	['rt', new Set(['rt', 'rp'])],
	['rp', new Set(['rt', 'rp'])],
	['optgroup', new Set(['optgroup'])],
	['option', new Set(['option', 'optgroup'])],
	['thead', new Set(['tbody', 'tfoot'])],
	['tbody', new Set(['tbody', 'tfoot'])],
	['tfoot', new Set(['tbody'])],
	['tr', new Set(['tr', 'tbody'])],
	['td', new Set(['td', 'th', 'tr'])],
	['th', new Set(['td', 'th', 'tr'])],
]);

// can this be a child of the parent element, or does it implicitly
// close it, like `<li>one<li>two`?
/**
 * @link {https://github.com/sveltejs/svelte/blob/aa4d0fc2643bdf968dbd72bceda1cce8bdfb5306/src/compiler/parse/utils/html.ts#L163}
 * @param {string} current
 * @param {string} [next]
 */
export function closingTagOmitted(current, next) {
	if (disallowedContents.has(current)) {
		if (!next || disallowedContents.get(current)?.has(next)) {
			return true;
		}
	}

	return false;
}
