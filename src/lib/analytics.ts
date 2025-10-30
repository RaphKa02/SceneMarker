import logger from '$lib/logger';
import { appState } from '$lib/state.svelte';
import { invoke } from '@tauri-apps/api/core';

export async function trackEvent(
  name: string,
  props?: {
    [key: string]: string | number;
  }
): Promise<void> {
  try {
    if (appState.settings.sendAnonymousStatistics !== 'true') return;

    await invoke<string>('plugin:aptabase|track_event', { name, props });
  } catch (error) {
    logger.error('[Analytics] Event logging failed:', String(error));
  }
}
