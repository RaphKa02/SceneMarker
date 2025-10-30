<script>
  import { appState } from '$lib/state.svelte';
  import { installUpdate } from '$lib/update';
  import CircleArrowDown from '@lucide/svelte/icons/circle-arrow-down';
  import Download from '@lucide/svelte/icons/download';
  import X from '@lucide/svelte/icons/x';
  import { Button } from './ui/button';
</script>

<div
  class={[
    'fixed top-0 left-1/2 z-10 -translate-x-1/2 shadow',
    !appState.showUpdatePopup && 'hidden',
  ]}
>
  <div
    class="bg-card border-border container mx-auto flex items-center justify-between gap-4 rounded-b-2xl border border-t-0 px-6 py-4"
  >
    <div class="flex items-center justify-center gap-3">
      <CircleArrowDown class="size-10" />

      <p class="mx-1 text-lg font-bold">
        Neue SceneMarker Version verfügbar! Klicke auf <strong>Installieren</strong> um das Update herunterzuladen
        und zu installieren.
      </p>

      <Button size="lg" onclick={installUpdate}>
        <Download class="size-5" />
        <span>Installieren</span>
      </Button>

      <!-- <button type="button" class="smallButton">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
        <span>Release notes</span>
      </button> -->
    </div>

    <Button
      variant="ghost"
      size="icon"
      onclick={() => (appState.showUpdatePopup = false)}
      aria-label="close popup"
    >
      <X class="size-5" />
    </Button>
  </div>
</div>
