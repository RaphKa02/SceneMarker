<script lang="ts">
  import { Button } from '$components/ui/button';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { projectManager } from '$lib/projectManager.svelte';
  import { tutorialElement } from '$lib/tutorial.svelte';
  import Video from '@lucide/svelte/icons/video';
</script>

<Button
  onclick={projectManager.createProject}
  variant="outline"
  title={keyHandler.getKeyCombo('create-project', true)}
  use={[[tutorialElement, { id: 'create-project-btn' }]]}
>
  <Video class="size-4" />
  Neues Projekt
</Button>
