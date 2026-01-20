<script lang="ts">
  import DnDZone from '$components/sidebar/DnDZone.svelte';
  import { Button } from '$components/ui/button';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { projectManager } from '$lib/projectManager.svelte';
  import { appState } from '$lib/state.svelte';
  import { tutorialElement } from '$lib/tutorial.svelte';
  import { cn } from '$utils';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import Lock from '@lucide/svelte/icons/lock';
  import LockOpen from '@lucide/svelte/icons/lock-open';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';

  interface Props {
    toggleLockSidebar: () => void;
  }

  const { toggleLockSidebar }: Props = $props();

  let searchQuery = $state('');
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
        Szenen
        <span class="text-muted-foreground text-lg">
          ({appState.sceneCount})
        </span>
      </h3>
    {/if}
    <div class={cn('flex gap-2', !appState.uiState.showSidebar && 'flex-col items-center gap-2')}>
      <Button
        variant="default"
        size="icon"
        onclick={projectManager.addScene}
        title={`Fügt eine neue Szene hinzu (${keyHandler.getKeyCombo('add-scene', true)})`}
        use={[[tutorialElement, { id: 'add-scene-btn' }]]}
      >
        <Plus />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={projectManager.addGroup}
        title={`Erstellt einen neuen Ordner (${keyHandler.getKeyCombo('add-group', true)})`}
        use={[[tutorialElement, { id: 'add-group-btn' }]]}
      >
        <FolderPlus />
      </Button>
      {#if appState.uiState.showSidebar}
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
      {/if}
    </div>
  </div>

  {#if appState.uiState.showSidebar}
    <div class="relative mt-3" use:tutorialElement={{ id: 'filter-input' }}>
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
  {/if}
</div>

<div class="bg-background flex-1 overflow-y-auto p-2" use:tutorialElement={{ id: 'items-area' }}>
  {#if appState.uiState.showSidebar}
    <DnDZone
      bind:items={appState.project.sceneListItems}
      locked={appState.uiState.lockSidebar}
      {searchQuery}
    />
  {/if}
</div>
