# ScopeGuard AI

ScopeGuard AI helps freelancers keep a reliable record of client agreements
and identify possible scope changes. This MVP uses browser `localStorage`; it
has no authentication, database, or external API connection.

## Requirements

- Node.js 22.13 or newer
- npm

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run build
```

## Environment placeholders

Copy `.env.example` to `.env.local` when the n8n integration phase begins.
Webhook URLs are intentionally unused in the current phase.
