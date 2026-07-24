# Pulse

Pulse monitors 114 RSS feeds across 11 news categories, detects when multiple publishers are reporting the same event and merges them into a single story, generates concise summaries and "Why It Matters" explanations using a locally-running language model, and delivers everything to you through a Telegram bot. 

The core idea is simple: if Pulse sends you a notification, it should be worth opening.

---

## How it works

Every 10 minutes, Pulse polls all configured feeds and checks for new articles. Each new article goes through a pipeline:

1. The article text is downloaded and extracted using Mozilla Readability, the same algorithm Firefox uses for its Reader Mode. If that fails (JavaScript-heavy pages, paywalled previews), a headless Playwright browser tries instead.

2. The clean text is sent to a local Ollama instance running qwen3:1.7b, which generates a bullet-point summary and a short "Why It Matters" explanation. These are two separate model calls, small models produce better output when given one focused task at a time.

3. The article's headline and summary are converted into a 768-dimensional semantic vector using nomic-embed-text. This vector is compared against all recent stories in the same category using cosine similarity to decide what to do next.

**If similarity is below 0.84** — this is a genuinely new event. A new Story is created and interested users are notified.

**If similarity is between 0.84 and 0.95** — this might be the same event with new developments. The model checks whether the article adds materially new information (updated numbers, official statements, major developments). If yes, the existing story gets a Live Story update and users are notified again. If no, the article is silently attached as an extra source.

**If similarity is above 0.95** — this is the same event re-reported by another publisher. The publisher is added to the story's sources list. No notification goes out.

This is why a story from Reuters, BBC, AP, and CNN about the same earthquake becomes one notification, not four.

---

## Notification format

```
🌍 NEW STORY

Earthquake strikes southern Japan, 6.8 magnitude

• 6.8 magnitude quake struck off the coast of Miyazaki prefecture
• At least 12 casualties confirmed, rescue operations ongoing
• Bullet train services suspended across the Kyushu region
• Tsunami advisory issued for coastal areas, residents asked to evacuate

Why it matters
Japan sits on the Pacific Ring of Fire and experiences frequent seismic
activity, but a 6.8 magnitude event near a populated coast carries real
risk of infrastructure damage and secondary hazards. The tsunami advisory
affects several fishing communities with limited evacuation infrastructure.

Sources: Reuters, BBC World, AP, NHK
```

When the story develops:

```
🌍 LIVE STORY #2

Earthquake strikes southern Japan, 6.8 magnitude

• Tsunami advisory has been lifted after wave heights remained below
  warning thresholds
• Death toll revised to 9 after initial reports overcounted
• Shinkansen services partially resumed on two lines

Why it matters
The advisory being lifted is the clearest sign the acute danger phase
has passed. Revised casualty figures suggest initial reporting was
conservative rather than understated, which is typical in the first
hours after a major quake.

Sources: Reuters, BBC World, AP, NHK, The Guardian
```

---

## Tech stack

**Runtime and server**
Node.js with Express (used only for a health check endpoint at `GET /health`).

**Database**
MongoDB with Mongoose. Stories have variable-length arrays for sources, article URLs, live updates, and embedding vectors — a document database fits this shape naturally.

**Telegram bot**
Telegraf with WizardScene for the multi-step onboarding flow. All interactions use inline keyboards so users never have to type anything beyond setup.

**Feed parsing**
rss-parser handles all RSS/Atom feeds including Google News, which uses obfuscated redirect URLs that are resolved to the real article URL before extraction.

**Content extraction**
@mozilla/readability and jsdom as the primary strategy. Playwright (headless Chromium) as fallback for JavaScript-rendered pages.

**Language model**
Ollama running qwen3:1.7b locally. Thinking mode disabled (`think: false`) since structured text generation doesn't benefit from chain-of-thought reasoning, and disabling it cuts latency significantly on CPU inference.

**Embedding model**
Ollama running nomic-embed-text locally. Generates 768-dimensional semantic vectors used for cosine similarity deduplication.

**Scheduler**
node-cron for RSS polling (every 10 minutes by default) and morning/evening digest delivery.

**Concurrency**
p-limit caps parallel Ollama calls at 2 to avoid saturating a single local model instance.

**Logging**
pino with structured JSON output. pino-pretty formats it into colored, readable output in development.

---

## Prerequisites

You need four things installed and running before starting Pulse.

**Node.js** (version 18 or higher) — https://nodejs.org

**MongoDB** running locally on port 27017. Install from https://mongodb.com/try/download/community and start it with `brew services start mongodb-community` on macOS or `sudo systemctl start mongod` on Linux.

**Ollama** running locally on port 11434 — https://ollama.com. After installing, pull both models:

```
ollama pull qwen3:1.7b
ollama pull nomic-embed-text
```

**A Telegram bot token** — open Telegram, search for @BotFather, send `/newbot`, follow the prompts. Copy the token it gives you.

---

## Setup

```bash
# Install dependencies
npm install

# Install the Playwright browser used as fallback extractor
npx playwright install chromium

# Create your environment file
cp .env.example .env
```

Open `.env` and set your bot token:

```
TELEGRAM_BOT_TOKEN=(grab a token from botfather)
```

Everything else in `.env` works out of the box for local development.

---

## Running

```bash
npm run dev
```

You should see four startup lines confirming everything connected:

```
INFO: MongoDB connected
INFO: Telegram bot started (polling mode)
INFO: Scheduler started
INFO: HTTP server listening  { port: 3000 }
```

Open Telegram, find your bot, and send `/start` to begin setup.

---

## Bot commands

`/start` — runs the onboarding wizard to set your preferences

`/settings` — shows your current categories, topics, keywords, and digest settings

`/categories` — change which categories you follow

`/topics` — change specific topics within your categories

`/keywords` — set up to 5 custom keyword alerts (e.g. Tesla, ISRO, Delhi Metro)

`/digest` — enable or change your daily digest (morning, evening, or both)

`/help` — lists all commands

---

## Configuration

All settings live in `.env`. The defaults work for most cases — the ones worth knowing about are:

`RSS_POLL_CRON` — how often feeds are checked. Default is `*/10 * * * *` (every 10 minutes). Change to `*/5 * * * *` for every 5 minutes.

`DEDUP_SIMILARITY_THRESHOLD` — the cosine similarity score below which an article is treated as a new story. Default `0.84`. Lower this to merge more aggressively; raise it to create more separate stories.

`DEDUP_NEAR_DUPLICATE_THRESHOLD` — above this score, articles are treated as exact re-reports and merged silently. Default `0.95`.

`MAX_ARTICLES_PER_CYCLE` — maximum articles processed per cron run. Default `50`. Prevents the first run (empty database) from queuing thousands of Ollama jobs at once.

`OLLAMA_CONCURRENCY` — parallel Ollama calls. Default `2`. Lower to `1` if your machine struggles.

---

## Project structure

```
src/
  config/          Environment config, topic taxonomy, RSS source list
  db/              MongoDB connection
  models/          User, Story, Article, Notification schemas
  ingestion/       RSS feed polling, Google News URL resolver
  extraction/      Readability extractor, Playwright fallback, content cleaner
  ai/              Ollama client, prompt templates, summarizer, topic classifier
  dedup/           Cosine similarity engine
  storyEngine/     Story resolution logic, Live Story update rules
  notifications/   User matcher, notification dispatcher, daily digest builder
  telegram/        Bot setup, onboarding scene, command handlers, formatters
  jobs/            Cron scheduler, ingestion pipeline runner
  middleware/      Error handler, request logger
  routes/          Health check endpoint
  utils/           Logger, retry helper, text utilities
```

---

## License

MIT
