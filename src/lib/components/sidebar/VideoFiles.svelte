<script lang="ts">
  import { Button } from '$components/ui/button';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { projectManager } from '$lib/projectManager.svelte';
  import { appState } from '$lib/state.svelte';
  import { tutorialElement } from '$lib/tutorial.svelte';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import Plus from '@lucide/svelte/icons/plus';
  import VideoFileCard from './VideoFileCard.svelte';

  interface Props {
    toggleShowVideoFiles: () => void;
    editingId: string | null;
  }

  let { toggleShowVideoFiles, editingId = $bindable() }: Props = $props();

  function handleDeleteVideo(videoId: string, deleteScenes: boolean) {
    projectManager.deleteVideoFile(videoId, deleteScenes);
  }
</script>

<div class="p-2">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold">
      Videodateien
      <span class="text-muted-foreground text-lg">
        ({appState.project.videoLibrary.size})
      </span>
    </h3>
    <div class="flex gap-2">
      <Button
        variant="default"
        size="icon"
        onclick={async () => {
          const id = await projectManager.addVideoFile();
          if (id) editingId = id;
        }}
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
        use={[[tutorialElement, { id: 'hide-videofiles-btn' }]]}
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
