<script lang="ts">
  import type { VideoState } from '$lib/types';
  import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event';
  import { onMount } from 'svelte';

  let videoElement = $state<HTMLVideoElement | null>(null);
  let videoState = $state<VideoState>({
    currentTime: 0,
    playing: false,
    videoPath: undefined,
  });

  onMount(() => {
    const unlisten = listen<VideoState>('video-state-update', (e) => {
      videoState = e.payload;
      if (e.payload.playing) videoElement?.play();
      else videoElement?.pause();
      if (videoElement) videoElement.currentTime = videoState.currentTime;
    });
    emit('ready');
    return () => cleanUp(unlisten);
  });

  async function cleanUp(unlisten: Promise<UnlistenFn>) {
    (await unlisten)();
  }
</script>

<video
  bind:this={videoElement}
  class="h-screen w-full bg-black object-contain"
  src={videoState.videoPath}
  muted
>
  <track kind="captions" />
</video>
