<script lang="ts">
  import { Button } from '$components/ui/button';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import logger from '$lib/logger';
  import { formatTime } from '$utils';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  interface Props {
    videoPath?: string;
    currentTime: number;
    onRelocateVideo?: () => void;
  }

  let { videoPath, currentTime = $bindable(0), onRelocateVideo }: Props = $props();

  let videoElement = $state<HTMLVideoElement | null>(null);
  let hasVideoError = $state(false);

  let isPlaying = $state(false);
  let duration = $state(0);
  let volume = $state(1);
  let isMuted = $state(false);
  let isFullscreen = $state(false);

  let controllInterval = $state<number>();
  let showControlls = $state(false);

  const skipIntervals = [0.03, 1, 3, 5, 10, 60];

  onMount(() => {
    addActions();
    return () => removeActions();
  });

  $effect(() => {
    if (videoElement && videoPath) {
      const convertedPath = convertFile(videoPath);
      if (convertedPath) {
        videoElement.src = convertedPath;
      }
    }
  });

  $effect(() => {
    if (videoPath) {
      hasVideoError = false;
    }
  });

  function togglePlay() {
    if (isPlaying) {
      videoElement?.pause();
    } else {
      videoElement?.play();
    }
  }

  function handleLoadedMetadata() {
    duration = videoElement?.duration ?? 0;
  }

  function handlePlay() {
    isPlaying = true;
  }

  function handlePause() {
    isPlaying = false;
  }

  function seekTo(time: number) {
    if (videoElement) {
      videoElement.currentTime = time;
    }
  }

  function skip(seconds: number) {
    if (videoElement) {
      videoElement.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  }

  function handleVolumeChange() {
    if (videoElement) {
      videoElement.volume = volume;
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (videoElement) {
      videoElement.muted = isMuted;
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      videoElement?.requestFullscreen();
      isFullscreen = true;
    } else {
      document.exitFullscreen();
      isFullscreen = false;
    }
  }

  function handleVideoClick() {
    isPlaying ? videoElement?.pause() : videoElement?.play();
    restartControllsInterval();
  }

  function handleMouseEnter() {
    restartControllsInterval();
  }

  function restartControllsInterval() {
    showControlls = true;
    clearInterval(controllInterval);
    controllInterval = setInterval(() => (showControlls = false), 3000);
  }

  function convertFile(filePath: string) {
    try {
      return convertFileSrc(filePath);
    } catch (e) {
      logger.error(`Fehler bei convertFileSrc: ${e}`);
      toast.error('Fehler beim Laden des Videos');
    }
  }

  function addActions() {
    keyHandler.registerAction('play-pause', () => {
      if (videoElement) isPlaying ? videoElement.pause() : videoElement.play();
    });
    keyHandler.registerAction('skip-back-5', () => skip(-5));
    keyHandler.registerAction('skip-forward-5', () => skip(5));
  }

  function removeActions() {
    keyHandler.removeAction('play-pause');
    keyHandler.removeAction('skip-back-5');
    keyHandler.removeAction('skip-forward-5');
  }
</script>

<div class="relative flex flex-col overflow-hidden rounded-lg bg-black shadow-2xl">
  {#if videoPath && !hasVideoError}
    <video
      bind:this={videoElement}
      bind:currentTime
      class="h-full w-full bg-black object-contain"
      onloadedmetadata={handleLoadedMetadata}
      onplay={handlePlay}
      onpause={handlePause}
      onerror={(e) => {
        hasVideoError = true;
        toast.error('Fehler', {
          description: JSON.stringify(e),
          dismiss: false,
          dismissable: true,
        });
      }}
      onclick={handleVideoClick}
      onmouseenter={handleMouseEnter}
    >
      <track kind="captions" />
    </video>

    <div
      class={[
        'bg-background absolute bottom-0 w-full space-y-3 p-4 opacity-0 transition-opacity hover:opacity-100',
        showControlls && 'opacity-100',
      ]}
    >
      <!-- Zeitachse -->
      <div class="flex items-center gap-3">
        <span class="text-muted-foreground w-16 text-right text-sm">{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          oninput={(e) => seekTo(parseFloat((e.target as HTMLInputElement).value))}
          class="bg-input [&::-webkit-slider-thumb]:bg-primary h-2 flex-1 cursor-pointer appearance-none rounded-lg [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
        />
        <span class="text-muted-foreground w-16 text-sm">{formatTime(duration)}</span>
      </div>

      <!-- Kontrollleiste -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <!-- Play/Pause -->
          <button
            onclick={togglePlay}
            class="hover:bg-input text-primary rounded p-2 transition-colors"
          >
            {#if isPlaying}
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            {:else}
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            {/if}
          </button>

          <!-- Sprung-Buttons -->
          <div class="flex gap-1">
            {#each skipIntervals.toReversed() as interval (interval)}
              <button
                onclick={() => skip(-interval)}
                class="hover:bg-input rounded px-2 py-1 text-xs transition-colors"
              >
                -{interval < 1 ? '1FR' : interval + 's'}
              </button>
            {/each}

            <div class="bg-border mx-1 w-px"></div>

            {#each skipIntervals as interval (interval)}
              <button
                onclick={() => skip(interval)}
                class="hover:bg-input rounded px-2 py-1 text-xs transition-colors"
              >
                {interval < 1 ? '1FR' : interval + 's'}
              </button>
            {/each}
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Lautstärke -->
          <div class="flex items-center gap-2">
            <button onclick={toggleMute} class="hover:bg-input rounded p-2 transition-colors">
              {#if isMuted || volume === 0}
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
                  />
                </svg>
              {:else if volume < 0.5}
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                </svg>
              {:else}
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
                  />
                </svg>
              {/if}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              bind:value={volume}
              oninput={handleVolumeChange}
              class="bg-input [&::-webkit-slider-thumb]:bg-primary h-2 w-20 cursor-pointer appearance-none rounded-lg [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>

          <button
            onclick={toggleFullscreen}
            class="hover:bg-input rounded p-2 transition-colors"
            aria-label="fullscreen"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  {:else if hasVideoError}
    <div class="bg-background flex aspect-video items-center justify-center">
      <div class="text-muted-foreground px-8 text-center">
        <svg
          class="text-destructive mx-auto mb-4 h-20 w-20"
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
        <p class="mb-2 text-lg font-semibold">Video konnte nicht geladen werden</p>
        <p class="mb-6 text-sm">Die Datei wurde möglicherweise verschoben oder gelöscht</p>
        <Button
          onclick={() => {
            onRelocateVideo?.();
          }}
          class="bg-primary text-primary-foreground hover:bg-primary mx-auto flex cursor-pointer items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div class="bg-background flex aspect-video items-center justify-center">
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
