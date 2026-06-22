<script lang="ts">
	import { dashboard, lang, record, ripple, motion } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import NavigateButton from '$lib/Main/NavigateButton.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Ripple from 'svelte-ripple';
	import { updateObj } from '$lib/Utils';
	import type { NavigateButtonItem } from '$lib/Types';

	export let isOpen: boolean;
	export let sel: NavigateButtonItem;

	let name = sel?.name;
	let icon = sel?.icon;
	let color = sel?.color;

	$: isColorTemplate = !!(color?.includes('{%') || color?.includes('{{'));

	$: views = $dashboard?.views?.filter((v) => !v.isDndShadowItem) ?? [];

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Navegar para</h1>

		<h2>{$lang('preview')}</h2>
		<div class="preview">
			<NavigateButton {sel} />
		</div>

		<h2>Aba de destino</h2>
		<div class="view-list">
			{#each views as view (view.id)}
				<button
					class="view-btn"
					class:selected={sel?.navigate_to === view.id}
					on:click={() => set('navigate_to', view.id)}
					use:Ripple={$ripple}
				>
					{view.name || 'Sem nome'}
				</button>
			{/each}
		</div>

		<h2>{$lang('name')}</h2>
		<InputClear
			condition={name}
			on:clear={() => {
				name = undefined;
				set('name');
			}}
			let:padding
		>
			<input
				type="text"
				class="input"
				bind:value={name}
				on:change={(e) => set('name', e)}
				placeholder="Nome personalizado"
				autocomplete="off"
				spellcheck="false"
				style:padding
			/>
		</InputClear>

		<h2>Icon</h2>
		<InputClear
			condition={icon}
			on:clear={() => {
				icon = undefined;
				set('icon');
			}}
			let:padding
		>
			<input
				type="text"
				class="input"
				bind:value={icon}
				on:change={(e) => set('icon', e)}
				placeholder="mdi:arrow-right-circle"
				autocomplete="off"
				spellcheck="false"
				style:padding
			/>
		</InputClear>

		<h2>Icon Color</h2>
		<div class="color-row">
			{#if !isColorTemplate}
				<input
					type="color"
					class="color-swatch"
					value={color ?? '#4ba6ed'}
					on:input={(e) => {
						color = e.currentTarget.value;
						set('color', e);
					}}
				/>
			{/if}
			<InputClear
				condition={color}
				on:clear={() => {
					color = undefined;
					set('color');
				}}
				let:padding
			>
				{#if isColorTemplate}
					<textarea
						class="input mono"
						bind:value={color}
						on:change={(e) => set('color', e)}
						placeholder="#4ba6ed"
						rows="3"
						autocomplete="off"
						spellcheck="false"
						style:padding
					/>
				{:else}
					<input
						type="text"
						class="input"
						bind:value={color}
						on:change={(e) => set('color', e)}
						placeholder="#4ba6ed"
						autocomplete="off"
						spellcheck="false"
						style:padding
					/>
				{/if}
			</InputClear>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.preview {
		margin-bottom: 0.5rem;
	}

	.view-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 0.25rem;
	}

	.view-btn {
		text-align: left;
		padding: 0.6rem 0.9rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.6rem;
		color: inherit;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.9rem;
		opacity: 0.75;
		transition: opacity 80ms;
	}

	.view-btn:hover {
		opacity: 1;
	}

	.view-btn.selected {
		border-color: rgba(75, 166, 237, 0.6);
		background: rgba(75, 166, 237, 0.1);
		opacity: 1;
	}

	.color-row {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.color-swatch {
		width: 2.6rem;
		height: 2.6rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 0.6rem;
		padding: 0.2rem;
		background: none;
		cursor: pointer;
		flex-shrink: 0;
	}

	textarea {
		resize: none;
	}

	.mono {
		font-family: monospace;
		font-size: 0.82rem;
	}
</style>
