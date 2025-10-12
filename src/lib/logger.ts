import { path } from '@tauri-apps/api';
import { invoke } from '@tauri-apps/api/core';
import { dev } from '../../build.json';

let fileName: string;

const getTime = () => {
  return new Date().toLocaleString('de');
};

export const log = (...message: string[]) => {
  const time = getTime();

  console.log(`[SceneMarker LOG] (${time})`, ...message);
  invoke('logger', { message: message.join(' '), time, kind: 'log' });
  writeToFile(`[SceneMarker LOG] (${time})`, ...message);
};

export const warn = (...message: string[]) => {
  const time = getTime();

  console.log(`[SceneMarker WARN] (${time})`, ...message);
  invoke('logger', { message: message.join(' '), time, kind: 'warn' });
  writeToFile(`[SceneMarker WARN] (${time})`, ...message);
};

export const error = (...message: string[]) => {
  const time = getTime();

  console.log(`[SceneMarker ERROR] (${time})`, ...message);
  invoke('logger', { message: message.join(' '), time, kind: 'error' });
  writeToFile(`[SceneMarker ERROR] (${time})`, ...message);
};

const writeToFile = async (...message: string[]) => {
  if (dev === true) {
    return;
  }

  const folderPath = await path.join(await path.cacheDir(), 'de.karl-raphael.scene-marker', 'logs');
  await invoke('create_logs_dir', { path: folderPath });

  if (fileName === undefined) {
    const time = new Date().toISOString().replace('T', '-').replaceAll(':', '-').substring(0, 19);
    fileName = `scene-marker-${time}.log`;
  }

  invoke('write_logs', { name: `${folderPath}/${fileName}`, message: `${message.join(' ')}\n` });
};

export default { log, warn, error };
