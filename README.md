# Intelligent Bistro

## Overview

Intelligent Bistro is an AI-powered restaurant ordering app built with React Native (Expo) and a Node.js backend. Users can browse a multi-cuisine menu, chat with an AI ordering assistant, and get personalized food recommendations based on their current mood. The assistant handles natural-language orders, upsells combo meals, and maintains conversation context across messages.

---

## Features

### Food ordering
- Browse a full restaurant menu with item names, descriptions, prices, and images
- Add, remove, and update items in a persistent cart
- Place orders via a conversational AI chat interface
- View and manage cart with a dedicated cart screen

### Mood-based recommendations
- On first launch, users describe how they're feeling in natural language
- Gemini detects the mood (joyful, comfort, stressed, heartbroken, adventurous, tired, romantic, neutral) and recommends 2–3 menu items whose mood tags match
- The AI opens with a warm, empathetic message tailored to the detected mood

### Conversation history
- The last 6 messages of chat history are sent with every request so the assistant remembers context
- Enables follow-up replies ("yes, add those"), corrections, and multi-turn ordering without repetition

### Combo upselling 
- When a main dish is ordered, the assistant suggests a cuisine-matched drink and side (e.g. Butter Chicken → Garlic Naan + Mango Lassi)
- Upsell is a suggestion only — items are added only when the user confirms
- The assistant recognises affirmative follow-ups ("sure", "yes please", "add those") and acts on them using conversation history

### Multi-cuisine menu — 40+ items
- 40 items across 6 cuisines: American, Indian, Japanese, Greek, French, and Mexican
- Categories: burgers, mains, sides, drinks, desserts
- Every item carries mood tags used for mood-based recommendations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile frontend | React Native 0.81 + Expo 54 (SDK 54) |
| Web frontend | React Native Web via Expo |
| Routing | Expo Router v6 (file-based) |
| Styling | NativeWind v4 (Tailwind CSS for React Native) |
| State management | Zustand v5 |
| Backend | Node.js + Express v5 + TypeScript |
| AI / LLM | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Validation | Zod |
| HTTP client | Axios |

---

## Architecture

### Frontend
- Built with **Expo Router** using a tab-based layout (`app/(tabs)/`)
- Three main tabs: **Menu** (browse & filter), **Chat** (AI ordering assistant), **Cart** (review & checkout)
- A modal screen handles mood capture on first load
- Cart state is managed globally with **Zustand** and shared across all tabs
- `constants/config.ts` holds `API_BASE_URL` so the base URL is changed in one place for local vs. deployed environments

### Backend
- Express server running on port 3000 with three routes:
  - `GET /menu` — returns the full menu JSON
  - `POST /chat` — handles AI ordering; accepts message, cart state, mood, recommended item IDs, and conversation history
  - `POST /mood` — detects mood from free-text input and returns recommended item IDs plus an opening message
- Menu data lives in a static `menu.json` file loaded at startup
- All request bodies are validated with **Zod** schemas before hitting the AI

### AI Layer
- Both `/chat` and `/mood` call **Google Gemini 2.5 Flash** via the `@google/generative-ai` SDK
- The chat prompt injects the full menu JSON, current cart state, mood context, and recent conversation history so Gemini has complete ordering context
- Gemini is instructed to return a strict JSON object (`{ reply, actions }`) with no markdown wrapping — the server parses and forwards this directly to the client
- Cart actions (`add`, `remove`, `update`, `clear`) are applied client-side so the frontend stays authoritative over cart state
- The mood prompt maps free-text feelings to one of 8 canonical moods and cross-references menu item mood tags to surface relevant recommendations

---

## AI Tools Used

- **Claude Code** — primary coding assistant used throughout development for implementing features, debugging, and refining prompts
- **Google Gemini 2.5 Flash** — LLM powering the ordering assistant and mood detection at runtime

---

## Setup Instructions

### Backend setup

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

Start the development server:

```bash
npm run dev
```

The server will be available at `http://localhost:3000`.

### Frontend setup

```bash
cd app
npm install
```

Update `app/constants/config.ts` to point at your backend:

```ts
// For local development on a physical device, use your machine's LAN IP
export const API_BASE_URL = 'http://192.168.x.x:3000';

// For the iOS Simulator / Android Emulator on the same machine
// export const API_BASE_URL = 'http://localhost:3000';
```

Start the Expo dev server:

```bash
npm start        # opens Expo Go menu
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # browser
```

### Environment variables

| Variable | Location | Description |
|---|---|---|
| `GEMINI_API_KEY` | `server/.env` | Google Gemini API key — obtain from [Google AI Studio](https://aistudio.google.com/) |
| `PORT` | `server/.env` | Port the Express server listens on (default: `3000`) |

---

## Prompt Engineering Approach

Two carefully crafted system prompts drive the AI behaviour:

**Chat prompt (`/chat`)**
The prompt injects the full menu JSON, current cart, detected mood, and the last 6 messages of conversation history on every request. Key rules enforced in the prompt:
- Always action whatever can be matched on the menu immediately — never ask for confirmation before adding
- Respect exact quantities stated by the user (e.g. "5 lemonades" → qty 5, not 1)
- Upsell a cuisine-matched combo (one drink + one side) when a main dish is ordered, but only as a suggestion in the reply — never auto-add upsell items
- Detect affirmative follow-ups in conversation history and add the previously suggested upsell items when confirmed
- Reference mood only on the first message; subsequent messages focus purely on the order
- Return a raw JSON object (`{ reply, actions }`) with no markdown — enforced strictly so the server can `JSON.parse` the response directly without cleanup

**Mood prompt (`/mood`)**
A shorter, focused prompt that:
- Distinguishes between a mood/feeling input and a food order or greeting
- Maps any input to exactly one of 8 canonical moods
- Cross-references the menu's `moods` array to pick 2–3 contextually relevant items
- Generates a warm, empathetic opening message that names the recommended dishes
- Falls back gracefully to a neutral welcome message if the API call fails
