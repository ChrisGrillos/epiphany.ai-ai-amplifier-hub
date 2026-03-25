# Epiphany.AI — AI Amplifier Hub

**An AI productivity platform that gives you persistent memory, multi-model orchestration, and context management across every AI tool you use.**

Epiphany.AI solves the core problem with AI assistants: they forget everything. Every new conversation starts from zero. Your insights, decisions, and context evaporate between sessions.

The Amplifier Hub fixes this with **Vaults** — persistent workspaces that maintain a Living Summary of your ongoing projects. When you switch between Claude, GPT, Grok, or any other AI, your context travels with you.

---

## What It Does

**Vaults** — Organized workspaces for each project, client, or research thread. Each vault maintains its own Living Summary that accumulates knowledge across sessions.

**Living Summary** — An AI-maintained document that captures decisions, facts, open questions, and next actions from every session. Updated through a human-in-the-loop synthesis step — the AI proposes changes, you review and approve.

**Multi-Model Orchestration** — Route prompts to Grok, OpenAI, Anthropic, or any OpenAI-compatible endpoint. API keys are encrypted per-user with AES-256-GCM on the server. No keys stored in the browser.

**Epi (Concierge Intelligence)** — A coordination layer with four escalating autonomy levels:
- **Level 1**: Silent — just context management
- **Level 2**: Reactive — responds when asked, parses pasted conversations
- **Level 3**: Proactive — suggests workflows, analyzes vault health, provides context packs
- **Level 4**: Autonomous — nudges, auto-saves sessions, runs Guardian checks

**Guardian** — Contradiction and quality checker that scans your Living Summary for stale actions, conflicting decisions, and unresolved questions.

**Multi-Agent Sessions** — Run multiple AI agents in parallel on the same problem with configurable personalities and a loop detector that breaks circular reasoning.

**Cross-Model Merge** — Send the same prompt to multiple LLM providers simultaneously and merge their responses.

**Bridge Conversations** — Import conversations from ChatGPT, Claude, or Grok and synthesize them into your vault's Living Summary.

**References** — Attach documents and files to vaults. The AI can propose edits to reference files with diff review.

**Workflows** — Build multi-step AI workflows with configurable steps and auto-delegation.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Frontend (React + Vite)         │
│                                                    │
│  Home.jsx ─── VaultSidebar ─── ChatInput          │
│     │              │               │               │
│     ├── Epi ───── Guardian ─── SessionManager     │
│     ├── MultiAgent (AgentBus + LoopDetector)      │
│     ├── CrossModelMerge                           │
│     ├── Workflows                                 │
│     └── Social / Bridge / References              │
└──────────────────┬───────────────────────────────┘
                   │
            Base44 Platform
                   │
┌──────────────────┴───────────────────────────────┐
│              Server Functions (Deno)              │
│                                                    │
│  llmProxy.ts ─── AES-GCM key encryption          │
│       │          Multi-provider LLM routing       │
│       │          (Grok, OpenAI, Anthropic, Custom)│
│       │                                           │
│  entityGuard.ts ─ Ownership enforcement           │
│                   Cross-user read prevention      │
└──────────────────────────────────────────────────┘
```

**Key design decisions:**

- API keys never touch the browser. All LLM calls route through `llmProxy.ts` which decrypts keys server-side.
- Entity ownership is enforced at two levels: Base44's built-in `created_by` scoping and an explicit `entityGuard.ts` audit layer.
- The Living Summary uses human-in-the-loop synthesis — the AI proposes, you review a diff, then accept or reject. No silent overwrites.
- Multi-agent sessions use an in-browser message bus with a Jaccard similarity-based loop detector that injects circuit-breaker prompts when agents start repeating themselves.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| State | TanStack Query (React Query) |
| Backend | Base44 (entities, auth, serverless functions) |
| Server Functions | Deno (TypeScript) |
| LLM Providers | Grok (xAI), OpenAI (GPT-4o), Anthropic (Claude), Custom |
| Encryption | AES-256-GCM, PBKDF2 key derivation (Web Crypto API) |

---

## Current Status
✅ God-component refactor complete (Home.jsx is now a thin orchestrator)  
Core systems (Vaults, Epi, Guardian, multi-agent loops, Living Summaries) are modular and working.    
Still polishing edge cases and adding tests — actively fixing as I go. Next: full test suite + relay-node integration sketch.

## Quick Start

### Prerequisites

- Node.js 18+
- A [Base44](https://base44.com) account (free tier works)

### Install

```bash
git clone https://github.com/ChrisGrillos/epiphany.ai-ai-amplifier-hub.git
cd epiphany.ai-ai-amplifier-hub
npm install
```

### Configure

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Base44 app credentials (from your Base44 dashboard):

```env
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app-name.base44.app
```

### Create Base44 Entities

In your Base44 app dashboard, create the entities listed in [SETUP.md](./SETUP.md).

### Deploy Server Functions

Upload the two files from `functions/` to your Base44 app's serverless functions:

- `llmProxy.ts` → function name: `llmProxy`
- `entityGuard.ts` → function name: `entityGuard`

### Run

```bash
npm run dev
```

Open `http://localhost:5173`

