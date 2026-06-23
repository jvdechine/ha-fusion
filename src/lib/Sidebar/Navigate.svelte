<script lang="ts">
	import {
		dashboard,
		currentViewId,
		motion,
		highlightView,
		viewUnderline,
		draggingView,
		editMode,
		lang
	} from '$lib/Stores';
	import { onMount, getContext } from 'svelte';
	import { flip } from 'svelte/animate';
	import Icon from '@iconify/svelte';
	import { readable } from 'svelte/store';
	import type { Writable } from 'svelte/store';

	const _collapsedCtx = getContext<Writable<boolean> | undefined>('sidebarCollapsed');
	const collapsedCtx = _collapsedCtx ?? readable(false);
	$: collapsed = $collapsedCtx;

	export let modalTransitionEnd: boolean | undefined = true;

	let container: HTMLDivElement;
	let clientWidth: number;
	let buttons: { [key: number]: HTMLButtonElement } = {};

	let top: string;
	let left: string;
	let height: string;

	let resizeTimeout: ReturnType<typeof setTimeout>;
	let isResizing: boolean;

	$: transition = `top ${isResizing ? '0' : $motion}ms ease`;

	// if width changes don't transition
	$: if (clientWidth) {
		isResizing = true;
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			isResizing = false;
		}, $motion);
	}

	$: if ($currentViewId && modalTransitionEnd) {
		setDimensions(buttons[$currentViewId]);
	}

	onMount(() => {
		// adding new item wait for motion to properly calculate setDimensions
		setTimeout(() => {
			if ($currentViewId) {
				setDimensions(buttons[$currentViewId]);
			}
		}, $motion);
	});

	function setDimensions(element: HTMLElement) {
		if (container && element) {
			const elementRect = element.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();
			top = elementRect.top - containerRect.top + 'px';
			left = elementRect.left - containerRect.left + 'px';
			height = elementRect.height + 'px';
		}
	}
</script>

{#if collapsed}
	<div class="collapsed-nav">
		{#each $dashboard?.views ?? [] as view (view.id)}
			<button
				class:active={$currentViewId === view.id}
				title={view.name}
				on:click={() => {
					if (!$editMode && view.id && $currentViewId !== view.id) {
						$currentViewId = view.id;
						$highlightView = false;
						$viewUnderline = false;
					}
				}}
			>
				<Icon icon={view?.icon || 'fluent:tab-add-24-filled'} height="20" />
			</button>
		{/each}
	</div>
{:else}
<div class="container" bind:this={container} bind:clientWidth>
	{#if $dashboard?.views?.length !== 0}
		{#each $dashboard?.views as view (view.id)}
			{@const currentView =
				$currentViewId === view.id ||
				view ===
					($dashboard?.views?.find((view) => view?.id === $currentViewId) ||
						($currentViewId === view.id
							? undefined
							: $dashboard?.views?.find((view) => view?.isDndShadowItem)))}
			<button
				tabindex="-1"
				class:selected={($draggingView || !modalTransitionEnd) && currentView}
				style:cursor={$editMode || currentView ? 'unset' : 'pointer'}
				animate:flip={{ duration: $motion }}
				bind:this={buttons[view.id || 0]}
				on:click={() => {
					if (!$editMode && view.id && $currentViewId !== view.id) {
						$currentViewId = view.id;
						$highlightView = false;
						$viewUnderline = false;
					}
				}}
			>
				<div class="content">
					<span class="name">{view.name}</span>

					<span style="height: 1.4rem; width: 1.4rem; min-width: 1.4rem;">
						<Icon icon={view?.icon || 'fluent:tab-add-24-filled'} height="none" />
					</span>
				</div>
			</button>
		{/each}

		{#if !$draggingView && modalTransitionEnd}
			<div class="navigate selected" style:top style:left style:height style:transition></div>
		{/if}
	{:else}
		{$lang('navigate')}
	{/if}
</div>
{/if}

<style>
	.container {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: var(--theme-sidebar-item-padding);
	}

	.selected {
		background-color: var(--theme-navigate-background-color);
		border-radius: 0.4rem;
	}

	.navigate {
		z-index: 0;
		position: absolute;
		pointer-events: none;
		width: 100%;
	}

	.name {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 1.8rem;
	}

	button {
		font-size: inherit;
		position: relative;
		padding: 0.15rem 0.6rem;
		color: inherit;
		width: calc(100% + 1.2rem);
		text-align: start;
		border: none;
		margin-left: -0.6rem;
		background-color: transparent;
		z-index: 1;
		font-family: inherit;
		touch-action: manipulation;
	}

	.collapsed-nav {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.4rem 0;
	}

	.collapsed-nav button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		margin: 0;
		padding: 0;
		border-radius: 0.4rem;
		background-color: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		opacity: 0.55;
		transition: opacity 150ms, background-color 150ms;
		font-size: 0;
	}

	.collapsed-nav button:hover {
		opacity: 1;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.collapsed-nav button.active {
		opacity: 1;
		background-color: var(--theme-navigate-background-color);
		border-radius: 0.4rem;
	}
</style>
