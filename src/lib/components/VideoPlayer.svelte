<script lang="ts">
  import { Button } from '$components/ui/button';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { appState } from '$lib/state.svelte';
  import type { VideoState } from '$lib/types';
  import { formatTime } from '$utils';
  import Expand from '@lucide/svelte/icons/expand';
  import Monitor from '@lucide/svelte/icons/monitor';
  import MonitorOff from '@lucide/svelte/icons/monitor-off';
  import Pause from '@lucide/svelte/icons/pause';
  import Play from '@lucide/svelte/icons/play';
  import Volume from '@lucide/svelte/icons/volume';
  import Volume1 from '@lucide/svelte/icons/volume-1';
  import Volume2 from '@lucide/svelte/icons/volume-2';
  import VolumeOff from '@lucide/svelte/icons/volume-off';
  import VolumeX from '@lucide/svelte/icons/volume-x';
  import { emitTo } from '@tauri-apps/api/event';
  import { onMount, untrack } from 'svelte';

  interface Props {
    videoPath?: string;
    currentTime: number;
    onRelocateVideo?: () => void;
    onTogglePresenationMode?: () => void;
  }

  let {
    videoPath,
    currentTime = $bindable(0),
    onRelocateVideo,
    onTogglePresenationMode,
  }: Props = $props();

  let videoElement = $state<HTMLVideoElement | null>(null);
  let hasVideoError = $state(false);

  let duration = $state(0);
  let volume = $state(1);
  let isMuted = $state(false);
  let isFullscreen = $state(false);
  let videoState = $state<VideoState>({ videoPath: undefined, playing: false, currentTime: 0 });

  let controllInterval = $state<number>();
  let showControlls = $state(false);

  const skipIntervals = [0.03, 1, 3, 5, 10, 60];

  onMount(() => {
    addActions();
    return () => removeActions();
  });

  $effect(() => {
    console.log('emit');
    if (videoPath) hasVideoError = false;
    videoState.videoPath = videoPath;

    emitTo(
      'presentation',
      'video-state-update',
      untrack(() => videoState)
    );
  });

  function togglePlay() {
    if (videoState.playing) {
      videoElement?.pause();
    } else {
      videoElement?.play();
    }
  }

  function handleLoadedMetadata() {
    duration = videoElement?.duration ?? 0;
  }

  function handlePlay() {
    videoState.playing = true;
    appState.playing = true;
    videoState.currentTime = currentTime;
    emitTo('presentation', 'video-state-update', videoState);
  }

  function handlePause() {
    videoState.playing = false;
    appState.playing = false;
    videoState.currentTime = currentTime;
    emitTo('presentation', 'video-state-update', videoState);
  }

  function seekTo(time: number) {
    if (videoElement) {
      videoElement.currentTime = time;
      videoState.currentTime = time;
      emitTo('presentation', 'video-state-update', videoState);
    }
  }

  function skip(seconds: number) {
    if (videoElement) {
      videoState.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoElement.currentTime = videoState.currentTime;
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
    videoState.playing ? videoElement?.pause() : videoElement?.play();
    restartControllsInterval();
  }

  function handleMouseEnter() {
    restartControllsInterval();
  }

  function restartControllsInterval() {
    showControlls = true;
    clearTimeout(controllInterval);
    controllInterval = setTimeout(() => (showControlls = false), 3000);
  }

  function addActions() {
    keyHandler.registerAction('play-pause', () => {
      if (videoElement) videoState.playing ? videoElement.pause() : videoElement.play();
    });
    keyHandler.registerAction('skip-back', () => skip(-Number(appState.settings.skipIntervall)));
    keyHandler.registerAction('skip-forward', () => skip(Number(appState.settings.skipIntervall)));
  }

  function removeActions() {
    keyHandler.removeAction('play-pause');
    keyHandler.removeAction('skip-back');
    keyHandler.removeAction('skip-forward');
  }
</script>

<div class="relative flex flex-col overflow-hidden rounded-lg bg-black shadow-2xl">
  {#if videoState.videoPath && !hasVideoError}
    <video
      bind:this={videoElement}
      bind:currentTime
      class="h-full w-full bg-black object-contain"
      onloadedmetadata={handleLoadedMetadata}
      onplay={handlePlay}
      onpause={handlePause}
      onerror={(e) => {
        hasVideoError = true;
      }}
      src={videoState.videoPath}
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
        <span class="text-muted-foreground w-16 text-right text-sm">
          {formatTime(currentTime)}
        </span>
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
            {#if videoState.playing}
              <Pause class="size-6" />
            {:else}
              <Play class="size-6" />
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
          <button
            onclick={onTogglePresenationMode}
            class="hover:bg-input rounded p-2 transition-colors"
            aria-label="presentation"
            title="Starte/Stoppe den Präsentationsmodus"
          >
            {#if appState.isPresentationMode}
              <MonitorOff class="size-5" />
            {:else}
              <Monitor class="size-5" />
            {/if}
          </button>
          <!-- Lautstärke -->
          <div class="flex items-center gap-2">
            <button onclick={toggleMute} class="hover:bg-input rounded p-2 transition-colors">
              {#if isMuted}
                <VolumeOff class="size-5" />
              {:else if volume === 0}
                <VolumeX class="size-5" />
              {:else if volume < 0.3}
                <Volume class="size-5" />
              {:else if volume < 0.6}
                <Volume1 class="size-5" />
              {:else}
                <Volume2 class="size-5" />
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
            <Expand class="size-5" />
          </button>
        </div>
      </div>
    </div>
  {:else if hasVideoError}
    <div class="bg-background flex aspect-video items-center justify-center">
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
        <p class="text-sm">{videoPath?.split(/[\\/]/).pop()}</p>
        <Button
          onclick={() => {
            onRelocateVideo?.();
          }}
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
