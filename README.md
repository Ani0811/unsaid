# Unsaid 💭

> **“A private place for the things you don't know how to say out loud.”**

Built for the **Hacktoberfest 2026 DEV Weekend Challenge: “Build for a Friend.”**

---

## What is Unsaid?

We all have conversations that linger in our heads—things we wish we had said, thoughts that feel too chaotic to put into words, or feelings we aren't ready to share with anyone yet. 

**Unsaid** is a local-first personal reflection and conversation application. It offers a calm, private digital room to:
- **TALK** through something weighing on your mind without unsolicited advice.
- **UNLOAD** raw, messy thoughts without any expectation of solving or fixing them.
- **UNSAID** explore words you wish you could say to another person, separating what you feel from assumptions about what they might think.

The AI runs **entirely on your own computer** through **LM Studio** using open **Gemma** models.

---

## Why Local AI?

The thoughts we hesitate to say out loud are often our most vulnerable reflections. Sending them to a cloud AI SaaS platform means trusting third-party servers, opaque telemetry pipelines, model training regimes, and centralized data stores.

Unsaid is designed around a single non-negotiable principle:

> **Private by design. Your reflections stay on this device.**

- **No accounts or sign-ups**
- **No cloud databases**
- **No telemetry or analytics tracking**
- **No remote AI API calls**
- **Local persistence via your browser's private `localStorage`**
- **One-click "Delete all local data"** purge

Your words never leave your hardware.

---

## Architecture

```text
┌────────────────────────────────────────────────────────┐
│                        Unsaid                          │
│               React 19 + TypeScript + Vite             │
│                                                        │
│     ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│     │  TALK Mode   │  │ UNLOAD Mode  │  │UNSAID Mode│  │
│     └──────────────┘  └──────────────┘  └───────────┘  │
│                                                        │
│            Browser localStorage (Local Only)           │
│            Modular Safety & Grounding Layer            │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ Local HTTP / REST
                            ▼
┌────────────────────────────────────────────────────────┐
│                      LM Studio                         │
│            OpenAI-Compatible Local Endpoint            │
│                 http://localhost:1234/v1               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Open Gemma Model                     │
│    (e.g., gemma-2-2b-it, gemma-2-9b-it, gemma-3-1b)   │
└────────────────────────────────────────────────────────┘
```

---

## Core Modes

### 1. TALK — *Say what's on your mind.*
The normal conversational mode. Unsaid acts as a gentle, grounded listener. It acknowledges what you are experiencing, asks gentle clarifying questions, and respects uncertainty. It intentionally avoids jumping to quick fixes, action items, or clinical labels.

### 2. UNLOAD — *Get it out without needing to solve it.*
Designed for when your mind is buzzing with overwhelm, frustration, or chaos. Unsaid serves as a quiet, safe container. It reflects core themes and holds space, explicitly refusing to give 5-step advice lists or unsolicited solutions.

### 3. UNSAID — *Explore what you wish you could say.*
The distinctive reflection mode for unspoken words meant for a friend, partner, parent, coworker, or estranged person. Unsaid helps you:
- Clarify what you truly wish the other person understood.
- Distinguish concrete facts from assumptions.
- Turn raw emotion into honest, authentic expression.
- **Critical rule:** It will never pretend to know what the other person secretly thinks or feels (e.g. *"We don't know how they would respond, but it sounds like you wish they knew how much the friendship meant to you"*).

---

## Modular Safety Layer

Unsaid includes a dedicated safety detector (`src/safety/detector.ts`). If input indicates imminent crisis, suicidal thoughts, or immediate self-harm:
- Normal AI conversational generation is immediately halted.
- A compassionate safety card is presented with immediate, actionable steps (moving away from harmful items, contacting trusted people nearby).
- Direct access to free 24/7 crisis resources (e.g., **988 Lifeline**, **Crisis Text Line**, NHS 111, and international directories via [findahelpline.com](https://findahelpline.com)).

---

## Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)
2. **LM Studio** ([lmstudio.ai](https://lmstudio.ai))
3. An open **Gemma** model downloaded in LM Studio (recommended: `gemma-2-2b-it` or `gemma-2-9b-it`)

---

### Step-by-Step Setup

#### 1. Clone the repository
```bash
git clone https://github.com/your-username/unsaid.git
cd unsaid
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Start LM Studio & Load Gemma
1. Open **LM Studio**.
2. Search for and download **Gemma 2** (e.g., `google/gemma-2-2b-it-GGUF` or `gemma-2-9b-it-GGUF`).
3. Navigate to the **Local Server** tab (the `<->` icon on the left bar).
4. Select your loaded Gemma model at the top.
5. Click **Start Server** (default port: `1234`, endpoint: `http://localhost:1234/v1`).
6. *Ensure "CORS" is toggled ON in LM Studio server settings (or rely on Unsaid's built-in dev proxy).*

#### 4. Run Unsaid locally
```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

#### 5. Verify Local AI Connection
- Look at the top-right connection badge:
  - **● Local AI connected (Gemma · LM Studio)**
- If offline, click **Test Connection** or adjust settings in the Settings dialog (gear icon).

*(Note: Unsaid also includes an optional "Offline Preview Simulator" in Settings so you can test all 3 modes and the complete UI flow even before downloading a model).*

---

## Configuration

Unsaid works out-of-the-box with default LM Studio settings. You can optionally configure settings via `.env` or directly in the UI Settings modal:

```env
# LM Studio OpenAI-compatible endpoint
VITE_LM_STUDIO_BASE_URL=http://localhost:1234/v1

# Optional specific model identifier (leave blank to auto-detect loaded model)
VITE_LM_STUDIO_MODEL=
```

---

## Important Positioning & Limitations

- **Not medical care:** Unsaid is **not** an AI therapist, counselor, psychologist, medical application, or diagnostic system.
- **No diagnosis:** Unsaid will never diagnose mental health conditions or issue clinical evaluations.
- **Reflection, not authority:** Unsaid is an automated companion to help you organize your own thoughts before you decide how to act in your real life.

---

## License

MIT License. Built with ❤️ for friends who need a safe place for the things left unsaid.
