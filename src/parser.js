import * as acorn from './acorn.js';
import * as h from 'hine';
import { PMAttribute, PMComment, PMElement, PMFragment, PMInvalid, PMMustacheTag, PMScript, PMText } from './nodes.js';
import { closingTagOmitted } from './utils/html.js';
import { createAfterAttributeName } from './states/afterAttributeName.js';
import { createAfterAttributeValueQuoted } from './states/afterAttributeValueQuoted.js';
import { createAttributeName } from './states/attributeName.js';
import { createAttributeValueMustache } from './states/attributeValueMustache.js';
import { createAttributeValueQuoted } from './states/attributeValueQuoted.js';
import { createAttributeValueUnquoted } from './states/attributeValueUnquoted.js';
import { createBeforeAttributeName } from './states/beforeAttributeName.js';
import { createBeforeAttributeValue } from './states/beforeAttributeValue.js';
import { createBeforeEndTagClose } from './states/beforeEndTagClose.js';
import { createComment } from './states/comment/index.js';
import { createDone } from './states/done.js';
import { createEndTagName } from './states/endTagName.js';
import { createEndTagOpen } from './states/endTagOpen.js';
import { createEndTagVoid } from './states/endTagVoid.js';
import { createFragment } from './states/fragment.js';
import { createInvalid } from './states/invalid.js';
// import { createNotImplemented } from './states/notImplemented.js';
import { createSelfClosingTag } from './states/selfClosingTag.js';
import { createTagName } from './states/tagName.js';
import { createTagOpen } from './states/tagOpen.js';
import { createText } from './states/text.js';
import { PMStack } from './stack.js';

/** @typedef {import('./nodes.js').PMElementChild} ElementChild */

export const EOF = Symbol('EOF');
/**
 * @param {string} char
 */
function quoteChar(char) {
	return char === '\'' ? `"${char}"` : `'${char}'`;
}

