<script lang="ts">
  import DnDZone from '$components/sidebar/DnDZone.svelte';
  import { Button } from '$components/ui/button';
  import ButtonGroup from '$components/ui/button-group/button-group.svelte';
  import * as ToggleGroup from '$components/ui/toggle-group';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { projectManager } from '$lib/projectManager.svelte';
  import { appState } from '$lib/state.svelte';
  import { tutorialElement } from '$lib/tutorial.svelte';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import ListFilter from '@lucide/svelte/icons/list-filter';
  import ListFilterPlus from '@lucide/svelte/icons/list-filter-plus';
  import Lock from '@lucide/svelte/icons/lock';
  import LockOpen from '@lucide/svelte/icons/lock-open';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';

  interface Props {
    toggleLockSidebar: () => void;
    toggleShowFilters: () => void;
    editingId: string | null;
  }

  let { toggleLockSidebar, toggleShowFilters, editingId = $bindable() }: Props = $props();

  let searchQuery = $state('');
  let videoFilter = $state<string[]>([]);
</script>

<div class="space-y-2 px-2 pt-4 pb-2">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold">
      Szenen
      <span class="text-muted-foreground text-lg">
        ({appState.sceneCount})
      </span>
    </h3>
    <div class="flex gap-2">
      <ButtonGroup>
        <Button
          variant="default"
          size="icon"
          onclick={() => {
            const id = projectManager.addScene();
            if (id) editingId = id;
          }}
          title={`Fügt eine neue Szene hinzu (${keyHandler.getKeyCombo('add-scene', true)})`}
          use={[[tutorialElement, { id: 'add-scene-btn' }]]}
        >
          <Plus />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onclick={() => {
            const id = projectManager.addGroup();
            if (id) editingId = id;
          }}
          title={`Erstellt einen neuen Ordner (${keyHandler.getKeyCombo('add-group', true)})`}
          use={[[tutorialElement, { id: 'add-group-btn' }]]}
        >
          <FolderPlus />
        </Button>
      </ButtonGroup>
      <Button
        variant="outline"
        size="icon"
        onclick={toggleLockSidebar}
        title={`Schaltet drag and drop an/aus (${keyHandler.getKeyCombo('toggle-locked', true)})`}
        use={[[tutorialElement, { id: 'lock-sidebar-btn' }]]}
      >
        {#if appState.uiState.lockSidebar}
          <Lock />
        {:else}
          <LockOpen />
        {/if}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={toggleShowFilters}
        title={`Blendet die Filter ein/aus (${keyHandler.getKeyCombo('toggle-filter', true)})`}
        use={[[tutorialElement, { id: 'toggle-filter-btn' }]]}
      >
        {#if appState.uiState.showFilter}
          <ListFilter />
        {:else}
          <ListFilterPlus />
        {/if}
      </Button>
    </div>
  </div>

  {#if appState.uiState.showFilter}
    <div class="relative" use:tutorialElement={{ id: 'filter-input' }}>
      <input
        type="text"
        name="search"
        bind:value={searchQuery}
        placeholder="Einträge durchsuchen..."
        class="bg-input w-full rounded border px-9 py-2 text-sm"
      />
      <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Button
        variant="ghost"
        size="sm"
        class="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
        onclick={() => (searchQuery = '')}
      >
        <X />
      </Button>
    </div>

    {#if appState.hasMultipleVideos}
      <ToggleGroup.Root
        type="multiple"
        variant="outline"
        spacing={2}
        size="sm"
        bind:value={videoFilter}
        class="flex w-full flex-row flex-wrap gap-2 [--radius:9999rem]"
      >
        {#each appState.project.videoLibrary as [id, videoSource] (id)}
          <ToggleGroup.Item
            value={id}
            aria-label={`${videoSource.name} umschalten`}
            class="data-[state=on]:*:[svg]:stroke-primary data-[state=on]:border-primary max-w-full data-[state=on]:bg-transparent data-[state=off]:*:[svg]:hidden"
          >
            <CircleCheck />
            <span class="truncate">{videoSource.name}</span>
          </ToggleGroup.Item>
        {/each}
        {#if videoFilter.length > 0}
          <Button
            variant="ghost"
            size="icon"
            class="text-muted-foreground ml-2 size-4"
            onclick={() => (videoFilter = [])}
          >
            <X />
          </Button>
        {/if}
      </ToggleGroup.Root>
    {/if}
  {/if}
</div>

<div class="bg-background flex-1 overflow-y-auto p-2" use:tutorialElement={{ id: 'items-area' }}>
  <DnDZone
    bind:items={appState.project.sceneListItems}
    locked={appState.uiState.lockSidebar}
    {searchQuery}
    {videoFilter}
    bind:editingId
  />
</div>
