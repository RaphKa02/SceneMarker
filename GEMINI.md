# Project Context: Scene Marker

## 1. Project Overview

**Scene Marker** is a desktop application for logging, annotating, and organizing video files.

- **Goal:** Allow users to load videos, mark scenes with timestamps/descriptions, and organize them for analysis.
- **Platform:** Native Desktop (Windows/macOS/Linux) via Tauri.

## 2. Tech Stack & Versions

- **Framework:** Svelte 5 (Runes mode).
  - _Critical:_ DO NOT use Svelte 4 `writable` stores or legacy reactivity. Use `$state()`, `$derived()`, and `$effect()`.
- **Language:** TypeScript (`.ts`).
- **Bundler/Router:** SvelteKit (File-based routing, Adapter Static).
- **Styling:** Tailwind CSS v4 + `shadcn-svelte` (built on `bits-ui`).
- **Host/Backend:** Tauri v2 (Rust).
- **Key Libraries:**
  - `svelte-dnd-action`: Drag and drop.
  - `lucide-svelte`: Icons.
  - `svelte-sonner`: Toast notifications.
  - `paneforge`: Resizable panes.

## 3. Architecture

The application follows a standard "Thick Frontend, Thin Backend" approach:

- **Frontend (Svelte):** Handles 95% of the logic, including state management, UI, and business logic.
- **Backend (Rust):** Used strictly for OS-level capabilities (File system access, native dialogs, window management).
- **Communication:** Frontend invokes Rust commands via Tauri's IPC only when necessary.

## 4. Folder Structure

- `src-tauri/`: Rust backend (minimal boilerplate).
- `src/`: Svelte frontend.
  - `src/routes/`: SvelteKit pages (`+page.svelte`, `+layout.svelte`).
  - `src/lib/`:
    - `types.ts`: Centralized TypeScript interfaces.
    - `utils.ts`: Pure helper functions.
    - `components/`:
      - `ui/`: Reusable Shadcn/Bits components (Button, Input, etc.).
      - `[Feature]/`: Custom feature components (e.g., `sidebar/`, `videoPlayer/`).
    - `*.svelte.ts`: Shared state files (e.g., `state.svelte.ts`, `projectManager.svelte.ts`).

## 5. Coding Guidelines & Rules

### Svelte 5 Reactivity (Strict)

- Use **Runes** for all state.
  - ❌ `let count;` (Legacy)
  - ❌ `import { writable } from 'svelte/store'`
  - ✅ `let count = $state(0);`
  - ✅ `let double = $derived(count * 2);`
- Shared state must be encapsulated in `.svelte.ts` files (e.g., `state.svelte.ts`) exporting classes or functions returning reactive objects.

### TypeScript

- Strict typing is required.
- Define interfaces/types in `src/lib/types.ts` and import them.
- Do not use `any`.

### Styling

- Use Tailwind utility classes for layout and spacing.
- Use `shadcn-svelte` components for standard UI elements (Buttons, Inputs, Dialogs).
- Avoid standard CSS in `<style>` blocks unless creating complex custom animations not possible with Tailwind.

### Logic & Modularity

- **Separation of Concerns:** Keep `.svelte` components focused on UI. Move complex logic to `utils.ts` or state classes.
- **Functions:** Prefer Arrow functions (`const myFunc = () => {}`) for callbacks and handlers.
- **PackageManager:** Use pnpm as the PackageManager

## 6. Common Tauri Patterns

If writing a Tauri command invocation, strictly follow Tauri v2 syntax:

```typescript
import { invoke } from '@tauri-apps/api/core'; // Note: v2 import path

async function loadVideo() {
  // Example invocation
  const result = await invoke('my_rust_command', { arg: 'value' });
}
```
