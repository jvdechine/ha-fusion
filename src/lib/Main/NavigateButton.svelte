<script lang="ts">
	import { editMode, itemHeight, ripple, dashboard, currentViewId } from '$lib/Stores';
	import Icon, { loadIcon } from '@iconify/svelte';
	import { openModal } from 'svelte-modals';
	import Ripple from 'svelte-ripple';
	import type { NavigateButtonItem } from '$lib/Types';

	export let sel: NavigateButtonItem;

	$: targetView = $dashboard?.views?.find((v) => v.id === sel?.navigate_to);
	$: icon = sel?.icon || targetView?.icon || 'mdi:arrow-right-circle';
	$: name = sel?.name || targetView?.name || 'Navegar';
	$: color = sel?.color || 'rgb(75, 166, 237)';

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/NavigateButtonConfig.svelte'), { sel });
		} else if (sel?.navigate_to != null) {
			$currentViewId = sel.navigate_to;
		}
	}

	async function handlePointer() {
		if ($editMode) {
			await import('$lib/Modal/NavigateButtonConfig.svelte');
		}
	}
</script>

<div
	class="container"
	style:min-height="{$itemHeight}px"
	on:click={handleClick}
	on:pointerenter={handlePointer}
	on:pointerdown={handlePointer}
	on:keydown
	role="button"
	tabindex="0"
	use:Ripple={{
		...$ripple,
		color: $editMode ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0.15)'
	}}
>
	<div class="left">
		<div class="icon" style:--icon-color={color}>
			{#await loadIcon(icon)}
				<Icon icon="mdi:arrow-right-circle" height="none" width="100%" />
			{:then resolvedIcon}
				<Icon icon={resolvedIcon} height="none" width="100%" />
			{:catch}
				<Icon icon="mdi:arrow-right-circle" height="none" width="100%" />
			{/await}
		</div>
	</div>

	<div class="right">
		<div class="name">{name}</div>
		<div class="state">{targetView?.name ?? ''}</div>
	</div>
</div>

<style>
	.container {
		background-color: var(--theme-button-background-color-off);
		font-family: inherit;
		width: 100%;
		height: 100%;
		display: grid;
		border-radius: 0.65rem;
		margin: 0;
		grid-template-columns: min-content auto;
		grid-template-areas: 'left right';
		--container-padding: 0.72rem;
		cursor: pointer;
		transform: translateZ(0);
		overflow: hidden;
	}

	.left {
		display: inherit;
		padding: var(--container-padding);
	}

	.right {
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
		padding-right: var(--container-padding);
	}

	.icon {
		--icon-size: 2.4rem;
		height: var(--icon-size);
		width: var(--icon-size);
		color: rgb(200 200 200);
		background-color: var(--icon-color);
		border-radius: 50%;
		display: flex;
		padding: 0.5rem;
	}

	.name {
		font-weight: 500;
		color: var(--theme-button-name-color-off);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 0.95rem;
		margin-top: -1px;
	}

	.state {
		font-weight: 400;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--theme-button-state-color-off);
		font-size: 0.925rem;
		margin-top: 1px;
	}

	@media all and (max-width: 768px) {
		.container {
			width: calc(50vw - 1.45rem);
		}
	}
</style>
