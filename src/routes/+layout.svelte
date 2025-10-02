<script lang="ts">
  import { Toaster } from '$components/ui/sonner';
  import { ModeWatcher } from 'mode-watcher';
  import '../app.css';

  const { children } = $props();
</script>

<ModeWatcher defaultMode="system" />
<Toaster />
{@render children?.()}
