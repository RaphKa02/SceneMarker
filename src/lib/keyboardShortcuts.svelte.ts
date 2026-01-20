import logger from '$lib/logger';
import { Store } from '@tauri-apps/plugin-store';
import { SvelteMap } from 'svelte/reactivity';

interface Action {
  preventDefault?: boolean;
  action: () => void;
}

class KeyHandler {
  #store = $state<Store>();
  #actions = new SvelteMap<string, Action>();
  #customBindings = new SvelteMap<string, string>();
  #defaultBindings = new SvelteMap<string, string>();

  #disabled = false;

  constructor() {
    $effect.root(() => {
      $effect(() => {
        if (this.#store) {
          this.#store.set('customKeybinds', this.#customBindings);
        }
      });
    });
  }

  async setStore(store: Store) {
    const saved = await store.get('customKeybinds');

    if (saved) this.#customBindings = new SvelteMap(Object.entries(saved));
    this.#store = store;
  }

  normalizeKeyEvent(e: KeyboardEvent) {
    const parts: string[] = [];

    if (e.ctrlKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    if (e.metaKey) parts.push('meta'); // ⌘ on macOS

    if (e.code === 'Space') parts.push('space');
    else if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) parts.push(e.key.toLowerCase());

    return parts.join('+');
  }

  #normalizeKeyCombo(keyCombo: string) {
    return keyCombo.toLowerCase().trim();
  }

  handle(e: KeyboardEvent) {
    if (
      this.#disabled ||
      (e.target instanceof HTMLInputElement && e.target.type === 'text') ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }
    const keyCombo = this.normalizeKeyEvent(e);
    const identifier = this.#customBindings.get(keyCombo) ?? this.#defaultBindings.get(keyCombo);
    if (!identifier) return;

    const action = this.#actions.get(identifier);
    if (!action) return;

    if (action.preventDefault !== false) e.preventDefault();
    action.action();
  }

  registerAction(identifier: string, action: Action | (() => void)) {
    const finalAction: Action =
      typeof action === 'function' ? { preventDefault: true, action } : action;

    if (this.#actions.has(identifier)) {
      logger.warn(`Aktion "${identifier}" wird überschrieben.`);
    }

    this.#actions.set(identifier, finalAction);
  }

  bindKey(keyCombo: string, identifier: string) {
    const normalizedCombo = this.#normalizeKeyCombo(keyCombo);

    if (!this.#actions.has(identifier)) {
      logger.warn('Unbekannte Aktion: ', identifier);
      return;
    }

    this.#customBindings.set(normalizedCombo, identifier);
  }

  unbindKey(keyCombo: string | undefined) {
    if (!keyCombo) return;
    const normalizedCombo = this.#normalizeKeyCombo(keyCombo);
    this.#customBindings.delete(normalizedCombo);
  }

  restoreDefault(identifier: string) {
    for (const [key, value] of this.#customBindings.entries()) {
      if (value === identifier) {
        this.#customBindings.delete(key);
      }
    }
  }

  removeAction(identifier: string) {
    this.#actions.delete(identifier);
  }

  clear() {
    this.#actions.clear();
    this.#customBindings.clear();
  }

  getKeyCombo(actionId: string, beautify?: boolean) {
    for (const [combo, id] of this.#customBindings.entries()) {
      if (id === actionId) {
        return beautify ? combo.toUpperCase().replaceAll('+', ' + ') : combo;
      }
    }
    return this.getDefaultKeyCombo(actionId, beautify);
  }

  getDefaultKeyCombo(actionId: string, beautify?: boolean) {
    for (const [combo, id] of this.#defaultBindings.entries()) {
      if (id === actionId) {
        return beautify ? combo.toUpperCase().replaceAll('+', ' + ') : combo;
      }
    }
    return '';
  }

  setDefaultBindings(bindings: Record<string, string>) {
    this.#defaultBindings = new SvelteMap(
      Object.entries(bindings).map(([k, v]) => [this.#normalizeKeyCombo(k), v])
    );
  }

  disable(disabled: boolean) {
    this.#disabled = disabled;
  }
}

export const keyHandler = new KeyHandler();
