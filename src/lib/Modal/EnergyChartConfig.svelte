<script lang="ts">
	import { dashboard, states, lang, record, ripple } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import EnergyChart from '$lib/Main/EnergyChart.svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';
	import type { EnergyChartItem } from '$lib/Types';
	import Ripple from 'svelte-ripple';

	export let isOpen: boolean;
	export let sel: EnergyChartItem;

	let name = sel?.name;

	const periodOptions = [
		{ id: '5minute', label: $lang('period_5minute') },
		{ id: 'hour', label: $lang('period_hour') },
		{ id: 'day', label: $lang('period_day') },
		{ id: 'week', label: $lang('period_week') },
		{ id: 'month', label: $lang('period_month') }
	];

	$: options = Object.entries($states)
		.filter(([id]) => id.startsWith('sensor.'))
		.map(([id, entity]) => ({
			id,
			label: (entity as any)?.attributes?.friendly_name || id
		}))
		.sort((a, b) => a.label.localeCompare(b.label));

	function setDivisor(e: Event) {
		const v = parseFloat((e.target as HTMLInputElement).value);
		set('divisor', v > 0 ? v : 1);
	}

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Gráfico de Energia</h1>

		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<EnergyChart {sel} />
		</div>

		<h2>Consumo — Canal A</h2>

		<Select
			{options}
			clearable={true}
			placeholder="sensor.energia_consumida_a"
			value={sel?.consumption_entity_a}
			on:change={(event) => set('consumption_entity_a', event)}
		/>

		<h2>Consumo — Canal B <span class="optional">(opcional)</span></h2>

		<Select
			{options}
			clearable={true}
			placeholder="sensor.energia_consumida_b"
			value={sel?.consumption_entity_b}
			on:change={(event) => set('consumption_entity_b', event)}
		/>

		<h2>Injeção — Canal A</h2>

		<Select
			{options}
			clearable={true}
			placeholder="sensor.energia_injetada_a"
			value={sel?.injection_entity_a}
			on:change={(event) => set('injection_entity_a', event)}
		/>

		<h2>Injeção — Canal B <span class="optional">(opcional)</span></h2>

		<Select
			{options}
			clearable={true}
			placeholder="sensor.energia_injetada_b"
			value={sel?.injection_entity_b}
			on:change={(event) => set('injection_entity_b', event)}
		/>

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
				class="input"
				type="text"
				placeholder="Energia"
				autocomplete="off"
				spellcheck="false"
				bind:value={name}
				on:change={(event) => set('name', event)}
				style:padding
			/>
		</InputClear>

		<h2>Fator de conversão — sensor <span class="optional">(opcional)</span></h2>

		<Select
			{options}
			clearable={true}
			placeholder="sensor.fator_conversao"
			value={sel?.divisor_entity}
			on:change={(event) => set('divisor_entity', event)}
		/>

		<h2>Fator de conversão — valor fixo <span class="optional">(se não usar sensor)</span></h2>

		<input
			class="input"
			type="number"
			min="0.001"
			step="any"
			placeholder="1"
			value={sel?.divisor ?? 1}
			on:change={setDivisor}
		/>

		<h2>{$lang('period')}</h2>

		<Select
			options={periodOptions}
			placeholder={$lang('period')}
			value={sel?.period ?? '5minute'}
			on:change={(event) => set('period', event)}
		/>

		<h2>{$lang('mobile')}</h2>

		<div class="button-container">
			<button
				class:selected={sel?.hide_mobile !== true}
				on:click={() => set('hide_mobile')}
				use:Ripple={$ripple}
			>
				{$lang('visible')}
			</button>

			<button
				class:selected={sel?.hide_mobile === true}
				on:click={() => set('hide_mobile', true)}
				use:Ripple={$ripple}
			>
				{$lang('hidden')}
			</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.preview {
		height: 11rem;
	}

	.optional {
		font-size: 0.75rem;
		opacity: 0.5;
		font-weight: normal;
	}
</style>
