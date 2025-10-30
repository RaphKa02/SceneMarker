import { appState } from '$lib/state.svelte';
import type { Action } from 'svelte/action';

interface TutorialState {
  stageNumber: number;
  stageCount: number;
  active: boolean;
  element: HTMLElement | undefined;
  stage: { id: string; text: string } | undefined;
  firstStage: boolean;
  lastStage: boolean;
  originalStyles?: {
    zIndex: string;
    pointerEvents: string;
    tabIndex: number;
    outline: string;
    boxShadow: string;
  };
}

const tutorialElements = new Map<string, HTMLElement>();

const tutorialStages = [
  {
    id: 'main',
    text: 'Danke, dass du SceneMarker installiert hast! Hier ist eine kurze Tour, um dir die wichtigsten Funktionen zu zeigen.',
  },
  {
    id: 'create-project-btn',
    text: 'Hier kannst du ein neues Projekt starten, indem du ein Video auswählst.',
  },
  {
    id: 'save-project-as-btn',
    text: 'Wenn du dein Projekt speichern möchtest, klicke hier und wähle einen Speicherort aus.',
  },
  {
    id: 'save-project-btn',
    text: 'Mit diesem Knopf kannst du dein Projekt schnell speichern. Wenn es bereits eine Datei gibt, wird der aktuelle Stand dort gespeichert - sonst öffnet sich der „Speichern unter“-Dialog.',
  },
  {
    id: 'load-project-btn',
    text: 'Hier kannst du ein zuvor gespeichertes Projekt wieder laden.',
  },
  {
    id: 'last-projects-btn',
    text: 'Zuletzt geöffnete Projekte erscheinen hier, damit du sie schnell wieder öffnen kannst.',
  },
  {
    id: 'add-scene-btn',
    text: "Mit diesem Knopf erstellst du eine neue Szene an der aktuellen Videoposition. In den Einstellungen kannst du festlegen, ob die Zeit automatisch ein paar Sekunden nach hinten verschoben wird. Szenen lassen sich per Drag'n'Drop sortieren und per Doppelklick umbenennen.",
  },
  {
    id: 'add-group-btn',
    text: 'Hier kannst du Ordner anlegen, um Szenen zu gruppieren. Zieh einfach eine Szene auf den Ordner, um sie dort abzulegen. Ordner kannst du ebenfalls per Doppelklick umbenennen.',
  },
  {
    id: 'lock-sidebar-btn',
    text: 'Wenn du vermeiden willst, dass du Szenen oder Ordner aus Versehen verschiebst oder umbenennst, kannst du sie hier sperren.',
  },
  {
    id: 'hide-sidebar-btn',
    text: 'Blende die Seitenleiste hier ein oder aus.',
  },
  {
    id: 'filter-input',
    text: 'Suche hier nach Szenen- oder Ordnernamen, um schneller zu finden, was du suchst.',
  },
  {
    id: 'items-area',
    text: 'In diesem Bereich siehst du alle deine Szenen und Gruppen. Ob neue Elemente oben oder unten eingefügt werden, kannst du in den Einstellungen festlegen.',
  },
  {
    id: 'settings-btn',
    text: 'Wenn du etwas anpassen möchtest - z. B. Tastenkürzel, Design oder Verhalten - findest du alles hier in den Einstellungen.',
  },
  {
    id: 'tour-btn',
    text: 'Geschafft! Viel Spaß mit SceneMarker! Wenn du die Tour später nochmal sehen möchtest, klicke einfach hier.',
  },
] as const;

export let tutorialState = $state<TutorialState>({
  stageNumber: -1,
  stageCount: tutorialStages.length,
  active: false,
  element: undefined,
  stage: undefined,
  firstStage: true,
  lastStage: true,
});

export const tutorialElement: Action<HTMLElement, { id: string }> = (node, params) => {
  tutorialElements.set(params.id, node);
};

export const startTutorial = () => {
  tutorialState.active = true;
  tutorialState.stageNumber = 0;

  handleStage();
};

export const stopTutorial = () => {
  clearCurrent();
  tutorialState.active = false;
  appState.uiState.tutorialShown = true;
};

function handleStage() {
  if (tutorialState.stageNumber === -1) return;

  tutorialState.firstStage = tutorialState.stageNumber === 0;
  tutorialState.lastStage = tutorialState.stageNumber >= tutorialStages.length - 1;

  tutorialState.stage = tutorialStages[tutorialState.stageNumber];
  const element = tutorialElements.get(tutorialState.stage.id);
  tutorialState.element = element;

  if (!element) {
    nextStage();
    return;
  }

  tutorialState.originalStyles = {
    zIndex: element.style.zIndex,
    pointerEvents: element.style.pointerEvents,
    outline: element.style.outline,
    boxShadow: element.style.boxShadow,
    tabIndex: element.tabIndex,
  };

  element.style.zIndex = '1000';
  element.style.pointerEvents = 'none';
  element.tabIndex = -1;
  element.style.outline = '3px solid #FFD600';
  element.style.boxShadow = '0 0 0 5px rgba(255, 214, 0, 0.5), 0 4px 20px 2px rgba(0,0,0,0.18)';
}

function clearCurrent() {
  if (tutorialState.element && tutorialState.originalStyles) {
    tutorialState.element.style.zIndex = tutorialState.originalStyles.zIndex;
    tutorialState.element.style.pointerEvents = tutorialState.originalStyles.pointerEvents;
    tutorialState.element.tabIndex = tutorialState.originalStyles.tabIndex;
    tutorialState.element.style.boxShadow = tutorialState.originalStyles.boxShadow;
    tutorialState.element.style.outline = tutorialState.originalStyles.outline;
  }
}

export const nextStage = () => {
  if (tutorialState.lastStage) {
    stopTutorial();
    return;
  }
  clearCurrent();
  tutorialState.stageNumber++;
  handleStage();
};

export const previousStage = () => {
  clearCurrent();
  tutorialState.stageNumber--;
  handleStage();
};
