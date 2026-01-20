<script lang="ts">
  import { Button } from '$components/ui/button';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { projectManager } from '$lib/projectManager.svelte';
  import { tutorialElement } from '$lib/tutorial.svelte';
</script>

<Button
  onclick={projectManager.saveProjectAt}
  variant="outline"
  title={keyHandler.getKeyCombo('save-project-at', true)}
  use={[[tutorialElement, { id: 'save-project-as-btn' }]]}
>
  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
    />
  </svg>
  Projekt speichern unter
</Button>
