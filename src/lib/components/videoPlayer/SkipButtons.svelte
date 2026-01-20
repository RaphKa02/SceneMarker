<script lang="ts">
  interface Props {
    skip: (seconds: number) => void;
  }

  const { skip }: Props = $props();

  const skipIntervals = [0.03, 1, 3, 5, 10, 60];
</script>

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
