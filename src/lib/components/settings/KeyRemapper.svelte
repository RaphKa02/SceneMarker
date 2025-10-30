<script lang="ts">
  import { Button } from '$components/ui/button';
  import { trackEvent } from '$lib/analytics';
  import { keyHandler } from '$lib/keyboardShortcuts.svelte';
  import Undo from '@lucide/svelte/icons/undo';

  interface Props {
    title: string;
    actionId: string;
  }

  const { title, actionId }: Props = $props();

  let edit = $state(false);
  let lastKeyCombo = $state('');

  const isDefault = $derived(
    keyHandler.getKeyCombo(actionId) === keyHandler.getDefaultKeyCombo(actionId)
  );

  const keyCombo = $derived(edit ? lastKeyCombo : keyHandler.getKeyCombo(actionId, true));

  function handleKeyDown(e: KeyboardEvent) {
    if (!edit) return;
    e.preventDefault();

    if (e.key === 'Enter') {
      edit = false;
      keyHandler.unbindKey(keyHandler.getKeyCombo(actionId));
      keyHandler.bindKey(lastKeyCombo, actionId);

      trackEvent(`key-combo_${actionId}_changed`, { keyCombo: lastKeyCombo });
      return;
    }

    lastKeyCombo = keyHandler.normalizeKeyEvent(e);
  }
</script>

<div class="flex items-center justify-between">
  <p>{title}</p>
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
        edit = true;
      }}
      onkeydown={handleKeyDown}
    >
      {keyCombo}
    </Button>
  </div>
</div>
