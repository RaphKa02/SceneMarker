<script lang="ts">
  import DnDZone from '$components/sidebar/DnDZone.svelte';
  import { Button } from '$components/ui/button';
  import { trackEvent } from '$lib/analytics';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { appState } from '$lib/state.svelte';
  import { startTutorial, tutorialElement } from '$lib/tutorial.svelte';
  import type { SceneListItem } from '$lib/types';
  import Download from '@lucide/svelte/icons/download';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import Lock from '@lucide/svelte/icons/lock';
  import LockOpen from '@lucide/svelte/icons/lock-open';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import Plus from '@lucide/svelte/icons/plus';
  import Rocket from '@lucide/svelte/icons/rocket';
  import Search from '@lucide/svelte/icons/search';
  import Settings from '@lucide/svelte/icons/settings';
  import X from '@lucide/svelte/icons/x';
  import { onMount } from 'svelte';
  import { cn } from '$utils';

  interface Props {
    listItems: SceneListItem[];
    onJumpToScene: (time: number) => void;
    onAddScene: () => void;
    onAddGroup: () => void;
    onShowSettings: () => void;
  }

  let {
    listItems = $bindable(),
    onJumpToScene,
    onAddScene,
    onAddGroup,
    onShowSettings,
  }: Props = $props();

  let searchQuery = $state('');

  onMount(() => {
    setActions();
    return () => removeActions();
  });

  function setActions() {
    keyHandler.registerAction('add-scene', onAddScene);
    keyHandler.registerAction('add-group', onAddGroup);
    keyHandler.registerAction('toggle-locked', toggleLockSidebar);
  }

  function removeActions() {
    keyHandler.removeAction('add-scene');
    keyHandler.removeAction('add-group');
    keyHandler.removeAction('toggle-locked');
  }

  function toggleLockSidebar() {
    appState.uiState.lockSidebar = !appState.uiState.lockSidebar;
    trackEvent('sidebar_locked', { value: String(appState.uiState.lockSidebar) });
  }

  function toggleShowSidebar() {
    appState.uiState.showSidebar = !appState.uiState.showSidebar;
    trackEvent('sidebar_visible', { value: String(appState.uiState.showSidebar) });
  }
</script>

<aside class="bg-background flex h-full flex-col divide-y transition-all duration-300 ease-in-out">
  <div
    class={cn(
      'flex justify-between p-2',
      !appState.uiState.showSidebar && 'flex-col items-center gap-2'
    )}
  >
    <!-- <Button
      variant="outline"
      size="icon"
      onclick={toggleLockSidebar}
      title={`Schaltet drag and drop an/aus (${keyHandler.getKeyCombo('toggle-locked', true)})`}
      use={[[tutorialElement, { id: 'lock-sidebar-btn' }]]}
    >
      {#if appState.uiState.lockSidebar}
        <FileVideoCamera />
      {:else}
        <LockOpen />
      {/if}
    </Button> -->
    <Button
      variant="outline"
      size="icon"
      onclick={toggleShowSidebar}
      title="Schaltet die Sidebar aus (Strg+E)"
      use={[[tutorialElement, { id: 'hide-sidebar-btn' }]]}
    >
      {#if appState.uiState.showSidebar}
        <ChevronRight />
      {:else}
        <ChevronLeft />
      {/if}
    </Button>
  </div>
  <div class="p-2">
    <div
      class={cn(
        'flex items-center justify-between',
        !appState.uiState.showSidebar && 'justify-center'
      )}
    >
      {#if appState.uiState.showSidebar}
        <h3 class="text-lg font-semibold">Szenen ({appState.sceneCount})</h3>
      {/if}
      <div class={cn('flex gap-2', !appState.uiState.showSidebar && 'flex-col items-center gap-2')}>
        <Button
          variant="default"
          size="icon"
          onclick={onAddScene}
          title={`Fügt eine neue Szene hinzu (${keyHandler.getKeyCombo('add-scene', true)})`}
          use={[[tutorialElement, { id: 'add-scene-btn' }]]}
        >
          <Plus />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onclick={onAddGroup}
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
        bind:items={listItems}
        locked={appState.uiState.lockSidebar}
        {searchQuery}
        {onJumpToScene}
      />
    {/if}
  </div>

  <div
    class={cn(
      'flex justify-between p-2',
      !appState.uiState.showSidebar && 'flex-col items-center gap-2'
    )}
  >
    {#if appState.uiState.showSidebar}
      <Button
        variant="ghost"
        size="icon"
        onclick={startTutorial}
        use={[[tutorialElement, { id: 'tour-btn' }]]}
      >
        <Rocket class="size-5" />
      </Button>
    {/if}
    <div class={cn('flex gap-2', !appState.uiState.showSidebar && 'flex-col items-center')}>
      {#if appState.updateAvailable}
        <Button variant="ghost" size="icon" onclick={() => (appState.showUpdatePopup = true)}>
          <Download class="size-5" />
        </Button>
      {/if}
      <Button
        variant="ghost"
        size="icon"
        class="relative"
        onclick={onShowSettings}
        use={[[tutorialElement, { id: 'settings-btn' }]]}
      >
        <Settings class="size-5" />
      </Button>
    </div>
  </div>
</aside>
