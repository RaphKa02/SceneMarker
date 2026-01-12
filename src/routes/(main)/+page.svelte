<script lang="ts">
  import { tutorialElement } from '$lib/tutorial.svelte';
  import App from '../../App.svelte';
</script>

<App />

<div
  class="bg-background fixed top-1/3 left-1/2 -z-50 flex -translate-1/2 items-center gap-8 rounded-xl p-8"
  use:tutorialElement={{ id: 'main', hidden: true }}
>
  <div
    class="bg-primary text-primary-foreground flex aspect-square items-center justify-center rounded p-4 text-7xl font-bold"
  >
    SM
  </div>
  <h1 class="text-6xl font-bold">SceneMarker</h1>
</div>
