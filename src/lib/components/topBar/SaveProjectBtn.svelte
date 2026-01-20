<script lang="ts">
  import { Button } from '$components/ui/button';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { projectManager } from '$lib/projectManager.svelte';
  import { appState } from '$lib/state.svelte';
  import { tutorialElement } from '$lib/tutorial.svelte';
  import Save from '@lucide/svelte/icons/save';
</script>

<Button
  onclick={projectManager.saveProject}
  disabled={!appState.projectModified}
  variant={appState.projectModified ? 'default' : 'outline'}
  title={keyHandler.getKeyCombo('save-project', true)}
  use={[[tutorialElement, { id: 'save-project-btn' }]]}
>
  <Save />
</Button>
