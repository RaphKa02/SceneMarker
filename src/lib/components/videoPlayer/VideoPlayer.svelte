<script lang="ts">
  import { Button } from '$components/ui/button';
  import SkipLeftIcon from '$components/videoPlayer/SkipLeftIcon.svelte';
  import SkipRightIcon from '$components/videoPlayer/SkipRightIcon.svelte';
  import VideoControlls from '$components/videoPlayer/VideoControlls.svelte';
  import { projectManager } from '$lib/projectManager.svelte';
  import { appState } from '$lib/state.svelte';
  import { videoPlayerState } from '$lib/videoPlayerState.svelte';
  import { getFileName } from '$utils';

  interface Props {
    videoPath?: string;
    currentTime: number;
    onTogglePresenationMode: () => void;
  }

  let { videoPath, currentTime = $bindable(0), onTogglePresenationMode }: Props = $props();

  let hasVideoError = $state(false);

  let controllInterval = $state<number>();

  let skipRightActive = $state(false);
  let skipLeftActive = $state(false);
  let skipAmount = $state(0);

  $effect(() => {
    if (videoPath) hasVideoError = false;
    videoPlayerState.videoPath = videoPath;
  });

  function handleVideoClick() {
    if (!videoPlayerState.isFullscreen) videoPlayerState.togglePlay();
    restartControllsInterval();
  }

  function handleMouseEnter() {
    restartControllsInterval();
  }

  function restartControllsInterval() {
    videoPlayerState.showControlls = true;
    clearTimeout(controllInterval);
    controllInterval = setTimeout(() => (videoPlayerState.showControlls = false), 3000);
  }
</script>

<div
  class="bg-background relative max-h-full w-full items-center overflow-hidden rounded-lg shadow-2xl"
>
  {#if videoPlayerState.videoPath && !hasVideoError}
    <video
      bind:this={videoPlayerState.videoElement}
      bind:currentTime
      bind:playbackRate={videoPlayerState.videoSpeed}
      bind:volume={videoPlayerState.volume}
      class="max-h-full w-full bg-black object-contain outline-none"
      onloadedmetadata={videoPlayerState.handleLoadedMetadata}
      onplay={videoPlayerState.handlePlay}
      onpause={videoPlayerState.handlePause}
      onerror={() => (hasVideoError = true)}
      src={videoPlayerState.videoPath}
      onclick={handleVideoClick}
      onmouseenter={handleMouseEnter}
      tabindex="0"
    >
      <track kind="captions" />
    </video>
    {#if skipRightActive}
      <div class="absolute top-1/2 right-4 -translate-x-1/2">
        <SkipRightIcon active={skipRightActive} seconds={skipAmount} />
      </div>
    {/if}
    {#if skipLeftActive}
      <div class="absolute top-1/2 left-4 -translate-x-1/2">
        <SkipLeftIcon active={skipLeftActive} seconds={skipAmount} />
      </div>
    {/if}
    <VideoControlls
      {restartControllsInterval}
      {onTogglePresenationMode}
      bind:skipLeftActive
      bind:skipRightActive
      bind:skipAmount
    />
  {:else if hasVideoError}
    <div class="bg-background flex aspect-video max-h-full items-center justify-center">
      <div class="text-muted-foreground flex flex-col items-center gap-6 px-8">
        <svg
          class="text-destructive mx-auto h-20 w-20"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div class="space-y-2 text-center">
          <p class="text-lg font-semibold">Video konnte nicht geladen werden</p>
          <p class="text-sm">Die Datei wurde möglicherweise verschoben oder gelöscht</p>
        </div>
        <p class="text-sm">{getFileName(videoPath ?? '')}</p>
        <Button
          onclick={() => projectManager.relocateVideo(appState.project.activeVideoId)}
          class="bg-primary text-primary-foreground hover:bg-primary flex cursor-pointer items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors"
        >
          <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Video neu verknüpfen
        </Button>
      </div>
    </div>
  {:else}
    <div class="bg-background flex aspect-video max-h-full items-center justify-center">
      <div class="text-muted-foreground text-center">
        <svg
          class="mx-auto mb-4 h-24 w-24 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p class="text-lg">Kein Video geladen</p>
        <p class="mt-2 text-sm">Öffne ein Video oder lade ein Projekt</p>
      </div>
    </div>
  {/if}
</div>
