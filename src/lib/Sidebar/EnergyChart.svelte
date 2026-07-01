<script lang="ts">
	import { connection, selectedLanguage } from '$lib/Stores';
	import { scaleLinear, scaleBand } from 'd3-scale';
	import { max } from 'd3-array';

	export let consumption_entity: string | undefined;
	export let injection_entity: string | undefined;
	export let period = 'hour';
	export let name: string | undefined = undefined;

	type DataPoint = { x: Date; consumption: number; injection: number };
	let chartData: DataPoint[] = [];
	let width = 0;
	let height = 0;
	let hoverIndex = -1;

	$: if (consumption_entity || injection_entity) fetchData();

	function fetchData() {
		const ids = [consumption_entity, injection_entity].filter(Boolean) as string[];
		if (!ids.length) return;

		const start_time = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
		const end_time = new Date().toISOString();

		connection.subscribe((conn) => {
			conn
				?.sendMessagePromise({
					type: 'recorder/statistics_during_period',
					start_time,
					end_time,
					statistic_ids: ids,
					period: period || 'hour'
				})
				.then((res: any) => {
					const map = new Map<string, DataPoint>();

					const consumeData = consumption_entity ? (res[consumption_entity] ?? []) : [];
					const injectData = injection_entity ? (res[injection_entity] ?? []) : [];

					for (const item of consumeData) {
						const existing = map.get(item.start) ?? {
							x: new Date(item.start),
							consumption: 0,
							injection: 0
						};
						existing.consumption = Math.max(0, item.change ?? 0);
						map.set(item.start, existing);
					}

					for (const item of injectData) {
						const existing = map.get(item.start) ?? {
							x: new Date(item.start),
							consumption: 0,
							injection: 0
						};
						existing.injection = Math.max(0, item.change ?? 0);
						map.set(item.start, existing);
					}

					chartData = [...map.values()].sort((a, b) => a.x.getTime() - b.x.getTime());
				});
		});
	}

	$: yMax = Math.max(max(chartData, (d) => Math.max(d.consumption, d.injection)) ?? 0, 0.01);

	$: xScale = scaleBand<number>()
		.domain(chartData.map((_, i) => i))
		.range([0, width])
		.padding(0.12);

	$: halfHeight = height / 2;

	$: yScale = scaleLinear().domain([0, yMax]).range([0, halfHeight - 1]);

	$: hoverData = hoverIndex >= 0 ? chartData[hoverIndex] : chartData[chartData.length - 1];

	function fmt(v: number) {
		return Intl.NumberFormat($selectedLanguage, { maximumFractionDigits: 2 }).format(v);
	}

	function fmtTime(d: Date) {
		return new Intl.DateTimeFormat($selectedLanguage, { timeStyle: 'short' }).format(d);
	}
</script>

<div class="container">
	<p class="label">{name || 'Energia'}</p>

	<p class="values">
		{#if hoverData}
			{#if hoverIndex >= 0}
				<span class="time">{fmtTime(hoverData.x)}</span>
			{/if}
			<span class="consume">▲ {fmt(hoverData.consumption)} kWh</span>
			<span class="inject">▼ {fmt(hoverData.injection)} kWh</span>
		{/if}
	</p>

	<div
		class="chart"
		bind:clientWidth={width}
		bind:clientHeight={height}
		on:pointerleave={() => (hoverIndex = -1)}
	>
		{#if width && height}
			<svg {width} {height}>
				<!-- center axis -->
				<line x1="0" y1={halfHeight} x2={width} y2={halfHeight} class="axis" />

				{#each chartData as d, i}
					{@const x = xScale(i) ?? 0}
					{@const bw = xScale.bandwidth()}
					{@const ch = yScale(d.consumption)}
					{@const ih = yScale(d.injection)}
					<g on:pointerenter={() => (hoverIndex = i)}>
						<!-- consumption bar (up) -->
						<rect
							{x}
							y={halfHeight - ch}
							width={bw}
							height={ch}
							class="bar-consume"
							class:highlighted={hoverIndex === i}
						/>
						<!-- injection bar (down) -->
						<rect
							{x}
							y={halfHeight}
							width={bw}
							height={ih}
							class="bar-inject"
							class:highlighted={hoverIndex === i}
						/>
					</g>
				{/each}
			</svg>
		{/if}
	</div>
</div>

<style>
	.container {
		padding: var(--theme-sidebar-item-padding);
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
	}

	p {
		margin-block-start: 0;
		margin-block-end: 0;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.label {
		margin-bottom: 0.1rem;
	}

	.values {
		display: flex;
		gap: 0.6rem;
		font-size: 0.78rem;
		margin-bottom: 0.3rem;
		opacity: 0.9;
	}

	.time {
		opacity: 0.55;
	}

	.consume {
		color: #f59e0b;
	}

	.inject {
		color: #60a5fa;
	}

	.chart {
		height: 7rem;
	}

	.axis {
		stroke: rgba(255, 255, 255, 0.12);
		stroke-width: 1;
	}

	.bar-consume {
		fill: #f59e0b;
		opacity: 0.65;
		transition: opacity 100ms ease;
	}

	.bar-inject {
		fill: #60a5fa;
		opacity: 0.65;
		transition: opacity 100ms ease;
	}

	.bar-consume.highlighted,
	.bar-inject.highlighted {
		opacity: 1;
	}
</style>
