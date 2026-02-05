<script lang="ts">
  import SceneCard from '$components/sidebar/SceneCard.svelte';
  import SceneGroup from '$components/sidebar/SceneGroup.svelte';
  import { trackEvent } from '$lib/analytics';
  import type { SceneListItem, SceneListItemScene } from '$lib/types';
  import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  interface Props {
    items: SceneListItem[];
    locked?: boolean;
    searchQuery: string;
    videoFilter: string[];
    editingId: string | null;
  }

  let {
    items = $bindable(),
    locked = false,
    searchQuery,
    videoFilter,
    editingId = $bindable(null),
  }: Props = $props();

  let isDraggingGroup = $state(false);

  const transformedQuery = $derived(searchQuery.trim().toLowerCase());

  const filteredItems = $derived.by(() => {
    if (!transformedQuery && videoFilter.length === 0) return items;

    return items
      .map((item) => {
        const matchesFilter = (sceneItem: SceneListItemScene): boolean => {
          return (
            sceneItem.scene.id === editingId ||
            ((videoFilter.length === 0 || videoFilter.includes(sceneItem.scene.videoSourceId)) &&
              sceneItem.scene.title.toLowerCase().includes(transformedQuery))
          );
        };

        if (item.type === 'scene') {
          return matchesFilter(item) ? item : null;
        } else if (item.type === 'group') {
          const filteredScenes = item.items.filter(matchesFilter);

          // Priority 1: Group Name Match
          // If the group name matches the query, show the group and ALL items that belong to the current video filter.
          // We relax the text search for children here to show the group's "context".
          if (transformedQuery && item.group.name.toLowerCase().includes(transformedQuery)) {
            const scenesMatchingVideo = item.items.filter(
              (sceneItem) =>
                sceneItem.scene.id === editingId ||
                videoFilter.length === 0 ||
                videoFilter.includes(sceneItem.scene.videoSourceId)
            );
            return { ...item, items: scenesMatchingVideo };
          }

          // Priority 2: Editing Group or Has Matching Children
          // If we are editing the group OR it has children that match the strict filter, show it.
          // IMPORTANT: We use 'filteredScenes' here. If we are editing, we don't want to suddenly show
          // items from other videos (pop-in effect). We preserve the current view context.
          if (item.group.id === editingId || filteredScenes.length > 0) {
            return { ...item, items: filteredScenes };
          }

          return null;
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
