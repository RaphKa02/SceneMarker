<script lang="ts">
  import TimelineMarker from '$components/videoPlayer/TimelineMarker.svelte';
  import { trackEvent } from '$lib/analytics';
  import { appState } from '$lib/state.svelte';
  import type { SceneListItemScene } from '$lib/types';
  import { videoPlayerState } from '$lib/videoPlayerState.svelte';
  import { formatTime } from '$utils';

  let lastSeekTime = $state(0);

  const sliderProgress = $derived((videoPlayerState.currentTime / videoPlayerState.duration) * 100);
  const sliderBackground = $derived(
    `linear-gradient(to right, var(--color-primary) ${sliderProgress}%, var(--color-input) ${sliderProgress}%)`
  );

  const filteredScenes = $derived.by(() => {
    const scenes = appState.project.sceneListItems
      .flatMap((item) => (item.type === 'scene' ? [item] : item.items))
      .filter((scene) => scene.scene.videoSourceId === appState.project.activeVideoId);

    scenes.sort((a, b) => a.scene.time - b.scene.time);

    const groups: Record<number, SceneListItemScene[]> = {};
    for (const s of scenes) {
      const time = s.scene.time;
      if (!groups[time]) groups[time] = [];
      groups[time].push(s);
    }

    return Object.values(groups);
  });

  function throttledSeekTo(value: number) {
    const now = Date.now();
    if (now - lastSeekTime >= 400) {
      videoPlayerState.seekTo(value);
      lastSeekTime = now;
    }
  }
</script>

<div class="flex items-center gap-3">
  <span class="text-muted-foreground w-16 text-right text-sm">
    {formatTime(videoPlayerState.currentTime)}
  </span>
  <div class="relative flex-1">
    {#if appState.uiState.showTimelineMarkers}
      <div class="pointer-events-none absolute -top-8 right-0 left-0 mx-2 h-8">
        <div class="relative h-full">
          {#each filteredScenes as sceneItems (sceneItems[0].scene.time)}
            <TimelineMarker
              scenes={sceneItems}
              duration={videoPlayerState.duration}
              hidden={false}
              onclick={() => {
                videoPlayerState.seekTo(sceneItems[0].scene.time);
                trackEvent('scene_navigated_to', { type: 'marker' });
              }}
            />
          {/each}
        </div>
      </div>
    {/if}

    <div class="flex h-2 w-full justify-center">
      <input
        type="range"
        step="0.01"
        min="0"
        max={videoPlayerState.duration}
        bind:value={videoPlayerState.currentTime}
        oninput={(e) => throttledSeekTo(parseFloat((e.target as HTMLInputElement).value))}
        class="[&::-webkit-slider-thumb]:bg-primary h-full w-full cursor-pointer appearance-none rounded-lg [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
        style={`background: ${sliderBackground}`}
      />
    </div>
  </div>
  <span class="text-muted-foreground w-16 text-sm">{formatTime(videoPlayerState.duration)}</span>
</div>
