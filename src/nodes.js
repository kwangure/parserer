import * as acorn from './acorn.js';

/**
 * @typedef {PMAttribute | PMComment | PMElement | PMFragment | PMInvalid | PMMustacheTag | PMText} PMTemplateNode
 */

/**
 * @param {PMBaseNode<string>} node
 * @param {string} property
 */
function PMError(node, property) {
	return Error(`${node.constructor.name.replace('PM', '')} does not have the ${property} property`);
}

/**
 * @template {string} T
 */
class PMBaseNode {
	/** @type {PMAttribute[] | undefined} */
	#attributes = undefined;
	/** @type {(PMAttribute | PMComment | PMElement | PMInvalid | PMMustacheTag | PMText)[] | undefined} */
	#children = undefined;
	/** @type {string | undefined} */
	#code = undefined;
	/** @type {import("estree").Program | undefined} */
	#content = undefined;
	/** @type {string | undefined} */
	#context = undefined;
	/** @type {string | undefined} */
	#data = undefined;
	/** @type {number} */
	#end;
	/** @type {PMInvalid | undefined} */
	#error = undefined;
	/** @type {string[] | undefined} */
	#ignores = undefined;
	/** @type {string | undefined} */
	#message = undefined;
	/** @type {string | undefined} */
	#name = undefined;
	/** @type {string | undefined} */
	#raw = undefined;
	/** @type {number} */
	#start;
	/** @type {T} */
	#type;
	/** @type {boolean | (PMInvalid | PMMustacheTag | PMText)[] | undefined} */
	#value = undefined;
	/**
	 * @param {{
	 *     attributes?: [];
	 *     children?: [];
	 *     code?: string;
	 *     context?: string;
	 *     content?: import("estree").Program;
	 *     data?: string;
	 *     end?: number;
	 *     ignores?: [];
	 *     message?: string;
	 *     name?: string;
	 *     raw?: string;
	 *     start: number;
	 *     type: T;
	 *     value?: [];
	 * }} options
	 */
	constructor(options) {
		this.#attributes = options.attributes;
		this.#children = options.children;
		this.#code = options.code;
		this.#context = options.context;
		this.#content = options.content;
		this.#data = options.data;
		this.#end = options.end ?? options.start;
		this.#message = options.message;
		this.#ignores = options.ignores;
		this.#name = options.name;
		this.#raw = options.raw;
		this.#start = options.start;
		this.#type = options.type;
		this.#value = options.value;
	}
	/**
	 * @param {PMTemplateNode} node
	 */
	append(node) {
		throw Error(`${this.constructor.name.replace('PM', '')} nodes do not take '${node.type}' as a child.`);
	}
	// These getters are mostly for debugging purposes. They throw an error
	// when you try something fishy with an inheriting node. It's too easy to
	// lie to typescript by casting.
	get attributes() {
		if (this.#attributes) return this.#attributes;
		throw PMError(this, 'attributes');
	}
	get children() {
		if (this.#children) return this.#children;
		throw PMError(this, 'children');
	}
	get code() {
		if (this.#code) return this.#code;
		throw PMError(this, 'code');
	}
	get content() {
		if (this.#content) return this.#content;
		throw PMError(this, 'content');
	}
	get context() {
		if (this.#context) return this.#context;
		throw PMError(this, 'context');
	}
	get data() {
		if (typeof this.#data === 'string') return this.#data;
		throw PMError(this, 'data');
	}
	set data(value) {
		if (typeof this.#data !== 'string') throw PMError(this, 'data');
		this.#data = value;
	}
	get end() {
		return this.#end;
	}
	set end(value) {
		this.#end = value;
	}
	get error() {
		return this.#error;
	}
	set error(value) {
		this.#error = value;
	}
	get ignores() {
		if (this.#ignores) return this.#ignores;
		throw PMError(this, 'ignores');
	}
	get message() {
		if (this.#message) return this.#message;
		throw PMError(this, 'message');
	}
	get name() {
		if (typeof this.#name === 'string') return this.#name;
		throw PMError(this, 'name');
	}
	set name(value) {
		if (typeof this.#name !== 'string') throw PMError(this, 'name');
		this.#name = value;
	}
	get raw() {
		if (typeof this.#raw === 'string') return this.#raw;
		throw PMError(this, 'raw');
	}
	set raw(value) {
		if (typeof this.#raw !== 'string') throw PMError(this, 'raw');
		this.#raw = value;
	}
	get start() {
		if (typeof this.#start === 'number') return this.#start;
		throw PMError(this, 'start');
	}
	get type() {
		if (this.#type) return this.#type;
		throw PMError(this, 'type');
	}
	get value() {
		if (Array.isArray(this.#value) || typeof this.#value === 'boolean') {
			return this.#value;
		}
		throw PMError(this, 'value');
	}
	set value(value) {
		if (Array.isArray(this.#value) || typeof this.#value === 'boolean') {
			this.#value = value;
		} else {
			throw PMError(this, 'value');
		}
	}
}

/** @extends {PMBaseNode<'Attribute'>} */
export class PMAttribute extends PMBaseNode {
	/**
	 * @param {Object} options
	 * @param {string} options.name
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ name, start, end }) {
		super({
			end,
			name,
			start,
			type: 'Attribute',
			value: [],
		});
	}

	/**
	 * @param {PMTemplateNode} node
	 */
	append(node) {
		switch (node.type) {
			case 'MustacheTag':
			case 'Text':
				if (Array.isArray(this.value)) {
					this.value.push(node);
				} else {
					this.value = [node];
				}
				break;
			default:
				super.append(node);
		}
	}
	valueOf() {
		return {
			start: this.start,
			end: this.end,
			type: this.type,
			name: this.name,
			value: Array.isArray(this.value)
				? this.value.map((value) => value.valueOf())
				: this.value,
			error: this.error?.valueOf(),
		};
	}
}

/** @extends {PMBaseNode<'Comment'>} */
export class PMComment extends PMBaseNode {
	/**
	 * @param {Object} options
	 * @param {string} options.data
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ data, start, end }) {
		super({
			data,
			end,
			ignores: [],
			start,
			type: 'Comment',
		});
	}
	valueOf() {
		// Add error first to maintain order in test snapshot
		/** @type {{} | { error: ReturnType<PMInvalid['valueOf']> }} */
		let value = {};
		if (this.error) {
			value = {
				error: this.error?.valueOf(),
			};
		}
		return {
			...value,
			start: this.start,
			end: this.end,
			type: this.type,
			data: this.data,
			ignores: this.ignores,
		};
	}
}

/** @extends {PMBaseNode<'Element'>} */
export class PMElement extends PMBaseNode {
	/**
	 * @typedef {PMComment | PMElement | PMInvalid | PMText} PMElementChild
	 *
	 * @type {PMElementChild[]}
	 */
	#children = [];
	/**
	 * @param {Object} options
	 * @param {string} options.name
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ name, start, end }) {
		super({
			attributes: [],
			children: [],
			end,
			name,
			start,
			type: 'Element',
		});
	}

	/**
	 * @param {PMElementChild | PMAttribute} node
	 */
	append(node) {
		if (node.type === 'Attribute') {
			this.attributes.push(node);
		} else if (node.type === 'Comment' || node.type === 'Element' || node.type === 'Invalid') {
			this.#children.push(node);
		} else if (node.type === 'Text') {
			const lastChild = this.#children.at(-1);
			if (lastChild?.type === 'Text') {
				lastChild.end = node.end;
				lastChild.raw += node.raw;
				lastChild.data = lastChild.raw;
			} else {
				this.#children.push(node);
			}
		} else {
			super.append(node);
		}
	}
	get children() {
		return this.#children;
	}
	/**
	 * @typedef {{
	 *     error?: ReturnType<PMInvalid['valueOf']>,
	 *     start: number,
	 *     end: number,
	 *     type: PMElement['type'],
	 *     name: string,
	 *     attributes: ReturnType<PMAttribute['valueOf']>[],
	 *     children: ReturnType<PMElementChild['valueOf']>[],
	 * }} ElementValueOf
	 * @returns {ElementValueOf}
	 */
	valueOf() {
		// Maintain order of test snapshot
		return {
			start: this.start,
			end: this.end,
			type: this.type,
			name: this.name,
			attributes: this.attributes.map((attribute) => attribute.valueOf()),
			children: this.#children.map((child) => child.valueOf()),
			error: this.error?.valueOf(),
		};
	}
}

/**
 * @extends {PMBaseNode<'Fragment'>}
 */
export class PMFragment extends PMBaseNode {
	/**
	 * @param {Object} options
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ start, end }) {
		super({
			children: [],
			end,
			start,
			type: 'Fragment',
		});
	}

	/**
	 * @param {PMTemplateNode} node
	 */
	append(node) {
		switch (node.type) {
			case 'Comment':
			case 'Element':
				this.children.push(node);
				break;
			case 'Text': {
				const lastChild = this.children.at(-1);
				if (lastChild?.type === 'Text') {
					lastChild.end = node.end;
					lastChild.raw += node.raw;
					lastChild.data = lastChild.raw;
				} else {
					this.children.push(node);
				}
				break;
			}
			default:
				super.append(node);
		}
	}
	valueOf() {
		// Maintain order of test snapshot
		return {
			error: this.error?.valueOf(),
			start: this.start,
			end: this.end,
			type: this.type,
			children: this.children?.map((child) => child.valueOf()),
		};
	}
}

/** @extends {PMBaseNode<'Invalid'>} */
export class PMInvalid extends PMBaseNode {
	/**
	 * @param {Object} options
	 * @param {string} options.code
	 * @param {string} options.message
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ code, message, start, end }) {
		super({
			code,
			end,
			message,
			type: 'Invalid',
			start,
		});
	}
	valueOf() {
		// Maintain order of test snapshot
		return {
			code: this.code,
			message: this.message,
			start: this.start,
			end: this.end,
			type: this.type,
		};
	}
}

/** @extends {PMBaseNode<'MustacheTag'>} */
export class PMMustacheTag extends PMBaseNode {
	/**
	 * @param {Object} options
	 * @param {string} options.raw
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ raw, start, end }) {
		super({
			end,
			raw,
			start,
			type: 'MustacheTag',
		});
	}
	valueOf() {
		const json = {};
		const start = this.start + 1;
		const source = `${' '.repeat(start)}${this.raw}`.trimEnd();
		const end = source.length - 1;
		try {
			const expressions = [];
			let current = start;
			while (current < end) {
				const expression = acorn.parseExpressionAt(source, current);
				current = expression.end;
				expressions.push(expression);
			}
			if (expressions.length > 1) {
				const invalid = new PMInvalid({
					start: expressions.at(1).start,
					end,
					code: 'invalid-javascript-multiple-expression',
					message: 'Expected a single expression in between the curly braces',
				});
				json.error = invalid.valueOf();
			} else {
				json.expression = expressions[0];
			}
		} catch (/** @type {any} */ error) {
			const invalid = new PMInvalid({
				start: error.raisedAt,
				end: this.end,
				code: 'invalid-javascript-expression',
				message: error.message,
			});
			json.error = invalid.valueOf();
		}

		return json;
	}
}

/** @extends {PMBaseNode<'Script'>} */
export class PMScript extends PMBaseNode {
	/**
	 * @param {Object} options
	 * @param {import("estree").Program} options.content
	 * @param {string} options.context
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ content, context, start, end }) {
		super({
			type: 'Script',
			start,
			end,
			context,
			content,
		});
	}
	valueOf() {
		// Maintain order of test snapshot
		return {
			type: this.type,
			start: this.start,
			end: this.end,
			context: this.context,
			// convert to plain object
			content: structuredClone(this.content),
		};
	}
}

/** @extends {PMBaseNode<'Text'>} */
export class PMText extends PMBaseNode {
	/**
	 * @param {Object} options
	 * @param {string} options.data
	 * @param {string} options.raw
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ data, raw, start, end }) {
		super({
			data,
			raw,
			end,
			start,
			type: 'Text',
		});
	}
	valueOf() {
		// Maintain order of test snapshot
		return {
			start: this.start,
			end: this.end,
			type: this.type,
			raw: this.raw,
			data: this.data,
		};
	}
}
