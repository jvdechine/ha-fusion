<script lang="ts">
	import { editMode, lang } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import Icon from '@iconify/svelte';
	import type { IframeItem } from '$lib/Types';

	export let sel: IframeItem;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="container"
	on:click={() => {
		if ($editMode) openModal(() => import('$lib/Modal/IframeConfig.svelte'), { sel });
	}}
>
	{#if sel?.url}
		<iframe
			src={sel.url}
			style:height={sel?.size || '400px'}
			style:pointer-events={$editMode ? 'none' : 'unset'}
			title={$lang('iframe')}
		></iframe>
	{:else}
		<div class="placeholder center" style:height={sel?.size || '400px'}>
			<div class="icon">
				<Icon icon="fontisto:world-o" height="none" />
			</div>
		</div>
	{/if}
</div>

<style>
	.container {
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	iframe,
	.placeholder {
		display: block;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.8rem;
		width: 100%;
		background-color: rgba(0, 0, 0, 0.2);
	}

	.center {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.icon {
		opacity: 0.2;
		width: 3.8rem;
		height: 3.8rem;
	}
</style>
