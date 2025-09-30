<script lang="ts">
  interface Props {
    projectModified: boolean;
    hasVideo: boolean;
    onOpenVideo: () => void;
    onSaveProject: () => void;
    onLoadProject: () => void;
  }

  let { projectModified, hasVideo, onOpenVideo, onSaveProject, onLoadProject }: Props = $props();
</script>

<div class="flex h-14 items-center gap-2 border-b border-gray-700 bg-gray-800 px-4">
  <div class="mr-4 flex items-center gap-2">
    <div class="flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-bold">SM</div>
    <h1 class="text-lg font-bold">SceneMarker</h1>
  </div>

  <button
    onclick={onOpenVideo}
    class="flex items-center gap-2 rounded bg-gray-700 px-4 py-2 transition-colors hover:bg-gray-600"
  >
    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
    Video öffnen
  </button>

  <button
    onclick={onLoadProject}
    class="flex items-center gap-2 rounded bg-gray-700 px-4 py-2 transition-colors hover:bg-gray-600"
  >
    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
      />
    </svg>
    Projekt laden
  </button>

  <button
    onclick={onSaveProject}
    disabled={!hasVideo}
    class="flex items-center gap-2 rounded px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    class:bg-green-600={projectModified}
    class:hover:bg-green-700={projectModified}
    class:bg-gray-700={!projectModified}
    class:hover:bg-gray-600={!projectModified}
  >
    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
      />
    </svg>
    Projekt speichern
    {#if projectModified}
      <span class="text-xs">●</span>
    {/if}
  </button>

  <div class="flex-1"></div>

  {#if hasVideo}
    <div class="text-sm text-gray-400">Video geladen</div>
  {/if}
</div>
