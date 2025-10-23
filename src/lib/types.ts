export interface Scene {
  id: string;
  title: string;
  time: number;
}

export interface Group {
  id: string;
  name: string | undefined;
}

export interface SceneListItemScene {
  id: string;
  type: 'scene';
  scene: Scene;
  new: boolean;
}

export interface SceneListItemGroup {
  id: string;
  type: 'group';
  group: Group;
  items: SceneListItemScene[];
  new: boolean;
}

export type SceneListItem = SceneListItemScene | SceneListItemGroup;

export interface Project {
  version: string;
  filePath: string | undefined;
  videoPath: string | undefined;
  sceneListItems: SceneListItem[];
}

export interface LibState {
  version: string;
  updateAvailable: boolean;
  showUpdatePopup: boolean;
  projectModified: boolean;
  isPresentationMode: boolean;
  currentTime: number;
  playing: boolean;
  project: Project;
}

export interface VideoState {
  videoPath: string | undefined;
  playing: boolean;
  currentTime: number;
}

export interface UiState {
  sidebarWidth: number;
  showSidebar: boolean;
  lockSidebar: boolean;
  showSettings: boolean;
  settingsTab: string;
  showTimelineMarkers: boolean;
}

export interface SettingsState {
  theme: 'system' | 'light' | 'dark';
  openLastProjectOnStartup: boolean;
  itemPlaceLocation: 'top' | 'bottom';
  skipIntervall: string;
}

export interface ProjectMetadata {
  path: string;
  lastModified: number | undefined;
  lastAccessed: number | undefined;
}
