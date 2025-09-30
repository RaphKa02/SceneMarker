# SceneMarker - Requirements

## 1. Ziel

Entwicklung einer **lokalen Desktop-Anwendung** für Windows, mit der ein Handballtrainer heruntergeladene Spielvideos abspielen und analysieren kann. Die Anwendung ermöglicht es, **Szenen zu markieren, zu benennen, zu gruppieren und direkt per Klick anzusteuern**. Ziel ist ein **einfach zu bedienendes, modernes Interface**, das auf Laptops im Training genutzt werden kann.

## 2. Hauptfunktionen

### 2.1 Videoverwaltung

- Nutzer kann über einen **Dateidialog** ein lokales Videofile (z. B. MP4) auswählen und laden.
- Das Video wird im **zentralen Player-Bereich** angezeigt.
- Es können mehrere Projekte gespeichert/geladen werden (Projektdatei enthält: Videopfad + Szenenliste).

### 2.2 Video-Playback

- Klassische **Kontrollleiste unter dem Video**:
  - Play / Pause
  - Zeitachse (Playhead, scrubbable)
  - Aktuelle Zeit / Gesamtdauer Anzeige

- **Sprung-Buttons**: vor/zurück um 1, 3, 5, 10, 60 Sekunden.
- Lautstärkeregelung + Mute.
- Optional: Fullscreen-Modus.

### 2.3 Szenenmanagement

- **Szenen hinzufügen**:
  - Button „Szene speichern“ → aktuelle Videoposition wird mit Titel gespeichert.
  - Titel-Eingabe über Dialog oder Inline-Edit.

- **Szenen bearbeiten**:
  - Titel ändern.
  - Startzeit anpassen (z. B. durch Übernehmen der aktuellen Videoposition).

- **Szenen löschen**: Eintrag in der Liste entfernen.
- **Szenenliste in Sidebar**:
  - Rechts neben dem Video.
  - Jede Szene als klickbarer Button (Titel + Zeitcode).
  - Klick → Video springt direkt zu dieser Position.

- Szenenliste scrollbar, mit Suchfeld und optionalen Kategorien/Ordnern.

### 2.4 Speicherung

- Szenen werden in einer **Projektdatei (JSON)** gespeichert.
- Beispiel:

```json
{
  "videoPath": "C:/Videos/spiel1.mp4",
  "scenes": [
    { "title": "Anwurf", "time": 0 },
    { "title": "Gegenstoß 1. Halbzeit", "time": 120 }
  ]
}
```

- Laden & Speichern von Projekten über Menü.

## 3. Benutzeroberfläche

### 3.1 Layout

- **Flex-Layout (Tailwind CSS)**
  - Linke Seite: Videoplayer (groß, responsive, mit Kontrollleiste unten).
  - Rechte Seite: Sidebar mit Szenenliste, Kategorien, Buttons.

- Dunkles UI (Dark Mode by default).
- Abgerundete Kanten, sanfte Schatten, moderne Buttons.

### 3.2 Bedienung

- Hauptnavigation minimal (nur „Video öffnen“, „Projekt speichern“, „Projekt laden“).
- Fokussiert auf **große Videofläche** + **einfache Szenensteuerung**.

## 4. Technische Anforderungen

### 4.1 Frameworks

- **UI:** [Svelte 5](https://svelte.dev/) (TypeScript) + [Tailwind CSS](https://tailwindcss.com/) für Styling.
- **Desktop:** [Tauri 2](https://v2.tauri.app/) als Container, offline unter Windows.
- **Build & Dev:** [Vite](https://vitejs.dev/) als Bundler/Dev-Server.

### 4.2 Video-Handling

- Nutzung des nativen `<video>`-Elements (Chromium in Electron).
- Unterstützt MP4 (H.264) als Standardformat.
- Direktes Springen via `video.currentTime`.
- Performance: flüssige Sprünge (Keyframe-optimiertes Video empfohlen).

### 4.3 Dateiverwaltung

- Dateidialog via Tauri.
- Projekt-Speicherung als JSON auf dem Dateisystem.
- Persistenz zwischen Sessions (letztes Projekt wird automatisch geladen).

## 5. Erweiterungen (optional)

- Kategorien / Ordner für Szenen (z. B. Angriff, Abwehr, Umschalten).
- Exportfunktion für Clips (via FFMPEG).
- Multi-Video Projekte (z. B. Hin- und Rückspiel).
- Hotkeys:
  - Space = Play/Pause
  - Pfeiltasten = ±5s
  - Customizable Shortcuts.

## 6. Nicht-Funktionen

- Keine Cloud / kein Online-Upload.
- Keine komplexe Videoanalyse (z. B. Zeichnen, Tracking).
- Keine Streaming-Unterstützung (nur lokale Files).

## 7. Zielumgebung

- **Windows 10/11 Laptop**, mind. 8 GB RAM.
- Lokale Videos (MP4, max. 1080p empfohlen).
