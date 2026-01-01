// src/lib/supabaseClient.js

import { createBrowserClient, parse, serialize } from '@supabase/ssr';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';

// Standard implementation for client-side usage that respects session-only cookies (no maxAge)
export const supabase = createBrowserClient(
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY,
	{
		cookies: {
			getAll() {
				if (typeof document === 'undefined') return [];
				const cookies = parse(document.cookie);
				return Object.keys(cookies).map((key) => ({
					name: key,
					value: cookies[key] || ''
				}));
			},
			setAll(cookiesToSet) {
				if (typeof document === 'undefined') return;
				cookiesToSet.forEach(({ name, value, options }) => {
					// Force session cookies by removing persistence options
					const { maxAge, expires, ...sessionOptions } = options;
					document.cookie = serialize(name, value, sessionOptions);
				});
			}
		}
	}
);
