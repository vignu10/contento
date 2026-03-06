# Content Repurposing Pipeline

Transform a single piece of long-form content into 10+ formatted assets for multiple platforms.

## 🎯 What It Does

- **Input:** YouTube video, podcast, blog post, or uploaded file
- **Output:** Twitter threads, LinkedIn posts, newsletters, TikTok clips, quote graphics, SEO summaries, and more

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## 📁 Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and helpers
│   ├── services/         # Business logic (transcription, AI, etc.)
│   ├── workers/          # Bull queue processors
│   └── types/            # TypeScript type definitions
├── prisma/               # Database schema
└── public/               # Static assets
```

## 🔧 Environment Variables

See `.env.example` for required configuration.

## 📦 Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Node.js, Bull/Redis queues
- **AI:** OpenAI Whisper (transcription), GPT-4 (content generation)
- **Database:** PostgreSQL (Prisma ORM)
- **Storage:** S3-compatible storage

## 🗓️ Roadmap

- [ ] MVP: Core pipeline (YouTube → all formats)
- [ ] Phase 2: Scheduling integrations, brand kits
- [ ] Phase 3: White-label, API access

---

Built by Izanagi for Vignu 🎯
