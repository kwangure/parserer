/**
 * @typedef {import("./nodes.js").PMTemplateNode} PMTemplateNode
 */

export class PMStack {
	/** @type {PMTemplateNode[]} */
	#value;
	/**
	 * @param {PMTemplateNode[]} values
	 */
	constructor(...values) {
		this.#value = [...values];
	}
	/**
	 * @param {number} index
	 */
	at(index) {
		return this.#value.at(index);
	}
	clear() {
		this.#value.length = 0;
	}
	/**
	 * @template {PMTemplateNode['type']} T
	 * @param {{ depth?: number, expect?: T } | undefined} [options]
	 */
	peek(options) {
		const { depth = 1, expect } = options || {};
		if (this.#value.length === 0) {
			throw Error('Attempted to peek an empty stack');
		}
		const value = /** @type {PMTemplateNode} */(this.#value.at(-1 * depth));
		if (expect && value.type !== expect) {
			throw Error(`Expected to peek a '${expect}' node, but found a '${value.type}' instead.`);
		}
		return /** @type {Extract<PMTemplateNode, { type: T }>} */(value);
	}
	/**
	 * @template {PMTemplateNode['type']} T
	 * @param {{ depth?: number; expect?: T } | undefined} [options]
	 */
	pop(options = {}) {
		const { depth = 1, expect } = options;
		if (this.#value.length === 0) {
			throw Error('Attempted to pop an empty stack');
		}
		const value = /** @type {PMTemplateNode} */(this.#value.at(-1 * depth));
		if (expect && value.type !== expect) {
			throw Error(`Expected to pop a '${expect}' node, but found a '${value.type}' instead.`);
		}
		return /** @type {Extract<PMTemplateNode, { type: T }>} */(
			this.#value.splice(this.#value.length - depth, 1)[0]
		);
	}
	/** @param {PMTemplateNode[]} values */
	push(...values) {
		return this.#value.push(...values);
	}
	get size() {
		return this.#value.length;
	}
	toJSON() {
		return this.#value.map((node) => node.valueOf());
	}

}
