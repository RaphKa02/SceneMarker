<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    children?: Snippet<[]>;
  }

  const { title, children }: Props = $props();
</script>

<section class="border-border h-fit rounded-xl border p-4">
  <h1 class="text-muted-foreground mb-2 font-semibold">{title}</h1>
  <div class="grid gap-2">
    {@render children?.()}
  </div>
</section>
