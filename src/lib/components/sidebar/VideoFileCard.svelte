<script lang="ts">
  import ColorPicker from '$components/sidebar/ColorPicker.svelte';
  import { Button } from '$components/ui/button';
  import * as Dialog from '$components/ui/dialog';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import { trackEvent } from '$lib/analytics';
  import { appState } from '$lib/state.svelte';
  import type { VideoSource } from '$lib/types';
  import { getDisplayPath, getFileName, stopPropagation } from '$utils';
  import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
  import PaintBucket from '@lucide/svelte/icons/paint-bucket';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash from '@lucide/svelte/icons/trash';
  import { tick } from 'svelte';

  interface Props {
    videoSource: VideoSource;
    editingId: string | null;
    onDeleteVideo: (deleteScenes: boolean) => void;
  }

  let { videoSource = $bindable(), editingId = $bindable(null), onDeleteVideo }: Props = $props();

  let editName = $state('');
  let dropdownOpen = $state(false);
  let deleteDialogOpen = $state(false);
  let deleteScenes = $state(false);
  let dropdownAnchor = $state<HTMLElement | null>(null);
  let dialogAnchor = $state<HTMLElement | null>(null);
  let inputRef = $state<HTMLInputElement | null>(null);
  let colorPickerOpen = $state(false || videoSource.new);

  const editing = $derived(editingId === videoSource.id);
  const isActive = $derived(appState.project.activeVideoId === videoSource.id);

  const associatedScenesCount = $derived(
    appState.project.sceneListItems.reduce((count, item) => {
      if (item.type === 'scene') {
        return count + (item.scene.videoSourceId === videoSource.id ? 1 : 0);
      }
      if (item.type === 'group') {
        return (
          count +
          item.items.filter((sceneItem) => sceneItem.scene.videoSourceId === videoSource.id).length
        );
      }
      return count;
    }, 0)
  );

  async function startEdit() {
    editingId = videoSource.id;
    editName = videoSource.name || getFileName(videoSource.path);
    await tick();
    inputRef?.select();
    inputRef?.scrollIntoView({ behavior: 'smooth' });
  }

  function saveEdit() {
    if (editing && editName.trim()) {
      videoSource = { ...videoSource, name: editName.trim() };
      trackEvent('video-file_renamed');
    }
    editingId = null;
  }

  function cancelEdit() {
    editingId = null;
    editName = '';
  }

  function openColorPicker() {
    colorPickerOpen = true;
  }

  function handleDelete() {
    deleteDialogOpen = true;
    deleteScenes = false;
  }

  function confirmDelete() {
    onDeleteVideo(deleteScenes);
    deleteDialogOpen = false;
    deleteScenes = false;
  }
</script>

<div
  bind:this={dialogAnchor}
  class={[
    'group/vf text-card-foreground w-full rounded-lg border px-3 py-2 text-left shadow-sm transition-colors',
    !editing && 'hover:bg-input',
    isActive && 'border-primary',
    appState.hasMultipleVideos && videoSource && 'border-l-4',
  ]}
  style={appState.hasMultipleVideos ? `border-left-color: ${videoSource?.color}` : ''}
  onclick={(e) => {
    e.stopPropagation();
    if (!editing) {
      appState.project.activeVideoId = videoSource.id;
    }
  }}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!editing) {
        appState.project.activeVideoId = videoSource.id;
      }
    }
  }}
  role="button"
  tabindex="0"
>
  {#if editing}
    <div class="space-y-2">
      <input
        type="text"
        bind:this={inputRef}
        bind:value={editName}
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
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0 flex-1">
        <h3
          class="truncate text-sm font-medium transition-colors"
          ondblclick={() => {
            startEdit();
            trackEvent('video-file_edit-start', { source: 'dblClick' });
          }}
        >
          {videoSource.name || getFileName(videoSource.path)}
        </h3>
        <p class="text-muted-foreground truncate text-xs" title={getDisplayPath(videoSource.path)}>
          {getDisplayPath(videoSource.path)}
        </p>
      </div>
      <div class="flex items-center gap-1">
        {#if isActive}
          <span
            class="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase"
          >
            Aktiv
          </span>
        {/if}
        <Button
          variant="ghost"
          size="sm"
          class="text-foreground px-0! opacity-0 group-focus-within/vf:opacity-100 group-hover/vf:opacity-100"
          aria-label="Open dropdown"
          onclick={stopPropagation(() => (dropdownOpen = true))}
          bind:ref={dropdownAnchor}
        >
          <EllipsisVertical />
        </Button>
      </div>
    </div>
  {/if}
</div>

<DropdownMenu.Root bind:open={dropdownOpen}>
  <DropdownMenu.Content customAnchor={dropdownAnchor} align="end">
    <DropdownMenu.Group>
      <DropdownMenu.Item
        onclick={() => {
          startEdit();
          trackEvent('video-file_edit-start', { source: 'menu' });
        }}
      >
        <Pencil class="mr-2 size-4" />
        Umbenennen
      </DropdownMenu.Item>
      <DropdownMenu.Item
        onclick={() => {
          openColorPicker();
          trackEvent('video-file_change-color', { source: 'menu' });
        }}
      >
        <PaintBucket class="mr-2 size-4" />
        Farbe ändern
      </DropdownMenu.Item>
      <DropdownMenu.Item class="text-destructive" onclick={handleDelete}>
        <Trash class="mr-2 size-4" />
        Löschen
      </DropdownMenu.Item>
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Videodatei löschen</Dialog.Title>
      <Dialog.Description>
        Möchtest du diese Videodatei wirklich löschen?
        {#if associatedScenesCount > 0}
          <br />
          <span class="text-destructive font-semibold">
            Diese Videodatei hat {associatedScenesCount} zugehörige Szene{associatedScenesCount !==
            1
              ? 'n'
              : ''}.
          </span>
        {/if}
      </Dialog.Description>
    </Dialog.Header>
    {#if associatedScenesCount > 0}
      <div class="flex items-center gap-2 py-2">
        <input
          type="checkbox"
          id="delete-scenes-{videoSource.id}"
          bind:checked={deleteScenes}
          class="border-border h-4 w-4 rounded"
        />
        <label
          for="delete-scenes-{videoSource.id}"
          class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Zugehörige Szenen ebenfalls löschen
        </label>
      </div>
    {/if}
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (deleteDialogOpen = false)}>Abbrechen</Button>
      <Button variant="destructive" onclick={confirmDelete}>Löschen</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<ColorPicker
  bind:open={colorPickerOpen}
  bind:value={
    () => videoSource.color, (v) => (videoSource = { ...videoSource, color: v, new: false })
  }
  filename={videoSource.name}
/>
