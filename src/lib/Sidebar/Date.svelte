<script lang="ts">
	import { timer, selectedLanguage } from '$lib/Stores';
	import { getContext } from 'svelte';
	import { readable } from 'svelte/store';
	import type { Writable } from 'svelte/store';

	export let short_day: boolean | undefined = undefined;
	export let short_month: boolean | undefined = undefined;
	export let hide: string | undefined = undefined;
	export let layout: string | undefined = undefined;

	const _collapsedCtx = getContext<Writable<boolean> | undefined>('sidebarCollapsed');
	const collapsedCtx = _collapsedCtx ?? readable(false);
	$: collapsed = $collapsedCtx;

	$: weekDay = $timer.toLocaleDateString($selectedLanguage, {
		weekday: short_day ? 'short' : 'long'
	});

	$: shortDate = $timer.toLocaleDateString($selectedLanguage, {
		day: 'numeric',
		month: short_month ? 'short' : 'long'
	});

	$: dayNum = $timer.toLocaleDateString($selectedLanguage, { day: 'numeric' });
	$: monthAbbr = $timer.toLocaleDateString($selectedLanguage, { month: 'short' });

	$: orientation = layout || 'vertical';
</script>

{#if collapsed}
	<div class="collapsed">
		<span class="day-num">{dayNum}</span>
		<span class="month-abbr">{monthAbbr}</span>
	</div>
{:else}
	<div>
		{#if orientation === 'vertical'}
			{#if hide !== 'day'}
				{weekDay}<br />
			{/if}

			{#if hide !== 'month'}
				{shortDate}<br />
			{/if}
		{/if}
		{#if orientation === 'horizontal'}
			{weekDay},&nbsp;{shortDate}
		{/if}
	</div>
{/if}

<style>
	div {
		padding: var(--theme-sidebar-item-padding);
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	div::first-letter {
		text-transform: capitalize;
	}

	.collapsed {
		padding: 0.3rem 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		width: 100%;
		line-height: 1.3;
	}

	.day-num {
		font-weight: 600;
		font-size: 1.45rem;
		white-space: nowrap;
	}

	.month-abbr {
		font-size: 0.8rem;
		opacity: 0.7;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		white-space: nowrap;
	}
</style>
