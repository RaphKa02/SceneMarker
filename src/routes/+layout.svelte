<script lang="ts">
  import { Toaster } from '$components/ui/sonner';
  import * as Tooltip from '$components/ui/tooltip';
  import { ModeWatcher } from 'mode-watcher';
  import '../app.css';

  const { children } = $props();
</script>

<ModeWatcher defaultMode="system" />
<Toaster />
<Tooltip.Provider delayDuration={400}>
  {@render children?.()}
</Tooltip.Provider>
