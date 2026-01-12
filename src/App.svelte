<script lang="ts">
  import Settings from '$components/Settings.svelte';
  import Sidebar from '$components/sidebar/Sidebar.svelte';
  import TopBar from '$components/TopBar.svelte';
  import Tutorial from '$components/Tutorial.svelte';
  import * as Resizable from '$components/ui/resizable';
  import UpdateAlert from '$components/UpdateAlert.svelte';
  import VideoPlayer from '$components/VideoPlayer.svelte';
  import WindowControlls from '$components/WindowControlls.svelte';
  import { trackEvent } from '$lib/analytics';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import logger from '$lib/logger';
  import { convertProject } from '$lib/migrationManager';
  import { appState } from '$lib/state.svelte';
  import type { SceneListItem, VideoState } from '$lib/types';
  import { convertFile } from '$utils';
  import { invoke } from '@tauri-apps/api/core';
  import { emitTo } from '@tauri-apps/api/event';
  import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
  import {
    availableMonitors,
    currentMonitor,
    getAllWindows,
    getCurrentWindow,
  } from '@tauri-apps/api/window';
  import { ask, open, save } from '@tauri-apps/plugin-dialog';
  import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
  import { onMount, tick } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { dev, number, version } from '../build.json';

  let sidebarPane = $state<ReturnType<typeof Resizable.Pane>>();

  onMount(() => {
    logger.log(`SceneMarker ${version} ${number}`);

    processArgs();
    setActions();

    const unlisten = getCurrentWindow().onCloseRequested(async (event) => {
      if (dev) return;
      if (!(await isProjectModifiedCancel())) return;

      event.preventDefault();
    });

    return async () => {
      removeActions();
      (await unlisten)();
    };
  });

  $effect(() => {
    JSON.stringify(appState.project);
    appState.projectModified = !appState.empty;
  });

  $effect(() => {
    keyHandler.disable(appState.uiState.showSettings);
  });

  $effect(() => {
    if (appState.uiState.showSidebar) sidebarPane?.expand();
    else sidebarPane?.collapse();
  });

  async function processArgs() {
    const args: string[] = await invoke('get_args');

    if (args[1]) {
      loadProjectFromPath(args[1]);
      trackEvent('project_loaded', { action: 'file' });
    }
  }

  function setActions() {
    keyHandler.registerAction('save-project', saveProject);
    keyHandler.registerAction('save-project-at', saveProjectAt);
    keyHandler.registerAction('load-project', loadProject);
    keyHandler.registerAction('open-video-dialog', openVideoDialog);
    keyHandler.registerAction('toggle-sidebar', () => {
      appState.uiState.showSidebar = !appState.uiState.showSidebar;
      trackEvent('sidebar_toggled', { value: String(appState.uiState.showSidebar) });
    });
  }

  function removeActions() {
    keyHandler.removeAction('save-project');
    keyHandler.removeAction('save-project-at');
    keyHandler.removeAction('load-project');
    keyHandler.removeAction('open-video-dialog');
    keyHandler.removeAction('toggle-sidebar');
  }

  async function openVideoDialog(reset = true) {
    if (reset && (await isProjectModifiedCancel())) return;
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
        if (reset) {
          appState.project = {
            version,
            sceneListItems: [],
            videoPath: undefined,
            filePath: undefined,
          };
          appState.currentTime = 0;
          appState.playing = false;
        }
        const convertedPath = convertFile(selected);
        if (!convertedPath) toast.error('Fehler beim Laden des Videos');
        else appState.project.videoPath = convertedPath;
      }
    } catch (err) {
      logger.error('Fehler beim Öffnen des Videos:', String(err));
      toast.error('Fehler beim Öffnen des Videos');
    }
  }

  async function saveProject() {
    const filePath = appState.project.filePath;
    if (!filePath) return saveProjectAt();

    appState.project.version = version;

    try {
      await writeTextFile(filePath, JSON.stringify(appState.project, null, 2));
      appState.projectModified = false;
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
  }

  async function saveProjectAt() {
    const savePath = await save({
      defaultPath: decodeURIComponent(appState.project.videoPath ?? '')
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
      saveProject();
    }
  }

  async function loadProject() {
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
      loadProjectFromPath(selected);
    }
  }

  async function loadProjectFromPath(filePath: string) {
    try {
      if (await isProjectModifiedCancel()) return;

      const content = await readTextFile(filePath);
      const { project, migrated } = convertProject(JSON.parse(content), version);
      appState.project = project;

      const projectMetadata = appState.recentProjects.get(filePath);
      appState.recentProjects.set(filePath, {
        path: filePath,
        lastAccessed: Date.now(),
        lastModified: projectMetadata?.lastModified,
      });
      await tick();
      appState.projectModified = migrated;
    } catch (err) {
      logger.error(`Fehler beim Laden der Projektdatei: ${err}`);
      toast.error('Fehler beim Öffnen', {
        description:
          'Möglicherweise wurde die Datei geändert und ist nun beschädigt oder wurde gelöscht',
      });
    }
  }

  function addScene() {
    addSceneListItem({
      type: 'scene',
      id: crypto.randomUUID(),
      scene: {
        id: crypto.randomUUID(),
        title: `Szene ${appState.sceneCount + 1}`,
        time: Math.max(0, appState.currentTime - Number(appState.settings.shiftSceneTime)),
      },
      new: true,
    });
    trackEvent('scene_created');
  }

  function jumpToScene(time: number) {
    appState.currentTime = time;

    emitTo<VideoState>('presentation', 'video-state-update', {
      videoPath: appState.project.videoPath,
      currentTime: time,
      playing: appState.playing,
    });

    trackEvent('scene_navigated_to', { type: 'card' });
  }

  function addGroup() {
    addSceneListItem({
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
  }

  function addSceneListItem(item: SceneListItem) {
    if (appState.settings.itemPlaceLocation === 'top')
      appState.project.sceneListItems.unshift(item);
    else appState.project.sceneListItems.push(item);
  }

  function deleteProjectMetadata(path: string) {
    appState.recentProjects.delete(path);

    trackEvent('recent-project_deleted');
  }

  async function togglePresentationMode() {
    const windows = await getAllWindows();
    let presentationWindow = windows.find((window) => window.label === 'presentation');

    if (appState.isPresentationMode) {
      presentationWindow?.close();
      appState.isPresentationMode = false;
      return;
    }

    if (presentationWindow) {
      appState.isPresentationMode = true;
      return;
    }

    const monitors = await availableMonitors();
    const currentM = await currentMonitor();

    const targetMonitor = monitors.find((monitor) => monitor.name !== currentM?.name);
    if (!targetMonitor) {
      toast.warning('Kein weiterer Monitor gefunden', {
        description: 'Versuche mit Windows+P den Modus auf "Erweitern" zu stellen',
      });
      return;
    }

    presentationWindow = new WebviewWindow('presentation', {
      url: '/presentation',
      title: 'Presentation View',
      fullscreen: true,
      resizable: false,
      decorations: false,
      visible: true,
      x: targetMonitor.position.x,
      y: targetMonitor.position.y,
    });

    presentationWindow.once('tauri://created', () => {
      appState.isPresentationMode = true;
    });
    presentationWindow.once('tauri://destroyed', () => {
      appState.isPresentationMode = false;
    });
    presentationWindow.once('tauri://error', (e) => {
      logger.log('an error happened creating the webview', String(e.payload));
      appState.isPresentationMode = false;
    });
    presentationWindow.once('ready', () => {
      emitTo<VideoState>('presentation', 'video-state-update', {
        videoPath: appState.project.videoPath,
        currentTime: appState.currentTime,
        playing: appState.playing,
      });
    });

    trackEvent('presentation-mode_started');
  }

  function showSettings() {
    trackEvent('settings_open');
    appState.uiState.showSettings = true;
  }

  async function isProjectModifiedCancel() {
    if (appState.projectModified) {
      const confirmed = await ask(
        'Das Projekt wurde bearbeitet und es liegen nicht gespeicherte Änderungen vor. Trotzdem fortfahren?',
        { title: 'SceneMarker', kind: 'warning', cancelLabel: 'Nein', okLabel: 'Ja' }
      );
      if (!confirmed) return true;
    }
    return false;
  }
</script>

<svelte:window
  onbeforeunload={(e) => appState.projectModified && !dev && e.preventDefault()}
  onkeydown={(e) => keyHandler.handle(e)}
/>

{#if appState.updateAvailable}
  <UpdateAlert />
{/if}

<Tutorial />

<WindowControlls />

<div class="bg-background-dark flex h-screen flex-col">
  <TopBar
    projectName={appState.project.filePath?.split(/[\\/]/).pop() ?? null}
    onOpenVideo={openVideoDialog}
    onSaveProject={saveProject}
    onSaveProjectAt={saveProjectAt}
    onLoadProject={loadProject}
    onLoadProjectFromPath={loadProjectFromPath}
    onDeleteProjectMetadata={deleteProjectMetadata}
  />

  <Resizable.PaneGroup direction="horizontal">
    <Resizable.Pane defaultSize={80} order={1}>
      <main class="flex max-h-full w-full p-4">
        <VideoPlayer
          videoPath={appState.project.videoPath}
          bind:currentTime={appState.currentTime}
          onRelocateVideo={() => openVideoDialog(false)}
          onTogglePresenationMode={togglePresentationMode}
        />
      </main>
    </Resizable.Pane>
    {#if appState.uiState.showSidebar}
      <Resizable.Handle />
    {/if}
    <Resizable.Pane
      minSize={10}
      maxSize={80}
      order={2}
      collapsible
      collapsedSize={4}
      bind:this={sidebarPane}
    >
      <Sidebar
        bind:listItems={appState.project.sceneListItems}
        onJumpToScene={jumpToScene}
        onAddScene={addScene}
        onAddGroup={addGroup}
        onShowSettings={showSettings}
      />
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>

{#if appState.uiState.showSettings}
  <Settings />
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
</style>
