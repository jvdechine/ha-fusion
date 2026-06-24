import { error } from '@sveltejs/kit';
import dotenv from 'dotenv';

dotenv.config();

const HASS_URL = (process.env.HASS_INTERNAL_URL || process.env.HASS_URL)?.replace(/\/$/, '');
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;

const ALLOWED_PATHS = /^\/api\/(camera_proxy|image\/serve)\//;

export const GET = async ({ url }) => {
	const path = url.searchParams.get('path');
	const clientToken = url.searchParams.get('token');

	if (!path || !ALLOWED_PATHS.test(path)) {
		error(400, 'Invalid path');
	}

	if (!HASS_URL) {
		error(500, 'HASS_URL not configured');
	}

	const token = SUPERVISOR_TOKEN || clientToken;
	const headers: Record<string, string> = {};
	if (token) headers['Authorization'] = `Bearer ${token}`;

	let response: globalThis.Response;
	try {
		response = await fetch(`${HASS_URL}${path}`, { headers });
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
