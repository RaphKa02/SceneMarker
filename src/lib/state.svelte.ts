import type { Store } from '@tauri-apps/plugin-store';
import { setMode } from 'mode-watcher';
import { SvelteMap } from 'svelte/reactivity';
import type { Project, ProjectMetadata, SettingsState, UiState } from './types';

class AppState {
  version = $state('');
  #store = $state<Store>();
  updateAvailable = $state(false);
  showUpdatePopup = $state(true);
  isPresentationMode = $state(false);

  recentProjects = new SvelteMap<string, ProjectMetadata>([]);

  project = $state<Project>({
    version: '',
    filePath: undefined,
    activeVideoId: undefined,
    videoLibrary: new SvelteMap(),
    sceneListItems: [],
  });

  #projectSnapshot = $state(this.stringify(this.project));

  projectModified = $derived(this.#projectSnapshot !== this.stringify(this.project));

  uiState = $state<UiState>({
    sidebarWidth: 320,
    showSidebar: true,
    showVideoFiles: true,
    lockSidebar: false,
    showSettings: false,
    settingsTab: '',
    showTimelineMarkers: true,
    tutorialShown: false,
  });
  settings = $state<SettingsState>({
    theme: 'dark',
    itemPlaceLocation: 'bottom',
    skipIntervall: '5',
    shiftSceneTime: '0',
    sendAnonymousStatistics: 'true',
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

  activeVideoPath = $derived(
    this.project.activeVideoId
      ? this.project.videoLibrary.get(this.project.activeVideoId)?.path
      : undefined
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

    if (uiState) this.uiState = { ...this.uiState, ...uiState };
    if (settingsState) this.settings = { ...this.settings, ...settingsState };
    this.recentProjects = new SvelteMap(recentProjects.map((p) => [p.path, p]));

    this.#store = store;
  }

  stringify(project: Project) {
    return JSON.stringify(project, (_, value) => {
      if (value instanceof Map || value instanceof Set) {
        return Array.from(value.entries());
      }
      return value;
    });
  }

  resetModified() {
    this.#projectSnapshot = this.stringify(this.project);
  }
}

export const appState = new AppState();
