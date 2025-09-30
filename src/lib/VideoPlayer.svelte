<script lang="ts">
  import { convertFileSrc } from '@tauri-apps/api/core';
  import { onMount } from 'svelte';

  interface Props {
    videoPath: string;
    currentTime: number;
    onVideoElementReady: (element: HTMLVideoElement) => void;
  }

  let { videoPath, currentTime = $bindable(0), onVideoElementReady }: Props = $props();

  let videoElement = $state<HTMLVideoElement | null>(null);
  let isPlaying = $state(false);
  let duration = $state(0);
  let volume = $state(1);
  let isMuted = $state(false);
  let isFullscreen = $state(false);

  onMount(() => {
    if (videoElement) {
      onVideoElementReady(videoElement);
    }
  });

  function togglePlay() {
    if (isPlaying) {
      videoElement?.pause();
    } else {
      videoElement?.play();
    }
  }

  function handleTimeUpdate() {
    currentTime = videoElement?.currentTime ?? 0;
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

  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function convertFile(filePath: string) {
    try {
      return convertFileSrc(filePath);
    } catch (e) {
      console.error('Fehler bei convertFileSrc:', e);
    }
  }

  $effect(() => {
    if (videoElement && videoPath) {
      const convertedPath = convertFile(videoPath);
      if (convertedPath) {
        videoElement.src = convertedPath;
        onVideoElementReady(videoElement);
      }
    }
  });
</script>

<div class="flex flex-col overflow-hidden rounded-lg bg-black shadow-2xl">
  {#if videoPath}
    <div class="relative aspect-video bg-black">
      <video
        bind:this={videoElement}
        class="h-full w-full"
        ontimeupdate={handleTimeUpdate}
        onloadedmetadata={handleLoadedMetadata}
        onplay={handlePlay}
        onpause={handlePause}
        onerror={(e) => console.error('Video load error:', e)}
      >
        <track kind="captions" />
      </video>
    </div>

    <div class="space-y-3 bg-gray-800 p-4">
      <!-- Zeitachse -->
      <div class="flex items-center gap-3">
        <span class="w-16 text-right text-sm text-gray-400">{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          oninput={(e) => seekTo(parseFloat((e.target as HTMLInputElement).value))}
          class="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-700 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
        />
        <span class="w-16 text-sm text-gray-400">{formatTime(duration)}</span>
      </div>

      <!-- Kontrollleiste -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <!-- Play/Pause -->
          <button onclick={togglePlay} class="rounded p-2 transition-colors hover:bg-gray-700">
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
            <button
              onclick={() => skip(-60)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">-60s</button
            >
            <button
              onclick={() => skip(-10)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">-10s</button
            >
            <button
              onclick={() => skip(-5)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">-5s</button
            >
            <button
              onclick={() => skip(-3)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">-3s</button
            >
            <button
              onclick={() => skip(-1)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">-1s</button
            >
            <button
              onclick={() => skip(-0.03)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">-1FR</button
            >

            <div class="mx-1 w-px bg-gray-600"></div>

            <button
              onclick={() => skip(0.03)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">+1FR</button
            >
            <button
              onclick={() => skip(1)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">+1s</button
            >
            <button
              onclick={() => skip(3)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">+3s</button
            >
            <button
              onclick={() => skip(5)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">+5s</button
            >
            <button
              onclick={() => skip(10)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">+10s</button
            >
            <button
              onclick={() => skip(60)}
              class="rounded px-2 py-1 text-xs transition-colors hover:bg-gray-700">+60s</button
            >
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Lautstärke -->
          <div class="flex items-center gap-2">
            <button onclick={toggleMute} class="rounded p-2 transition-colors hover:bg-gray-700">
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
              class="h-2 w-20 cursor-pointer appearance-none rounded-lg bg-gray-700 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
            />
          </div>

          <button
            onclick={toggleFullscreen}
            class="rounded p-2 transition-colors hover:bg-gray-700"
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
  {:else}
    <div class="flex aspect-video items-center justify-center bg-gray-800">
      <div class="text-center text-gray-400">
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
        <p class="mt-2 text-sm">Öffne ein Video über das Menü</p>
      </div>
    </div>
  {/if}
</div>
