<script lang="ts">
  import SceneCard from '$components/sidebar/SceneCard.svelte';
  import SceneGroup from '$components/sidebar/SceneGroup.svelte';
  import { trackEvent } from '$lib/analytics';
  import type { SceneListItem } from '$lib/types';
  import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  interface Props {
    items: SceneListItem[];
    locked?: boolean;
    searchQuery: string;
    videoFilter: string[];
  }

  let { items = $bindable(), locked = false, searchQuery, videoFilter }: Props = $props();

  let isDraggingGroup = $state(false);
  let editingId = $state<string | null>(null);

  const transformedQuery = $derived(searchQuery.trim().toLowerCase());

  const filteredItems = $derived.by(() => {
    if (!transformedQuery && videoFilter.length === 0) return items;

    return items
      .map((item) => {
        if (item.type === 'scene') {
          return videoFilter.includes(item.scene.videoSourceId) &&
            item.scene.title.toLowerCase().includes(transformedQuery)
            ? item
            : null;
        } else if (item.type === 'group') {
          const filteredScenes = item.items.filter(
            (sceneItem) =>
              videoFilter.includes(sceneItem.scene.videoSourceId) &&
              sceneItem.scene.title.toLowerCase().includes(transformedQuery)
          );
          return filteredScenes.length > 0
            ? { ...item, items: filteredScenes }
            : transformedQuery && item.group.name.toLowerCase().includes(transformedQuery)
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
          onDeleteScene={() => {
            deleteItem(item.id);
            trackEvent('scene-card_deleted');
          }}
        />
      {/if}
    </div>
  {/each}
</div>
