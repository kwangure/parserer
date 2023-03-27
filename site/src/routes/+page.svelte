<script>
	/* eslint-disable import/no-unresolved */
	import '@kwangure/strawberry/default/button';
	import { Code, json } from '@kwangure/strawberry/default/code';
	import { Container } from '@kwangure/strawberry/default/input/container';
	import { createParser } from '@parserer/svelte';
	import { Diff } from '$lib/components';
	import { parse as svelteParse } from 'svelte/compiler';

	const parser = createParser();

	let code = '<p><p><p>';
	/** @type {'stack' | 'parserer' | 'svelte' | 'diff'} */
	let showing = 'stack';

	$: parser.init(code);
	$: rest = code.slice($parser.previous.length + $parser.current.length);
	$: stack = JSON.stringify($parser.stack, null, 4);
	$: parserer = JSON.stringify($parser.result, null, 4);
	$: svelte = JSON.stringify(parse(code), null, 4);

	/** @param {string} code */
	function parse(code) {
		try {
			return svelteParse(code);
		} catch (error) {
			return error;
		}
	}
</script>

{$parser.state?.name} {$parser.index}
<div class="source">
	<span class='previous'>{$parser.previous}</span>
	<span class='current'>{$parser.current}</span>
	<span class='next'>{rest}</span>
</div>
<div class="double-column">
	<div class='input'>
		<Container>
			<textarea bind:value={code}></textarea>
		</Container>
		<button on:click={() => parser.step()}>Step</button>
		<button on:click={() => parser.parse()}>Parse</button>
		<button on:click={() => parser.init(code)}>Reset</button>
	</div>
	<div class="output">
		<div class="tabs">
			<button class:br-button-primary={showing === 'stack'} on:click={() => showing = 'stack'}>
				Show Stack
			</button>
			<button class:br-button-primary={showing === 'parserer'} on:click={() => showing = 'parserer'}>
				Show Parserer
			</button>
			<button class:br-button-primary={showing === 'svelte'} on:click={() => showing = 'svelte'}>
				Show Svelte
			</button>
			<button class:br-button-primary={showing === 'diff'} on:click={() => showing = 'diff'}>
				Show Diff
			</button>
		</div>
		{#if showing === 'stack'}
			<Code code={stack} highlight={json}/>
		{:else if showing === 'parserer'}
			<Code code={parserer} highlight={json}/>
		{:else if showing === 'svelte'}
			<Code code={svelte} highlight={json}/>
		{:else if showing === 'diff'}
			<Diff currentCode={parserer} currentCodeHighlight={json}
				originalCode={svelte} originalCodeHighlight={json}/>
		{/if}
	</div>
</div>


<style>
	.source {
		display: flex;
	}
	.previous {
		background-color: darkgreen;
	}
	.current {
		background-color: darkblue;
	}
	.output {
		display: flex;
		flex-direction: column;
	}
	.tabs {
		display: flex;
		gap: 8px;
	}
</style>