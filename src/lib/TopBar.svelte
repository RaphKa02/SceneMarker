<script lang="ts">
  import { Button } from '$components/ui/button';
  import Save from '@lucide/svelte/icons/save';

  interface Props {
    projectModified: boolean;
    hasProject: boolean;
    projectName: string | null;
    onOpenVideo: () => void;
    onSaveProject: () => void;
    onSaveProjectAt: () => void;
    onLoadProject: () => void;
  }

  let {
    projectModified,
    hasProject,
    projectName,
    onOpenVideo,
    onSaveProject,
    onSaveProjectAt,
    onLoadProject,
  }: Props = $props();
</script>

<div
  class="border-border bg-background flex h-14 items-center gap-2 border-b px-4"
  data-tauri-drag-region
>
  <div class="mr-4 flex items-center gap-2">
    <div class="flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-bold">SM</div>
    <h1 class="text-lg font-bold">SceneMarker</h1>
  </div>

  <Button onclick={onOpenVideo} variant="outline" title="(Strg+Shift+O)">
    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
    Video öffnen
  </Button>

  <Button onclick={onLoadProject} variant="outline" title="(Strg+O)">
    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
      />
    </svg>
    Projekt laden
  </Button>

  <Button onclick={onSaveProjectAt} variant="outline" disabled={!hasProject} title="(Strg+Shift+S)">
    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
      />
    </svg>
    Projekt speichern unter
  </Button>
  <Button
    onclick={onSaveProject}
    disabled={!projectModified}
    variant={projectModified ? 'default' : 'outline'}
    title="Speichern (Strg+S)"
  >
    <Save />
  </Button>

  {#if projectName}
    <div class="text-muted-foreground text-sm">
      {projectName}
    </div>
  {:else if hasProject}
    <div class="text-muted-foreground text-sm">Video geladen</div>
  {/if}
</div>
