<script lang="ts">
  import { Button } from '$components/ui/button';
  import { trackEvent } from '$lib/analytics';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { projectManager } from '$lib/projectManager.svelte';
  import { appState } from '$lib/state.svelte';
  import { startTutorial, tutorialElement } from '$lib/tutorial.svelte';
  import { cn } from '$utils';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Download from '@lucide/svelte/icons/download';
  import FileVideoCamera from '@lucide/svelte/icons/file-video-camera';
  import Rocket from '@lucide/svelte/icons/rocket';
  import Settings from '@lucide/svelte/icons/settings';
  import { onMount } from 'svelte';
  import SceneList from './SceneList.svelte';
  import VideoFiles from './VideoFiles.svelte';

  onMount(() => {
    setActions();
    return () => removeActions();
  });

  function setActions() {
    keyHandler.registerAction('add-scene', projectManager.addScene);
    keyHandler.registerAction('add-group', projectManager.addGroup);
    keyHandler.registerAction('open-video-dialog', projectManager.addVideoFile);
    keyHandler.registerAction('toggle-locked', toggleLockSidebar);
    keyHandler.registerAction('toggle-videofiles', toggleShowVideoFiles);
    keyHandler.registerAction('toggle-videofilter', toggleShowFilters);
  }

  function removeActions() {
    keyHandler.removeAction('add-scene');
    keyHandler.removeAction('add-group');
    keyHandler.removeAction('open-video-dialog');
    keyHandler.removeAction('toggle-locked');
    keyHandler.removeAction('toggle-videofiles');
    keyHandler.removeAction('toggle-videofilter');
  }

  function toggleLockSidebar() {
    appState.uiState.lockSidebar = !appState.uiState.lockSidebar;
    trackEvent('sidebar_locked', { value: String(appState.uiState.lockSidebar) });
  }

  function toggleShowSidebar() {
    appState.uiState.showSidebar = !appState.uiState.showSidebar;
    trackEvent('sidebar_visible', { value: String(appState.uiState.showSidebar) });
  }

  function toggleShowVideoFiles() {
    appState.uiState.showVideoFiles = !appState.uiState.showVideoFiles;
    trackEvent('video-files_visible', { value: String(appState.uiState.showVideoFiles) });
  }

  function toggleShowFilters() {
    appState.uiState.showFilter = !appState.uiState.showFilter;
    trackEvent('filter_visible', { value: String(appState.uiState.showFilter) });
  }

  function showSettings() {
    appState.uiState.showSettings = true;
    trackEvent('settings_open');
  }
</script>

<aside class="bg-background flex h-full flex-col divide-y transition-all duration-300 ease-in-out">
  <div
    class={cn(
      'flex justify-between p-2',
      !appState.uiState.showSidebar && 'flex-col items-center gap-2'
    )}
  >
    <Button
      variant="outline"
      size="icon"
      onclick={toggleShowSidebar}
      title="Schaltet die Sidebar an/aus (Strg+E)"
      use={[[tutorialElement, { id: 'hide-sidebar-btn' }]]}
    >
      {#if appState.uiState.showSidebar}
        <ChevronRight />
      {:else}
        <ChevronLeft />
      {/if}
    </Button>
    {#if !appState.uiState.showVideoFiles && appState.uiState.showSidebar}
      <Button
        variant="outline"
        size="icon"
        onclick={toggleShowVideoFiles}
        title={`Schaltet die Videoliste an (${keyHandler.getKeyCombo('toggle-videofiles', true)})`}
        use={[[tutorialElement, { id: 'show-videofiles-btn' }]]}
      >
        <FileVideoCamera />
      </Button>
    {/if}
  </div>
  {#if appState.uiState.showSidebar}
    {#if appState.uiState.showVideoFiles}
      <VideoFiles {toggleShowVideoFiles} />
    {/if}

    <SceneList {toggleLockSidebar} {toggleShowFilters} />

    <div class="flex justify-between p-2">
      <Button
        variant="ghost"
        size="icon"
        onclick={startTutorial}
        use={[[tutorialElement, { id: 'tour-btn' }]]}
      >
        <Rocket class="size-5" />
      </Button>
      <div class="flex gap-2">
        {#if appState.updateAvailable}
          <Button variant="ghost" size="icon" onclick={() => (appState.showUpdatePopup = true)}>
            <Download class="size-5" />
          </Button>
        {/if}
        <Button
          variant="ghost"
          size="icon"
          class="relative"
          onclick={showSettings}
          use={[[tutorialElement, { id: 'settings-btn' }]]}
        >
          <Settings class="size-5" />
        </Button>
      </div>
    </div>
  {/if}
</aside>
