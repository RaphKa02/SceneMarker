<script lang="ts">
  import { Button } from '$components/ui/button';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { projectManager } from '$lib/projectManager.svelte';
  import { tutorialElement } from '$lib/tutorial.svelte';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
</script>

<Button
  onclick={projectManager.loadProject}
  variant="outline"
  title={keyHandler.getKeyCombo('load-project', true)}
  use={[[tutorialElement, { id: 'load-project-btn' }]]}
>
  <FolderOpen class="size-4" />
  Projekt laden
</Button>
