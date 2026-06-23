<script lang="ts">
	import { dashboard, states, record, lang, ripple, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { updateObj, getName } from '$lib/Utils';

	export let isOpen: boolean;
	export let sel: any;

	let name = sel?.name;
	let icon = sel?.icon;
	let color = sel?.color;
	let state_on = sel?.state_on;
	let state_off = sel?.state_off;
	let computedIcon: string;

	$: entity_id = sel?.entity_id;
	$: options = $entityList('');

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Chip</h1>

		<h2>{$lang('entity')}</h2>

		<div class="full-width">
			<Select
				{options}
				placeholder={$lang('entity')}
				value={entity_id}
				on:change={(event) => {
					if (event?.detail === null) return;
					set('entity_id', event);
				}}
				computeIcons={true}
				getIconString={true}
				on:iconString={(event) => {
					computedIcon = event?.detail;
				}}
			/>
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
				name={$lang('name')}
				class="input"
				type="text"
				placeholder={getName(sel, (entity_id && $states[entity_id]) || undefined) || $lang('name')}
				autocomplete="off"
				spellcheck="false"
				bind:value={name}
				on:change={(event) => set('name', event)}
				style:padding
			/>
		</InputClear>

		<h2>{$lang('icon')}</h2>

		<div class="icon-gallery-container">
			<InputClear
				condition={icon}
				on:clear={() => {
					icon = undefined;
					set('icon');
				}}
				let:padding
			>
				<input
					name={$lang('icon')}
					class="input"
					type="text"
					placeholder={computedIcon || $lang('icon')}
					autocomplete="off"
					spellcheck="false"
					bind:value={icon}
					on:change={(event) => set('icon', event)}
					style:padding
				/>
			</InputClear>

			<button
				use:Ripple={$ripple}
				title={$lang('icon')}
				class="icon-gallery"
				on:click={() => {
					window.open('https://icon-sets.iconify.design/', '_blank');
				}}
				style:padding="0.84rem"
			>
				<Icon icon="majesticons:open-line" height="none" />
			</button>
		</div>

		<h2>{$lang('color')}</h2>

		<InputClear
			condition={color}
			on:clear={() => {
				color = undefined;
				set('color');
			}}
			let:padding
		>
			<input
				name={$lang('color')}
				class="input"
				type="text"
				placeholder="#FFFFFF"
				autocomplete="off"
				spellcheck="false"
				bind:value={color}
				on:change={(event) => set('color', event)}
				style:padding
			/>
		</InputClear>

		<h2>Estado ativo</h2>

		<InputClear
			condition={state_on}
			on:clear={() => {
				state_on = undefined;
				set('state_on');
			}}
			let:padding
		>
			<input
				class="input"
				type="text"
				placeholder="ex: Detectado"
				autocomplete="off"
				spellcheck="false"
				bind:value={state_on}
				on:change={(event) => set('state_on', event)}
				style:padding
			/>
		</InputClear>

		<h2>Estado inativo</h2>

		<InputClear
			condition={state_off}
			on:clear={() => {
				state_off = undefined;
				set('state_off');
			}}
			let:padding
		>
			<input
				class="input"
				type="text"
				placeholder="ex: Não detectado"
				autocomplete="off"
				spellcheck="false"
				bind:value={state_off}
				on:change={(event) => set('state_off', event)}
				style:padding
			/>
		</InputClear>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.full-width {
		width: -webkit-fill-available;
		width: -moz-available;
	}
</style>
