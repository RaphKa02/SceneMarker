<script lang="ts">
  import { Button } from '$components/ui/button';
  import * as Popover from '$components/ui/popover';
  import { appState } from '$lib/state.svelte';
  import {
    nextStage,
    previousStage,
    startTutorial,
    stopTutorial,
    tutorialState,
  } from '$lib/tutorial.svelte';
  import X from '@lucide/svelte/icons/x';
  import { onMount, tick } from 'svelte';

  let nextBtn = $state<HTMLButtonElement | null>(null);

  onMount(() => {
    const wait = async () => {
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!appState.uiState.tutorialShown) startTutorial();
    };
    wait();
  });
</script>

{#if tutorialState.active}
  <div class="fixed z-[999] h-screen w-screen bg-black/60"></div>
  {#key tutorialState.stage?.id}
    <Popover.Root open>
      <Popover.Content
        customAnchor={tutorialState.element}
        interactOutsideBehavior="ignore"
        escapeKeydownBehavior="ignore"
        class="z-[1000] m-2 grid w-fit max-w-md gap-4"
        onOpenAutoFocus={async () => {
          await tick();
          await new Promise((resolve) => setTimeout(resolve, 10));
          nextBtn?.focus();
        }}
      >
        {tutorialState.stage?.text}

        <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4">
          <Button
            variant="ghost"
            class="text-muted-foreground flex w-fit items-center gap-2 text-xs"
            onclick={stopTutorial}
          >
            Tour beenden <X class="size-4" />
          </Button>
          <span class="text-muted-foreground text-sm">
            {tutorialState.stageNumber + 1}/{tutorialState.stageCount}
          </span>
          <Button variant="outline" onclick={previousStage} disabled={tutorialState.firstStage}>
            Zurück
          </Button>
          <Button onclick={nextStage} bind:ref={nextBtn}>
            {tutorialState.lastStage ? 'Ende' : 'Weiter'}
          </Button>
        </div>
      </Popover.Content>
    </Popover.Root>
  {/key}
{/if}

<style lang="postcss">
  @reference "tailwindcss";

  :global([data-tutorial-highlight='true']) {
    z-index: 1000 !important;
    pointer-events: none !important;
    outline: 3px solid var(--color-primary) !important;
    box-shadow:
      0 0 0 5px var(--color-primary),
      0 4px 20px 2px rgba(0, 0, 0, 0.18) !important;
    transition: margin 0.2s;
    margin: 4px;
  }
</style>
