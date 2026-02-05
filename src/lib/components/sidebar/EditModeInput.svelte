<script lang="ts">
  import { Button } from '$components/ui/button';
  import { stopPropagation } from '$utils';
  import { tick } from 'svelte';

  interface Props {
    value: string;
    onSave: () => void;
    onCancel: () => void;
  }

  let { value = $bindable(), onSave, onCancel }: Props = $props();

  let inputRef = $state<HTMLInputElement | null>(null);

  $effect(() => {
    tick().then(() => {
      inputRef?.focus();
      inputRef?.select();
      inputRef?.scrollIntoView({ behavior: 'smooth' });
    });
  });
</script>

<div class="space-y-2">
  <input
    type="text"
    bind:this={inputRef}
    bind:value
    onkeydown={(e) => {
      e.stopPropagation();
      if (e.key === 'Enter') onSave();
      if (e.key === 'Escape') onCancel();
    }}
    class="border-border bg-input focus:border-primary w-full rounded border px-2 py-1 text-sm focus:outline-none"
  />
  <div class="flex gap-2">
    <Button onclick={stopPropagation(onSave)} class="flex-1">Speichern</Button>
    <Button variant="outline" onclick={stopPropagation(onCancel)} class="flex-1">Abbrechen</Button>
  </div>
</div>
