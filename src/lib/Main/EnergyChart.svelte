<script lang="ts">
	import { connection, selectedLanguage, editMode, states } from '$lib/Stores';
	import { get } from 'svelte/store';
	import { openModal } from 'svelte-modals';
	import { onDestroy } from 'svelte';
	import { scaleLinear, scaleBand } from 'd3-scale';
	import { max } from 'd3-array';

	export let sel: any;

	type DataPoint = { x: Date; consumptionRaw: number; injectionRaw: number };
	let chartData: DataPoint[] = [];
	let width = 0;
	let height = 0;
	let hoverIndex = -1;
	let loading = false;
	let noData = false;

	$: period  = sel?.period || '5minute';
	$: divisor = (() => {
		if (sel?.divisor_entity) {
			const v = parseFloat($states?.[sel.divisor_entity]?.state);
			if (v > 0) return v;
		}
		return sel?.divisor && sel.divisor > 0 ? sel.divisor : 1;
	})();

	// support A+B entities, with fallback to old single-entity field names
	$: ca = sel?.consumption_entity_a || sel?.consumption_entity;
	$: cb = sel?.consumption_entity_b;
	$: ia = sel?.injection_entity_a || sel?.injection_entity;
	$: ib = sel?.injection_entity_b;

	$: if (ca || cb || ia || ib) fetchData();

	// Auto-refresh: every 5 min for 5minute period, every 10 min otherwise
	let refreshTimer: ReturnType<typeof setInterval>;
	$: {
		clearInterval(refreshTimer);
		if (ca || cb || ia || ib) {
			const ms = period === '5minute' ? 5 * 60 * 1000 : 10 * 60 * 1000;
			refreshTimer = setInterval(fetchData, ms);
		}
	}
	onDestroy(() => clearInterval(refreshTimer));

	function windowMs(p: string): number {
		if (p === '5minute') return 3 * 3600 * 1000;
		if (p === 'hour')    return 24 * 3600 * 1000;
		if (p === 'day')     return 30 * 24 * 3600 * 1000;
		if (p === 'week')    return 12 * 7 * 24 * 3600 * 1000;
		return 30 * 24 * 3600 * 1000;
	}

	function extractValue(item: any): number {
		if (item.change != null) return Math.max(0, item.change);
		if (item.mean  != null) return Math.max(0, item.mean);
		if (item.state != null) return Math.max(0, item.state);
		return 0;
	}

	function getChange(item: any, prevSum: number | null): { value: number; nextSum: number | null } {
		let raw: number;
		let nextSum = prevSum;
		if (item.change != null) {
			raw = Math.max(0, item.change);
		} else if (item.sum != null) {
			raw = prevSum != null ? Math.max(0, item.sum - prevSum) : 0;
			nextSum = item.sum;
		} else {
			raw = extractValue(item);
		}
		return { value: raw, nextSum };
	}

	async function fetchData() {
		const ids = [ca, cb, ia, ib].filter(Boolean) as string[];
		if (!ids.length) return;

		const conn = get(connection);
		if (!conn) { noData = true; return; }

		loading = true;
		noData = false;
		chartData = [];

		const end_time   = new Date().toISOString();
		const start_time = new Date(Date.now() - windowMs(period)).toISOString();

		try {
			const res: any = await conn.sendMessagePromise({
				type: 'recorder/statistics_during_period',
				start_time,
				end_time,
				statistic_ids: ids,
				period
			});

			const map = new Map<string, DataPoint>();

			function applyData(entityId: string | undefined, field: 'consumptionRaw' | 'injectionRaw') {
				if (!entityId) return;
				const rows: any[] = res[entityId] ?? [];
				let prevSum: number | null = null;
				for (const item of rows) {
					const existing = map.get(item.start) ?? {
						x: new Date(item.start), consumptionRaw: 0, injectionRaw: 0
					};
					const { value, nextSum } = getChange(item, prevSum);
					prevSum = nextSum;
					existing[field] += value;
					map.set(item.start, existing);
				}
			}

			applyData(ca, 'consumptionRaw');
			applyData(cb, 'consumptionRaw');
			applyData(ia, 'injectionRaw');
			applyData(ib, 'injectionRaw');

			let sorted = [...map.values()].sort((a, b) => a.x.getTime() - b.x.getTime());

			// Drop first point if it looks like an initial statistics dump
			if (sorted.length >= 2) {
				const firstMax = Math.max(sorted[0].consumptionRaw, sorted[0].injectionRaw);
				const restMax  = Math.max(...sorted.slice(1).map(d => Math.max(d.consumptionRaw, d.injectionRaw)));
				if (firstMax > restMax * 3 && firstMax > 0.5) {
					sorted = sorted.slice(1);
				}
			}

			chartData = sorted;
			noData = chartData.length === 0;
		} catch {
			noData = true;
		} finally {
			loading = false;
		}
	}

	const LABEL_H = 20;
	const PAD_TOP  = 8;

	$: scaledData = chartData.map(d => ({
		x: d.x,
		consumption: d.consumptionRaw / divisor,
		injection:   d.injectionRaw  / divisor
	}));

	$: plotH   = Math.max(0, height - LABEL_H - PAD_TOP);
	$: yMax    = Math.max(max(scaledData, (d) => Math.max(d.consumption, d.injection)) ?? 0, 0.01);
	$: xScale  = scaleBand<number>()
		.domain(scaledData.map((_, i) => i))
		.range([0, width])
		.padding(0);
	$: yScale  = scaleLinear().domain([0, yMax]).range([plotH, 0]);
	$: hoverData = hoverIndex >= 0 ? scaledData[hoverIndex] : undefined;
	$: labelStep = scaledData.length <= 12 ? 1 : scaledData.length <= 30 ? 2 : scaledData.length <= 60 ? 4 : 6;

	$: ptX = (i: number) => (xScale(i) ?? 0) + xScale.bandwidth() / 2;
	$: ptY = (v: number) => PAD_TOP + yScale(v);

	// Catmull-Rom → cubic bezier for smooth lines
	function smoothPath(pts: { x: number; y: number }[]): string {
		if (!pts.length) return '';
		if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
		let d = `M${pts[0].x},${pts[0].y}`;
		const t = 0.4;
		for (let i = 0; i < pts.length - 1; i++) {
			const p0 = pts[Math.max(0, i - 1)];
			const p1 = pts[i];
			const p2 = pts[i + 1];
			const p3 = pts[Math.min(pts.length - 1, i + 2)];
			const cp1x = p1.x + (p2.x - p0.x) * t / 3;
			const cp1y = p1.y + (p2.y - p0.y) * t / 3;
			const cp2x = p2.x - (p3.x - p1.x) * t / 3;
			const cp2y = p2.y - (p3.y - p1.y) * t / 3;
			d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
		}
		return d;
	}

	$: cPath = smoothPath(scaledData.map((d, i) => ({ x: ptX(i), y: ptY(d.consumption) })));
	$: iPath = smoothPath(scaledData.map((d, i) => ({ x: ptX(i), y: ptY(d.injection) })));

	$: baseY = PAD_TOP + plotH;
	$: cArea = cPath && scaledData.length
		? `${cPath} L${ptX(scaledData.length - 1)},${baseY} L${ptX(0)},${baseY} Z`
		: '';
	$: iArea = iPath && scaledData.length
		? `${iPath} L${ptX(scaledData.length - 1)},${baseY} L${ptX(0)},${baseY} Z`
		: '';

	function fmt(v: number) {
		return Intl.NumberFormat($selectedLanguage, { maximumFractionDigits: 2 }).format(v);
	}

	function fmtTime(d: Date) {
		if (period === 'day' || period === 'week' || period === 'month') {
			return new Intl.DateTimeFormat($selectedLanguage, { month: 'short', day: 'numeric' }).format(d);
		}
		return new Intl.DateTimeFormat($selectedLanguage, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
	}

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EnergyChartConfig.svelte'), { sel });
		}
	}

	function handlePointerMove(event: PointerEvent) {
		if ($editMode || !xScale || !scaledData.length) return;
		const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
		const x = event.clientX - rect.left;
		const step = xScale.step();
		const idx = Math.min(Math.max(Math.floor(x / step), 0), scaledData.length - 1);
		hoverIndex = idx;
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="container"
	on:click={handleClick}
	role="button"
	tabindex="-1"
>
	<div class="header">
		<span class="title">{sel?.name || 'Energia'}</span>
		<div class="legend">
			<span class="dot consume"></span><span>Consumo</span>
			<span class="dot inject"></span><span>Injeção</span>
		</div>
		{#if hoverData}
			<div class="tooltip">
				<span class="time">{fmtTime(hoverData.x)}</span>
				<span class="consume">▲ {fmt(hoverData.consumption)} kWh</span>
				<span class="inject">▼ {fmt(hoverData.injection)} kWh</span>
			</div>
		{/if}
	</div>

	<div
		class="chart"
		bind:clientWidth={width}
		bind:clientHeight={height}
		on:pointerleave={() => (hoverIndex = -1)}
	>
		{#if loading}
			<div class="empty">Carregando...</div>
		{:else if noData || (!ca && !cb && !ia && !ib)}
			<div class="empty">
				{#if !ca && !cb && !ia && !ib}
					Configure as entidades de energia
				{:else}
					Sem dados — verifique se o sensor tem estatísticas habilitadas no HA
				{/if}
			</div>
		{:else if width && height && scaledData.length}
			<svg
				{width}
				{height}
				on:pointermove={handlePointerMove}
				style:cursor={$editMode ? 'default' : 'crosshair'}
			>
				<!-- Area fills -->
				<path d={cArea} fill="#f59e0b" opacity="0.12" />
				<path d={iArea} fill="#60a5fa" opacity="0.12" />

				<!-- Lines -->
				<path d={cPath} fill="none" stroke="#f59e0b" stroke-width="1.5"
					stroke-linejoin="round" stroke-linecap="round" />
				<path d={iPath} fill="none" stroke="#60a5fa" stroke-width="1.5"
					stroke-linejoin="round" stroke-linecap="round" />

				<!-- Hover indicator -->
				{#if hoverIndex >= 0 && hoverData}
					{@const hx = ptX(hoverIndex)}
					<line
						x1={hx} y1={PAD_TOP}
						x2={hx} y2={baseY}
						stroke="rgba(255,255,255,0.25)"
						stroke-width="1"
						stroke-dasharray="3 2"
					/>
					<circle cx={hx} cy={ptY(hoverData.consumption)} r="3.5" fill="#f59e0b" />
					<circle cx={hx} cy={ptY(hoverData.injection)}   r="3.5" fill="#60a5fa" />
				{/if}

				<!-- X-axis labels -->
				{#each scaledData as d, i}
					{#if i % labelStep === 0}
						<text
							x={ptX(i)}
							y={height - 4}
							text-anchor="middle"
							fill="white"
							font-size="10"
							font-family="inherit"
							opacity={hoverIndex === i ? 1 : 0.5}
						>{fmtTime(d.x)}</text>
					{/if}
				{/each}
			</svg>
		{/if}
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 16rem;
		border-radius: 0.65rem;
		background: var(--theme-button-background-color-off);
		overflow: hidden;
		padding: 0.75rem 0.75rem 0;
		box-sizing: border-box;
		cursor: pointer;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.35rem;
		flex-shrink: 0;
	}

	.title {
		font-weight: 500;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		opacity: 0.65;
	}

	.dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		display: inline-block;
	}

	.dot.consume { background: #f59e0b; }
	.dot.inject  { background: #60a5fa; }

	.tooltip {
		display: flex;
		gap: 0.5rem;
		font-size: 0.8rem;
		margin-left: auto;
		flex-wrap: wrap;
	}

	.time    { opacity: 0.5; }
	.consume { color: #f59e0b; }
	.inject  { color: #60a5fa; }

	.chart {
		flex: 1;
		min-height: 0;
	}

	svg { display: block; }

	.empty {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.4;
		font-size: 0.85rem;
		text-align: center;
		padding: 1rem;
	}
</style>
