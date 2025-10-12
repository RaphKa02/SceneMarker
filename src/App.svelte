<script lang="ts">
  import SceneList from '$components/scene-list/SceneList.svelte';
  import { Button } from '$components/ui/button';
  import UpdateAlert from '$components/UpdateAlert.svelte';
  import logger from '$lib/logger';
  import { appState } from '$lib/state.svelte';
  import TopBar from '$lib/TopBar.svelte';
  import type { Project } from '$lib/types';
  import VideoPlayer from '$lib/VideoPlayer.svelte';
  import Eye from '@lucide/svelte/icons/eye';
  import Minus from '@lucide/svelte/icons/minus';
  import Square from '@lucide/svelte/icons/square';
  import X from '@lucide/svelte/icons/x';
  import { invoke } from '@tauri-apps/api/core';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { ask, open, save } from '@tauri-apps/plugin-dialog';
  import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { dev, number, version } from '../build.json';

  let sidebarWidth = $state(320);
  let sidebarVisible = $state(true);
  let isResizing = $state(false);

  onMount(() => {
    logger.log(`SceneMarker ${version} ${number}`);

    processArgs();

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

    return async () => (await unlisten)();
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

  function handleKeyDown(e: KeyboardEvent) {
    // Ignore shortcuts when typing in input fields
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Ctrl+S - Quick save
    if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
      e.preventDefault();
      saveProject();
    }

    // Ctrl+Shift+S - Save as
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      saveProjectAt();
    }

    // Ctrl+O - Open project
    if (e.ctrlKey && e.key === 'o' && !e.shiftKey) {
      e.preventDefault();
      loadProject();
    }

    // Ctrl+Shift+O - Open video
    if (e.ctrlKey && e.shiftKey && e.key === 'O') {
      e.preventDefault();
      openVideoDialog();
    }
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
      const content = await readTextFile(filePath);
      const project: Project = JSON.parse(content);
      appState.project = project;
      appState.projectModified = false;
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
  onkeydown={handleKeyDown}
/>

{#if appState.updateAvailable}
  <UpdateAlert />
{/if}

<div class="fixed top-0 right-0 flex gap-2 p-2">
  <Button
    variant="outline"
    size="icon"
    onclick={() => {
      getCurrentWindow().minimize();
    }}
  >
    <Minus />
  </Button>
  <Button
    variant="outline"
    size="icon"
    onclick={() => {
      getCurrentWindow().toggleMaximize();
    }}
  >
    <Square />
  </Button>
  <Button
    variant="outline"
    size="icon"
    onclick={() => {
      getCurrentWindow().close();
    }}
  >
    <X />
  </Button>
</div>
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
        title="Schaltet die Sidebar an"
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
