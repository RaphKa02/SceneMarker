export namespace V1_0 {
  export interface Project {
    version: string;
    filePath: string | undefined;
    videoPath: string | undefined;
    sceneListItems: SceneListItem[];
  }

  interface Scene {
    id: string;
    title: string;
    time: number;
  }

  interface Group {
    id: string;
    name: string;
  }

  interface SceneListItemScene {
    id: string;
    type: 'scene';
    scene: Scene;
    new: boolean;
  }

  interface SceneListItemGroup {
    id: string;
    type: 'group';
    group: Group;
    items: SceneListItemScene[];
    new: boolean;
  }

  type SceneListItem = SceneListItemScene | SceneListItemGroup;
}
