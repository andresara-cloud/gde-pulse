# GDE Pulse (`gde.web.app` & `gpulse.web.app`)

Interactive Live Workshop Quiz & Optional DevFest / Build with AI Travel Planner for **Google Developer Experts**.

## Features

- **⚡ GDE Pulse Live Workshop Quiz (`src/pulseQuiz.ts`)**
  - **Quiz Configurator**: Create multiple-choice workshop quizzes with per-question countdown timers (`5s`, `10s`, `15s`, `30s`, `45s`, `60s`) and optional question illustrations.
  - **Live Stage Controller (`gde.web.app`)**: Open the workshop lobby queue, display the workshop code on stage, launch timed questions, reveal answers, and celebrate the final podium.
  - **Participant Portal (`gpulse.web.app`)**: Code-gated 1-tap attendee entry with a live waiting queue, comedic random name generator, real-time countdown bar, and speed-based scoring.
- **✈️ Optional GDE Travel Planner (`src/travelPlanner.ts`)**
  - Toggleable module for tracking speaking engagements, WorkTrips approval checklists, regional funding caps, Sessionize speaker sync, and AES-256-GCM encrypted Advocu activity reporting.

## Environment Setup (No API Keys in Source)

Copy `.env.example` to `.env.local` and supply your Firebase web configuration:

```bash
cp .env.example .env.local
```

Run tests and build:

```bash
npm test
npm run build
```

## Android Installation Guide

GDE Pulse ships as an installable Progressive Web App (PWA) so GDEs get a standalone home-screen app without sideloading an APK:

1. Open [gde.web.app](https://gde.web.app) (or [gpulse.web.app](https://gpulse.web.app) for quiz participants) in **Chrome on Android**.
2. Tap the browser menu (**⋮**) in the top-right corner.
3. Tap **Add to Home screen** / **Install app** and confirm.
4. Launch **GDE Pulse** from your Android home screen or app drawer.

## Open Source & Contributing

Source code is open under the [MIT License](./LICENSE) at [github.com/andresara-cloud/gde-pulse](https://github.com/andresara-cloud/gde-pulse). Fork the repository, create a feature branch, run `npm test`, and open a pull request to contribute.

