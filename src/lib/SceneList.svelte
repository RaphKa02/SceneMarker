<script lang="ts">
  import { Button } from '$components/ui/button';
  import { appState, getState, setState } from '$lib/state';
  import CircleArrowDown from '@lucide/svelte/icons/circle-arrow-down';
  import EyeOff from '@lucide/svelte/icons/eye-off';
  import Info from '@lucide/svelte/icons/info';
  import Lock from '@lucide/svelte/icons/lock';
  import LockOpen from '@lucide/svelte/icons/lock-open';
  import Plus from '@lucide/svelte/icons/plus';
  import { dndzone } from 'svelte-dnd-action';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import type { Project, Scene } from '../types';
  import SceneCard from './SceneCard.svelte';

  interface Props {
    visible: boolean;
    activeProject?: Project;
    onJumpToScene: (time: number) => void;
    onUpdateScene: (id: string, updates: Partial<Scene>) => void;
    onUpdateScenes: (scenes: Scene[]) => void;
    onDeleteScene: (id: string) => void;
    onAddScene: () => void;
  }

  let {
    visible = $bindable(true),
    activeProject,
    onJumpToScene,
    onUpdateScene,
    onUpdateScenes,
    onDeleteScene,
    onAddScene,
  }: Props = $props();

  let locked = $state(false);

  let searchQuery = $state('');
  let editingId = $state<string | null>(null);
  let categories = new SvelteSet(['test']);

  let uncategorizedScenes = $state<Scene[]>([]);
  let categorizedScenesMap = new SvelteMap<string, Scene[]>();

  $effect(() => {
    uncategorizedScenes = filteredScenes.filter((s) => !s.category);

    const newMap = new SvelteMap<string, Scene[]>();
    categories.forEach((cat) => {
      newMap.set(
        cat,
        filteredScenes.filter((s) => s.category === cat)
      );
    });
    categorizedScenesMap = newMap;
  });

  let filteredScenes = $derived(
    activeProject?.scenes.filter((scene) =>
      scene.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? []
  );

  function handleUncategorizedConsider(e: CustomEvent) {
    uncategorizedScenes = e.detail.items;
  }

  function handleUncategorizedFinalize(e: CustomEvent) {
    uncategorizedScenes = e.detail.items;

    const allScenes = [
      ...uncategorizedScenes.map((s) => ({ ...s, category: undefined })),
      ...Array.from(categorizedScenesMap.entries()).flatMap(([cat, items]) =>
        items.map((s) => ({ ...s, category: cat }))
      ),
      ...(activeProject?.scenes.filter((s) => !filteredScenes.find((fs) => fs.id === s.id)) ?? []),
    ];

    onUpdateScenes(allScenes);
  }
</script>

<div class="bg-background flex h-full flex-col">
  <div class="border-border flex justify-end border-b p-2">
    <div class="flex flex-1 gap-2">
      <Button
        variant="default"
        size="icon"
        disabled={!activeProject}
        onclick={onAddScene}
        title="Fügt eine neue Szene hinzu"
      >
        <Plus />
      </Button>
      <!-- <Button
        variant="outline"
        size="icon"
        disabled={!activeProject}
        onclick={() => {}}
        title="Erstellt einen neuen Ordner"
      >
        <FolderPlus />
      </Button> -->
    </div>
    <div class="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onclick={() => (locked = !locked)}
        title="Schaltet drag and drop an/aus"
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
        title="Schaltet die Sidebar aus"
      >
        <EyeOff />
      </Button>
    </div>
  </div>
  <div class="border-border border-b px-4 py-2">
    <h2 class="mb-3 text-lg font-semibold">Szenen ({activeProject?.scenes.length ?? 0})</h2>

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

  <div class="flex-1 overflow-y-auto overscroll-contain p-2">
    {#if filteredScenes.length !== 0}
      {#if uncategorizedScenes.length > 0}
        <div
          use:dndzone={{
            items: uncategorizedScenes,
            flipDurationMs: 300,
            dragDisabled: locked,
            dropTargetStyle: { outline: 'unset' },
          }}
          onconsider={handleUncategorizedConsider}
          onfinalize={handleUncategorizedFinalize}
          class="h-full space-y-2 outline-none"
        >
          {#each uncategorizedScenes as scene (scene.id)}
            <SceneCard
              bind:editing={() => editingId === scene.id, (v) => (editingId = v ? scene.id : null)}
              {locked}
              {scene}
              {onJumpToScene}
              {onDeleteScene}
              {onUpdateScene}
            />
          {/each}
        </div>
      {/if}
    {:else}
      <div class="text-muted-foreground mt-8 text-center">
        {#if !activeProject?.scenes.length}
          <svg
            class="mx-auto mb-3 h-16 w-16 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 7h 10 M7 12h 10 M7 17h 10 M6 4v 16 M18 4v 16"
            />
          </svg>

          <p class="text-sm">Noch keine Szenen</p>
          <p class="mt-1 text-xs">Klicke auf das Plus</p>
        {:else}
          <p class="text-sm">Keine Szenen gefunden</p>
        {/if}
      </div>
    {/if}
  </div>

  <div class="border-border flex h-12 items-center justify-end gap-1 border-t px-4">
    {#if $appState.updateAvailable}
      <Button variant="ghost" size="icon" onclick={() => setState({ showUpdatePopup: true })}>
        <CircleArrowDown class="size-6" />
      </Button>
    {/if}
    <Button variant="ghost" size="icon" class="group">
      <Info class="size-6" />
      <div
        class="border-border bg-card fixed right-4 bottom-12 max-w-xs rounded-lg border p-3 text-xs opacity-0 transition-opacity group-focus:opacity-100"
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
        <p class="text-muted-foreground mt-2">Version: {getState().version}</p>
      </div>
    </Button>
  </div>
</div>
