# 🎬 SceneMarker

![Version](https://img.shields.io/badge/version-1.1.3-blue)
![License](https://img.shields.io/badge/license-GPL_3.0-green)
![Platform](https://img.shields.io/badge/platform-Windows-blue)

> **Professionelle Video-Analyse für Handballtrainer**

Eine moderne Desktop-Anwendung zur Markierung und Verwaltung von Spielszenen in Trainingsvideos. Entwickelt für Windows mit Tauri 2, Svelte 5 und Tailwind CSS.

---

## ✨ Features

### 🎥 Video-Verwaltung

- Unterstützung für MP4, MKV, AVI, MOV und WebM
- Flüssige Wiedergabe mit nativen HTML5 Video-Element
- Präzise Zeitsteuerung und Sprungfunktionen
- Fullscreen-Modus für Präsentationen

### 📍 Szenenmanagement

- Szenen mit Zeitstempel und Titel markieren
- Szenen in Kategorien organisieren (z.B. Angriff, Abwehr) (bald)
- Drag & Drop zum Umorganisieren (bald)
- Direkte Sprungmarken zu jeder Szene
- Suchfunktion für schnellen Zugriff

### 💾 Projekt-Speicherung

- JSON-basierte Projektdateien (.smp)
- Automatische Änderungserkennung
- Schnellspeichern mit Strg+S

### ⌨️ Tastenkürzel

| Kürzel             | Funktion         |
| ------------------ | ---------------- |
| `Strg + S`         | Schnellspeichern |
| `Strg + Shift + S` | Speichern unter  |
| `Strg + O`         | Projekt öffnen   |
| `Strg + Shift + O` | Video öffnen     |
| `Leertaste`        | Play/Pause       |
| `←` / `→`          | ±5 Sekunden      |

---

## 🚀 Installation

### Voraussetzungen

- **Node.js** (v18 oder höher)
- **Rust** (v1.70 oder höher)
- **Windows 10/11**

### Setup

```bash
# Repository klonen
git clone https://gitlab.karl-raphael.de/raphael/scene-marker.git
cd scene-marker

# Dependencies installieren
pnpm install

# Entwicklungsserver starten
pnpm run tauri dev
```

### Build

```bash
# Production Build erstellen
pnpm run tauri build

# Ausgabe: src-tauri/target/release/scene-marker.exe
```

---

## 📖 Verwendung

### 1. Video laden

- Klicke auf **"Video öffnen"** oder drücke `Strg + Shift + O`
- Wähle eine lokale Videodatei aus

### 2. Szenen markieren

- Navigiere zur gewünschten Position im Video
- Klicke auf **"Szene speichern"**
- Benenne die Szene um (optional)

### 3. Szenen organisieren

- Ziehe Szenen per Drag & Drop in Kategorien
- Nutze die Suchfunktion zum Filtern
- Klicke auf eine Szene, um direkt dorthin zu springen

### 4. Projekt speichern

- `Strg + S` für Schnellspeichern
- `Strg + Shift + S` für "Speichern unter"
- Projektdateien haben die Endung `.smp`

---

## 🏗️ Technologie-Stack

| Technologie                                   | Version | Verwendung         |
| --------------------------------------------- | ------- | ------------------ |
| [Tauri 2](https://v2.tauri.app/)              | 2.0     | Desktop-Framework  |
| [Svelte 5](https://svelte.dev/)               | 5.0     | Frontend-Framework |
| [TypeScript](https://www.typescriptlang.org/) | 5.3     | Type Safety        |
| [Tailwind CSS](https://tailwindcss.com/)      | 3.4     | Styling            |
| [Vite](https://vitejs.dev/)                   | 5.0     | Build Tool         |
| [Rust](https://www.rust-lang.org/)            | 1.70+   | Backend            |

---

## 📝 Lizenz

Dieses Projekt ist unter der GLP 3.0 Lizenz lizenziert.

---

## 👤 Autor

Entwickelt für Handballtrainer zur effizienten Videoanalyse im Training.

---

## 🙏 Danksagungen

- [Tauri Team](https://tauri.app/) für das fantastische Framework
- [Svelte Team](https://svelte.dev/) für das reaktive UI-Framework
- [Tailwind Labs](https://tailwindcss.com/) für das Utility-First CSS Framework

---

**⭐ Gefällt dir das Projekt? Gib ihm einen Star!**
