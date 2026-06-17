<script lang="ts">
	import { lang, connection, ripple } from '$lib/Stores';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';
	import { callService } from 'home-assistant-js-websocket';

	export let entity: any;

	$: entity_id = entity?.entity_id;
	$: attributes = entity?.attributes;
	$: state = entity?.state;

	$: min_temp = attributes?.min_temp ?? 16;
	$: max_temp = attributes?.max_temp ?? 32;
	$: step = attributes?.target_temp_step ?? 1;
	$: target_temp = attributes?.temperature ?? min_temp;
	$: current_temp = attributes?.current_temperature;

	let localTemp: number | null = null;
	$: displayTemp = localTemp ?? target_temp;

	// arc geometry
	const R = 90;
	const START_DEG = -135;
	const SWEEP_DEG = 270;

	function polarToXY(deg: number, r: number) {
		const rad = (deg * Math.PI) / 180;
		return { x: r * Math.sin(rad), y: -r * Math.cos(rad) };
	}

	const arcStart = polarToXY(START_DEG, R);
	const arcEnd = polarToXY(START_DEG + SWEEP_DEG, R);
	const bgArcPath = `M ${fmt(arcStart.x)} ${fmt(arcStart.y)} A ${R} ${R} 0 1 1 ${fmt(arcEnd.x)} ${fmt(arcEnd.y)}`;

	function fmt(n: number) {
		return n.toFixed(2);
	}

	$: progress = Math.max(0, Math.min(1, (displayTemp - min_temp) / (max_temp - min_temp)));
	$: handleAngle = START_DEG + progress * SWEEP_DEG;
	$: handlePos = polarToXY(handleAngle, R);

	function activeArcPath(p: number): string {
		if (p <= 0.001) return '';
		const endAngle = START_DEG + p * SWEEP_DEG;
		const end = polarToXY(endAngle, R);
		const largeArc = p * SWEEP_DEG > 180 ? 1 : 0;
		return `M ${fmt(arcStart.x)} ${fmt(arcStart.y)} A ${R} ${R} 0 ${largeArc} 1 ${fmt(end.x)} ${fmt(end.y)}`;
	}

	const hvacModeColors: Record<string, string> = {
		cool: '#03a9f4',
		heat: '#ff7043',
		auto: '#66bb6a',
		heat_cool: '#66bb6a',
		dry: '#26c6da',
		fan_only: '#78909c',
		off: '#546e7a'
	};

	const hvacModesIcons: Record<string, string> = {
		cool: 'mdi:snowflake',
		dry: 'mdi:water-percent',
		fan_only: 'mdi:fan',
		auto: 'mdi:thermostat-auto',
		heat: 'mdi:fire',
		off: 'mdi:power',
		heat_cool: 'mdi:sun-snowflake-variant'
	};

	const fanModeIcons: Record<string, string> = {
		on: 'mdi:fan',
		off: 'mdi:fan-off',
		auto: 'mdi:fan-auto',
		low: 'mdi:speedometer-slow',
		medium: 'mdi:speedometer-medium',
		high: 'mdi:speedometer',
		middle: 'mdi:speedometer-medium',
		focus: 'mdi:target',
		diffuse: 'mdi:weather-windy'
	};

	const swingModeIcons: Record<string, string> = {
		on: 'mdi:arrow-oscillating',
		off: 'mdi:arrow-oscillating-off',
		vertical: 'mdi:arrow-up-down',
		horizontal: 'mdi:arrow-left-right',
		both: 'mdi:arrow-all'
	};

	$: modeColor = hvacModeColors[state] ?? '#546e7a';

	function setTemperature(t: number) {
		const snapped = Math.round(Math.max(min_temp, Math.min(max_temp, t)) / step) * step;
		callService($connection, 'climate', 'set_temperature', { entity_id, temperature: snapped });
		return snapped;
	}

	function adjust(delta: number) {
		localTemp = Math.round(Math.max(min_temp, Math.min(max_temp, displayTemp + delta)) / step) * step;
		setTemperature(localTemp);
	}

	function handleHvacMode(mode: string) {
		callService($connection, 'climate', 'set_hvac_mode', { entity_id, hvac_mode: mode });
	}

	function handleFanMode(mode: string) {
		callService($connection, 'climate', 'set_fan_mode', { entity_id, fan_mode: mode });
	}

	function handleSwingMode(mode: string) {
		callService($connection, 'climate', 'set_swing_mode', { entity_id, swing_mode: mode });
	}

	// drag handling
	let svgEl: SVGSVGElement;
	let dragging = false;

	function onPointerDown(e: PointerEvent) {
		svgEl.setPointerCapture(e.pointerId);
		dragging = true;
		updateFromPointer(e);
	}

	function onPointerMove(e: PointerEvent) {
		if (dragging) updateFromPointer(e);
	}

	function onPointerUp(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		if (localTemp !== null) setTemperature(localTemp);
		localTemp = null;
	}

	function updateFromPointer(e: PointerEvent) {
		const rect = svgEl.getBoundingClientRect();
		const dx = e.clientX - (rect.left + rect.width / 2);
		const dy = e.clientY - (rect.top + rect.height / 2);
		// angle from north, CW — range (-180, 180]
		let theta = (Math.atan2(dx, -dy) * 180) / Math.PI;
		// clamp to arc range — gap is below [|theta| > 135]
		if (Math.abs(theta) > 135) theta = theta > 0 ? 135 : -135;
		const p = (theta - START_DEG) / SWEEP_DEG;
		localTemp = Math.round((min_temp + p * (max_temp - min_temp)) / step) * step;
	}

	// clear override once HA confirms
	$: if (target_temp === localTemp) localTemp = null;

	$: floorTemp = Math.floor(displayTemp);
	$: decimalPart = Math.round((displayTemp - floorTemp) * 10);
