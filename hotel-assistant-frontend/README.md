# Hotel Reservation Assistant - Frontend

Next.js chat interface and bookings management for the AI-powered hotel assistant.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | App Router, SSR/SSG |
| **React 19** | UI rendering |
| **Tailwind CSS v4** | Utility-first styling, amber/gold hotel theme |
| **shadcn/ui** | Pre-built accessible components |
| **react-markdown** | Render AI responses with formatting |
| **localStorage** | Session persistence across page refreshes |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with feature cards |
| `/chat` | Chat UI with session sidebar, markdown rendering, tool badges |
| `/bookings` | Reservation table with create/view/cancel actions |

## Setup

```bash
cd hotel-assistant-frontend
npm install
npm run dev
# Runs at http://localhost:3000
```

## Configuration

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Architecture

- **Chat page** — Session sidebar (list/load/delete), real-time messaging, localStorage session persistence, tool-usage badges
- **Bookings page** — Full CRUD table, create dialog with form validation, view detail modal, cancel with confirmation
- **Shared data** — Both chat reservations and UI reservations hit the same MongoDB collection, so they're always in sync
- **No auth** — Super user model matching the backend POC scope
