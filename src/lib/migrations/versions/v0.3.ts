export namespace V0_3 {
  export interface Project {
    version: string;
    filePath?: string;
    videoPath: string;
    sceneListItems: SceneListItem[];
  }

  type SceneListItem = SceneListItemScene | SceneListItemGroup;

  interface SceneListItemScene {
    id: string;
    type: 'scene';
    scene: Scene;
  }

  interface SceneListItemGroup {
    id: string;
    type: 'group';
    group: Group;
    items: SceneListItemScene[];
  }

  interface Scene {
    id: string;
    title: string;
    time: number;
  }

  interface Group {
    id: string;
    name: string | undefined;
  }
}
