type ProjectAny = any;

const migrations: Record<string, (p: ProjectAny) => ProjectAny> = {
  '0.0': convertStartTo0_2,
  '0.1': (p) => ({ ...p, version: '0.2.0' }),
  '0.2': convert0_2To0_3,
};

export function convertProject(
  project: ProjectAny,
  targetVersion: string
): { project: ProjectAny; migrated: boolean } {
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

function convertStartTo0_2(project: {
  filePath?: string;
  videoPath: string;
  scenes: {
    id: string;
    title: string;
    time: number;
    category?: string;
  }[];
  currentTime: number;
}): {
  version: string;
  filePath?: string;
  videoPath: string;
  currentTime: number;
  sceneListItems: (
    | {
        id: string;
        type: 'scene';
        scene: {
          id: string;
          title: string;
          time: number;
        };
      }
    | {
        id: string;
        type: 'group';
        group: {
          id: string;
          name: string | undefined;
        };
        items: {
          id: string;
          type: 'scene';
          scene: {
            id: string;
            title: string;
            time: number;
          };
        }[];
      }
  )[];
} {
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

function convert0_2To0_3(project: {
  version: string;
  filePath?: string;
  videoPath: string;
  currentTime: number;
  sceneListItems: (
    | {
        id: string;
        type: 'scene';
        scene: {
          id: string;
          title: string;
          time: number;
        };
      }
    | {
        id: string;
        type: 'group';
        group: {
          id: string;
          name: string | undefined;
        };
        items: {
          id: string;
          type: 'scene';
          scene: {
            id: string;
            title: string;
            time: number;
          };
        }[];
      }
  )[];
}): {
  version: string;
  filePath?: string;
  videoPath: string;
  sceneListItems: (
    | {
        id: string;
        type: 'scene';
        scene: {
          id: string;
          title: string;
          time: number;
        };
      }
    | {
        id: string;
        type: 'group';
        group: {
          id: string;
          name: string | undefined;
        };
        items: {
          id: string;
          type: 'scene';
          scene: {
            id: string;
            title: string;
            time: number;
          };
        }[];
      }
  )[];
} {
  const { currentTime: _, ...rest } = project;
  return {
    ...rest,
    version: '0.3.0',
  };
}
