<script lang="ts">
	import { timer, selectedLanguage } from '$lib/Stores';
	import { getContext } from 'svelte';
	import { readable } from 'svelte/store';
	import type { Writable } from 'svelte/store';

	export let hour12: boolean | undefined = undefined;
	export let seconds: boolean | undefined = undefined;

	const _collapsedCtx = getContext<Writable<boolean> | undefined>('sidebarCollapsed');
	const collapsedCtx = _collapsedCtx ?? readable(false);
	$: collapsed = $collapsedCtx;

	$: time = $timer.toLocaleTimeString($selectedLanguage, {
		hour: hour12 ? 'numeric' : '2-digit',
		minute: '2-digit',
		second: seconds && !collapsed ? '2-digit' : undefined,
		hour12: hour12
	});
</script>

<div class:collapsed>
	{time}
</div>

<style>
	div {
		padding: var(--theme-sidebar-item-padding);
		font-weight: 500;
		line-height: 2.8rem;
		font-size: var(--theme-sizes-sidebar-time);
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-left: -0.1rem;
	}

	.collapsed {
		padding: 0.3rem 0;
		text-align: center;
		font-size: 0.82rem;
		line-height: 1.6rem;
		margin-left: 0;
		letter-spacing: -0.03em;
		width: 100%;
		overflow: visible;
		text-overflow: clip;
		white-space: nowrap;
	}
</style>
