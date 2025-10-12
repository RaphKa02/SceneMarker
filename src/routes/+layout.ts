// Tauri doesn't have a Node.js server to do proper SSR
// so we use adapter-static with a fallback to index.html to put the site in SPA mode
// See: https://svelte.dev/docs/kit/single-page-apps

import { appState } from '$lib/state.svelte';
import { checkForUpdate } from '$lib/update';
import { getVersion } from '@tauri-apps/api/app';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load = (async () => {
  checkForUpdate();
  appState.version = await getVersion();
  return {};
}) satisfies LayoutLoad;
