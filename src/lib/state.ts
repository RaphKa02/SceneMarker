import { writable, get } from 'svelte/store';
import type { LibState } from '../types';

const defaultState: LibState = {
  version: '',
  updateAvailable: false,
  showUpdatePopup: true,
};

export const appState = writable<LibState>(
  sessionStorage.state ? JSON.parse(sessionStorage.state) : defaultState
);

appState.subscribe((data) => {
  console.log('State changed: ', data);

  sessionStorage.setItem('appState', JSON.stringify(data));
});

export const getState = (): LibState => {
  return get(appState);
};

export const setState = (newState: Partial<LibState>) => {
  appState.set({ ...get(appState), ...newState });
};
