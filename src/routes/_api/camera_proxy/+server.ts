import { error } from '@sveltejs/kit';
import dotenv from 'dotenv';

dotenv.config();

const HASS_URL = process.env.HASS_URL?.replace(/\/$/, '');

export const GET = async ({ url }) => {
	const path = url.searchParams.get('path');

	if (!path || !/^\/api\/camera_proxy/.test(path)) {
		error(400, 'Invalid path');
	}

	if (!HASS_URL) {
		error(500, 'HASS_URL not configured');
	}

	let response: globalThis.Response;
	try {
		response = await fetch(`${HASS_URL}${path}`);
	} catch (err: any) {
		error(502, `Failed to reach Home Assistant: ${err.message}`);
	}

	if (!response.ok) {
		error(response.status, 'Camera proxy error');
	}

	const contentType = response.headers.get('content-type') || 'image/jpeg';

	return new Response(response.body, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'no-cache, no-store'
		}
	});
};
