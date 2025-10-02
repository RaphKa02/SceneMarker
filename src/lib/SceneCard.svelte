<script lang="ts">
  import { Button } from '$components/ui/button';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import * as Popover from '$components/ui/popover';
  import { formatTime, stopPropagation } from '$utils';
  import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash from '@lucide/svelte/icons/trash';
  import { tick } from 'svelte';
  import type { Scene } from '../types';

  interface Props {
    scene: Scene;
    editing: boolean;
    locked: boolean;
    onJumpToScene: (time: number) => void;
    onUpdateScene: (id: string, updates: Partial<Scene>) => void;
    onDeleteScene: (id: string) => void;
  }

  let {
    scene,
    editing = $bindable(false),
    locked,
    onJumpToScene,
    onUpdateScene,
    onDeleteScene,
  }: Props = $props();

  let editTitle = $state('');
  let dropdownOpen = $state(false);
  let deleteDialogOpen = $state(false);
  let dropdownAnchor = $state<HTMLElement | null>(null);
  let dialogAnchor = $state<HTMLElement | null>(null);
  let inputRef = $state<HTMLElement | null>(null);

  async function startEdit() {
    editing = true;
    editTitle = scene.title;
    await new Promise((res) => setTimeout(res, 50));
    await tick();
    inputRef?.focus();
  }

  function saveEdit() {
    if (editing && editTitle.trim()) {
      onUpdateScene(scene.id, { title: editTitle.trim() });
      editing = false;
    }
  }

  function cancelEdit() {
    editing = false;
    editTitle = '';
  }

  function updateSceneTime() {
    onUpdateScene(scene.id, { time: -1 });
  }
</script>

<button
  bind:this={dialogAnchor}
  class={[
    'bg-card text-card-foreground w-full rounded-lg border px-3 py-2 text-left shadow-sm transition-colors',
    !editing && 'hover:bg-input',
  ]}
  onclick={() => !editing && onJumpToScene(scene.time)}
>
  {#if editing}
    <div class="space-y-2">
      <input
        type="text"
        bind:this={inputRef}
        bind:value={editTitle}
        onkeydown={(e) => {
          if (e.key === 'Enter') saveEdit();
          if (e.key === 'Escape') cancelEdit();
        }}
        class="border-border bg-input focus:border-primary w-full rounded border px-2 py-1 text-sm focus:outline-none"
      />
      <div class="flex gap-2">
        <Button onclick={stopPropagation(saveEdit)} class="flex-1">Speichern</Button>
        <Button variant="outline" onclick={stopPropagation(cancelEdit)} class="flex-1">
          Abbrechen
        </Button>
      </div>
    </div>
  {:else}
    <div class="">
      <h1
        class="text-start font-medium text-wrap transition-colors"
        ondblclick={() => !locked && startEdit()}
      >
        <div class="float-right pl-2 text-sm font-normal">
          <Button
            variant="ghost"
            size="sm"
            class="text-primary-foreground px-0!"
            aria-label="Open dropdown"
            onclick={stopPropagation(() => (dropdownOpen = true))}
            bind:ref={dropdownAnchor}
          >
            <EllipsisVertical />
          </Button>
        </div>
        {scene.title}
      </h1>
      <div class="mt-1 font-mono text-xs text-gray-400">
        {formatTime(scene.time)}
      </div>
    </div>
  {/if}
</button>

<DropdownMenu.Root bind:open={dropdownOpen}>
  <DropdownMenu.Content customAnchor={dropdownAnchor} align="end">
    <DropdownMenu.Group>
      <DropdownMenu.Item onclick={startEdit}>
        <Pencil class="mr-2 size-4" />
        Titel Bearbeiten
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={updateSceneTime}>
        <svg class="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Auf aktuelle Videozeit sezten
      </DropdownMenu.Item>
      <DropdownMenu.Item class="text-destructive" onclick={() => (deleteDialogOpen = true)}>
        <Trash class="mr-2 size-4" />
        Löschen
      </DropdownMenu.Item>
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<Popover.Root bind:open={deleteDialogOpen}>
  <Popover.Content customAnchor={dialogAnchor} class="space-y-4">
    <div class="space-y-2">
      <h4 class="text-xl">Löschen</h4>
      <p class="text-muted-foreground text-sm">Möchtest du diese Scene wirklich löschen?</p>
    </div>
    <div class="flex gap-4">
      <Button class="flex-1" variant="destructive" onclick={() => onDeleteScene(scene.id)}>
        Ja
      </Button>
      <Button class="flex-1" variant="outline" onclick={() => (deleteDialogOpen = false)}>
        Nein
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
