<script lang="ts">
  import Settings from '$components/settings/Settings.svelte';
  import Sidebar from '$components/sidebar/Sidebar.svelte';
  import TopBar from '$components/topBar/TopBar.svelte';
  import Tutorial from '$components/Tutorial.svelte';
  import * as Resizable from '$components/ui/resizable';
  import UpdateAlert from '$components/UpdateAlert.svelte';
  import VideoPlayer from '$components/videoPlayer/VideoPlayer.svelte';
  import WindowControlls from '$components/WindowControlls.svelte';
  import { trackEvent } from '$lib/analytics';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import logger from '$lib/logger';
  import { projectManager } from '$lib/projectManager.svelte';
  import { appState } from '$lib/state.svelte';
  import { videoPlayerState } from '$lib/videoPlayerState.svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
  import {
    availableMonitors,
    currentMonitor,
    getAllWindows,
    getCurrentWindow,
  } from '@tauri-apps/api/window';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { dev, number, version } from '../build.json';

  let sidebarPane = $state<ReturnType<typeof Resizable.Pane>>();

  onMount(() => {
    logger.log(`SceneMarker ${version} ${number}`);

    processArgs();
    setActions();

    const unlisten = getCurrentWindow().onCloseRequested(async (event) => {
      if (dev) return;
      if (!(await projectManager.isProjectModifiedCancel())) return;

      event.preventDefault();
    });

    return async () => {
      removeActions();
      (await unlisten)();
    };
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
      projectManager.loadProjectFromPath(args[1]);
      trackEvent('project_loaded', { action: 'file' });
    }
  }

  function setActions() {
    keyHandler.registerAction('save-project', projectManager.saveProject);
    keyHandler.registerAction('save-project-at', projectManager.saveProjectAt);
    keyHandler.registerAction('load-project', projectManager.loadProject);
    keyHandler.registerAction('create-project', projectManager.createProject);
    keyHandler.registerAction('toggle-sidebar', () => {
      appState.uiState.showSidebar = !appState.uiState.showSidebar;
      trackEvent('sidebar_toggled', { value: String(appState.uiState.showSidebar) });
    });
  }

  function removeActions() {
    keyHandler.removeAction('save-project');
    keyHandler.removeAction('save-project-at');
    keyHandler.removeAction('load-project');
    keyHandler.removeAction('create-project');
    keyHandler.removeAction('toggle-sidebar');
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
      videoPlayerState.syncState();
    });

    trackEvent('presentation-mode_started');
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
  <TopBar projectName={appState.project.filePath?.split(/[\\/]/).pop() ?? null} />

  <Resizable.PaneGroup direction="horizontal">
    <Resizable.Pane defaultSize={80} order={1}>
      <main class="flex max-h-full w-full p-4">
        <VideoPlayer
          videoPath={appState.activeVideoPath}
          bind:currentTime={videoPlayerState.currentTime}
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
      <Sidebar />
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
