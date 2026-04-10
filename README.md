# Hotel Reservation Assistant

AI-powered hotel assistant with RAG-based Q&A, reservation management, and intelligent tool routing.

```
┌────────────────┐       HTTP/JSON       ┌──────────────────┐
│   Next.js 16   │ ◄──────────────────►  │   FastAPI         │
│   :3000        │                       │   :8000           │
│                │                       │                    │
│  /chat         │                       │  Agent Service     │
│  /bookings     │                       │  ├─ OpenAI (tools) │
│                │                       │  ├─ ChromaDB (RAG) │
└────────────────┘                       │  └─ MongoDB (data) │
                                         └──────────────────┘
```

## Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **MongoDB** running on `localhost:27017`
- **OpenAI API key**

### 1. Backend

```bash
cd hotel-assistant-backend

# Setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env → add your OPENAI_API_KEY

# Run
bash start.sh
# → http://localhost:8000
```

The hotel PDF (`data/hotel_document.pdf`) is auto-indexed on first startup.

### 2. Frontend

```bash
cd hotel-assistant-frontend

# Setup & run
npm install
npm run dev
# → http://localhost:3000
```

### 3. Open the app

Visit **http://localhost:3000** in your browser.

---

## How to Use

### Chat (`/chat`)

Ask the AI assistant anything about the hotel:
- *"What is the famous dish in the hotel?"*
- *"How does the hotel ensure hygiene?"*
- *"What is the cancellation policy?"*

Manage reservations through conversation:
- *"Book a deluxe room for John (john@email.com) from 2025-06-01 to 2025-06-03"*
- *"Show my bookings"* → it will ask for your email
- *"Cancel reservation {id}"*

The sidebar shows your chat history — click any session to resume it.

### Bookings (`/bookings`)

- **View** all reservations in a table (includes bookings made via chat)
- **Create** a new booking with the "New Booking" button
- **View details** by clicking the eye icon
- **Cancel** a booking with the trash icon (with confirmation)

Both pages share the same MongoDB `reservations` collection — changes sync instantly.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| Backend | FastAPI, Python, Uvicorn |
| LLM | OpenAI gpt-5-mini (via LiteLLM) |
| RAG | ChromaDB + all-MiniLM-L6-v2 embeddings |
| Database | MongoDB |
| PDF Parsing | PyMuPDF |

## Key Features

- **RAG Q&A** — Answers grounded in the hotel PDF only, no hallucination
- **Tool Calling** — LLM intelligently routes between document search and reservation actions
- **Persistent Chat** — Sessions stored in MongoDB, survive page refreshes and server restarts
- **Guardrails** — Blocks jailbreak attempts, data exfiltration, and off-topic queries
- **PII Protection** — Guest data redacted in logs, masked in cancel responses
