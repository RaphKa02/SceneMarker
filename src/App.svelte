<script lang="ts">
  import { Button } from '$components/ui/button';
  import UpdateAlert from '$components/UpdateAlert.svelte';
  import SceneList from '$lib/SceneList.svelte';
  import { appState } from '$lib/state';
  import TopBar from '$lib/TopBar.svelte';
  import VideoPlayer from '$lib/VideoPlayer.svelte';
  import Eye from '@lucide/svelte/icons/eye';
  import Minus from '@lucide/svelte/icons/minus';
  import Square from '@lucide/svelte/icons/square';
  import X from '@lucide/svelte/icons/x';
  import { listen } from '@tauri-apps/api/event';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { ask, open, save } from '@tauri-apps/plugin-dialog';
  import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import type { Project, Scene } from './types';

  let currentProject = $state<Project>();
  let projectModified = $state(false);

  let sidebarWidth = $state(320);
  let sidebarVisible = $state(true);
  let isResizing = $state(false);

  onMount(() => {
    const unlisten = listen('file-opened', (event) => {
      const filePath = event.payload as string;
      console.log('Datei geöffnet:', filePath);

      loadProjectFromPath(filePath);
    });

    return async () => (await unlisten)();
  });

  onMount(() => {
    const unlisten = getCurrentWindow().onCloseRequested(async (event) => {
      if (!projectModified) return;

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
        if (!currentProject) currentProject = { currentTime: 0, scenes: [], videoPath: '' };
        currentProject.videoPath = selected;
        if (reset) currentProject.scenes = [];
        projectModified = false;
      }
    } catch (err) {
      console.error('Fehler beim Öffnen des Videos:', err);
    }
  }

  async function saveProject() {
    if (!currentProject?.filePath) return saveProjectAt();

    try {
      await writeTextFile(currentProject.filePath, JSON.stringify(currentProject, null, 2));
      projectModified = false;
      console.log('Saved project at ' + currentProject.filePath);
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      toast.error('Fehler beim Speichern', {
        description: 'Möglicherweise kann in den angegebenen Ort nicht geschrieben werden',
        dismiss: false,
        dismissable: true,
        closeButton: true,
      });
    }
  }

  async function saveProjectAt() {
    if (!currentProject) return;

    const savePath = await save({
      defaultPath: currentProject.videoPath.replace(/\.[^/.]+$/, ''),
      filters: [
        {
          name: 'SceneMarker Project',
          extensions: ['smp'],
        },
      ],
    });

    if (savePath) {
      currentProject.filePath = savePath;
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

  async function loadProjectFromPath(path: string) {
    try {
      const content = await readTextFile(path);
      const project: Project = JSON.parse(content);
      currentProject = project;
      projectModified = false;
    } catch (err) {
      console.error('Fehler beim Laden:', err);
      toast.error('Fehler beim Öffnen', {
        description: 'Möglicherweise wurde die Datei geändert und ist nun beschädigt',
        dismiss: false,
        dismissable: true,
        closeButton: true,
      });
    }
  }

  function addScene() {
    if (!currentProject) return;

    const newScene: Scene = {
      id: crypto.randomUUID(),
      title: `Szene ${currentProject.scenes.length + 1}`,
      time: currentProject.currentTime,
    };
    currentProject.scenes = [...currentProject.scenes, newScene];
    projectModified = true;
  }

  function updateScene(id: string, updates: Partial<Scene>) {
    if (!currentProject) return;

    currentProject.scenes = currentProject.scenes.map((s) =>
      s.id === id
        ? {
            ...s,
            ...updates,
            time:
              updates.time === -1 ? (currentProject?.currentTime ?? 0) : (updates.time ?? s.time),
          }
        : s
    );
    projectModified = true;
  }

  function updateScenes(newScenes: Scene[]) {
    if (!currentProject) return;

    currentProject.scenes = newScenes;
    projectModified = true;
  }

  function deleteScene(id: string) {
    if (!currentProject) return;

    currentProject.scenes = currentProject.scenes.filter((s) => s.id !== id);
    projectModified = true;
  }

  function jumpToScene(time: number) {
    if (!currentProject) return;

    currentProject.currentTime = time;
  }

  function startResizing(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);
  }

  function resize(e: any) {
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
  onbeforeunload={(e) => projectModified && e.preventDefault()}
  onkeydown={handleKeyDown}
/>

{#if $appState.updateAvailable}
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
    {projectModified}
    hasProject={!!currentProject}
    projectName={currentProject?.filePath?.split(/[\\/]/).pop() ?? null}
    onOpenVideo={openVideoDialog}
    onSaveProject={saveProject}
    onSaveProjectAt={saveProjectAt}
    onLoadProject={loadProject}
  />

  <div class="flex flex-1 overflow-hidden">
    <main class="flex flex-1 flex-col p-4">
      <VideoPlayer
        videoPath={currentProject?.videoPath}
        bind:currentTime={
          () => currentProject?.currentTime ?? 0,
          (v) => {
            if (currentProject) currentProject.currentTime = v;
          }
        }
        onRelocateVideo={() => openVideoDialog(false)}
      />
    </main>

    {#if sidebarVisible}
      <aside
        class="border-border relative max-w-2xl min-w-48 border-l"
        style="width: {sidebarWidth}px;"
      >
        <!-- Drag handle -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          class="hover:bg-border absolute top-0 left-0 h-full w-1 cursor-col-resize"
          onmousedown={startResizing}
          role="separator"
        ></div>
        <SceneList
          bind:visible={sidebarVisible}
          activeProject={currentProject}
          onAddScene={addScene}
          onJumpToScene={jumpToScene}
          onUpdateScene={updateScene}
          onUpdateScenes={updateScenes}
          onDeleteScene={deleteScene}
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
