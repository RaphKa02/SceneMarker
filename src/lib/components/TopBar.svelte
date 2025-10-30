<script lang="ts">
  import { Button } from '$components/ui/button';
  import * as DropdownMenu from '$components/ui/dropdown-menu';
  import * as Popover from '$components/ui/popover';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { appState } from '$lib/state.svelte';
  import { tutorialElement } from '$lib/tutorial.svelte';
  import { stopPropagation } from '$utils';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Save from '@lucide/svelte/icons/save';
  import Video from '@lucide/svelte/icons/video';
  import X from '@lucide/svelte/icons/x';

  interface Props {
    projectName: string | null;
    onOpenVideo: () => void;
    onSaveProject: () => void;
    onSaveProjectAt: () => void;
    onLoadProject: () => void;
    onLoadProjectFromPath: (path: string) => void;
    onDeleteProjectMetadata: (path: string) => void;
  }

  let {
    projectName,
    onOpenVideo,
    onSaveProject,
    onSaveProjectAt,
    onLoadProject,
    onLoadProjectFromPath,
    onDeleteProjectMetadata,
  }: Props = $props();

  let deleteDialogOpen = $state(false);
  let projectToDelete = $state<string>();
  let dialogAnchor = $state<HTMLElement | null>(null);
</script>

<div
  class="border-border bg-background flex h-14 items-center gap-2 border-b px-4"
  data-tauri-drag-region
>
  <div class="mr-4 flex items-center gap-2" use:tutorialElement={{ id: 'main' }}>
    <div
      class="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded font-bold"
    >
      SM
    </div>
    <h1 class="text-lg font-bold">SceneMarker</h1>
  </div>

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
            onclick={() => onLoadProjectFromPath(project.path)}
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

  <Button
    onclick={onLoadProject}
    variant="outline"
    title={keyHandler.getKeyCombo('load-project', true)}
    use={[[tutorialElement, { id: 'load-project-btn' }]]}
  >
    <FolderOpen class="size-4" />
    Projekt laden
  </Button>

  <Button
    onclick={onOpenVideo}
    variant="outline"
    title={keyHandler.getKeyCombo('open-video-dialog', true)}
    use={[[tutorialElement, { id: 'create-project-btn' }]]}
  >
    <Video class="size-4" />
    Neues Projekt
  </Button>

  <Button
    onclick={onSaveProjectAt}
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
  <Button
    onclick={onSaveProject}
    disabled={!appState.projectModified}
    variant={appState.projectModified ? 'default' : 'outline'}
    title={keyHandler.getKeyCombo('save-project', true)}
    use={[[tutorialElement, { id: 'save-project-btn' }]]}
  >
    <Save />
  </Button>

  {#if projectName}
    <div class="text-muted-foreground text-sm">
      {projectName}
    </div>
  {:else if appState.project.videoPath && !appState.project.filePath}
    <p class="text-muted-foreground">Neues Projekt</p>
  {/if}
</div>

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
          onDeleteProjectMetadata(projectToDelete!);
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
