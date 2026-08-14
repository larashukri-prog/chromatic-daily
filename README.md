# Chromatic Daily 

![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Zod Schema](https://img.shields.io/badge/Validation-Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> **A behavioral habit ritual app powered by a daily neuroplasticity memory mechanic.**

---

##  Live Application
 **Experience the Live App:** [chromatic-daily.lovable.app](https://chromatic-daily.lovable.app/)

---

## Project Overview

**Chromatic Daily** transforms daily cognitive habit tracking into an engaging, non-coercive ritual explicitly designed for daily neuroplasticity training. Built as an interactive, code-native prototype, it explores how to bridge behavioral retention loops with deterministic frontend engineering guardrails.

---

## Design System & Architecture

Generative tools and dynamic client states can introduce unpredictability. Chromatic Daily enforces strict design-system contracts and software guardrails to ensure layout stability, high accessibility, and rock-solid state management:

### 1. State Machine-Driven Habit Loops
Rather than relying on happy-path static screens, the daily memory loop is modeled as an explicit state machine:
`idle` → `cue_active` → `observation_phase` → `color_picker_active` → `verification` → `reward_unlocked`
Every state transition is handled deterministically in React to eliminate broken navigation branches or race conditions.

### 2. Schema Validation Contracts (Zod)
All game configuration payloads, active color palettes, and daily streak records pass through rigid **Zod schema contracts**:
* Enforces strict color hex format standards and enum-restricted palette tokens.
* Bounds daily progression states to prevent corrupted streak calculations or unexpected client crashes.

### 3. Design Token & Color Palette Governance
The UI adheres to a disciplined "Management Consultant meets Apple" design system:
* **Token Structure:** Centralized neutral baseline (`#F0D8D8`) paired with explicit active tokens (Red `#FF4444`, Yellow `#FFC047`, Teal `#66E7D7`, etc.).
* **Typography & Layout:** Elegant serif headers combined with high-density sans-serif instructions and crisp visual boundaries.

### 4. Neuroinclusive Motion Budget & Accessibility
Designed for daily use without triggering sensory overload:
* Smooth visual transitions adhere to a strict **motion budget**.
* Honors system `prefers-reduced-motion` flags and maintains WCAG AA/AAA contrast ratios across all daily color modes.

---

## Tech Stack & Tooling

* **Framework:** React 19, TypeScript
* **Styling & Tokens:** Tailwind CSS v4, Lucide React Icons
* **Validation & Types:** Zod, TypeScript Strict Interfaces
* **Build Tooling:** Vite, Bun runtime
* **Pipeline:** Lovable → GitHub Sync

---

## Local Development Setup

To run Chromatic Daily locally:

```bash
# 1. Clone the repository
git clone [https://github.com/chromatikprog/chromatic-daily.git](https://github.com/chromatikprog/chromatic-daily.git)

# 2. Navigate into the directory
cd chromatic-daily

# 3. Install dependencies
bun install   # or npm install

# 4. Start the development server
bun run dev   # or npm run dev
