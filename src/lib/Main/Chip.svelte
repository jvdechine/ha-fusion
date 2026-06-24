<script lang="ts">
	import { states, onStates, editMode, configuration } from '$lib/Stores';
	import { getName } from '$lib/Utils';
	import { openModal } from 'svelte-modals';
	import { base } from '$app/paths';
	import ComputeIcon from '$lib/Components/ComputeIcon.svelte';
	import StateLogic from '$lib/Components/StateLogic.svelte';
	import Icon from '@iconify/svelte';

	export let sel: any;
	export let demo: string | undefined = undefined;

	$: entity_id = demo || sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: stateOn = $onStates.includes(entity?.state);
	$: name = sel?.name || getName(sel, entity) || entity_id || '';
	$: iconColor = stateOn
		? sel?.color || 'var(--theme-button-background-color-on)'
		: 'rgba(255, 255, 255, 0.4)';
	$: stateLabel = stateOn ? sel?.state_on || undefined : sel?.state_off || undefined;

	$: isUrlIcon = sel?.icon?.startsWith('/') || sel?.icon?.startsWith('http');
	$: iconSrc = (() => {
		if (!isUrlIcon || !sel?.icon?.startsWith('/') || !$configuration?.hassUrl || $configuration?.ingress) {
			return sel?.icon;
		}
		const token = $configuration?.token ? `&token=${encodeURIComponent($configuration.token)}` : '';
		return `${base}/_api/camera_proxy?path=${encodeURIComponent(sel.icon)}${token}`;
	})();

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/ChipConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="chip" class:edit={$editMode} on:click={handleClick}>
	<div class="icon" style:color={iconColor}>
		{#if isUrlIcon}
			<img src={iconSrc} alt="" class="icon-img" />
		{:else if sel?.icon}
			<Icon icon={sel.icon} height="1rem" />
		{:else if entity_id}
			<ComputeIcon {entity_id} size="1rem" skipEntityPicture={true} />
		{/if}
	</div>

	<div class="info">
		<span class="name">{name}</span>
		<span class="state">
			{#if stateLabel}
				{stateLabel}
			{:else}
				<StateLogic {entity_id} selected={sel} />
			{/if}
		</span>
	</div>
</div>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 1rem;
		background: var(--theme-button-background-color-off);
		border-radius: 2rem;
		white-space: nowrap;
		user-select: none;
		cursor: default;
		height: 45px;
		box-sizing: border-box;
		margin-right: 0.5rem;
	}

	.chip.edit {
		cursor: pointer;
		outline: 2px dashed rgba(255, 255, 255, 0.25);
		outline-offset: 2px;
	}

	.icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		transition: color 200ms ease;
	}

	.icon-img {
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
		min-width: 0;
	}

	.name {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.5);
		line-height: 1.15;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.state {
		font-size: 0.75rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.15;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
