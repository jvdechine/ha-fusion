<script lang="ts">
	import { dashboard, record, ripple } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Title from '$lib/Main/Title.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Ripple from 'svelte-ripple';
	import { updateObj } from '$lib/Utils';
	import type { TitleItem } from '$lib/Types';

	export let isOpen: boolean;
	export let sel: TitleItem;

	let name = sel?.name;
	let color = sel?.color;

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Título</h1>

		<h2>Preview</h2>
		<div class="preview">
			<Title {sel} />
		</div>

		<h2>Texto</h2>
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
				placeholder="Nome da aba atual"
				autocomplete="off"
				spellcheck="false"
				style:padding
			/>
		</InputClear>

		<h2>Tamanho</h2>
		<div class="button-container">
			<button
				class:selected={sel?.size === 'small'}
				on:click={() => set('size', 'small')}
				use:Ripple={$ripple}
			>Pequeno</button>
			<button
				class:selected={!sel?.size || sel?.size === 'medium'}
				on:click={() => set('size')}
				use:Ripple={$ripple}
			>Médio</button>
			<button
				class:selected={sel?.size === 'large'}
				on:click={() => set('size', 'large')}
				use:Ripple={$ripple}
			>Grande</button>
		</div>

		<h2>Alinhamento</h2>
		<div class="button-container">
			<button
				class:selected={!sel?.align || sel?.align === 'left'}
				on:click={() => set('align')}
				use:Ripple={$ripple}
			>Esquerda</button>
			<button
				class:selected={sel?.align === 'center'}
				on:click={() => set('align', 'center')}
				use:Ripple={$ripple}
			>Centro</button>
			<button
				class:selected={sel?.align === 'right'}
				on:click={() => set('align', 'right')}
				use:Ripple={$ripple}
			>Direita</button>
		</div>

		<h2>Cor</h2>
		<div class="color-row">
			{#if !color?.includes('{%') && !color?.includes('{{')}
				<input
					type="color"
					class="color-swatch"
					value={color ?? '#ffffff'}
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
				<input
					type="text"
					class="input"
					bind:value={color}
					on:change={(e) => set('color', e)}
					placeholder="#ffffff"
					autocomplete="off"
					spellcheck="false"
					style:padding
				/>
			</InputClear>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.preview {
		margin-bottom: 0.5rem;
		padding: 0.5rem 0;
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
</style>
