import { setState } from '$lib/state';
import * as os from '@tauri-apps/plugin-os';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, Update } from '@tauri-apps/plugin-updater';
import { toast } from 'svelte-sonner';
import { dev } from '../../build.json';
import logger from './logger';

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
      logger.log(`Latest update: ${JSON.stringify(update)} ${update.body}`);

      setState({ updateAvailable: true });
    } catch (error) {
      logger.error(`Failed to check for update: ${error}`);
    }
  }
};

export const installUpdate = async () => {
  const system = os.type();

  if (system !== 'windows') {
    toast.info('Update available', {
      description: 'https://scene-marker.karl-raphael.de/#downloads',
    });
  } else {
    toast.info('Downloading update... Please wait!');
    setState({ showUpdatePopup: false });

    try {
      await updateObj.downloadAndInstall();
      await relaunch();
    } catch (error) {
      toast.error('Update fehlgeschlagen', {
        description: 'Es trat ein Fehler bei dem Update auf. Versuche es später erneut.',
      });
      logger.error(`Failed to update: ${error}`);
    }
  }
};
