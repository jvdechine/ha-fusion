<script lang="ts">
	import Modal from '$lib/Modal/Index.svelte';
	import { states } from '$lib/Stores';
	import { getName } from '$lib/Utils';
	import Camera from '$lib/Main/Camera.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let sel: any;
	export let isOpen: boolean;

	let isFullyKiosk = false;

	onMount(() => {
		isFullyKiosk = true;
	});

	function openSmartLife() {
		(window as any).FullyKiosk.startApplication('com.tuya.smartlife');
	}
</script>

{#if isOpen}
	<Modal size="large">
		<h1 slot="title">
			{getName(sel, $states?.[sel?.entity_id])}
		</h1>

		<div class="camera">
			<Camera {sel} responsive={true} muted={false} controls={true} />

			{#if isFullyKiosk}
				<button class="smartlife-btn" on:click={openSmartLife} title="Abrir SmartLife">
					<Icon icon="mdi:open-in-app" height="1.4rem" />
				</button>
			{/if}
		</div>
	</Modal>
{/if}

<style>
	.camera {
		position: relative;
		margin-top: 1rem;
	}

	.smartlife-btn {
		position: absolute;
		bottom: 0.75rem;
		right: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 50%;
		background-color: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		cursor: pointer;
		z-index: 2;
	}

	.smartlife-btn:active {
		background-color: rgba(0, 0, 0, 0.8);
	}
</style>
