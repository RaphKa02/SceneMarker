<script lang="ts">
  import RemapperState from '$components/settings/remapperState.svelte';
  import { Button } from '$components/ui/button';
  import { trackEvent } from '$lib/analytics';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import Undo from '@lucide/svelte/icons/undo';

  interface Props {
    title: string;
    actionId: string;
  }

  const { title, actionId }: Props = $props();

  let edit = $derived(RemapperState.activeEditAction === actionId);
  let lastKeyCombo = $state('');

  const isDefault = $derived(
    keyHandler.getKeyCombo(actionId) === keyHandler.getDefaultKeyCombo(actionId)
  );

  const keyCombo = $derived(edit ? lastKeyCombo : keyHandler.getKeyCombo(actionId, true));

  function handleKeyDown(e: KeyboardEvent) {
    if (!edit) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      lastKeyCombo = '';
      RemapperState.activeEditAction = null;
      return;
    }

    if (e.key === 'Enter') {
      keyHandler.unbindKey(keyHandler.getKeyCombo(actionId));
      keyHandler.bindKey(lastKeyCombo, actionId);

      trackEvent(`key-combo_${actionId}_changed`, { keyCombo: lastKeyCombo });
      RemapperState.activeEditAction = null;
      return;
    }

    lastKeyCombo = keyHandler.normalizeKeyEvent(e);
  }
</script>

<div class="flex items-center justify-between">
  <p>{title}</p>
  <div class="flex flex-col items-end gap-1">
    <div class="flex gap-2">
      {#if !isDefault}
        <Button
          variant="outline"
          size="icon"
          onclick={() => keyHandler.unbindKey(keyHandler.getKeyCombo(actionId))}
        >
          <Undo />
        </Button>
      {/if}
      <Button
        variant="outline"
        class={[
          'flex h-10 w-3xs',
          edit && 'border-primary! text-muted-foreground hover:text-muted-foreground border-4',
          isDefault && 'text-muted-foreground',
        ]}
        onclick={() => {
          lastKeyCombo = '';
          RemapperState.activeEditAction = actionId;
        }}
        onkeydown={handleKeyDown}
      >
        {keyCombo}
      </Button>
    </div>
    {#if edit}
      <p class="text-muted-foreground text-right text-xs leading-none">
        ENTER zum Speichern, ESC zum Abbrechen
      </p>
    {/if}
  </div>
</div>
