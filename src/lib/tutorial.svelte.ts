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
}

const tutorialElements = new Map<string, HTMLElement>();

const tutorialStages = [
  {
    id: 'main',
    text: 'Danke fürs installieren von SceneMarker. Hier ist eine kleine Tour durch das Programm, um dir die grundlegenden Funktionen zu erklären',
  },
  {
    id: 'create-project-btn',
    text: 'Hier kannst du ein neues Projekt starten, indem du ein Video auswählst',
  },
  {
    id: 'save-project-as-btn',
    text: 'Wenn du das Projekt speichern möchtest, klicke hier und wähle einen Speicherort aus',
  },
  {
    id: 'save-project-btn',
    text: 'Hier kannst du das Projekt auch speichern, wenn es bereits eine Datei zu diesem Projekt gibt, wird der aktuelle Stand in diese geschrieben, anderfalls verhält es sich wie bei "Projekt speichern unter"',
  },
  { id: 'load-project-btn', text: 'Mit diesem Knopf können gespeicherte Projekte geladen werden' },
  {
    id: 'last-projects-btn',
    text: 'Nachdem ein Projekt einmal geladen oder gespeichert wurde, wird es hier angezeigt',
  },
  {
    id: 'add-scene-btn',
    text: "Neue Szenen werden an der aktuellen Videozeit erstellt. In den Einstellungen kann die Zeit um ein paar Sekunden nach hinten gestellt werden. Szenen können mit Drag'n'Drop organisiert und mit einem Doppelklick auf den Titel umbenannt werden",
  },
  {
    id: 'add-group-btn',
    text: 'Szenen können gruppiert werden. Ziehe sie hierfür über den Ordner. Ordner können wie Szenen mit einem Doppelklick auf den Title umbenannt werden',
  },
  {
    id: 'lock-sidebar-btn',
    text: 'Um ein versehentliches Bearbeiten zu verhindern können die Szenen und Ordner gesperrt werden. Sie können dann nicht mehr verschoben und per Doppelklick umbenannt werden',
  },
  { id: 'hide-sidebar-btn', text: 'Blendet die Seitenleiste aus/ein' },
  { id: 'filter-input', text: 'Suche nach Szenen- oder Gruppennamen' },
  {
    id: 'items-area',
    text: 'Hier erscheinen alle Szenen und Gruppen. Ob neue Elemente oben oder unten in der Liste eingefügt werden kann in den einstellungen geändert werden',
  },
  {
    id: 'settings-btn',
    text: 'Wenn du irgendwas ändern möchtest, schaue hier in den Einstellungen nach',
  },
  {
    id: 'tour-btn',
    text: 'Geschafft! Viel Spaß! Falls du die Tour nochmal sehen möchtest klicke hier',
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

  if (element) {
    element.style.zIndex = '1000';
    element.style.pointerEvents = 'none';
    element.tabIndex = -1;
  } else {
    nextStage();
  }
}

function clearCurrent() {
  if (tutorialState.element) {
    tutorialState.element.style.zIndex = 'unset';
    tutorialState.element.style.pointerEvents = 'auto';
    tutorialState.element.tabIndex = 0;
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
