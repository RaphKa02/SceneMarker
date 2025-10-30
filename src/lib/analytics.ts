import logger from '$lib/logger';
import { invoke } from '@tauri-apps/api/core';

export async function trackEvent(
  name: string,
  props?: {
    [key: string]: string | number;
  }
): Promise<void> {
  try {
    await invoke<string>('plugin:aptabase|track_event', { name, props });
  } catch (error) {
    logger.error('[Analytics] Event logging failed:', String(error));
  }
}
