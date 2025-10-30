import { keyHandler } from '$lib/keyboardShortcuts.svelte';
import { appState } from '$lib/state.svelte';
import { checkForUpdate } from '$lib/update';
import { getVersion } from '@tauri-apps/api/app';
import { Store } from '@tauri-apps/plugin-store';
import type { LayoutLoad } from './$types';

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
