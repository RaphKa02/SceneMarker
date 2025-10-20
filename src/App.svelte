<script lang="ts">
  import SceneList from '$components/scene-list/SceneList.svelte';
  import Settings from '$components/Settings.svelte';
  import TopBar from '$components/TopBar.svelte';
  import { Button } from '$components/ui/button';
  import UpdateAlert from '$components/UpdateAlert.svelte';
  import VideoPlayer from '$components/VideoPlayer.svelte';
  import WindowControlls from '$components/WindowControlls.svelte';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import logger from '$lib/logger';
  import { convertProject } from '$lib/migrationManager';
  import { appState } from '$lib/state.svelte';
  import type { SceneListItem, VideoState } from '$lib/types';
  import { convertFile } from '$utils';
  import Eye from '@lucide/svelte/icons/eye';
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

  let isResizing = $state(false);
  let presentationWindow = $state<WebviewWindow>();

  onMount(() => {
    logger.log(`SceneMarker ${version} ${number}`);

    processArgs();
    setActions();

    const unlisten = getCurrentWindow().onCloseRequested(async (event) => {
      if (!appState.projectModified || dev) return;

      const confirmed = await ask(
        'Das Projekt wurde bearbeitet und es liegen nicht gespeicherte Änderungen vor. Trotzdem schließen?',
        { title: 'SceneMarker', kind: 'warning', cancelLabel: 'Nein', okLabel: 'Ja' }
      );
      if (!confirmed) {
        event.preventDefault();
      }
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

  async function processArgs() {
    const args: string[] = await invoke('get_args');

    if (args[1]) {
      loadProjectFromPath(args[1]);
    }
  }

  function setActions() {
    keyHandler.registerAction('save-project', saveProject);
    keyHandler.registerAction('save-project-at', saveProjectAt);
    keyHandler.registerAction('load-project', loadProject);
    keyHandler.registerAction('open-video-dialog', openVideoDialog);
    keyHandler.registerAction(
      'toggle-sidebar',
      () => (appState.uiState.showSidebar = !appState.uiState.showSidebar)
    );
  }

  function removeActions() {
    keyHandler.removeAction('save-project');
    keyHandler.removeAction('save-project-at');
    keyHandler.removeAction('load-project');
    keyHandler.removeAction('open-video-dialog');
    keyHandler.removeAction('toggle-sidebar');
  }

  async function openVideoDialog(reset = true) {
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
            currentTime: 0,
            sceneListItems: [],
            videoPath: undefined,
            filePath: undefined,
          };
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
    if (!appState.project.filePath) return saveProjectAt();

    appState.project.version = version;

    try {
      await writeTextFile(appState.project.filePath, JSON.stringify(appState.project, null, 2));
      appState.projectModified = false;
      logger.log('Projekt unter', appState.project.filePath, 'gespeichert');
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
      if (appState.projectModified) {
        const confirmed = await ask(
          'Das Projekt wurde bearbeitet und es liegen nicht gespeicherte Änderungen vor. Trotzdem laden?',
          { title: 'SceneMarker', kind: 'warning', cancelLabel: 'Nein', okLabel: 'Ja' }
        );
        if (!confirmed) return;
      }
      const content = await readTextFile(filePath);
      const { project, migrated } = convertProject(JSON.parse(content), version);
      appState.project = project;
      await tick();
      appState.projectModified = migrated;
    } catch (err) {
      logger.error(`Fehler beim Laden der Projektdatei: ${err}`);
      toast.error('Fehler beim Öffnen', {
        description: 'Möglicherweise wurde die Datei geändert und ist nun beschädigt',
        dismiss: false,
        dismissable: true,
        closeButton: true,
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
        time: appState.project.currentTime,
      },
    });
  }

  function jumpToScene(time: number) {
    appState.project.currentTime = time;

    emitTo<VideoState>('presentation', 'video-state-update', {
      videoPath: appState.project.videoPath,
      currentTime: time,
      playing: appState.playing,
    });
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
    });
  }

  function addSceneListItem(item: SceneListItem) {
    if (appState.settings.itemPlaceLocation === 'top')
      appState.project.sceneListItems.unshift(item);
    else appState.project.sceneListItems.push(item);
  }

  function startResizing(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);
  }

  function resize(e: MouseEvent) {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      appState.uiState.sidebarWidth = newWidth;
    }
  }

  function stopResizing() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResizing);
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
        currentTime: appState.project.currentTime,
        playing: appState.playing,
      });
    });
  }
</script>

<svelte:window
  onbeforeunload={(e) => appState.projectModified && !dev && e.preventDefault()}
  onkeydown={(e) => keyHandler.handle(e)}
/>

{#if appState.updateAvailable}
  <UpdateAlert />
{/if}

<WindowControlls />

<div class="bg-background-dark flex h-screen flex-col">
  <TopBar
    projectName={appState.project.filePath?.split(/[\\/]/).pop() ?? null}
    onOpenVideo={openVideoDialog}
    onSaveProject={saveProject}
    onSaveProjectAt={saveProjectAt}
    onLoadProject={loadProject}
  />

  <div class="flex flex-1 overflow-hidden">
    <main class="flex flex-1 flex-col p-4">
      <VideoPlayer
        videoPath={appState.project.videoPath}
        bind:currentTime={appState.project.currentTime}
        onRelocateVideo={() => openVideoDialog(false)}
        onTogglePresenationMode={togglePresentationMode}
      />
    </main>

    {#if appState.uiState.showSidebar}
      <aside
        class="border-border relative max-w-2xl min-w-48 border-l"
        style="width: {appState.uiState.sidebarWidth}px;"
      >
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          class="hover:bg-border absolute top-0 left-0 h-full w-1 cursor-col-resize"
          onmousedown={startResizing}
          role="separator"
        ></div>
        <SceneList
          bind:visible={appState.uiState.showSidebar}
          bind:listItems={appState.project.sceneListItems}
          onJumpToScene={jumpToScene}
          onAddScene={addScene}
          onAddGroup={addGroup}
          onShowSettings={() => (appState.uiState.showSettings = true)}
        />
      </aside>
    {:else}
      <Button
        variant="outline"
        size="icon"
        onclick={() => (appState.uiState.showSidebar = !appState.uiState.showSidebar)}
        title="Schaltet die Sidebar an (Strg+E)"
        class="mt-4 mr-2"
      >
        <Eye />
      </Button>
    {/if}
  </div>
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
