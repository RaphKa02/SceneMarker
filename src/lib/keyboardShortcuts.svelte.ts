import logger from '$lib/logger';

interface Action {
  preventDefault?: boolean;
  action: () => void;
}

class KeyHandler {
  #actions = new Map<string, Action>();
  #bindings = new Map<string, string>();

  #normalizeKeyEvent(e: KeyboardEvent) {
    const parts: string[] = [];

    if (e.ctrlKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    if (e.metaKey) parts.push('meta'); // ⌘ on macOS

    if (e.code === 'Space') parts.push('space');
    else parts.push(e.key.toLowerCase());

    return parts.join('+');
  }

  #normalizeKeyCombo(keyCombo: string) {
    return keyCombo.toLowerCase().trim();
  }

  handle(e: KeyboardEvent) {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }
    const keyCombo = this.#normalizeKeyEvent(e);
    const identifier = this.#bindings.get(keyCombo);
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

    this.#bindings.set(normalizedCombo, identifier);
  }

  unbindKey(keyCombo: string) {
    const normalizedCombo = this.#normalizeKeyCombo(keyCombo);
    this.#bindings.delete(normalizedCombo);
  }

  removeAction(identifier: string) {
    this.#actions.delete(identifier);
    for (const [combo, id] of this.#bindings.entries()) {
      if (id === identifier) {
        this.#bindings.delete(combo);
      }
    }
  }

  clear() {
    this.#actions.clear();
    this.#bindings.clear();
  }

  getBindings() {
    return Object.fromEntries(this.#bindings);
  }

  setBindings(bindings: Record<string, string>) {
    this.#bindings = new Map(
      Object.entries(bindings).map(([k, v]) => [this.#normalizeKeyCombo(k), v])
    );
  }
}

export const keyHandler = new KeyHandler();
