import type { LibState, Project } from './types';

class AppState implements LibState {
  version = $state('');
  updateAvailable = $state(false);
  showUpdatePopup = $state(true);
  projectModified = $state(false);
  project = $state<Project>({
    version: '',
    filePath: undefined,
    videoPath: undefined,
    currentTime: 0,
    sceneListItems: [],
  });

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
}

export const appState = new AppState();
