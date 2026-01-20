<script lang="ts">
  import * as Select from '$components/ui/select';
  import SkipButtons from '$components/videoPlayer/SkipButtons.svelte';
  import Timeline from '$components/videoPlayer/Timeline.svelte';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { appState } from '$lib/state.svelte';
  import { videoPlayerState } from '$lib/videoPlayerState.svelte';
  import Expand from '@lucide/svelte/icons/expand';
  import Flag from '@lucide/svelte/icons/flag';
  import Gauge from '@lucide/svelte/icons/gauge';
  import Monitor from '@lucide/svelte/icons/monitor';
  import MonitorOff from '@lucide/svelte/icons/monitor-off';
  import Pause from '@lucide/svelte/icons/pause';
  import Play from '@lucide/svelte/icons/play';
  import Volume from '@lucide/svelte/icons/volume';
  import Volume1 from '@lucide/svelte/icons/volume-1';
  import Volume2 from '@lucide/svelte/icons/volume-2';
  import VolumeOff from '@lucide/svelte/icons/volume-off';
  import VolumeX from '@lucide/svelte/icons/volume-x';
  import { onMount, tick } from 'svelte';

  interface Props {
    onTogglePresenationMode?: () => void;
    restartControllsInterval: () => void;
    skipRightActive: boolean;
    skipLeftActive: boolean;
    skipAmount: number;
  }

  let {
    skipLeftActive = $bindable(false),
    skipRightActive = $bindable(false),
    skipAmount = $bindable(0),
    onTogglePresenationMode,
    restartControllsInterval,
  }: Props = $props();

  const skipIntervals = [0.03, 1, 3, 5, 10, 60];

  onMount(() => {
    addActions();
    return () => removeActions();
  });

  function addActions() {
    keyHandler.registerAction('play-pause', () => {
      if (videoPlayerState.videoElement && !videoPlayerState.isFullscreen) {
        videoPlayerState.togglePlay();
        videoPlayerState.videoElement.focus();
      }
    });
    keyHandler.registerAction('skip-back', () => skip(-Number(appState.settings.skipIntervall)));
    keyHandler.registerAction('skip-forward', () => skip(Number(appState.settings.skipIntervall)));
  }

  function removeActions() {
    keyHandler.removeAction('play-pause');
    keyHandler.removeAction('skip-back');
    keyHandler.removeAction('skip-forward');
  }

  async function skip(seconds: number) {
    videoPlayerState.skip(seconds);
    skipAmount = seconds;
    skipRightActive = false;
    skipLeftActive = false;
    await tick();
    if (seconds < 0) skipLeftActive = true;
    if (seconds > 0) skipRightActive = true;
  }
</script>

<div
  class={[
    'bg-background absolute bottom-0 w-full space-y-3 p-4 opacity-0 transition-opacity focus-within:opacity-100 hover:opacity-100',
    videoPlayerState.showControlls && 'opacity-100',
  ]}
>
  <Timeline />

  <!-- Kontrollleiste -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <!-- Play/Pause -->
      <button
        onclick={videoPlayerState.togglePlay}
        class="hover:bg-input text-primary rounded p-2 transition-colors"
      >
        {#if videoPlayerState.playing}
          <Pause class="size-6" />
        {:else}
          <Play class="size-6" />
        {/if}
      </button>

      <SkipButtons {skip} />

      <Select.Root
        onOpenChange={(open) => {
          if (open) videoPlayerState.showControlls = true;
          else restartControllsInterval();
        }}
        type="single"
        bind:value={
          () => String(videoPlayerState.videoSpeed),
          (v) => (videoPlayerState.videoSpeed = Number(v))
        }
      >
        <Select.Trigger>
          <Gauge class="size-5" /> x{videoPlayerState.videoSpeed}
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            {#each [0.25, 0.5, 1, 1.5, 2] as speed}
              <Select.Item value={String(speed)}>{speed}</Select.Item>
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </div>

    <div class="flex items-center gap-2">
      <button
        onclick={() =>
          (appState.uiState.showTimelineMarkers = !appState.uiState.showTimelineMarkers)}
        class="hover:bg-input rounded p-2 transition-colors"
        aria-label="presentation"
        title="Schalte Zeitachsenszenenmarkierungen an/aus"
      >
        {#if appState.uiState.showTimelineMarkers}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-5"
          >
            <path
              d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"
            />
          </svg>
        {:else}
          <Flag class="size-5" />
        {/if}
      </button>

      <!-- Lautstärke -->
      <div class="mr-2 flex items-center gap-2">
        <button
          onclick={videoPlayerState.toggleMute}
          class="hover:bg-input rounded p-2 transition-colors"
          title="Lautstärke an/aus"
        >
          {#if videoPlayerState.isMuted}
            <VolumeOff class="size-5" />
          {:else if videoPlayerState.volume === 0}
            <VolumeX class="size-5" />
          {:else if videoPlayerState.volume < 0.3}
            <Volume class="size-5" />
          {:else if videoPlayerState.volume < 0.6}
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
          bind:value={videoPlayerState.volume}
          class="bg-input [&::-webkit-slider-thumb]:bg-primary h-2 w-20 cursor-pointer appearance-none rounded-lg [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
        />
      </div>

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

      <button
        onclick={videoPlayerState.toggleFullscreen}
        class="hover:bg-input rounded p-2 transition-colors"
        aria-label="fullscreen"
      >
        <Expand class="size-5" />
      </button>
    </div>
  </div>
</div>