</script>

<div class="arc-thermostat">
	<div class="dial-wrapper" data-exclude-drag-modal>
		<svg
			bind:this={svgEl}
			viewBox="-120 -120 240 240"
			class="dial"
			on:pointerdown|preventDefault={onPointerDown}
			on:pointermove|preventDefault={onPointerMove}
			on:pointerup={onPointerUp}
			on:pointercancel={onPointerUp}
		>
			<!-- background track -->
			<path d={bgArcPath} fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="12" stroke-linecap="round" />

			<!-- active arc -->
			{#if progress > 0.001}
				<path d={activeArcPath(progress)} fill="none" stroke={modeColor} stroke-width="12" stroke-linecap="round" />
			{/if}

			<!-- handle -->
			<circle
				cx={handlePos.x}
				cy={handlePos.y}
				r="9"
				fill="white"
				stroke={modeColor}
				stroke-width="2.5"
				style="cursor: grab; filter: drop-shadow(0 1px 4px rgba(0,0,0,0.6))"
			/>
		</svg>

		<div class="center-overlay" style:pointer-events="none">
			<div class="hvac-label" style:color={modeColor}>{$lang(state)}</div>
			<div class="target-temp">
				<span class="big">{floorTemp}</span>{#if decimalPart > 0}<span class="decimal">.{decimalPart}</span>{/if}<span class="degree">°</span>
			</div>
			{#if current_temp != null}
				<div class="current-temp">
					<Icon icon="mdi:thermometer" height="0.9rem" />
					{current_temp} °C
				</div>
			{/if}
			<div class="adjust-buttons" style:pointer-events="all">
				<button class="adj" on:click={() => adjust(-step)}>−</button>
				<button class="adj" on:click={() => adjust(+step)}>+</button>
			</div>
		</div>
	</div>

	<div class="hvac-modes-row">
		{#each attributes?.hvac_modes ?? [] as mode}
			<button
				class="mode-btn"
				class:active={mode === state}
				style:--mode-color={hvacModeColors[mode] ?? '#78909c'}
				on:click={() => handleHvacMode(mode)}
				title={$lang(mode)}
				use:Ripple={$ripple}
			>
				<Icon icon={hvacModesIcons[mode] ?? 'mdi:fan'} height="1.5rem" />
			</button>
		{/each}
	</div>

	{#if attributes?.fan_modes}
		<div class="secondary-row">
			<span class="row-label">{$lang('fan_modes')}</span>
			<div class="modes-row">
				{#each attributes.fan_modes as mode}
					<button
						class="mode-btn secondary"
						class:active={attributes?.fan_mode === mode}
						on:click={() => handleFanMode(mode)}
						title={$lang(mode)}
						use:Ripple={$ripple}
					>
						<Icon icon={fanModeIcons[mode] ?? 'mdi:fan'} height="1.4rem" />
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if attributes?.swing_modes}
		<div class="secondary-row">
			<span class="row-label">{$lang('swing_modes')}</span>
			<div class="modes-row">
				{#each attributes.swing_modes as mode}
					<button
						class="mode-btn secondary"
						class:active={attributes?.swing_mode === mode}
						on:click={() => handleSwingMode(mode)}
						title={$lang(mode)}
						use:Ripple={$ripple}
					>
						<Icon icon={swingModeIcons[mode] ?? 'mdi:arrow-oscillating'} height="1.4rem" />
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.arc-thermostat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 0;
	}

	.dial-wrapper {
		position: relative;
		width: 320px;
		height: 320px;
		touch-action: none;
	}

	.dial {
		width: 100%;
		height: 100%;
		touch-action: none;
		cursor: pointer;
		overflow: visible;
	}

	.center-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		user-select: none;
	}

	.hvac-label {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.9;
	}

	.target-temp {
		display: flex;
		align-items: flex-start;
		line-height: 1;
		color: white;
	}

	.big {
		font-size: 3.5rem;
		font-weight: 300;
	}

	.decimal {
		font-size: 1.4rem;
		font-weight: 300;
		margin-top: 0.65rem;
	}

	.degree {
		font-size: 1.4rem;
		font-weight: 300;
		margin-top: 0.4rem;
	}

	.current-temp {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.5);
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.adjust-buttons {
		display: flex;
		gap: 0.9rem;
		margin-top: 0.6rem;
	}

	.adj {
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.08);
		color: white;
		font-size: 1.4rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s;
	}

	.adj:hover {
		background: rgba(255, 255, 255, 0.18);
	}

	.hvac-modes-row,
	.modes-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.secondary-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.row-label {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.4);
	}

	.mode-btn {
		width: 3.6rem;
		height: 3.6rem;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.55);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
	}

	.mode-btn.secondary {
		width: 3rem;
		height: 3rem;
	}

	.mode-btn:hover {
		background: rgba(255, 255, 255, 0.14);
		color: rgba(255, 255, 255, 0.85);
	}

	.mode-btn.active {
		background: color-mix(in srgb, var(--mode-color, white) 22%, transparent);
		color: var(--mode-color, rgba(255, 255, 255, 0.9));
		border-color: color-mix(in srgb, var(--mode-color, white) 55%, transparent);
		box-shadow: 0 0 10px color-mix(in srgb, var(--mode-color, white) 25%, transparent);
	}
</style>
