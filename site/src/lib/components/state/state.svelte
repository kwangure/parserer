<script>
	import { Code, json } from '@kwangure/strawberry/default/code';

	/**
	 * @typedef {import('hine').AtomicStateJSON} AtomicStateJSON
	 * @typedef {import('hine').CompoundStateJSON} CompoundStateJSON
	 * @typedef {import('hine').StateNodeJSON} StateNodeJSON
	 */

	/** @type {import('hine').StateNode} */
	export let state;

	/** @type {'stateTree' | 'rendered'} */
	let showing = 'rendered';

	$: stateLines = toLines($state.toJSON());
	$: stateJSONString = joinLines(stateLines);
	$: stateHighlightTokens = toHighlightTokens(json, stateLines, stateJSONString);

	const INDENTATION = 4;
	/**
     * @param {Line[]} lines
	 * @param {string} currentLine
	 * @param {boolean} active,
     * @param {number} depth
     */
	// eslint-disable-next-line max-params
	function pushLine(lines, currentLine, active, depth) {
		const value = ' '.repeat(depth * INDENTATION) + currentLine;
		const start = lines.at(-1)?.end || 0;
		const end = start + value.length + 1;
		lines.push({ active, end, start, value });
	}

	/**
	 * @param {Line[]} lines
	 * @param {string} value
     */
	function append(lines, value) {
		const lastLine = lines[lines.length - 1];
		lastLine.value += value;
		lastLine.end = lastLine.start + lastLine.value.length + 1;
	}
	/**
	 * @typedef {{
	 *     active: boolean;
	 *     end: number,
	 *     start: number,
	 *     value: string;
	 * }} Line
	 */

	const IGNORE_KEYS = new Set(['active']);
	/**
	 * @param {import('$types').JsonValue} json
	 * @param {Line[]} lines
	 * @param {boolean} [isLast]
	 * @param {import('$types').JsonObject | import('$types').JsonArray} [parent]
     */
	// eslint-disable-next-line max-params
	function toLines(json, lines = [], depth = 0, isLast, parent) {
		if (typeof json === 'object') {
			if (json === null) {
				append(lines, ` ${JSON.stringify(json)}`);
			} else if (Array.isArray(json)) {
				if (lines.length) {
					append(lines, ' [');
				} else {
					pushLine(lines, '[', false, depth);
				}
				for (const [index, value] of json.entries()) {
					toLines(value, lines, depth + 1, index === json.length, json);
				}
				pushLine(lines, ']', false, depth);
			} else {
				let active = false;
				if (json.path) {
					// @ts-ignore
					active = state.matches(json.path?.join('.'));
				}
				if (active) console.log({ path: json.path, json });
				if (Array.isArray(parent) || !lines.length) {
					pushLine(lines, '{', false, depth);
				} else {
					append(lines, ' {');
				}

				/** @typedef {[string, import('type-fest').JsonValue]} */
				const entries = Object.entries(json);
				for (const [index, [key, value]] of entries.entries()) {
					if (json.type === 'compound' || json.type === 'atomic') {
						if (IGNORE_KEYS.has(key)) continue;
					}
					if (typeof value !== 'undefined') {
						pushLine(lines, `"${key}":`, active, depth + 1);
						const isLast = index === entries.length;
						toLines(value, lines, depth + 1, isLast, json);
					}
				}

				pushLine(lines, '}', false, depth);
			}
		} else if (typeof json === 'string' || typeof json === 'number' || typeof json === 'undefined') {
			if (Array.isArray(parent) || !lines.length) {
				pushLine(lines, ` ${JSON.stringify(json)}`, false, depth + 1);
			} else {
				append(lines, ` ${JSON.stringify(json)}`);
			}
		} else {
			throw Error(`Not implemented.${typeof json}`);
		}
		if (lines.length && isLast === false) {
			append(lines, ',');
		}

		return lines;
	}

	/**
     * @param {typeof json} highlighter
     * @param {Line[]} lines
     * @param {string} code
     */
	function toHighlightTokens(highlighter, lines, code) {
		const tokenLines = [];
		for (const line of lines) {
			tokenLines.push({
				...line,
				tokens: highlighter(code, {
					from: line.start,
					to: line.end,
				}),
			});
		}
		return tokenLines;
	}

	/**
     * @param {Line[]} lines
     */
	function joinLines(lines) {
		return lines.map((line) => line.value).join('\n');
	}
</script>

<div>
	<button on:click={() => showing = 'rendered'}>
		Show Rendered
	</button>
	<button on:click={() => showing = 'stateTree'}>
		Show State tree
	</button>
</div>


{#if showing === 'rendered'}
	<div class="state">
		{#each stateHighlightTokens as line}
			<div class="line" class:active={line.active}>
				<!-- Single line to reserve 'pre' whitespace -->
				{#each line.tokens as { segment, color }}<span style='color: var(--br-code-token-{color}-color);'>{segment}</span>{/each}</div>
		{/each}
	</div>
{:else if showing === 'stateTree'}
	<Code code={JSON.stringify($state.toJSON(), null, 4)} highlight={json}/>
{/if}


<style>
	.state {
		user-select: text;
		white-space: pre;
		margin-inline-start: var(--br-size-6);
		overflow: auto;
		font-size: 85%;
		line-height: 2;
		background-color: var(--br-code-root-background-color);
		color: var(--br-code-root-font-color);
		border-radius: var(--br-code-root-border-radius);
		font-family: monospace;
	}
	.line.active {
		background-color: hsl(144deg 55% 49% / 20%);
	}
</style>
