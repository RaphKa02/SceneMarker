<script lang="ts">
  import VideoPlayer from './lib/VideoPlayer.svelte';
  import SceneList from './lib/SceneList.svelte';
  import TopBar from './lib/TopBar.svelte';
  import { open, save } from '@tauri-apps/plugin-dialog';
  import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';

  interface Scene {
    id: string;
    title: string;
    time: number;
    category?: string;
  }

  interface Project {
    videoPath: string;
    scenes: Scene[];
  }

  let videoPath = $state('');
  let scenes = $state<Scene[]>([]);
  let currentTime = $state(0);
  let videoElement: HTMLVideoElement | null = $state(null);
  let projectModified = $state(false);

  async function openVideoDialog() {
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
        videoPath = selected;
        scenes = [];
        projectModified = false;
      }
    } catch (err) {
      console.error('Fehler beim Öffnen des Videos:', err);
    }
  }

  async function saveProject() {
    try {
      const project: Project = {
        videoPath,
        scenes,
      };

      const savePath = await save({
        filters: [
          {
            name: 'SceneMarker Project',
            extensions: ['smp'],
          },
        ],
      });

      if (savePath) {
        await writeTextFile(savePath, JSON.stringify(project, null, 2));
        projectModified = false;
        console.log('Saved project to ' + savePath);
      }
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
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
        videoPath = project.videoPath;
        scenes = project.scenes;
        projectModified = false;
      }
    } catch (err) {
      console.error('Fehler beim Laden:', err);
    }
  }

  function addScene() {
    const newScene: Scene = {
      id: crypto.randomUUID(),
      title: `Szene ${scenes.length + 1}`,
      time: currentTime,
    };
    scenes = [...scenes, newScene];
    projectModified = true;
  }

  function updateScene(id: string, updates: Partial<Scene>) {
    scenes = scenes.map((s) => (s.id === id ? { ...s, ...updates } : s));
    projectModified = true;
  }

  function deleteScene(id: string) {
    scenes = scenes.filter((s) => s.id !== id);
    projectModified = true;
  }

  function jumpToScene(time: number) {
    if (videoElement) {
      videoElement.currentTime = time;
    }
  }

  function handleTimeUpdate(time: number) {
    currentTime = time;
  }

  function setVideoElement(element: HTMLVideoElement) {
    videoElement = element;
  }
</script>

<div class="flex h-screen flex-col bg-gray-900 text-gray-100">
  <TopBar
    {projectModified}
    hasVideo={!!videoPath}
    onOpenVideo={openVideoDialog}
    onSaveProject={saveProject}
    onLoadProject={loadProject}
  />

  <div class="flex flex-1 overflow-hidden">
    <div class="flex flex-1 flex-col p-4">
      <VideoPlayer {videoPath} bind:currentTime onVideoElementReady={setVideoElement} />

      {#if videoPath}
        <div class="mt-4 flex justify-center">
          <button
            onclick={addScene}
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold transition-colors hover:bg-blue-700"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Szene speichern
          </button>
        </div>
      {/if}
    </div>

    <div class="w-80 border-l border-gray-700">
      <SceneList
        {scenes}
        {currentTime}
        onJumpToScene={jumpToScene}
        onUpdateScene={updateScene}
        onDeleteScene={deleteScene}
      />
    </div>
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
