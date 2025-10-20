<script lang="ts">
  import DnDZone from '$components/scene-list/DnDZone.svelte';
  import { Button } from '$components/ui/button';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { appState } from '$lib/state.svelte';
  import type { SceneListItem } from '$lib/types';
  import CircleArrowDown from '@lucide/svelte/icons/circle-arrow-down';
  import EyeOff from '@lucide/svelte/icons/eye-off';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import Lock from '@lucide/svelte/icons/lock';
  import LockOpen from '@lucide/svelte/icons/lock-open';
  import Plus from '@lucide/svelte/icons/plus';
  import Settings from '@lucide/svelte/icons/settings';
  import X from '@lucide/svelte/icons/x';
  import { onMount } from 'svelte';

  interface Props {
    visible: boolean;
    listItems: SceneListItem[];
    onJumpToScene: (time: number) => void;
    onAddScene: () => void;
    onAddGroup: () => void;
    onShowSettings: () => void;
  }

  let {
    visible = $bindable(true),
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
    keyHandler.registerAction(
      'toggle-locked',
      () => (appState.uiState.lockSidebar = !appState.uiState.lockSidebar)
    );
  }

  function removeActions() {
    keyHandler.removeAction('add-scene');
    keyHandler.removeAction('add-group');
    keyHandler.removeAction('toggle-locked');
  }
</script>

<div class="bg-background flex h-full flex-col">
  <div class="border-border flex justify-end border-b p-2">
    <div class="flex flex-1 gap-2">
      <Button
        variant="default"
        size="icon"
        onclick={onAddScene}
        title={`Fügt eine neue Szene hinzu (${keyHandler.getKeyCombo('add-scene', true)})`}
      >
        <Plus />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={onAddGroup}
        title={`Erstellt einen neuen Ordner (${keyHandler.getKeyCombo('add-group', true)})`}
      >
        <FolderPlus />
      </Button>
    </div>
    <div class="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onclick={() => (appState.uiState.lockSidebar = !appState.uiState.lockSidebar)}
        title={`Schaltet drag and drop an/aus (${keyHandler.getKeyCombo('toggle-locked', true)})`}
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
        onclick={() => (visible = !visible)}
        title="Schaltet die Sidebar aus (Strg+E)"
      >
        <EyeOff />
      </Button>
    </div>
  </div>
  <div class="border-border border-b px-4 py-2">
    <h2 class="mb-3 text-lg font-semibold">Szenen ({appState.sceneCount})</h2>

    <div class="relative">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Szenen durchsuchen..."
        class="bg-input w-full rounded border px-9 py-2 text-sm"
      />
      <svg
        class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <Button
        variant="ghost"
        size="sm"
        class="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
        onclick={() => (searchQuery = '')}
      >
        <X />
      </Button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-2">
    <DnDZone
      bind:items={listItems}
      locked={appState.uiState.lockSidebar}
      {searchQuery}
      {onJumpToScene}
    />
  </div>

  <div class="border-border flex h-12 items-center justify-end gap-1 border-t px-4">
    {#if appState.updateAvailable}
      <Button
        variant="ghost"
        size="icon"
        tabindex={-1}
        onclick={() => (appState.showUpdatePopup = true)}
      >
        <CircleArrowDown class="size-6" />
      </Button>
    {/if}
    <Button variant="ghost" size="icon" onclick={onShowSettings}>
      <Settings class="size-5" />
    </Button>
  </div>
</div>
