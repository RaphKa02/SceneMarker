<script lang="ts">
  import { Separator } from '$components/ui/separator';
  import type { SceneListItemScene } from '$lib/types';
  import { formatTime } from '$utils';

  interface Props {
    scenes: SceneListItemScene[];
    duration: number;
    hidden: boolean;
    onclick?: () => void;
  }

  const { scenes, duration, hidden, onclick }: Props = $props();

  const time = $derived(scenes[0].scene.time);
  const position = $derived(duration > 0 ? (time / duration) * 100 : 0);
  const isVisible = $derived(!hidden && time >= 0 && time <= duration);

  let isHovered = $state(false);
</script>

{#if isVisible}
  <div
    class="pointer-events-auto absolute bottom-0 -translate-x-1/2 cursor-pointer"
    style="left: {position}%"
    role="button"
    tabindex="0"
    onmouseenter={() => (isHovered = true)}
    onmouseleave={() => (isHovered = false)}
    {onclick}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onclick?.();
      }
    }}
  >
    {#if isHovered}
      <div
        class="absolute bottom-full left-1/2 mb-2 w-max max-w-52 -translate-x-1/2 rounded-lg border border-white/30 bg-white/20 px-4 py-2 text-center shadow-xl backdrop-blur-md dark:bg-gray-800/40"
      >
        {#each scenes as scene, i (scene.id)}
          <h3 class="mb-1 text-sm font-medium text-white drop-shadow-sm">{scene.scene.title}</h3>
          {#if i !== scenes.length - 1}
            <Separator class="bg-gradient-to-r from-transparent via-white to-transparent" />
          {/if}
        {/each}
        <div class="text-xs text-gray-200">{formatTime(time)}</div>

        <div class="absolute top-full left-1/2 -translate-x-1/2">
          <div
            class="border-t-[6px] border-r-[6px] border-l-[6px] border-t-white/50 border-r-transparent border-l-transparent"
          ></div>
        </div>
      </div>
    {/if}

    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      class="text-primary hover:text-foreground size-4"
    >
      <polygon points="4,6 20,6 12,20" />
    </svg>
  </div>
{/if}
