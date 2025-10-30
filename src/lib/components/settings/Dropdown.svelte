<script lang="ts">
  import * as Select from '$components/ui/select';

  interface Props {
    items: { value: string; label: string; disabled?: boolean }[];
    value?: string;
    onValueChange?: (value: string) => void;
  }

  let { items, value = $bindable(), onValueChange }: Props = $props();

  const triggerContent = $derived(items.find((item) => item.value === value)?.label);
</script>

<Select.Root type="single" bind:value {onValueChange}>
  <Select.Trigger class="min-w-2xs">{triggerContent}</Select.Trigger>
  <Select.Content preventScroll>
    <Select.Group>
      {#each items as item (item.value)}
        <Select.Item value={item.value} label={item.label} disabled={item.disabled}>
          {item.label}
        </Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
