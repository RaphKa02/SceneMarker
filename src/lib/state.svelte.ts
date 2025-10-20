import type { Store } from '@tauri-apps/plugin-store';
import { setMode } from 'mode-watcher';
import type { LibState, Project, SettingsState, UiState } from './types';

class AppState implements LibState {
  version = $state('');
  #store = $state<Store>();
  updateAvailable = $state(false);
  showUpdatePopup = $state(true);
  projectModified = $state(false);
  isPresentationMode = $state(false);
  playing = $state(false);
  project = $state<Project>({
    version: '',
    filePath: undefined,
    videoPath: undefined,
    currentTime: 0,
    sceneListItems: [],
  });
  uiState = $state<UiState>({
    sidebarWidth: 320,
    showSidebar: true,
    lockSidebar: false,
    showSettings: false,
    settingsTab: '',
  });
  settings = $state<SettingsState>({
    theme: 'dark',
    openLastProjectOnStartup: false,
    itemPlaceLocation: 'bottom',
    skipIntervall: '5',
  });

  constructor() {
    $effect.root(() => {
      $effect(() => {
        if (this.#store) {
          this.#store.set('uiState', this.uiState);
        }
      });

      $effect(() => {
        if (this.#store) {
          this.#store.set('settingsState', this.settings);
        }
      });
      $effect(() => {
        setMode(this.settings.theme);
      });
    });
  }

  empty = $derived(
    !this.project.filePath &&
      !this.project.videoPath &&
      this.project.currentTime === 0 &&
      this.project.sceneListItems.length === 0
  );

  sceneCount = $derived(
    this.project.sceneListItems.reduce((count, item) => {
      if (item.type === 'scene') {
        return count + 1;
      }
      if (item.type === 'group') {
        return count + item.items.length;
      }
      return count;
    }, 0)
  );

  groupCount = $derived(
    this.project.sceneListItems.reduce((count, item) => {
      return count + (item.type === 'group' ? 1 : 0);
    }, 0)
  );

  async setStore(store: Store) {
    const uiState = await store.get<UiState>('uiState');
    const settingsState = await store.get<SettingsState>('settingsState');

    if (uiState) this.uiState = uiState;
    if (settingsState) this.settings = settingsState;

    this.#store = store;
  }
}

export const appState = new AppState();
