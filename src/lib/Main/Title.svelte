<script lang="ts">
	import { editMode, currentViewId, dashboard } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import type { TitleItem } from '$lib/Types';

	export let sel: TitleItem;

	$: currentView = $dashboard?.views?.find((v) => v.id === $currentViewId);
	$: text = sel?.name || currentView?.name || '';

	$: fontSize =
		sel?.size === 'small' ? '1.1rem' : sel?.size === 'large' ? '2rem' : '1.5rem';

	$: color = sel?.color || 'inherit';
	$: align = sel?.align || 'left';

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/TitleConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="title"
	class:edit={$editMode}
	style:font-size={fontSize}
	style:color
	style:text-align={align}
	on:click={handleClick}
>
	{text}
</div>

<style>
	.title {
		width: 100%;
		font-weight: 700;
		letter-spacing: -0.01em;
		padding: 0.1rem 0;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: inherit;
	}

	.title.edit {
		cursor: pointer;
		outline: 2px dashed rgba(255, 255, 255, 0.3);
		outline-offset: 4px;
		border-radius: 4px;
	}
</style>
