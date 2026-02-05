import type { V0_0 } from '$lib/migrations/versions/v0.0';
import type { V0_2 } from '$lib/migrations/versions/v0.2';
import type { V0_3 } from '$lib/migrations/versions/v0.3';
import type { V1_0 } from '$lib/migrations/versions/v1.0';
import type { V1_1 } from '$lib/migrations/versions/v1.1';
import type { ProjectData, VideoSource } from '$lib/types';
import { getFileName } from '$utils';

type ProjectAny = any;

const migrations: Record<string, (p: ProjectAny) => ProjectAny> = {
  '0.0': convertStartTo0_2,
  '0.1': (p) => ({ ...p, version: '0.2.0' }),
  '0.2': convert0_2To0_3,
  '0.3': (p) => ({ ...p, version: '1.0.0' }),
  '1.0': convert1_0To1_1,
  '1.1': convert1_1To1_2,
};

export function convertProject(
  project: ProjectAny,
  targetVersion: string
): { project: ProjectData; migrated: boolean } {
  let migrated = false;
  let currentVersion = normalizeVersion(project.version);
  const targetStructureVersion = normalizeVersion(targetVersion);

  while (currentVersion !== targetStructureVersion) {
    const migrate = migrations[currentVersion];
    if (!migrate) {
      throw new Error(`Keine Migration von Version ${currentVersion} zu ${targetStructureVersion}`);
    }

    migrated = true;
    project = migrate(project);
    currentVersion = normalizeVersion(project.version);
  }

  return { project, migrated };
}

function normalizeVersion(v?: string) {
  if (!v) return '0.0';
  const [major, minor] = v.split('.');
  return `${major}.${minor ?? '0'}`;
}

function convertStartTo0_2(project: V0_0.Project): V0_2.Project {
  return {
    version: '0.2.0',
    filePath: project.filePath,
    videoPath: project.videoPath,
    currentTime: project.currentTime,
    sceneListItems: project.scenes.map((scene) => ({
      id: crypto.randomUUID(),
      type: 'scene' as const,
      scene,
    })),
  };
}

function convert0_2To0_3(project: V0_2.Project): V0_3.Project {
  const { currentTime: _, ...rest } = project;
  return {
    ...rest,
    version: '0.3.0',
  };
}

function convert1_0To1_1(project: V1_0.Project): V1_1.Project {
  const mainVideoId = crypto.randomUUID();

  const videoLibrary: Record<string, V1_1.VideoSource> = {};
  if (project.videoPath) {
    videoLibrary[mainVideoId] = {
      id: mainVideoId,
      path: project.videoPath,
      name: getFileName(project.videoPath),
      new: false,
      color: '#0000ff',
    };
  }

  const migratedItems = project.sceneListItems.map((item) => {
    if (item.type === 'scene') {
      return {
        ...item,
        scene: {
          ...item.scene,
          videoSourceId: mainVideoId,
        },
      };
    }

    return {
      ...item,
      items: item.items.map((subItem) => ({
        ...subItem,
        scene: {
          ...subItem.scene,
          videoSourceId: mainVideoId,
        },
      })),
    };
  });

  return {
    version: '1.1.0',
    filePath: project.filePath,
    videoLibrary,
    activeVideoId: project.videoPath ? mainVideoId : undefined,
    sceneListItems: migratedItems,
  };
}

function convert1_1To1_2(project: V1_1.Project): ProjectData {
  const migratedItems = project.sceneListItems.map((item) => {
    if (item.type === 'scene') {
      const { new: _, ...rest } = item;
      return {
        ...rest,
        id: item.scene.id,
      };
    }

    const { new: _, ...rest } = item;
    return {
      ...rest,
      id: item.group.id,
      items: item.items.map((subItem) => {
        const { new: __, ...subRest } = subItem;
        return {
          ...subRest,
          id: subItem.scene.id,
        };
      }),
    };
  });

  const migratedVideoLibrary: Record<string, VideoSource> = {};
  for (const [id, video] of Object.entries(project.videoLibrary)) {
    const { new: _, ...rest } = video;
    migratedVideoLibrary[id] = rest;
  }

  return {
    ...project,
    version: '1.2.0',
    videoLibrary: migratedVideoLibrary,
    sceneListItems: migratedItems,
  };
}
