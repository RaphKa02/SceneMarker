import { appState } from '$lib/state.svelte';
import * as os from '@tauri-apps/plugin-os';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { toast } from 'svelte-sonner';
import { dev } from '../../build.json';
import logger from './logger';
import { trackEvent } from '$lib/analytics';

let updateObj: Update; // TODO: should be an easier way

/**
 * Check for auto update
 */
export const checkForUpdate = async () => {
  if (!dev) {
    try {
      const update = await check();

      // No update available
      if (update === null) {
        return;
      }

      updateObj = update;
      logger.log(`Neuestes Update: ${JSON.stringify(update)} ${update.body}`);

      appState.updateAvailable = true;
    } catch (error) {
      logger.error(`Fehler beim Suchen nach einem Update: ${error}`);
    }
  }
};

export const installUpdate = async () => {
  const system = os.type();

  if (system !== 'windows') {
    toast.info('Update verfügbar', {
      description: 'https://scene-marker.karl-raphael.de/#downloads',
    });
  } else {
    toast.info('Update wird heruntergeladen... Bitte warten!');
    appState.showUpdatePopup = false;

    try {
      await updateObj.downloadAndInstall();
      trackEvent('update_started');
      await relaunch();
    } catch (error) {
      toast.error('Update fehlgeschlagen', {
        description: 'Es trat ein Fehler bei dem Update auf. Versuche es später erneut.',
      });
      logger.error(`Update fehlgeschlagen: ${error}`);
      trackEvent('update_failed');
    }
  }
};
