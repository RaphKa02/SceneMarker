<script lang="ts">
  import NewProjectBtn from '$components/topBar/NewProjectBtn.svelte';
  import RecentProjects from '$components/topBar/RecentProjects.svelte';
  import SaveProjectAtBtn from '$components/topBar/SaveProjectAtBtn.svelte';
  import SaveProjectBtn from '$components/topBar/SaveProjectBtn.svelte';
  import { appState } from '$lib/state.svelte';
  import LoadProjectBtn from './LoadProjectBtn.svelte';

  interface Props {
    projectName: string | null;
  }

  let { projectName }: Props = $props();
</script>

<div
  class="border-border bg-background flex h-14 items-center gap-2 border-b px-4"
  data-tauri-drag-region
>
  <div class="mr-4 flex items-center gap-2">
    <div
      class="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded font-bold"
    >
      SM
    </div>
    <h1 class="text-lg font-bold">SceneMarker</h1>
  </div>

  <RecentProjects />

  <LoadProjectBtn />

  <NewProjectBtn />

  <SaveProjectAtBtn />

  <SaveProjectBtn />

  {#if projectName}
    <div class="text-muted-foreground text-sm">
      {projectName}
    </div>
  {:else if !appState.project.filePath}
    <p class="text-muted-foreground">Neues Projekt</p>
  {/if}
</div>
