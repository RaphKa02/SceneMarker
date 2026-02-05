export namespace V1_1 {
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
    videoLibrary: Record<string, VideoSource>;
    sceneListItems: SceneListItem[];
  }
}
