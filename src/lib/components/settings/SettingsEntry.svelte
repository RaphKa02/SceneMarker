<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    children?: Snippet<[]>;
  }

  const { title, children }: Props = $props();
</script>

<div class="flex items-center justify-between">
  <p>{title}</p>
  <div class="flex gap-2">
    {@render children?.()}
  </div>
</div>
