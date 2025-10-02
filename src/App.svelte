<script lang="ts">
  import SceneList from '$lib/SceneList.svelte';
  import TopBar from '$lib/TopBar.svelte';
  import VideoPlayer from '$lib/VideoPlayer.svelte';
  import Minus from '@lucide/svelte/icons/minus';
  import Square from '@lucide/svelte/icons/square';
  import X from '@lucide/svelte/icons/x';
  import { ask, open, save } from '@tauri-apps/plugin-dialog';
  import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
  import type { Project, Scene } from './types';

  import { Button } from '$components/ui/button';
  import Eye from '@lucide/svelte/icons/eye';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  let currentProject = $state<Project>();
  let projectModified = $state(false);

  let sidebarWidth = $state(320);
  let sidebarVisible = $state(true);
  let isResizing = $state(false);

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

  onMount(() => {
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

      // // Space - Play/Pause
      // if (e.key === ' ' && videoElement) {
      //   e.preventDefault();
      //   togglePlayPause();
      // }

      // // Arrow keys - Skip ±5s
      // if (e.key === 'ArrowLeft' && videoElement) {
      //   e.preventDefault();
      //   skipVideo(-5);
      // }

      // if (e.key === 'ArrowRight' && videoElement) {
      //   e.preventDefault();
      //   skipVideo(5);
      // }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

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
    try {
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
        const content = await readTextFile(selected as string);
        const project: Project = JSON.parse(content);
        currentProject = project;
        projectModified = false;
      }
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

<svelte:window onbeforeunload={(e) => projectModified && e.preventDefault()} />

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

<!-- Keyboard shortcuts hint -->
<div
  class="fixed right-4 bottom-4 max-w-xs rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs text-gray-400 opacity-0 transition-opacity hover:opacity-100"
>
  <div class="mb-2 font-semibold">Tastenkürzel</div>
  <div class="space-y-1">
    <div><kbd class="rounded bg-gray-700 px-1 py-0.5">Strg+S</kbd> Speichern</div>
    <div><kbd class="rounded bg-gray-700 px-1 py-0.5">Strg+Shift+S</kbd> Speichern unter</div>
    <div><kbd class="rounded bg-gray-700 px-1 py-0.5">Strg+O</kbd> Projekt öffnen</div>
    <div><kbd class="rounded bg-gray-700 px-1 py-0.5">Strg+Shift+O</kbd> Video öffnen</div>
    <div><kbd class="rounded bg-gray-700 px-1 py-0.5">Leertaste</kbd> Play/Pause</div>
    <div><kbd class="rounded bg-gray-700 px-1 py-0.5">←/→</kbd> ±5 Sekunden</div>
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