export function createParser() {
	let error = /** @type {{ code: string; message: string } | null} */(null);
	let index = 0;
	let mustacheDepth = 0;
	const maybeStack = new PMStack();
	const stack = new PMStack();
	let openQuote = /** @type {'"' | '\''} */'\'';
	let source = '';

	const parser = h.compound({
		actions: {
			'$index.increment': h.action(() => {
				index += 1;
			}),
			'$stack.addData': h.action((/** @type {string} */ value) => {
				stack.peek().data += value;
			}),
			'$stack.addEnd': h.action(() => {
				stack.peek().end = index;
			}),
			'addName': new h.Action({
				name: '$stack.addName',
				/** @param {string} value */
				run(value) {
					stack.peek().name += value;
				},
			}),
			'$stack.addRaw': h.action((/** @type {string} */ value) => {
				stack.peek().raw += value;
			}),
			'$stack.fromMaybeStack': h.action(() => {
				stack.push(maybeStack.peek());
			}),
			'$stack.pop': h.action(() => {
				stack.pop();
			}),
			'$stack.popAttribute': h.action(() => {
				const current = stack.pop({ expect: 'Attribute' });
				if (Array.isArray(current.value) && current.value.length < 1) {
					current.end = current.start + current.name.length;
					current.value = true;
				} else {
					current.end = index;
				}
				const parent = stack.peek();
				parent.append(current);
			}),
			'$stack.popComment': h.action(() => {
				const current = stack.pop({ expect: 'Comment' });

				current.data = current.data.slice(0, -2);
				current.end = index;
				const last = stack.peek();
				last.append(current);
				last.end = index;
			}),
			'$stack.popElement': h.action(() => {
				const closingTag = stack.pop({ expect: 'Element' });
				if (stack.size < 2) {
					const last = stack.peek();
					last.error = new PMInvalid({
						start: closingTag.start,
						end: index,
						code: 'invalid-closing-tag',
						message: `</${closingTag.name}> attempted to close a tag that was not open`,
					});
					return;
				}

				const openingTag = stack.pop({ expect: 'Element' });
				openingTag.end = index;
				if (closingTag.name !== openingTag.name) {
					openingTag.error = new PMInvalid({
						start: closingTag.start,
						end: index,
						code: 'invalid-closing-tag',
						message: `</${closingTag.name}> attempted to close a tag that was not open`,
					});
				}
				const last = stack.peek();
				last.append(openingTag);
				last.end = index;
			}),
			'$stack.popAutoclosedSibling': h.action(() => {
				const parentTag = stack.peek({ depth: 3 });
				const autoclosedTag = stack.pop({ expect: 'Element', depth: 2 });
				const trailingTag = stack.peek({ expect: 'Element', depth: 1 });

				autoclosedTag.end = trailingTag.start;
				parentTag.append(autoclosedTag);
			}),
			'$stack.popAutoclosedEOF': h.action(() => {
				const parentTag = stack.peek({ expect: 'Fragment', depth: 2 });
				const autoclosedTag = stack.pop({ expect: 'Element', depth: 1 });

				autoclosedTag.end = index;
				parentTag.append(autoclosedTag);
			}),
			'$stack.popSelfClosingElement': h.action(() => {
				const current = stack.pop({ expect: 'Element' });
				current.end = index;
				const last = stack.peek({ expect: 'Fragment' });
				last.append(current);
				last.end = index;
			}),
			'$stack.popInvalid': h.action(() => {
				const invalid = stack.pop({ expect: 'Invalid' });
				invalid.end = index;

				const nodeWithError = /** @type {ElementChild} */(stack.pop());
				nodeWithError.end = index;
				nodeWithError.error = invalid;

				const parent = /** @type {ElementChild} */(stack.peek());
				parent.append(nodeWithError);
				parent.end = index;
			}),
			'$stack.popMustache': h.action(() => {
				const current = stack.pop({ expect: 'MustacheTag' });
				const parent = stack.peek({ expect: 'Attribute' });
				current.end = index;
				parent.append(current);
			}),
			'$stack.popText': h.action(() => {
				const current = stack.pop({ expect: 'Text' });
				const parent = stack.peek();
				current.end = index;
				// TODO: decode html character entities
				// https://github.com/sveltejs/svelte/blob/dd11917fe523a66d8f5d66aab8cbcf965f30f25f/src/compiler/parse/state/tag.ts#L521
				current.data = current.raw;
				parent.append(current);
			}),
			'$stack.pushAttribute': h.action(() => {
				const child = new PMAttribute({
					start: Number(index),
					name: '',
				});
				stack.push(child);
			}),
			'$stack.pushComment': h.action(() => {
				const tag = stack.pop({ expect: 'Element' });
				const child = new PMComment({
					start: tag.start,
					data: '',
				});
				stack.push(child);
			}),
			'$stack.pushInvalid': h.action((/** @type {string} */ value) => {
				if (!error) {
					console.error('Unknown error code');
					error = {
						code: 'unknown-error',
						message: `Unexpected character '${value}'`,
					};
				}
				const child = new PMInvalid({
					start: Number(index),
					...error,
				});
				stack.push(child);
				error = null;
			}),
			'$stack.pushTag': h.action(() => {
				const child = (new PMElement({
					start: Number(index),
					name: '',
				}));
				stack.push(child);
			}),
			'$stack.pushMustache': h.action(() => {
				const child = new PMMustacheTag({
					start: Number(index),
					raw: '',
				});
				stack.push(child);
			}),
			'$stack.pushText': h.action(() => {
				const child = new PMText({
					start: Number(index),
					data: '',
					raw: '',
				});
				stack.push(child);
			}),
			'$maybeStack.addRaw': h.action((/** @type {string} */ value) => {
				maybeStack.peek().raw += value;
			}),
			'$maybeStack.pop': h.action(() => {
				maybeStack.pop();
			}),
			'$maybeStack.popText': h.action(() => {
				const current = maybeStack.pop({ expect: 'Text' });
				const parent = maybeStack.peek();
				current.end = index;
				// TODO: decode html character entities
				// https://github.com/sveltejs/svelte/blob/dd11917fe523a66d8f5d66aab8cbcf965f30f25f/src/compiler/parse/state/tag.ts#L521
				current.data = current.raw;
				parent.append(current);
			}),
			'$maybeStack.pushText': h.action(() => {
				const child = new PMText({
					start: Number(index),
					data: '',
					raw: '',
				});
				maybeStack.push(child);
			}),
			'$openQuote.set': h.action((/** @type {string} */ value) => {
				openQuote = value;
			}),
			'$error.incompleteComment': h.action((/** @type {string} */ value) => {
				error = {
					code: 'incomplete_comment',
					message: `Expected a valid comment character but instead found ${quoteChar(value)}`,
				};
			}),
			'$error.invalidTagName': h.action((/** @type {string} */ value) => {
				error = {
					code: 'invalid_tag_name',
					message: `Expected a valid tag character but instead found ${quoteChar(value)}`,
				};
			}),
			'$error.invalidVoidContent': h.action(() => {
				const current = /** @type {PMElement} */(stack.peek());

				error = {
					code: 'invalid-void-content',
					message: `<${current.name}> is a void element and cannot have children, or a closing tag`,
				};
			}),
			'$error.invalidAttributeName': h.action((/** @type {string} */ value) => {
				error = {
					code: 'invalid_attribute_name',
					message: `Expected a valid attribute character but instead found ${quoteChar(value)}`,
				};
			}),
			'$error.invalidUnquotedValue': h.action((/** @type {string} */ value) => {
				error = {
					code: 'invalid_unquoted_value',
					message: `${quoteChar(value)} is not permitted in unquoted attribute values`,
				};
			}),
			'$error.unclosedBlock': h.action(() => {
				/** @typedef {PMAttribute | PMComment | PMElement} Block */

				const current = /** @type {Block} */(
					stack.peek()
				);
				const types = {
					Attribute: 'tag',
					Comment: 'comment',
					Element: 'tag',
				};
				const type = types[current.type] || 'block';
				error = {
					code: `unclosed-${type}`,
					message: `${type[0].toUpperCase() + type.substring(1)} was left open`,
				};
			}),
			'$mustacheDepth.increment': h.action(() => mustacheDepth += 1),
			'$mustacheDepth.decrement': h.action(() => mustacheDepth -= 1),
		},
		conditions: {
			isAlphaCharacter: h.condition((/** @type {string} */ value) => (/[A-z]/).test(value)),
			isDone: h.condition(() => index === source.length),
			isEquals: h.condition((/** @type {string} */ value) => value === '='),
			isExclamation: h.condition((/** @type {string} */ value) => value === '!'),
			isForwardSlash: h.condition((/** @type {string} */ value) => value === '/'),
			isInvalidUnquotedValue: h.condition((/** @type {string} */ value) => (/[\s"'=<>`]/).test(value)),
			isMinus: h.condition((/** @type {string} */ value) => value === '-'),
			isNonAlphaCharacter: h.condition((/** @type {string} */ value) => !(/[A-z]/).test(value)),
			isQuote: h.condition((/** @type {string} */ value) => value === '"' || value === '\''),
			isQuoteClosed: h
				.condition((/** @type {string} */ value) => value == openQuote),
			isSvelteMustacheClosed: h.condition((/** @type {string} */ value) => value === '}'),
			isSvelteMustacheOpen: h.condition((/** @type {string} */ value) => value === '{'),
			isSveltemustacheDepthDone: h.condition((/** @type {string} */ value) => mustacheDepth === 0 && value === '}'),
			isTagClose: h.condition((/** @type {string} */ value) => value === '>'),
			isTagOpen: h.condition((/** @type {string} */ value) => value === '<'),
			isTagCloseAndAutoclosedByParent: h
				.condition((/** @type {string} */ value) => {
					// Is tag close
					if (value !== '>') return false;
					// Could there be an unclosed tag?
					if (stack.size < 2) return false;
					// TODO: What if there's something between them, e.g a comment?
					const lastTag = stack.at(-1);
					const potentialAutoclosedTag = stack.at(-2);

					if (lastTag?.type !== 'Element' || potentialAutoclosedTag?.type !== 'Element') {
						return false;
					}

					if (lastTag.name === potentialAutoclosedTag.name) {
						return false;
					}

					return closingTagOmitted(potentialAutoclosedTag.name);
				}),
			isAutoclosedSibling: h.condition(() => {
				// Could there be an unclosed tag?
				if (stack.size < 2) return false;
				// TODO: What is there's something between them, e.g a comment?
				const lastTag = stack.at(-1);
				const potentialAutoclosedTag = stack.at(-2);

				if (lastTag?.type !== 'Element' || potentialAutoclosedTag?.type !== 'Element') {
					return false;
				}

				return closingTagOmitted(
					potentialAutoclosedTag.name, lastTag.name,
				);
			}),
			isAutoclosedEOF: new h.Condition({
				run() {
					if (!this.conditions.isDone.run()) return false;
					// Could there be an unc)losed tag?
					if (stack.size < 2) return false;
					const potentialAutoclosedTag = stack.at(-1);
					if (potentialAutoclosedTag?.type !== 'Element') {
						return false;
					}
					return closingTagOmitted(potentialAutoclosedTag.name);
				},
			}),
			/** @param {string} value */
			isVoidTag: h.condition((/** @type {string} */ value) => {
				const current = stack.peek({ expect: 'Element' });
				return isVoidElement(current.name + value);
			}),
			/** @param {string} value */
			isWhitespace: h.condition((/** @type {string} */ value) => (/\s/).test(value)),
			stackNotEmpty: h.condition(() => stack.size > 1),
		},
		states: {
			fragment: createFragment(),
			afterAttributeName: createAfterAttributeName(),
			afterAttributeValueQuoted: createAfterAttributeValueQuoted(),
			attributeName: createAttributeName(),
			attributeValueMustache: createAttributeValueMustache(),
			attributeValueQuoted: createAttributeValueQuoted(),
			attributeValueUnquoted: createAttributeValueUnquoted(),
			beforeAttributeName: createBeforeAttributeName(),
			beforeAttributeValue: createBeforeAttributeValue(),
			beforeEndTagClose: createBeforeEndTagClose(),
			comment: createComment(),
			done: createDone(),
			endTagName: createEndTagName(),
			endTagOpen: createEndTagOpen(),
			endTagVoid: createEndTagVoid(),
			invalid: createInvalid(),
			selfClosingTag: createSelfClosingTag(),
			tagName: createTagName(),
			tagOpen: createTagOpen(),
			text: createText(),
		},
	}).start();

	let previous = '';
	let current = '';

	const nonNewLineRE = /[^\n]/g;
	const positionIndicatorRE = / \(\d+:\d+\)$/;

	Object.defineProperties(parser, {
		current: {
			get: () => current,
		},
		index: {
			get: () => index,
		},
		previous: {
			get: () => previous,
		},
		init: {
			/** @param {string} _source */
			value(_source) {
				index = 0;
				source = _source;
				previous = '';
				current = '';
				stack.clear();
				const html = new PMFragment({
					start: index,
				});
				stack.push(html);
				parser.start();
				return this;
			},
		},
		parse: {
			value() {
				while (index < source.length) {
					this.step();
				}
			},
		},
		result: {
			get() {
				const fragment = /** @type {PMFragment} */(stack.at(0));
				const children = fragment.children;

				let instance;
				let module;
				/** @type {PMFragment['children']} */
				const nonscripts = [];
				for (let i = 0; i < children.length; i++) {
					const node = children[i];
					if (node.type !== 'Element' || node.name !== 'script') {
						nonscripts.push(node);
						continue;
					}
					const contextAttribute = node.attributes.find(({ name }) => name === 'context');
					/** @type {'default' | 'module'} */
					let context = 'default';
					if (contextAttribute) {
						const valid = validateContextValue(contextAttribute);
						if (valid) {
							context = valid;
						} else {
							nonscripts.push(node);
							continue;
						}
					}

					let error;
					if (context === 'default' && instance) {
						error = {
							code: 'invalid-script-instance',
							message: 'A component can only have one instance-level <script> element',
						};
					} else if (context === 'module' && module) {
						error = {
							code: 'invalid-script-module',
							message: 'A component can only have one <script context="module"> element',
						};
					}

					if (error) {
						node.error = new PMInvalid({
							start: node.start,
							end: node.end,
							...error,
						});
						nonscripts.push(node);
						continue;
					}

					const scriptChild = node.children[0];
					if (node.children.length > 1 || (node.children.length === 1 && scriptChild.type !== 'Text')) {
						scriptChild.error = new PMInvalid({
							start: scriptChild.start,
							end: scriptChild.end,
							code: 'invalid-script-nested-elements',
							message: 'Script elements cannot have nested children',
						});
						nonscripts.push(node);
					} else {
						const start = scriptChild
							? scriptChild.start
							: source.indexOf('</', node.start);
						const end = scriptChild
							? scriptChild.end
							: start;
						try {
							const code = source
								.slice(0, start)
								.replace(nonNewLineRE, ' ')
									+ (scriptChild ? scriptChild.raw : '');
							const content = acorn.parse(code);
							/** @type {any} */(content).start = start;
							const script = new PMScript({
								start: node.start,
								end: node.end,
								context,
								content,
							});
							if (context === 'default') {
								instance = script;
							} else if (context === 'module') {
								module = script;
							}
						} catch (error) {
							node.error = new PMInvalid({
								// @ts-ignore
								start: error.pos,
								end,
								code: 'parse-error',
								message: /** @type {Error} */(error).message.replace(positionIndicatorRE, ''),
							});
							nonscripts.push(node);
						}
					}

				}

				let start = null;
				let end = null;
				if (nonscripts.length) {
					start = nonscripts[0].start;
					// start after whitespace
					while ((/\s/).test(source[start])) start += 1;
					end = nonscripts[nonscripts.length - 1].end;
					// end before whitespace
					while ((/\s/).test(source[end - 1])) end -= 1;
				}

				return {
					html: {
						...fragment.valueOf(),
						start,
						end,
						type: 'Fragment',
						children: nonscripts.map((node) => node.valueOf()),
					},
					instance: instance?.valueOf(),
					module: module?.valueOf(),
				};

			},
		},
		step: {
			value() {
				const char = source[index];
				if (!char) return;
				parser.dispatch('CHARACTER', char);
				previous += current;
				current = char;
			},
		},
		stack: {
			get: () => stack,
		},
	});

	/**
	 * @typedef {h.CompoundState & {
	 *     readonly current: string;
	 *     readonly index: number;
	 *     readonly previous: string;
	 *     init(_source: string): Parser;
	 *     parse(): void;
	 *     step(): void;
	 *     readonly stack: PMStack;
	 *     result: {
	 *         html: ReturnType<PMFragment['valueOf']>
	 *     };
	 *     subscribe(fn: (arg : Parser) => any): (() => void)
	 * }} Parser
	 */

	return /** @type {Parser} */(parser);
}

/** regex of all html void element names */
const voidElementNamesRE = /^(?:area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;

/**
 * @param {string} name
 */
export function isVoidElement(name) {
	return voidElementNamesRE.test(name) || name.toLowerCase() === '!doctype';
}


/**
 * @param {PMAttribute} context
 * @retur {context is PMAttribute & { value: PMText[] }}
 */
function validateContextValue(context) {
	let error;
	if (typeof context.value === 'boolean') {
		error = {
			code: 'invalid-script-context-boolean',
			message: 'If the context attribute is supplied, its value must be "module"',
		};
	} else if (context.value.length !== 1 || context.value[0].type !== 'Text') {
		error = {
			code: 'invalid-script-context-static',
			message: 'Context attribute must be static',
		};
	} else if (context.value[0].data !== 'default' && context.value[0].data !== 'module') {
		error = {
			code: 'invalid-script-context-value',
			message: 'If the context attribute is supplied, its value must be "module"',
		};
	} else {
		return context.value[0].data;
	}
	if (error) {
		context.error = new PMInvalid({
			start: context.start,
			end: context.end,
			...error,
		});
		return null;
	}
}
