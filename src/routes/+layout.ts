// Tauri doesn't have a Node.js server to do proper SSR
// so we use adapter-static with a fallback to index.html to put the site in SPA mode
// See: https://svelte.dev/docs/kit/single-page-apps

import { keyHandler } from '$lib/keyboardShortcuts.svelte';
import { appState } from '$lib/state.svelte';
import { checkForUpdate } from '$lib/update';
import { getVersion } from '@tauri-apps/api/app';
import { Store } from '@tauri-apps/plugin-store';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load = (async () => {
  checkForUpdate();
  appState.version = await getVersion();
  const store = await Store.load('store.json');
  appState.setStore(store);
  keyHandler.setStore(store);
  keyHandler.setDefaultBindings({
    'CTRL+S': 'save-project',
    'CTRL+SHIFT+S': 'save-project-at',
    'CTRL+O': 'load-project',
    'CTRL+SHIFT+O': 'open-video-dialog',
    'CTRL+E': 'toggle-sidebar',
    'CTRL+N': 'add-scene',
    'CTRL+G': 'add-group',
    'CTRL+L': 'toggle-locked',
    SPACE: 'play-pause',
    ArrowLeft: 'skip-back',
    ArrowRight: 'skip-forward',
  });

  return {};
}) satisfies LayoutLoad;
