<script lang="ts">
	import { editMode, configuration } from '$lib/Stores';
	import { base } from '$app/paths';
	import { onMount, getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import Broken from '$lib/Main/Camera/Broken.svelte';

	const viewHidden = getContext<Writable<boolean> | undefined>('viewHidden');

	export let sel: any;
	export let entity: any;
	export let size: string | undefined;
	export let stream_url: string | undefined;
	export let loaderVisible: boolean | undefined;
	export let responsive: boolean | undefined = undefined;
	export let muted: boolean | undefined = true;

	let img: HTMLImageElement;
	let broken: boolean;
	let date: number;
	let interval: ReturnType<typeof setInterval>;

	$: rawPicture = entity?.attributes?.entity_picture || '';

	// Only route through server-side proxy for direct/reverse-proxy access. In ingress mode the
	// addon is iframed under /api/hassio_ingress/<token>/, so absolute paths like /_api/... go to
	// the HA frontend instead of the addon. Falling back to the raw HA path resolves against the
	// same origin as HA and is authenticated by the token query parameter.
	$: useProxy =
		rawPicture.startsWith('/api/camera_proxy') &&
		!!$configuration?.hassUrl &&
		!$configuration?.ingress;

	$: entity_picture = useProxy
		? `${base}/_api/camera_proxy?path=${encodeURIComponent(rawPicture)}`
		: rawPicture;

	$: entity_stream_picture = useProxy
		? `${base}/_api/camera_proxy?path=${encodeURIComponent(rawPicture.replace('/api/camera_proxy/', '/api/camera_proxy_stream/'))}`
		: rawPicture.replace('/camera_proxy/', '/camera_proxy_stream/');

	$: proxy_stream = (!muted || sel?.stream) && !stream_url && !$editMode;

	function handleError(error: boolean) {
		loaderVisible = false;
		broken = error;
	}

	$: updateInterval = sel?.snapshot_interval
		? sel.snapshot_interval * 1000
		: 30_000;

	$: isHidden = viewHidden ? $viewHidden : false;

	$: {
		clearInterval(interval);
		if (!isHidden) {
			interval = setInterval(() => {
				date = Date.now();
			}, updateInterval);
		}
	}

	onMount(() => {
		return () => {
			clearInterval(interval);
			if (img) img.src = '';
		};
	});
</script>

<img
	loading="lazy"
	src={proxy_stream
		? entity_stream_picture
		: entity_picture
			? `${entity_picture}${date ? '&date=' + date : ''}`
			: 'about:blank'}
	bind:this={img}
	on:error={() => handleError(true)}
	on:load={() => handleError(false)}
	style:display={broken ? 'none' : 'initial'}
	style:width={responsive ? '100%' : 'min(calc(14.5rem * 2 + 0.4rem), 100%)'}
	style:object-fit={size}
	draggable="false"
	style:position={loaderVisible && proxy_stream ? 'absolute' : 'relative'}
	alt=""
/>

{#if broken}
	<Broken />
{/if}

<style>
	img {
		width: 100%;
		height: 100%;
	}
</style>
