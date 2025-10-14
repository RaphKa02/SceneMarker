<script lang="ts">
  import DnDZone from '$components/scene-list/DnDZone.svelte';
  import { Button } from '$components/ui/button';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { appState } from '$lib/state.svelte';
  import type { SceneListItem } from '$lib/types';
  import CircleArrowDown from '@lucide/svelte/icons/circle-arrow-down';
  import EyeOff from '@lucide/svelte/icons/eye-off';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import Info from '@lucide/svelte/icons/info';
  import Lock from '@lucide/svelte/icons/lock';
  import LockOpen from '@lucide/svelte/icons/lock-open';
  import Plus from '@lucide/svelte/icons/plus';
  import { onMount } from 'svelte';

  interface Props {
    visible: boolean;
    listItems: SceneListItem[];
    onJumpToScene: (time: number) => void;
    onAddScene: () => void;
    onAddGroup: () => void;
  }

  let {
    visible = $bindable(true),
    listItems = $bindable(),
    onJumpToScene,
    onAddScene,
    onAddGroup,
  }: Props = $props();

  let locked = $state(false);

  let searchQuery = $state('');

  onMount(() => {
    setActions();
    return () => removeKeyboardShortcuts();
  });

  function setActions() {
    keyHandler.registerAction('add-scene', onAddScene);
    keyHandler.registerAction('add-group', onAddGroup);
    keyHandler.registerAction('toggle-locked', () => (locked = !locked));
  }

  function removeKeyboardShortcuts() {
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
        title="Fügt eine neue Szene hinzu (Strg+N)"
      >
        <Plus />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={onAddGroup}
        title="Erstellt einen neuen Ordner (Strg+G)"
      >
        <FolderPlus />
      </Button>
    </div>
    <div class="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onclick={() => (locked = !locked)}
        title="Schaltet drag and drop an/aus (Strg+L)"
      >
        {#if locked}
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
        class="bg-input w-full rounded border border-gray-600 px-3 py-2 pl-9 text-sm focus:border-blue-500 focus:outline-none"
      />
      <svg
        class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
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
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-2">
    <DnDZone bind:items={listItems} {locked} {searchQuery} {onJumpToScene} />
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
    <Button variant="ghost" size="icon" class="group" tabindex={-1}>
      <Info class="size-6" />
      <div
        class="border-border bg-card fixed right-4 bottom-12 hidden max-w-xs rounded-lg border p-3 text-xs transition-opacity group-focus:block"
      >
        <div class="mb-2 font-semibold">Tastenkürzel</div>
        <div class="space-y-1">
          <div><kbd class="rounded bg-gray-700 px-1 py-0.5">Strg+S</kbd> Speichern</div>
          <div>
            <kbd class="rounded bg-gray-700 px-1 py-0.5">Strg+Shift+S</kbd> Speichern unter
          </div>
          <div><kbd class="rounded bg-gray-700 px-1 py-0.5">Strg+O</kbd> Projekt öffnen</div>
          <div><kbd class="rounded bg-gray-700 px-1 py-0.5">Strg+Shift+O</kbd> Video öffnen</div>
          <div><kbd class="rounded bg-gray-700 px-1 py-0.5">Leertaste</kbd> Play/Pause</div>
          <div><kbd class="rounded bg-gray-700 px-1 py-0.5">←/→</kbd> ±5 Sekunden</div>
        </div>
        <p class="text-muted-foreground mt-2">Version: {appState.version}</p>
      </div>
    </Button>
  </div>
</div>
