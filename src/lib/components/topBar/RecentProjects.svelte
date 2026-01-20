<script lang="ts">
  import { Button } from '$components/ui/button';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import * as Popover from '$components/ui/popover';
  import { projectManager } from '$lib/projectManager.svelte';
  import { appState } from '$lib/state.svelte';
  import { tutorialElement } from '$lib/tutorial.svelte';
  import { stopPropagation } from '$utils';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import X from '@lucide/svelte/icons/x';

  let deleteDialogOpen = $state(false);
  let projectToDelete = $state<string>();
  let dialogAnchor = $state<HTMLElement | null>(null);
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" use={[[tutorialElement, { id: 'last-projects-btn' }]]}>
        Letzte Projekte <ChevronDown />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="start" class="max-h-72">
    <DropdownMenu.Group>
      {#each [...appState.recentProjects.entries()].sort(([_, a], [__, b]) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0)) as [key, project] (key)}
        <DropdownMenu.Item
          class="group justify-between gap-2 overflow-hidden"
          onclick={() => projectManager.loadProjectFromPath(project.path)}
        >
          <div>
            <p class="text-sm leading-tight font-semibold">{project.path.split(/[\\/]/).pop()}</p>
            <p class="text-muted-foreground max-w-full truncate text-xs leading-tight">
              {project.path}
            </p>
            {#if project.lastModified}
              <p class="text-muted-foreground text-xs leading-tight">
                Zuletzt geändert:
                {new Date(project.lastModified).toLocaleString(undefined, {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            {/if}
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="ring-0"
            onclick={stopPropagation((e) => {
              deleteDialogOpen = true;
              projectToDelete = project.path;
              dialogAnchor = e.target as HTMLElement;
            })}
          >
            <X class="text-destructive size-4 opacity-0 group-hover:opacity-100" />
          </Button>
        </DropdownMenu.Item>
      {:else}
        <DropdownMenu.Item disabled>keine Projekte</DropdownMenu.Item>
      {/each}
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<Popover.Root bind:open={deleteDialogOpen}>
  <Popover.Content customAnchor={dialogAnchor} class="space-y-4">
    <div class="space-y-2">
      <h4 class="text-xl">Löschen</h4>
      <p class="text-muted-foreground text-sm">Möchtest du diesen Eintrag wirklich löschen?</p>
    </div>
    <div class="flex gap-4">
      <Button
        class="flex-1"
        variant="destructive"
        onclick={() => {
          projectManager.deleteProjectMetadata(projectToDelete!);
          deleteDialogOpen = false;
          projectToDelete = undefined;
        }}
      >
        Ja
      </Button>
      <Button class="flex-1" variant="outline" onclick={() => (deleteDialogOpen = false)}>
        Nein
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
