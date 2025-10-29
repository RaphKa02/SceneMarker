import type { Store } from '@tauri-apps/plugin-store';
import { setMode } from 'mode-watcher';
import { SvelteMap } from 'svelte/reactivity';
import type { LibState, Project, ProjectMetadata, SettingsState, UiState } from './types';

class AppState implements LibState {
  version = $state('');
  #store = $state<Store>();
  updateAvailable = $state(false);
  showUpdatePopup = $state(true);
  projectModified = $state(false);
  isPresentationMode = $state(false);
  playing = $state(false);
  currentTime = $state(0);
  videoSpeed = $state(1);
  recentProjects = new SvelteMap<string, ProjectMetadata>([]);
  project = $state<Project>({
    version: '',
    filePath: undefined,
    videoPath: undefined,
    sceneListItems: [],
  });
  uiState = $state<UiState>({
    sidebarWidth: 320,
    showSidebar: true,
    lockSidebar: false,
    showSettings: false,
    settingsTab: '',
    showTimelineMarkers: true,
    tutorialShown: false,
  });
  settings = $state<SettingsState>({
    theme: 'dark',
    openLastProjectOnStartup: false,
    itemPlaceLocation: 'bottom',
    skipIntervall: '5',
    shiftSceneTime: '0',
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
        if (this.#store) {
          this.#store.set('recentProjects', this.recentProjects.values().toArray());
        }
      });

      $effect(() => {
        setMode(this.settings.theme);
      });
    });
  }

  empty = $derived(
    !this.project.filePath && !this.project.videoPath && this.project.sceneListItems.length === 0
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
    const recentProjects = (await store.get<ProjectMetadata[]>('recentProjects')) ?? [];

    if (uiState) this.uiState = uiState;
    if (settingsState) this.settings = settingsState;
    this.recentProjects = new SvelteMap(recentProjects.map((p) => [p.path, p]));

    this.#store = store;
  }
}

export const appState = new AppState();
