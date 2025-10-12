<script lang="ts">
  import SceneCard from '$components/scene-list/SceneCard.svelte';
  import { Button } from '$components/ui/button';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import * as Popover from '$components/ui/popover';
  import type { Group, SceneListItemScene } from '$lib/types';
  import { stopPropagation } from '$utils';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash from '@lucide/svelte/icons/trash';
  import { tick } from 'svelte';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  interface Props {
    group: Group;
    items: SceneListItemScene[];
    dragDisabled: boolean;
    onJumpToScene: (time: number) => void;
    onDeleteScene: (id: string) => void;
    onDeleteGroup: () => void;
    editingId: string | null;
    dropFromOthersDisabled: boolean;
  }

  let {
    group = $bindable(),
    items = $bindable(),
    dragDisabled,
    editingId = $bindable(null),
    dropFromOthersDisabled,
    onDeleteScene,
    onJumpToScene,
    onDeleteGroup,
  }: Props = $props();

  let extended = $state(true);
  let editGroupName = $state('');
  let dropdownOpen = $state(false);
  let deleteDialogOpen = $state(false);
  let dropdownAnchor = $state<HTMLElement | null>(null);
  let dialogAnchor = $state<HTMLElement | null>(null);
  let inputRef = $state<HTMLElement | null>(null);

  const isEditGroup = $derived(editingId === group.id);

  async function startEdit() {
    editingId = group.id;
    editGroupName = group.name ?? '';
    await new Promise((res) => setTimeout(res, 50));
    await tick();
    inputRef?.focus();
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
  class="group/sg border-border hover:shadow-primary/10 rounded-xl border p-2 shadow-lg shadow-black/20 transition-all"
>
  {#if isEditGroup}
    <div class="space-y-2 p-2">
      <input
        type="text"
        bind:this={inputRef}
        bind:value={editGroupName}
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
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      ondblclick={startEdit}
      class="flex w-full items-center justify-between pb-2 pl-2 text-left"
    >
      <h3 class="text-foreground font-semibold">{group.name}</h3>
      <div class="flex items-center">
        <Button variant="ghost" size="icon" onclick={() => (extended = !extended)}>
          <ChevronDown
            class={[
              'text-muted-foreground h-5 w-5 transform opacity-0 transition-transform group-hover/sg:opacity-100',
              extended && 'rotate-180',
            ]}
          />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="text-primary-foreground opacity-0 transition-transform group-hover/sg:opacity-100"
          aria-label="Open dropdown"
          onclick={stopPropagation(() => (dropdownOpen = true))}
          bind:ref={dropdownAnchor}
        >
          <EllipsisVertical class="size-4 text-sm" />
        </Button>
      </div>
    </div>
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
        <div animate:flip={{ duration: 300 }}>
          <SceneCard
            bind:editingId
            locked={dragDisabled}
            bind:scene={item.scene}
            {onJumpToScene}
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
      <DropdownMenu.Item onclick={startEdit}>
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
