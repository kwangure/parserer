<script>
	import { Code, json } from '@kwangure/strawberry/default/code';
	import { Container } from '@kwangure/strawberry/default/input/container';
	// eslint-disable-next-line
	import { createParser } from '@parserer/svelte';

	const parser = createParser();

	let code = '<d d=ab"/>';

	$: parser.init(code);
	$: rest = code.slice($parser.previous.length + $parser.current.length);
	$: console.log({ rest });
</script>

{$parser.state.name} {$parser.index}
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
		<Code code={JSON.stringify($parser.stack.toJSON(), null, 4)} highlight={json}/>
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
</style>