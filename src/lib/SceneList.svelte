<script lang="ts">
  interface Scene {
    id: string;
    title: string;
    time: number;
    category?: string;
  }

  interface Props {
    scenes: Scene[];
    currentTime: number;
    onJumpToScene: (time: number) => void;
    onUpdateScene: (id: string, updates: Partial<Scene>) => void;
    onDeleteScene: (id: string) => void;
  }

  let { scenes, currentTime, onJumpToScene, onUpdateScene, onDeleteScene }: Props = $props();

  let searchQuery = $state('');
  let editingId = $state<string | null>(null);
  let editTitle = $state('');

  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function startEdit(scene: Scene) {
    editingId = scene.id;
    editTitle = scene.title;
  }

  function saveEdit() {
    if (editingId && editTitle.trim()) {
      onUpdateScene(editingId, { title: editTitle.trim() });
      editingId = null;
    }
  }

  function cancelEdit() {
    editingId = null;
    editTitle = '';
  }

  function updateSceneTime(id: string) {
    onUpdateScene(id, { time: currentTime });
  }

  let filteredScenes = $derived(
    scenes.filter((scene) => scene.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );
</script>

<div class="flex h-full flex-col bg-gray-800">
  <div class="border-b border-gray-700 p-4">
    <h2 class="mb-3 text-lg font-semibold">Szenen ({scenes.length})</h2>

    <div class="relative">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Szenen durchsuchen..."
        class="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 pl-9 text-sm focus:border-blue-500 focus:outline-none"
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
    {#if filteredScenes.length === 0}
      <div class="mt-8 text-center text-gray-400">
        {#if scenes.length === 0}
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p class="text-sm">Noch keine Szenen</p>
          <p class="mt-1 text-xs">Klicke auf "Szene speichern"</p>
        {:else}
          <p class="text-sm">Keine Szenen gefunden</p>
        {/if}
      </div>
    {:else}
      <div class="space-y-2">
        {#each filteredScenes as scene (scene.id)}
          <div class="hover:bg-gray-650 rounded-lg bg-gray-700 p-3 transition-colors">
            {#if editingId === scene.id}
              <div class="space-y-2">
                <input
                  type="text"
                  bind:value={editTitle}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  class="w-full rounded border border-gray-500 bg-gray-600 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  autofocus
                />
                <div class="flex gap-2">
                  <button
                    onclick={saveEdit}
                    class="flex-1 rounded bg-green-600 px-2 py-1 text-xs transition-colors hover:bg-green-700"
                  >
                    Speichern
                  </button>
                  <button
                    onclick={cancelEdit}
                    class="flex-1 rounded bg-gray-600 px-2 py-1 text-xs transition-colors hover:bg-gray-500"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            {:else}
              <button onclick={() => onJumpToScene(scene.time)} class="group mb-2 w-full text-left">
                <div class="font-medium transition-colors group-hover:text-blue-400">
                  {scene.title}
                </div>
                <div class="mt-1 font-mono text-xs text-gray-400">
                  {formatTime(scene.time)}
                </div>
              </button>

              <div class="mt-2 flex gap-1">
                <button
                  onclick={() => startEdit(scene)}
                  class="flex flex-1 items-center justify-center gap-1 rounded bg-gray-600 px-2 py-1 text-xs transition-colors hover:bg-gray-500"
                  title="Titel bearbeiten"
                >
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Bearbeiten
                </button>

                <button
                  onclick={() => updateSceneTime(scene.id)}
                  class="flex flex-1 items-center justify-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs transition-colors hover:bg-blue-700"
                  title="Zeit aktualisieren"
                >
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Zeit
                </button>

                <button
                  onclick={() => onDeleteScene(scene.id)}
                  class="flex items-center justify-center rounded bg-red-600 px-2 py-1 text-xs transition-colors hover:bg-red-700"
                  title="Szene löschen"
                  aria-label="delete scene"
                >
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
