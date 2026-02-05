<script lang="ts">
  import SceneCard from '$components/sidebar/SceneCard.svelte';
  import { Button } from '$components/ui/button';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import * as Popover from '$components/ui/popover';
  import { trackEvent } from '$lib/analytics';
  import type { Group, SceneListItemScene } from '$lib/types';
  import { stopPropagation } from '$utils';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash from '@lucide/svelte/icons/trash';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import EditModeInput from './EditModeInput.svelte';

  interface Props {
    group: Group;
    items: SceneListItemScene[];
    dragDisabled: boolean;
    editingId: string | null;
    dropFromOthersDisabled: boolean;
    onDeleteScene: (id: string) => void;
    onDeleteGroup: () => void;
  }

  let {
    group = $bindable(),
    items = $bindable(),
    dragDisabled,
    editingId = $bindable(null),
    dropFromOthersDisabled,
    onDeleteScene,
    onDeleteGroup,
  }: Props = $props();

  let extended = $state(true);
  let editGroupName = $state('');
  let dropdownOpen = $state(false);
  let deleteDialogOpen = $state(false);
  let dropdownAnchor = $state<HTMLElement | null>(null);
  let dialogAnchor = $state<HTMLElement | null>(null);

  const isEditGroup = $derived(editingId === group.id);

  $effect(() => {
    if (isEditGroup) {
      editGroupName = group.name;
    }
  });

  function startEdit() {
    editingId = group.id;
  }

  function saveEdit() {
    if (isEditGroup && editGroupName.trim()) {
      group.name = editGroupName.trim();
    }
    editingId = null;
  }

  function cancelEdit() {
    editingId = null;
    editGroupName = '';
  }

  function handleDnDConsider(e: CustomEvent<DndEvent<SceneListItemScene>>) {
    items = e.detail.items;
  }

  function handleDnDFinalize(e: CustomEvent<DndEvent<SceneListItemScene>>) {
    items = e.detail.items;
  }
</script>

<div
  bind:this={dialogAnchor}
  class="group/sg border-border hover:shadow-primary/10 space-y-3 rounded-xl border px-3 py-2 shadow-lg shadow-black/20 transition-all"
>
  {#if isEditGroup}
    <EditModeInput bind:value={editGroupName} onSave={saveEdit} onCancel={cancelEdit} />
  {:else}
    <h1
      class="font-medium text-wrap transition-colors"
      ondblclick={() => {
        if (dragDisabled) return;
        startEdit();
        trackEvent('group-card_edit-start', { source: 'dblClick' });
      }}
    >
      <div class="float-right pl-2 text-sm font-normal">
        <div class="-mt-1 flex">
          <Button
            variant="ghost"
            size="sm"
            class="text-foreground opacity-0 transition-transform group-hover/sg:opacity-100"
            aria-label="Open dropdown"
            onclick={stopPropagation(() => (dropdownOpen = true))}
            bind:ref={dropdownAnchor}
          >
            <EllipsisVertical class="size-4 text-sm" />
          </Button>
          <Button variant="ghost" size="sm" onclick={() => (extended = !extended)} class="ring-0">
            <ChevronDown
              class={[
                'text-muted-foreground h-5 w-5 transform transition-transform',
                extended && 'rotate-180',
              ]}
            />
          </Button>
        </div>
      </div>
      {group.name}
    </h1>
  {/if}
  {#if extended}
    <div
      use:dndzone={{
        items: items,
        flipDurationMs: 300,
        dragDisabled,
        type: dropFromOthersDisabled ? 'noop' : 'SceneList',
        dropTargetStyle: { outline: 'unset' },
        dropFromOthersDisabled: false,
      }}
      onfinalize={handleDnDFinalize}
      onconsider={handleDnDConsider}
      class="h-full min-h-10 space-y-2 outline-none"
    >
      {#each items as item (item.id)}
        <div id={item.id} animate:flip={{ duration: 300 }}>
          <SceneCard
            bind:editingId
            locked={dragDisabled}
            bind:scene={item.scene}
            onDeleteScene={() => onDeleteScene(item.id)}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

<DropdownMenu.Root bind:open={dropdownOpen}>
  <DropdownMenu.Content customAnchor={dropdownAnchor} align="end">
    <DropdownMenu.Group>
      <DropdownMenu.Item
        onclick={() => {
          startEdit();
          trackEvent('group-card_edit-start', { source: 'menu' });
        }}
      >
        <Pencil class="mr-2 size-4" />
        Name Bearbeiten
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
      <p class="text-muted-foreground text-sm">
        Möchtest du diese Gruppe wirklich löschen? Alle Szenen in dieser Gruppe gehen verloren!
      </p>
    </div>
    <div class="flex gap-4">
      <Button class="flex-1" variant="destructive" onclick={onDeleteGroup}>Ja</Button>
      <Button class="flex-1" variant="outline" onclick={() => (deleteDialogOpen = false)}>
        Nein
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
