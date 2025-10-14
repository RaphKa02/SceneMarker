<script lang="ts">
  import SceneList from '$components/scene-list/SceneList.svelte';
  import TopBar from '$components/TopBar.svelte';
  import { Button } from '$components/ui/button';
  import UpdateAlert from '$components/UpdateAlert.svelte';
  import VideoPlayer from '$components/VideoPlayer.svelte';
  import WindowControlls from '$components/WindowControlls.svelte';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import logger from '$lib/logger';
  import { appState } from '$lib/state.svelte';
  import { convertProject } from '$lib/migrationManager';
  import Eye from '@lucide/svelte/icons/eye';
  import { invoke } from '@tauri-apps/api/core';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { ask, open, save } from '@tauri-apps/plugin-dialog';
  import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
  import { onMount, tick } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { dev, number, version } from '../build.json';

  let sidebarWidth = $state(320);
  let sidebarVisible = $state(true);
  let isResizing = $state(false);

  onMount(() => {
    logger.log(`SceneMarker ${version} ${number}`);

    processArgs();
    setActions();
    addKeyboardShortcuts();

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
    appState.projectModified = true;
  });

  async function processArgs() {
    const args: string[] = await invoke('get_args');

    if (args[1] && args[1]) {
      loadProjectFromPath(args[1]);
    }
  }

  function addKeyboardShortcuts() {
    keyHandler.bindKey('CTRL+S', 'save-project');
    keyHandler.bindKey('CTRL+SHIFT+S', 'save-project-at');
    keyHandler.bindKey('CTRL+O', 'load-project');
    keyHandler.bindKey('CTRL+SHIFT+O', 'open-video-dialog');
    keyHandler.bindKey('CTRL+E', 'toggle-sidebar');
    keyHandler.bindKey('CTRL+N', 'add-scene');
    keyHandler.bindKey('CTRL+G', 'add-group');
    keyHandler.bindKey('CTRL+L', 'toggle-locked');
    keyHandler.bindKey('SPACE', 'play-pause');
    keyHandler.bindKey('ArrowLeft', 'skip-back-5');
    keyHandler.bindKey('ArrowRight', 'skip-forward-5');
  }

  function setActions() {
    keyHandler.registerAction('save-project', saveProject);
    keyHandler.registerAction('save-project-at', saveProjectAt);
    keyHandler.registerAction('load-project', loadProject);
    keyHandler.registerAction('open-video-dialog', openVideoDialog);
    keyHandler.registerAction('toggle-sidebar', () => (sidebarVisible = !sidebarVisible));
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
        appState.project.videoPath = selected;
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
      defaultPath: appState.project.videoPath?.replace(/\.[^/.]+$/, ''),
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
    appState.project.sceneListItems.push({
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
  }

  function addGroup() {
    appState.project.sceneListItems.push({
      type: 'group',
      id: crypto.randomUUID(),
      group: {
        id: crypto.randomUUID(),
        name: `Gruppe ${appState.groupCount + 1}`,
      },
      items: [],
    });
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
      sidebarWidth = newWidth;
    }
  }

  function stopResizing() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResizing);
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

<div class="flex h-screen flex-col bg-gray-900 text-gray-100">
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
      />
    </main>

    {#if sidebarVisible}
      <aside
        class="border-border relative max-w-2xl min-w-48 border-l"
        style="width: {sidebarWidth}px;"
      >
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          class="hover:bg-border absolute top-0 left-0 h-full w-1 cursor-col-resize"
          onmousedown={startResizing}
          role="separator"
        ></div>
        <SceneList
          bind:visible={sidebarVisible}
          bind:listItems={appState.project.sceneListItems}
          onJumpToScene={jumpToScene}
          onAddScene={addScene}
          onAddGroup={addGroup}
        />
      </aside>
    {:else}
      <Button
        variant="outline"
        size="icon"
        onclick={() => (sidebarVisible = !sidebarVisible)}
        title="Schaltet die Sidebar an (Strg+E)"
        class="mt-4 mr-2"
      >
        <Eye />
      </Button>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
</style>
