import { trackEvent } from '$lib/analytics';
import logger from '$lib/logger';
import { convertProject } from '$lib/migrations/migrationManager';
import { appState } from '$lib/state.svelte';
import type { ProjectData, SceneListItem } from '$lib/types';
import { videoPlayerState } from '$lib/videoPlayerState.svelte';
import { convertFile, getFileName, getRandomColor } from '$utils';
import { ask, open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { tick } from 'svelte';
import { toast } from 'svelte-sonner';
import { SvelteMap } from 'svelte/reactivity';
import { version } from '../../build.json';

class ProjectManager {
  createProject = async () => {
    if (await this.isProjectModifiedCancel()) return;

    appState.project = {
      version,
      sceneListItems: [],
      videoLibrary: new SvelteMap(),
      filePath: undefined,
      activeVideoId: undefined,
    };
    videoPlayerState.currentTime = 0;
    videoPlayerState.playing = false;

    this.addVideoFile();
  };

  saveProject = async () => {
    const filePath = appState.project.filePath;
    if (!filePath) return this.saveProjectAt();

    appState.project.version = version;

    const projectData: ProjectData = {
      ...appState.project,
      videoLibrary: Object.fromEntries(appState.project.videoLibrary),
    };

    try {
      await writeTextFile(filePath, JSON.stringify(projectData, null, 2));
      appState.resetModified();
      appState.recentProjects.set(filePath, {
        path: filePath,
        lastModified: Date.now(),
        lastAccessed: Date.now(),
      });
      logger.log('Projekt unter', filePath, 'gespeichert');
      toast.success('Gespeichert');
    } catch (err) {
      logger.error('Fehler beim Speichern:', String(err));
      toast.error('Fehler beim Speichern', {
        description: 'Möglicherweise kann in den angegebenen Ort nicht geschrieben werden',
      });
    }
  };

  saveProjectAt = async () => {
    const savePath = await save({
      defaultPath: decodeURIComponent(appState.activeVideoPath ?? '')
        .replace('http://asset.localhost/', '')
        .replace(/\.[^/.]+$/, ''),
      filters: [
        {
          name: 'SceneMarker Project',
          extensions: ['smp'],
        },
      ],
    });

    if (savePath) {
      appState.project.filePath = savePath;
      this.saveProject();
    }
  };

  loadProject = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'SceneMarker Project',
          extensions: ['smp'],
        },
      ],
    });
    if (selected) {
      this.loadProjectFromPath(selected);
    }
  };

  loadProjectFromPath = async (filePath: string) => {
    try {
      if (await this.isProjectModifiedCancel()) return;

      const content = await readTextFile(filePath);
      const { project, migrated } = convertProject(JSON.parse(content), version);
      appState.project = {
        ...project,
        videoLibrary: new SvelteMap(Object.entries(project.videoLibrary)),
      };

      const projectMetadata = appState.recentProjects.get(filePath);
      appState.recentProjects.set(filePath, {
        path: filePath,
        lastAccessed: Date.now(),
        lastModified: projectMetadata?.lastModified,
      });
      await tick();
      if (!migrated) appState.resetModified();
    } catch (err) {
      logger.error(`Fehler beim Laden der Projektdatei: ${err}`);
      toast.error('Fehler beim Öffnen', {
        description:
          'Möglicherweise wurde die Datei geändert und ist nun beschädigt oder wurde gelöscht',
      });
    }
  };

  addVideoFile = async () => {
    const filePath = await this.getVideoFilePath();

    if (!filePath) return;

    const videoId = crypto.randomUUID();
    appState.project.videoLibrary.set(videoId, {
      id: videoId,
      name: getFileName(filePath),
      path: filePath,
      color: getRandomColor(),
      new: true,
    });

    appState.project.activeVideoId = videoId;
  };

  getVideoFilePath = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: 'Video',
            extensions: ['mp4', 'mkv', 'avi', 'mov'],
          },
        ],
      });

      if (selected) {
        const convertedPath = convertFile(selected);
        if (!convertedPath) toast.error('Fehler beim Laden des Videos');
        return convertedPath;
      }
    } catch (err) {
      logger.error('Fehler beim Öffnen des Videos:', String(err));
      toast.error('Fehler beim Öffnen des Videos');
    }
  };

  relocateVideo = async (videoId: string | undefined) => {
    if (!videoId) return;

    const filePath = await this.getVideoFilePath();
    if (!filePath) return;

    const video = appState.project.videoLibrary.get(videoId);
    if (video) video.path = filePath;
  };

  addScene = () => {
    if (!appState.project.activeVideoId) return;

    this.addSceneListItem({
      type: 'scene',
      id: crypto.randomUUID(),
      scene: {
        id: crypto.randomUUID(),
        title: `Szene ${appState.sceneCount + 1}`,
        time: Math.max(0, videoPlayerState.currentTime - Number(appState.settings.shiftSceneTime)),
        videoSourceId: appState.project.activeVideoId,
      },
      new: true,
    });
    trackEvent('scene_created');
  };

  jumpToScene = async (time: number, videoSourceId: string) => {
    appState.project.activeVideoId = videoSourceId;
    await tick();

    videoPlayerState.currentTime = time;
    videoPlayerState.syncState();

    trackEvent('scene_navigated_to', { type: 'card' });
  };

  addGroup = () => {
    this.addSceneListItem({
      type: 'group',
      id: crypto.randomUUID(),
      group: {
        id: crypto.randomUUID(),
        name: `Gruppe ${appState.groupCount + 1}`,
      },
      items: [],
      new: true,
    });

    trackEvent('group_created');
  };

  addSceneListItem = (item: SceneListItem) => {
    if (appState.settings.itemPlaceLocation === 'top')
      appState.project.sceneListItems.unshift(item);
    else appState.project.sceneListItems.push(item);
  };

  deleteProjectMetadata = (path: string) => {
    appState.recentProjects.delete(path);

    trackEvent('recent-project_deleted');
  };

  isProjectModifiedCancel = async () => {
    if (appState.projectModified) {
      const confirmed = await ask(
        'Das Projekt wurde bearbeitet und es liegen nicht gespeicherte Änderungen vor. Trotzdem fortfahren?',
        { title: 'SceneMarker', kind: 'warning', cancelLabel: 'Nein', okLabel: 'Ja' }
      );
      if (!confirmed) return true;
    }
    return false;
  };

  deleteVideoFile = (videoId: string, deleteAssociatedScenes: boolean) => {
    if (!videoId) return;

    if (appState.project.activeVideoId === videoId) {
      const remainingVideos = Array.from(appState.project.videoLibrary.keys()).filter(
        (id) => id !== videoId
      );
      appState.project.activeVideoId = remainingVideos.length > 0 ? remainingVideos[0] : undefined;
    }

    if (deleteAssociatedScenes) {
      appState.project.sceneListItems = appState.project.sceneListItems
        .map((item) => {
          if (item.type === 'scene') {
            return item.scene.videoSourceId === videoId ? null : item;
          }
          if (item.type === 'group') {
            const filteredItems = item.items.filter(
              (sceneItem) => sceneItem.scene.videoSourceId !== videoId
            );
            // Return null if group becomes empty, otherwise return updated group
            return filteredItems.length === 0 ? null : { ...item, items: filteredItems };
          }
          return item;
        })
        .filter((item): item is SceneListItem => item !== null);
    }

    appState.project.videoLibrary.delete(videoId);
    trackEvent('video-file_deleted', { deleteScenes: String(deleteAssociatedScenes) });
  };
}

export const projectManager = new ProjectManager();
