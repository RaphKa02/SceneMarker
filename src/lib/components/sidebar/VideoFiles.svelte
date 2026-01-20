<script lang="ts">
  import { Button } from '$components/ui/button';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { projectManager } from '$lib/projectManager.svelte';
  import { appState } from '$lib/state.svelte';
  import { tutorialElement } from '$lib/tutorial.svelte';
  import { cn } from '$utils';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import Plus from '@lucide/svelte/icons/plus';
  import VideoFileCard from './VideoFileCard.svelte';

  interface Props {
    toggleShowVideoFiles: () => void;
  }

  const { toggleShowVideoFiles }: Props = $props();

  let editingId = $state<string | null>(null);

  function handleDeleteVideo(videoId: string, deleteScenes: boolean) {
    projectManager.deleteVideoFile(videoId, deleteScenes);
  }
</script>

<div class="p-2">
  <div
    class={cn(
      'flex items-center justify-between',
      !appState.uiState.showSidebar && 'justify-center'
    )}
  >
    {#if appState.uiState.showSidebar}
      <h3 class="text-lg font-semibold">
        Videodateien
        <span class="text-muted-foreground text-lg">
          ({appState.project.videoLibrary.size})
        </span>
      </h3>
    {/if}
    <div class={cn('flex gap-2', !appState.uiState.showSidebar && 'flex-col items-center gap-2')}>
      <Button
        variant="default"
        size="icon"
        onclick={projectManager.addVideoFile}
        title={`Fügt eine neue Videodatei hinzu (${keyHandler.getKeyCombo(
          'open-video-dialog',
          true
        )})`}
        use={[[tutorialElement, { id: 'add-video-btn' }]]}
      >
        <Plus />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={toggleShowVideoFiles}
        title={`Schaltet die Videoliste aus (${keyHandler.getKeyCombo('toggle-videofiles', true)})`}
        use={[[tutorialElement, { id: 'show-videos-btn' }]]}
      >
        {#if appState.uiState.showVideoFiles}
          <ChevronUp />
        {/if}
      </Button>
    </div>
  </div>

  <div class="mt-3 space-y-1">
    {#if appState.project.videoLibrary.size === 0}
      <p class="text-muted-foreground px-2 text-center text-sm">
        Noch keine Videodatei hinzugefügt.
      </p>
    {:else}
      {#each appState.project.videoLibrary as [id, videoSource] (id)}
        <VideoFileCard
          bind:videoSource={() => videoSource, (v) => appState.project.videoLibrary.set(id, v)}
          bind:editingId
          onDeleteVideo={(deleteScenes) => handleDeleteVideo(id, deleteScenes)}
        />
      {/each}
    {/if}
  </div>
</div>
