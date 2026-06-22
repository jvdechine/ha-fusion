<script lang="ts">
	import { dashboard, lang, record, ripple, motion, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
	import Remote from '$lib/Main/Remote.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Select from '$lib/Components/Select.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Ripple from 'svelte-ripple';
	import Icon from '@iconify/svelte';
	import { updateObj } from '$lib/Utils';
	import type { RemoteControlItem, RemoteButton } from '$lib/Types';

	export let isOpen: boolean;
	export let sel: RemoteControlItem;

	let name = sel?.name;
	let icon = sel?.icon;
	let color = sel?.color;

	$: isColorTemplate = !!(color?.includes('{%') || color?.includes('{{'));
	let buttons: RemoteButton[] = sel?.remote_buttons ? [...sel.remote_buttons] : [];

	$: options = $entityList('');

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	function syncButtons() {
		set('remote_buttons', buttons);
	}

	function addButton() {
		const nextId = buttons.reduce((max, b) => Math.max(max, b.id), 0) + 1;
		buttons = [...buttons, { id: nextId }];
		syncButtons();
	}

	function removeButton(id: number) {
		buttons = buttons.filter((b) => b.id !== id);
		syncButtons();
	}

	function updateButton(id: number, key: keyof RemoteButton, value: string | undefined) {
		buttons = buttons.map((b) => (b.id === id ? { ...b, [key]: value || undefined } : b));
		syncButtons();
	}

	function toggleLarge(id: number, value: boolean) {
		buttons = buttons.map((b) => (b.id === id ? { ...b, large: value || undefined } : b));
		syncButtons();
	}

	function isValidJson(str: string | undefined): boolean {
		if (!str) return true;
		try {
			JSON.parse(str);
			return true;
		} catch {
			return false;
		}
	}

	function loadDefaults() {
		buttons = [
			// Power
			{ id: 1,  large: true, label: 'Power', icon: 'mdi:power', color: '#c0392b',           service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_POWER"}' },
			// Secondary row
			{ id: 2,  label: 'Guide', icon: 'mdi:television-guide',                               service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_GUIDE"}' },
			{ id: 3,  label: 'HDMI',  icon: 'mdi:hdmi-port',                                      service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_HDMI"}' },
			{ id: 4,  label: 'Info',  icon: 'mdi:information-outline',                            service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_INFO"}' },
			// Nav cluster – row 1
			{ id: 5,  spacer: true },
			{ id: 6,  circle: true, icon: 'mdi:chevron-up',                                       service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_UP"}' },
			{ id: 7,  spacer: true },
			// Nav cluster – row 2
			{ id: 8,  circle: true, icon: 'mdi:chevron-left',                                     service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_LEFT"}' },
			{ id: 9,  circle: true, label: 'OK', color: 'rgba(255,255,255,0.14)',                  service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_ENTER"}' },
			{ id: 10, circle: true, icon: 'mdi:chevron-right',                                    service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_RIGHT"}' },
			// Nav cluster – row 3
			{ id: 11, spacer: true },
			{ id: 12, circle: true, icon: 'mdi:chevron-down',                                     service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_DOWN"}' },
			{ id: 13, spacer: true },
			// Controls
			{ id: 14, label: 'Vol+',  icon: 'mdi:volume-plus',                                    service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_VOLUMEUP"}' },
			{ id: 15, label: 'Back',  icon: 'mdi:arrow-u-left-top',                               service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_RETURN"}' },
			{ id: 16, label: 'Ch+',   icon: 'mdi:plus',                                           service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_CHANNELUP"}' },
			{ id: 17, label: 'Vol-',  icon: 'mdi:volume-minus',                                   service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_VOLUMEDOWN"}' },
			{ id: 18, label: 'Home',  icon: 'mdi:home',                                           service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_HOME"}' },
			{ id: 19, label: 'Ch-',   icon: 'mdi:minus',                                          service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_CHANNELDOWN"}' },
			// Media controls
			{ id: 20, icon: 'mdi:skip-previous',                                                  service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_REWIND"}' },
			{ id: 21, icon: 'mdi:play-pause',                                                     service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_PLAYPAUSE"}' },
			{ id: 22, icon: 'mdi:skip-next',                                                      service: 'media_player.play_media', service_data: '{"media_content_type":"send_key","media_content_id":"KEY_FF"}' },
		];
		syncButtons();
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Remote</h1>

		<h2>{$lang('preview')}</h2>
		<div class="preview">
			<Remote {sel} />
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
				placeholder="Remote"
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
				placeholder="mdi:remote"
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

		<h2>{$lang('entity')}</h2>
		{#if options}
			<Select
				{options}
				placeholder={$lang('entity')}
				value={sel?.entity_id}
				clearable={true}
				on:change={(e) => set('entity_id', e.detail)}
			/>
		{/if}

		<h2>Buttons</h2>

		<div class="list">
			<button class="load-defaults" on:click={loadDefaults} use:Ripple={$ripple}>
				<Icon icon="mdi:remote-tv" height="1rem" />
				Load TV remote defaults
			</button>
			{#each buttons as btn, i (btn.id)}
				<div class="card" transition:slide={{ duration: $motion / 2 }}>
					<div class="card-header">
						<span class="card-title">Button {i + 1}</span>
						<button
							class="delete"
							on:click={() => removeButton(btn.id)}
							use:Ripple={$ripple}
							title="Remove"
						>
							<Icon icon="mdi:delete-outline" height="1rem" />
						</button>
					</div>

					<div class="row">
						<div class="field half">
							<label>Label</label>
							<InputClear
								condition={btn.label}
								on:clear={() => updateButton(btn.id, 'label', '')}
								let:padding
							>
								<input
									type="text"
									class="input"
									value={btn.label ?? ''}
									on:change={(e) => updateButton(btn.id, 'label', e.currentTarget.value)}
									placeholder="Power"
									autocomplete="off"
									spellcheck="false"
									style:padding
								/>
							</InputClear>
						</div>

						<div class="field half">
							<label>Icon</label>
							<InputClear
								condition={btn.icon}
								on:clear={() => updateButton(btn.id, 'icon', '')}
								let:padding
							>
								<input
									type="text"
									class="input"
									value={btn.icon ?? ''}
									on:change={(e) => updateButton(btn.id, 'icon', e.currentTarget.value)}
									placeholder="mdi:power"
									autocomplete="off"
									spellcheck="false"
									style:padding
								/>
							</InputClear>
						</div>
					</div>

					<div class="row">
						<div class="field" style:flex="2">
							<label>Service</label>
							<input
								type="text"
								class="input"
								value={btn.service ?? ''}
								on:change={(e) => updateButton(btn.id, 'service', e.currentTarget.value)}
								placeholder="remote.send_command"
								autocomplete="off"
								spellcheck="false"
							/>
						</div>

						<div class="field half">
							<label>Color</label>
							<div class="color-row">
								<input
									type="color"
									class="color-swatch"
									value={btn.color ?? '#4ba6ed'}
									on:input={(e) => updateButton(btn.id, 'color', e.currentTarget.value)}
								/>
								<InputClear
									condition={btn.color}
									on:clear={() => updateButton(btn.id, 'color', '')}
									let:padding
								>
									<input
										type="text"
										class="input"
										value={btn.color ?? ''}
										on:change={(e) => updateButton(btn.id, 'color', e.currentTarget.value)}
										placeholder="#4ba6ed"
										autocomplete="off"
										spellcheck="false"
										style:padding
									/>
								</InputClear>
							</div>
						</div>
					</div>

					<div class="field">
						<label>
							Service Data (JSON)
							{#if !isValidJson(btn.service_data)}
								<span class="json-error">Invalid JSON</span>
							{/if}
						</label>
						<textarea
							class="input mono"
							value={btn.service_data ?? ''}
							on:change={(e) => updateButton(btn.id, 'service_data', e.currentTarget.value)}
							placeholder={'{"command": "power"}'}
							rows="2"
							autocomplete="off"
							spellcheck="false"
						/>
					</div>

					<div class="button-container">
						<button
							class:selected={!btn.large}
							on:click={() => toggleLarge(btn.id, false)}
							use:Ripple={$ripple}
						>
							Normal
						</button>
						<button
							class:selected={btn.large}
							on:click={() => toggleLarge(btn.id, true)}
							use:Ripple={$ripple}
						>
							Full width
						</button>
					</div>
				</div>
			{/each}

			<button class="add" on:click={addButton} use:Ripple={$ripple}>
				<Icon icon="gridicons:add-outline" height="1rem" />
				Add button
			</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		margin-bottom: 0.5rem;
	}

	.card {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.6rem;
		padding: 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.card-title {
		font-size: 0.85rem;
		font-weight: 500;
		opacity: 0.7;
	}

	.delete {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 0.25rem;
		opacity: 0.5;
		border-radius: 0.3rem;
		display: flex;
		align-items: center;
		line-height: 0;
	}

	.delete:hover {
		opacity: 0.9;
	}

	.row {
		display: flex;
		gap: 0.55rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.half {
		flex: 1;
		min-width: 0;
	}

	label {
		font-size: 0.75rem;
		opacity: 0.55;
		display: flex;
		align-items: center;
		gap: 0.4rem;
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

	.json-error {
		color: rgb(255, 100, 100);
		font-size: 0.7rem;
	}

	textarea {
		resize: none;
	}

	.mono {
		font-family: monospace;
		font-size: 0.82rem;
	}

	.add {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		padding: 0.65rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 0.6rem;
		color: inherit;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.85rem;
		opacity: 0.8;
	}

	.add:hover {
		opacity: 1;
	}

	.load-defaults {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		padding: 0.65rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0.6rem;
		color: inherit;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.85rem;
		opacity: 0.7;
	}

	.load-defaults:hover {
		opacity: 1;
	}
</style>