---

## Usage

1. **Create a Vault** — each vault is a workspace for a project
2. **Chat** — messages route through the secure LLM proxy
3. **End session** — triggers synthesis, proposing updates to your Living Summary
4. **Review** — accept or reject the proposed summary changes
5. **Attach references** — documents get injected into LLM context
6. **Switch models** — configure API keys in settings, choose your provider
7. **Use Epi** — switch to the Epi tab for context packs, vault health, and conversation condensing

---

## Project Structure

```
src/
├── pages/Home.jsx                # Main application (single-page)
├── components/
│   ├── chat/                     # Message display, input, context indicator
│   ├── epi/                      # Epi concierge system (roles, utils, workflows)
│   ├── vault/                    # Vault management
│   ├── guardian/                 # Living Summary quality checker
│   ├── multiagent/               # Multi-agent sessions + loop detection
│   ├── merge/                    # Cross-model merge layer
│   ├── bridge/                   # External conversation import
│   ├── workflow/                 # Multi-step workflow builder
│   ├── references/               # Document management + diff review
│   ├── social/                   # Social media scheduling + analytics
│   ├── summary/                  # Living Summary viewer
│   ├── synthesis/                # Session synthesis review (diff UI)
│   ├── session/                  # Auto-save + session lifecycle
│   ├── settings/                 # API key management (multi-provider)
│   ├── moltbook/                 # Custom agent builder
│   ├── collab/                   # Vault sharing + comments
│   ├── tutorial/                 # Onboarding flow
│   └── ui/                       # shadcn/ui components
├── api/base44Client.js           # Base44 SDK client
├── lib/userScoped.jsx            # User-scoped entity helpers
└── Layout.jsx                    # Root layout + theme
functions/
├── llmProxy.ts                   # Multi-provider LLM proxy (AES-GCM encryption)
└── entityGuard.ts                # Server-side ownership enforcement
```

---

## Security

- **API keys**: Encrypted with AES-256-GCM using PBKDF2-derived keys. The encryption secret is the user's server-side ID. Keys are encrypted before storage and decrypted only at call time.
- **Entity ownership**: `entityGuard.ts` enforces server-side ownership checks on all sensitive entities.
- **No browser storage for secrets**: All credential management runs through the server function.
- **User-scoped queries**: Frontend queries always include `created_by` filters via `userScopedEntities`.

---

## Author

**Chris Grillos** — [@cmgdank](https://x.com/cmgdank)

Independent AI researcher and systems architect building tools for human-AI collaboration.

- [Epiphany.AI](https://epiphanyai-ai-amplifier-hub.base44.app) — Live deployment
- [Medium](https://medium.com/@cmgdank) — Research articles on AI architecture and alignment

---

## License

MIT
