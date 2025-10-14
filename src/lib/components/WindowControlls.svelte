<script lang="ts">
  import { Button } from '$components/ui/button';
  import Minus from '@lucide/svelte/icons/minus';
  import Square from '@lucide/svelte/icons/square';
  import X from '@lucide/svelte/icons/x';
  import { getCurrentWindow } from '@tauri-apps/api/window';
</script>

<div class="fixed top-0 right-0 flex gap-2 p-2">
  <Button
    tabindex={-1}
    variant="outline"
    size="icon"
    onclick={() => {
      getCurrentWindow().minimize();
    }}
  >
    <Minus />
  </Button>
  <Button
    tabindex={-1}
    variant="outline"
    size="icon"
    onclick={() => {
      getCurrentWindow().toggleMaximize();
    }}
  >
    <Square />
  </Button>
  <Button
    tabindex={-1}
    variant="outline"
    size="icon"
    onclick={() => {
      getCurrentWindow().close();
    }}
  >
    <X />
  </Button>
</div>
