<script lang="ts">
  import { Button } from '$components/ui/button';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import * as Popover from '$components/ui/popover';
  import { trackEvent } from '$lib/analytics';
  import { projectManager } from '$lib/projectManager.svelte';
  import { appState } from '$lib/state.svelte';
  import type { Scene } from '$lib/types';
  import { videoPlayerState } from '$lib/videoPlayerState.svelte';
  import { formatTime, getFileName, stopPropagation } from '$utils';
  import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash from '@lucide/svelte/icons/trash';
  import { onMount, tick } from 'svelte';
  import EditModeInput from './EditModeInput.svelte';

  interface Props {
    scene: Scene;
    editingId: string | null;
    locked: boolean;
    onDeleteScene: () => void;
  }

  let { scene = $bindable(), editingId = $bindable(null), locked, onDeleteScene }: Props = $props();

  let editTitle = $state('');
  let dropdownOpen = $state(false);
  let deleteDialogOpen = $state(false);
  let dropdownAnchor = $state<HTMLElement | null>(null);
  let dialogAnchor = $state<HTMLElement | null>(null);

  const editing = $derived(editingId === scene.id);

  const videoSource = $derived(
    scene.videoSourceId ? appState.project.videoLibrary.get(scene.videoSourceId) : undefined
  );

  $effect(() => {
    if (editing) {
      editTitle = scene.title;
    }
  });

  function startEdit() {
    editingId = scene.id;
  }

  function saveEdit() {
    if (editing && editTitle.trim()) {
      scene.title = editTitle.trim();
    }
    editingId = null;
  }

  function cancelEdit() {
    editingId = null;
    editTitle = '';
  }

  function updateSceneTime() {
    scene.time = videoPlayerState.currentTime;
  }
</script>

<div
  bind:this={dialogAnchor}
  class={[
    'group/sc bg-card text-card-foreground w-full rounded-xl border px-3 py-2 text-left shadow-sm transition-colors',
    !editing && 'hover:bg-input',
    appState.hasMultipleVideos && videoSource && 'border-l-4',
  ]}
  style={appState.hasMultipleVideos ? `border-left-color: ${videoSource?.color}` : ''}
  onclick={(e) => {
    e.stopPropagation();
    if (!editing) {
      projectManager.jumpToScene(scene.time, scene.videoSourceId);
    }
  }}
  onkeypress={(e) => {
    if (e.key === 'ENTER' && !editing) {
      projectManager.jumpToScene(scene.time, scene.videoSourceId);
    }
  }}
  role="button"
  tabindex="0"
>
  {#if editing}
    <EditModeInput bind:value={editTitle} onSave={saveEdit} onCancel={cancelEdit} />
  {:else}
    <h1
      class="text-start font-medium text-wrap transition-colors"
      ondblclick={() => {
        if (locked) return;
        startEdit();
        trackEvent('scene-card_edit-start', { source: 'dblClick' });
      }}
    >
      <div class="float-right pl-2 text-sm font-normal">
        <Button
          variant="ghost"
          size="sm"
          class="text-foreground px-0! opacity-0 group-focus-within/sc:opacity-100 group-hover/sc:opacity-100"
          aria-label="Open dropdown"
          onclick={stopPropagation(() => (dropdownOpen = true))}
          bind:ref={dropdownAnchor}
        >
          <EllipsisVertical />
        </Button>
      </div>
      {scene.title}
    </h1>
    <div class="text-muted-foreground mt-1 flex items-center gap-1.5">
      <span class="font-mono text-xs">{formatTime(scene.time)}</span>
    </div>
  {/if}
</div>

<DropdownMenu.Root bind:open={dropdownOpen}>
  <DropdownMenu.Content customAnchor={dropdownAnchor} align="end">
    <DropdownMenu.Group>
      <DropdownMenu.Item
        onclick={() => {
          startEdit();
          trackEvent('scene-card_edit-start', { source: 'menu' });
        }}
      >
        <Pencil class="mr-2 size-4" />
        Titel Bearbeiten
      </DropdownMenu.Item>
      <DropdownMenu.Item
        onclick={() => {
          updateSceneTime();
          trackEvent('scene-card_update-time');
        }}
      >
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
      <Button class="flex-1" variant="destructive" onclick={onDeleteScene}>Ja</Button>
      <Button class="flex-1" variant="outline" onclick={() => (deleteDialogOpen = false)}>
        Nein
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
