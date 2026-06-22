<script lang="ts">
	import { editMode, itemHeight, ripple, states, connection, config, templates } from '$lib/Stores';
	import Icon, { loadIcon } from '@iconify/svelte';
	import { openModal } from 'svelte-modals';
	import { onDestroy } from 'svelte';
	import Ripple from 'svelte-ripple';
	import type { RemoteControlItem } from '$lib/Types';

	export let sel: RemoteControlItem;

	$: icon = sel?.icon || 'mdi:remote';
	$: name = sel?.name || 'Remote';

	$: template = $templates?.[sel?.id!];
	$: isColorTemplate = !!(sel?.color?.includes('{%') || sel?.color?.includes('{{'));
	$: color = (isColorTemplate && template?.color?.output)
		? String(template.color.output).trim()
		: (sel?.color || 'rgb(75, 166, 237)');

	$: if ($config?.state === 'RUNNING' && sel?.id && isColorTemplate && sel.color) {
		const sameInput = sel.color === template?.color?.input;
		const sameEntity = sel?.entity_id === template?.color?.entity_id;
		if (!sameInput || !sameEntity) renderColorTemplate(sel.color);
	}

	let unsubscribeColor: (() => void) | undefined;

	async function renderColorTemplate(value: string) {
		if (!$connection || !sel?.id) return;
		unsubscribeColor?.();
		try {
			const id = sel.id!;
			unsubscribeColor = await $connection.subscribeMessage(
				(response: { result: string } | { error: string; level: 'ERROR' | 'WARNING' }) => {
					if ('result' in response) {
						$templates[id] = {
							...$templates[id],
							color: { input: value, output: String(response.result), error: undefined, entity_id: sel?.entity_id }
						};
					}
				},
				{
					type: 'render_template',
					template: value,
					report_errors: true,
					variables: { entity_id: sel?.entity_id }
				}
			);
		} catch (e) {
			console.error('Remote color template:', e);
		}
	}

	onDestroy(() => unsubscribeColor?.());

	const stateMap: Record<string, string> = {
		on: 'Ligada',
		off: 'Desligada',
		playing: 'Tocando',
		paused: 'Pausada',
		idle: 'Ociosa',
		standby: 'Em espera',
		unavailable: 'Indisponível',
		unknown: 'Desconhecido'
	};

	$: entity = sel?.entity_id ? $states?.[sel.entity_id] : undefined;
	$: stateLabel = stateMap[entity?.state ?? ''] ?? entity?.state ?? '';

	async function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/RemoteConfig.svelte'), { sel });
		} else {
			openModal(() => import('$lib/Modal/RemoteModal.svelte'), { sel });
		}
	}

	async function handlePointer() {
		if ($editMode) {
			await import('$lib/Modal/RemoteConfig.svelte');
		} else {
			await import('$lib/Modal/RemoteModal.svelte');
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
				<Icon icon="mdi:remote" height="none" width="100%" />
			{:then resolvedIcon}
				<Icon icon={resolvedIcon} height="none" width="100%" />
			{:catch}
				<Icon icon="mdi:remote" height="none" width="100%" />
			{/await}
		</div>
	</div>

	<div class="right">
		<div class="name">{name}</div>
		<div class="state">{stateLabel}</div>
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
