<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';

  interface Props {
    value: string;
    open: boolean;
    filename: string;
  }

  let { value = $bindable('#ff0000'), open = $bindable(false), filename }: Props = $props();

  let tempColor = $state(value);
  let pickerRef = $state<HTMLDivElement>();
  let isDragging = $state(false);

  function updateColorFromCoords(clientX: number, clientY: number) {
    if (!pickerRef) return;
    const rect = pickerRef.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    const hue = (angle + 360 + 90) % 360;

    tempColor = `hsl(${hue}, 100%, 50%)`;
  }

  function handlePointerDown(e: PointerEvent) {
    isDragging = true;
    updateColorFromCoords(e.clientX, e.clientY);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    updateColorFromCoords(e.clientX, e.clientY);
  }

  function stopDragging() {
    isDragging = false;
  }

  function confirm() {
    value = tempColor;
    open = false;
  }

  function cancel() {
    tempColor = value;
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[425px]" interactOutsideBehavior="ignore">
    <Dialog.Header>
      <Dialog.Title>Farbe wählen</Dialog.Title>
      <Dialog.Description>
        Wähle eine Farbe, um bei mehreren Videodateien die Szenen unterscheiden zu können
      </Dialog.Description>
      <Dialog.Description>
        Datei: <br />
        {filename}
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col items-center gap-6 py-4">
      <div
        bind:this={pickerRef}
        class="relative h-48 w-48 cursor-crosshair rounded-full border-4 border-white shadow-lg"
        style="background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red);"
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={stopDragging}
        onpointerleave={stopDragging}
      >
        <div
          class="pointer-events-none absolute inset-0 rounded-full border-[12px] border-white/20"
        ></div>
      </div>

      <div class="flex w-full items-center gap-4 px-8">
        <div class="h-12 w-12 rounded-md border shadow-sm" style:background-color={tempColor}></div>
        <div class="flex-1">
          <p class="text-muted-foreground text-sm font-medium">Vorschau</p>
          <code class="text-xs uppercase">{tempColor}</code>
        </div>
      </div>
    </div>

    <Dialog.Footer class="flex gap-2">
      <Button variant="ghost" onclick={cancel}>Abbrechen</Button>
      <Button onclick={confirm}>OK</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
