<script lang="ts">
	import { connection, lang, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import Icon, { loadIcon } from '@iconify/svelte';
	import Ripple from 'svelte-ripple';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import type { RemoteControlItem, RemoteButton } from '$lib/Types';

	export let isOpen: boolean;
	export let sel: RemoteControlItem;

	type NavCluster = { isGroup: true; id: string; buttons: RemoteButton[] };
	type ProcessedItem = RemoteButton | NavCluster;

	/**
	 * Groups consecutive circle+spacer buttons into a compact nav cluster,
	 * keeping all other buttons in the flat 3-column grid.
	 */
	$: groups = (() => {
		const result: ProcessedItem[] = [];
		const btns = sel?.remote_buttons ?? [];
		let i = 0;

		while (i < btns.length) {
			if (btns[i].spacer || btns[i].circle) {
				const cluster: RemoteButton[] = [];
				while (i < btns.length && (btns[i].spacer || btns[i].circle)) {
					cluster.push(btns[i]);
					i++;
				}
				if (cluster.some((b) => b.circle)) {
					result.push({ isGroup: true, id: `cluster-${cluster[0].id}`, buttons: cluster });
				} else {
					cluster.forEach((b) => result.push(b));
				}
			} else {
				result.push(btns[i]);
				i++;
			}
		}
		return result;
	})();

	function handleClick(btn: RemoteButton) {
		if (!btn.service || !$connection) return;
		const dot = btn.service.indexOf('.');
		if (dot < 1) return;

		const domain = btn.service.slice(0, dot);
		const service = btn.service.slice(dot + 1);

		const data: Record<string, any> = {};
		if (sel?.entity_id) data.entity_id = sel.entity_id;
		if (btn.service_data) {
			try {
				Object.assign(data, JSON.parse(btn.service_data));
			} catch {
				// invalid JSON
			}
		}

		callService($connection, domain, service, data);
	}

	function btnColor(btn: RemoteButton) {
		return btn.color ?? 'rgba(255,255,255,0.07)';
	}

	function btnBorder(btn: RemoteButton) {
		return btn.color ? btn.color + '55' : 'rgba(255,255,255,0.1)';
	}
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{sel?.name || 'Remote'}</h1>

		{#if sel?.remote_buttons?.length}
			<div class="shell">
				<div class="grid">
					{#each groups as item (('isGroup' in item) ? item.id : item.id)}
						{#if 'isGroup' in item}
							<!-- compact D-pad sub-grid -->
							<div class="nav-cluster">
								{#each item.buttons as btn (btn.id)}
									{#if btn.spacer}
										<div />
									{:else}
										<button
											class="nav-btn"
											style:--c={btnColor(btn)}
											style:--b={btnBorder(btn)}
											title={btn.label || btn.service || ''}
											on:click={() => handleClick(btn)}
											use:Ripple={$ripple}
										>
											{#if btn.icon}
												{#await loadIcon(btn.icon)}
													<span class="icon-slot nav" />
												{:then resolvedIcon}
													<Icon icon={resolvedIcon} height="1.5rem" />
												{:catch}
													<span class="icon-slot nav" />
												{/await}
											{/if}
											{#if btn.label && !btn.icon}
												<span class="label-only">{btn.label}</span>
											{/if}
										</button>
									{/if}
								{/each}
							</div>
						{:else if item.spacer}
							<div />
						{:else}
							<button
								class="btn"
								class:large={item.large}
								style:--c={btnColor(item)}
								style:--b={btnBorder(item)}
								title={item.label || item.service || ''}
								on:click={() => handleClick(item)}
								use:Ripple={$ripple}
							>
								{#if item.icon}
									{#await loadIcon(item.icon)}
										<span class="icon-slot" />
									{:then resolvedIcon}
										<Icon icon={resolvedIcon} height="1.2rem" />
									{:catch}
										<span class="icon-slot" />
									{/await}
								{/if}
								{#if item.label && !item.large}
									<span class="label">{item.label}</span>
								{:else if item.label}
									<span class="label-large">{item.label}</span>
								{/if}
							</button>
						{/if}
					{/each}
				</div>
			</div>
		{:else}
			<p class="empty">{$lang('no_items') || 'No buttons configured'}</p>
		{/if}

		<ConfigButtons />
	</Modal>
{/if}

<style>
	.shell {
		background: linear-gradient(160deg, rgba(28, 28, 33, 0.97) 0%, rgba(14, 14, 18, 0.99) 100%);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.4rem;
		padding: 1rem 0.9rem;
		margin: 0.5rem 0 0.25rem;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	/* ── main 3-column grid ── */
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.42rem;
	}

	/* ── regular buttons ── */
	.btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		min-height: 2.75rem;
		background: var(--c);
		border: 1px solid var(--b);
		border-radius: 0.65rem;
		color: rgba(255, 255, 255, 0.88);
		cursor: pointer;
		font-family: inherit;
		padding: 0.4rem 0.3rem;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.07);
		transition: filter 80ms ease;
		user-select: none;
	}

	.btn:active {
		filter: brightness(1.45);
	}

	/* power-style full-width pill */
	.btn.large {
		grid-column: 1 / -1;
		min-height: 3rem;
		border-radius: 2rem;
		flex-direction: row;
		gap: 0.5rem;
		font-size: 0.95rem;
		font-weight: 500;
		letter-spacing: 0.03em;
		box-shadow: 0 3px 14px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12);
	}

	/* ── nav cluster ── */
	.nav-cluster {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: repeat(3, 4.2rem);
		gap: 0.35rem;
		justify-content: center;
		padding: 0.2rem 0;
	}

	.nav-btn {
		width: 4.2rem;
		height: 4.2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--c);
		border: 1px solid var(--b);
		border-radius: 50%;
		color: rgba(255, 255, 255, 0.88);
		cursor: pointer;
		font-family: inherit;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
		transition: filter 80ms ease;
		user-select: none;
	}

	.nav-btn:active {
		filter: brightness(1.5);
	}

	/* ── labels ── */
	.label {
		font-size: 0.6rem;
		opacity: 0.75;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.label-large {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.label-only {
		font-size: 0.82rem;
		font-weight: 500;
		opacity: 0.9;
	}

	.icon-slot {
		height: 1.2rem;
		width: 1.2rem;
		display: block;
	}

	.icon-slot.nav {
		height: 1.5rem;
		width: 1.5rem;
	}

	.empty {
		opacity: 0.4;
		text-align: center;
		padding: 2rem 0;
		margin: 0;
	}
</style>
