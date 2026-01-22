export interface Scene {
  id: string;
  title: string;
  time: number;
  videoSourceId: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface VideoSource {
  id: string;
  path: string;
  name: string;
  color: string;
  new: boolean;
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
  activeVideoId: string | undefined;
  videoLibrary: Map<string, VideoSource>;
  sceneListItems: SceneListItem[];
}

export interface ProjectData {
  version: string;
  filePath: string | undefined;
  activeVideoId: string | undefined;
  videoLibrary: Record<string, VideoSource>;
  sceneListItems: SceneListItem[];
}

export interface VideoState {
  videoPath: string | undefined;
  playing: boolean;
  currentTime: number;
}

export interface UiState {
  sidebarWidth: number;
  showSidebar: boolean;
  showVideoFiles: boolean;
  lockSidebar: boolean;
  showFilter: boolean;
  showSettings: boolean;
  settingsTab: string;
  showTimelineMarkers: boolean;
  tutorialShown: boolean;
}

export interface SettingsState {
  theme: 'system' | 'light' | 'dark';
  itemPlaceLocation: 'top' | 'bottom';
  skipIntervall: string;
  shiftSceneTime: string;
  sendAnonymousStatistics: 'true' | 'false';
}

export interface ProjectMetadata {
  path: string;
  lastModified: number | undefined;
  lastAccessed: number | undefined;
}
