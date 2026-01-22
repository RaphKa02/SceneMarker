<script lang="ts">
  import Dropdown from '$components/settings/Dropdown.svelte';
  import KeyRemapper from '$components/settings/KeyRemapper.svelte';
  import remapperState from '$components/settings/remapperState.svelte';
  import SettingsEntry from '$components/settings/SettingsEntry.svelte';
  import SettingsSection from '$components/settings/SettingsSection.svelte';
  import { buttonVariants } from '$components/ui/button';
  import * as Dialog from '$components/ui/dialog';
  import Separator from '$components/ui/separator/separator.svelte';
  import * as Tabs from '$components/ui/tabs';
  import { trackEvent } from '$lib/analytics';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import { appState } from '$lib/state.svelte';

  const categories: Record<string, string> = {
    info: 'Über SceneMarker',
    general: 'Allgemein',
    keyboard: 'Tastenzuweisungen',
  } as const;
</script>

<Dialog.Root
  bind:open={appState.uiState.showSettings}
  onOpenChange={(open) => !open && (remapperState.activeEditAction = null)}
>
  <Dialog.Content
    class="flex flex-col sm:h-1/2 sm:max-w-1/2"
    showCloseButton={false}
    interactOutsideBehavior="ignore"
  >
    <Dialog.Header class="text-xl font-bold">
      {categories[appState.uiState.settingsTab]}
    </Dialog.Header>
    <Separator />
    <Tabs.Root
      class="flex flex-1 flex-row overflow-hidden"
      orientation="vertical"
      bind:value={appState.uiState.settingsTab}
    >
      <Tabs.List
        class="bg-bg h-full flex-col items-start justify-start gap-2 overflow-y-auto p-2 pr-8"
      >
        {#each Object.entries(categories) as [value, category] (value)}
          <Tabs.Trigger class="h-fit flex-initial" {value}>{category}</Tabs.Trigger>
        {/each}
      </Tabs.List>
      <Separator orientation="vertical" />
      <Tabs.Content
        class="flex flex-col items-center justify-center gap-6 overflow-y-auto py-8"
        value="info"
      >
        <h1
          class="bg-primary text-primary-foreground flex aspect-square items-center justify-center rounded p-4 text-4xl font-bold"
        >
          SM
        </h1>
        <h2 class="text-2xl font-bold">SceneMarker</h2>
        <div class="flex flex-col items-center">
          <p class="text-muted-foreground">made by Raphael Karl</p>
          <p class="text-muted-foreground">v{appState.version}</p>
        </div>
      </Tabs.Content>
      <Tabs.Content class="grid content-start gap-4 overflow-y-auto pr-2" value="general">
        <SettingsSection title="Allgemein">
          <SettingsEntry title="Design">
            <Dropdown
              bind:value={appState.settings.theme}
              onValueChange={(value) => trackEvent('theme_changed', { theme: value })}
              items={[
                {
                  label: 'System',
                  value: 'system',
                },
                {
                  label: 'Hell',
                  value: 'light',
                },
                {
                  label: 'Dunkel',
                  value: 'dark',
                },
              ]}
            />
          </SettingsEntry>
        </SettingsSection>
        <SettingsSection title="Szenen">
          <SettingsEntry title="Neue Szene/Gruppe platzieren">
            <Dropdown
              bind:value={appState.settings.itemPlaceLocation}
              onValueChange={(value) =>
                trackEvent('item-place-location_changed', { location: value })}
              items={[
                { label: 'Oben', value: 'top' },
                { label: 'Unten', value: 'bottom' },
              ]}
            />
          </SettingsEntry>
          <SettingsEntry title="Zeit der Szene beim Erstellen verschieben">
            <Dropdown
              bind:value={appState.settings.shiftSceneTime}
              onValueChange={(value) => trackEvent('time-shift_changed', { time: value })}
              items={[
                { label: '0 Sekunden', value: '0' },
                { label: '- 5 Sekunden', value: '5' },
                { label: '- 10 Sekunden', value: '10' },
                { label: '- 15 Sekunden', value: '15' },
                { label: '- 20 Sekunden', value: '20' },
                { label: '- 30 Sekunden', value: '30' },
              ]}
            />
          </SettingsEntry>
        </SettingsSection>
        <SettingsSection title="Video">
          <SettingsEntry
            title={`Sprungintervall (${keyHandler.getKeyCombo('skip-forward', true)}/${keyHandler.getKeyCombo('skip-back', true)})`}
          >
            <Dropdown
              bind:value={appState.settings.skipIntervall}
              onValueChange={(value) => trackEvent('skip-interval_changed', { time: value })}
              items={[
                { label: '1 Sekunde', value: '1' },
                { label: '5 Sekunden', value: '5' },
                { label: '10 Sekunden', value: '10' },
                { label: '30 Sekunden', value: '30' },
                { label: '1 Minute', value: '60' },
              ]}
            />
          </SettingsEntry>
        </SettingsSection>
        <SettingsSection title="Analyse">
          <SettingsEntry
            title="Sende anonyme und nicht nachverfolgbare Statistiken, um die App zu verbessern"
          >
            <Dropdown
              bind:value={appState.settings.sendAnonymousStatistics}
              onValueChange={(value) => trackEvent('send-statistics_changes', { enabled: value })}
              items={[
                { label: 'Ja, gerne', value: 'true' },
                { label: 'Nein, ich möchte das nicht', value: 'false' },
              ]}
            />
          </SettingsEntry>
        </SettingsSection>
      </Tabs.Content>
      <Tabs.Content class="grid content-start gap-4 overflow-y-auto pr-2" value="keyboard">
        <SettingsSection title="Allgemein">
          <KeyRemapper actionId="create-project" title="Projekt erstellen" />
          <KeyRemapper actionId="load-project" title="Projekt laden" />
          <KeyRemapper actionId="open-video-dialog" title="Video öffnen" />
          <KeyRemapper actionId="save-project-at" title="Projekt speichen unter" />
          <KeyRemapper actionId="save-project" title="Projekt speichen" />
        </SettingsSection>
        <SettingsSection title="Wiedergabe">
          <KeyRemapper actionId="play-pause" title="Play/Pause" />
          <KeyRemapper actionId="skip-forward" title="Springe +5s" />
          <KeyRemapper actionId="skip-back" title="Springe -5s" />
        </SettingsSection>
        <SettingsSection title="Seitenleiste">
          <KeyRemapper actionId="toggle-sidebar" title="Sichtbar an/aus" />
          <KeyRemapper actionId="toggle-videofiles" title="Videodateien an/aus" />
          <KeyRemapper actionId="toggle-locked" title="Sperren an/aus" />
          <KeyRemapper actionId="add-scene" title="Neue Szene" />
          <KeyRemapper actionId="add-group" title="Neue Gruppe" />
        </SettingsSection>
      </Tabs.Content>
    </Tabs.Root>
    <Separator />
    <Dialog.Footer>
      <Dialog.Close class={buttonVariants({ variant: 'outline' })}>Schließen</Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
