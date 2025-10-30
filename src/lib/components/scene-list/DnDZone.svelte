<script lang="ts">
  import SceneCard from '$components/scene-list/SceneCard.svelte';
  import SceneGroup from '$components/scene-list/SceneGroup.svelte';
  import { trackEvent } from '$lib/analytics';
  import type { SceneListItem } from '$lib/types';
  import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  interface Props {
    items: SceneListItem[];
    locked?: boolean;
    searchQuery: string;
    onJumpToScene: (time: number) => void;
  }

  let { items = $bindable(), locked = false, searchQuery, onJumpToScene }: Props = $props();

  let isDraggingGroup = $state(false);
  let editingId = $state<string | null>(null);

  const transformedQuery = $derived(searchQuery.trim().toLowerCase());

  const filteredItems = $derived.by(() => {
    if (!transformedQuery) return items;

    return items
      .map((item) => {
        if (item.type === 'scene') {
          return item.scene.title.toLowerCase().includes(transformedQuery) ? item : null;
        } else if (item.type === 'group') {
          const filteredScenes = item.items.filter((sceneItem) =>
            sceneItem.scene.title.toLowerCase().includes(transformedQuery)
          );
          return filteredScenes.length > 0
            ? { ...item, items: filteredScenes }
            : item.group.name.toLowerCase().includes(transformedQuery)
              ? item
              : null;
        }
        return null;
      })
      .filter((x): x is SceneListItem => x !== null);
  });

  function handleDndConsider(e: CustomEvent<DndEvent<SceneListItem>>) {
    const { info, items: dndItems } = e.detail;

    if (info.trigger == TRIGGERS.DRAG_STARTED) {
      if (items.find((item) => item.id === info.id)?.type === 'group') {
        isDraggingGroup = true;
      }
    }

    items = dndItems;
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<SceneListItem>>) {
    isDraggingGroup = false;
    items = e.detail.items;
  }

  function deleteItem(id: string) {
    items = items.filter((item) => item.id !== id);
  }
</script>

<div
  use:dndzone={{
    items: items,
    type: 'SceneList',
    flipDurationMs: 300,
    dropTargetStyle: { outline: 'unset' },
    dragDisabled: locked || searchQuery.trim() !== '',
  }}
  onconsider={handleDndConsider}
  onfinalize={handleDndFinalize}
  class="flex min-h-full flex-col gap-2"
>
  {#each filteredItems as item (item.id)}
    <div id={item.id} animate:flip={{ duration: 300 }}>
      {#if item.type === 'group'}
        <SceneGroup
          bind:group={item.group}
          bind:items={item.items}
          bind:newCreated={item.new}
          dragDisabled={locked || searchQuery.trim() !== ''}
          dropFromOthersDisabled={isDraggingGroup}
          bind:editingId
          onDeleteScene={(id) => {
            item.items = item.items.filter((sceneItem) => sceneItem.id !== id);
            trackEvent('scene-card_deleted');
          }}
          {onJumpToScene}
          onDeleteGroup={() => {
            deleteItem(item.id);
            trackEvent('scene-group_deleted');
          }}
        />
      {:else}
        <SceneCard
          bind:scene={item.scene}
          bind:editingId
          bind:newCreated={item.new}
          {locked}
          {onJumpToScene}
          onDeleteScene={() => {
            deleteItem(item.id);
            trackEvent('scene-card_deleted');
          }}
        />
      {/if}
    </div>
  {/each}
</div>
