<script lang="ts">
	import { dashboard, motion, record, ripple } from '$lib/Stores';
	import Ripple from 'svelte-ripple';
	import Icon from '@iconify/svelte';
	import { generateId } from '$lib/Utils';
	import { createEventDispatcher } from 'svelte';

	export let view: any;

	$: noViews = !$dashboard?.views?.length;

	const dispatch = createEventDispatcher();

	function handleClick() {
		if (!view || !view.sections) return;

		view.sections = [
			{
				type: 'chips',
				name: 'Chips',
				items: [],
				id: generateId($dashboard)
			},
			...view.sections
		];

		$dashboard = $dashboard;
		$record();
		dispatch('clicked');
	}
</script>

<button
	class="button dropdown"
	on:click={handleClick}
	use:Ripple={{
		...$ripple,
		opacity: noViews ? '0' : $ripple.opacity
	}}
	style:cursor={noViews ? 'unset' : 'pointer'}
	style:opacity={noViews ? '0.5' : '1'}
	style:transition="opacity {$motion}ms ease"
>
	<figure>
		<Icon icon="mdi:tag-multiple-outline" height="none" />
	</figure>

	Chips
</button>
