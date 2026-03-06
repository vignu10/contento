# Contento - AI Content Repurposing Platform

Transform one piece of content into 10+ formats for all platforms with AI.

## 🎯 Features

- ✅ **Multi-format Output**: Twitter threads, LinkedIn posts, newsletters, TikTok clips, quote graphics, SEO summaries, Instagram captions
- ✅ **YouTube Processing**: Paste any YouTube URL
- ✅ **File Upload**: Support for audio, video, and PDF files
- ✅ **Real AI**: OpenAI Whisper + GPT-4 integration
- ✅ **Beautiful UI**: shadcn/ui components with modern design
- ✅ **Dark Mode**: Full dark mode support
- ✅ **Mobile Responsive**: Works on all devices
- ✅ **Test Coverage**: 60+ Playwright tests

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY="sk-proj-your-key-here"
```

**Get your API key:** https://platform.openai.com/api-keys

### 3. Initialize Database

```bash
npx prisma migrate dev
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🤖 AI Modes

### Mock Mode (Default without API key)
- Instant demo outputs
- No API costs
- Good for testing UI

### Real AI Mode (With OpenAI key)
- GPT-4 for content generation
- Whisper for transcription
- Takes 1-2 minutes per piece
- High-quality outputs

To enable real AI:
```bash
# Add to .env
OPENAI_API_KEY="sk-proj-..."
```

## 📁 Project Structure

```
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   ├── services/         # AI services
│   └── types/            # TypeScript types
├── prisma/               # Database schema
├── tests/                # Playwright tests
└── docs/                 # Documentation
```

## 🧪 Testing

```bash
# Run all tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui

# Run specific test
npx playwright test auth.spec.ts
```

## 🚢 Deployment

### Railway (Recommended)

1. Push to GitHub
2. Connect to Railway
3. Add PostgreSQL + Redis
4. Set environment variables
5. Deploy!

See [PR #2](https://github.com/vignu10/contento/pull/2) for details.

## 🎨 Customization

### Change Theme

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      }
    }
  }
}
```

### Add New Output Format

1. Update `src/services/real-ai.ts`
2. Add new tab in `src/app/content/[id]/page.tsx`
3. Update tests

## 📊 Performance

- **Build Size**: ~117 KB (dashboard)
- **First Load**: ~100 KB shared
- **Lighthouse**: 95+ Performance
- **Test Coverage**: 60+ tests

## 🔒 Security

- JWT-based authentication
- Password hashing (SHA-256)
- SQL injection protection (Prisma)
- XSS protection (React)
- CSRF protection (Next.js)

## 📝 API Reference

### POST /api/content
Process new content

### GET /api/content
List all content

### GET /api/content/[id]
Get single content with outputs

### POST /api/auth
Login / Signup / Logout

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI**: shadcn/ui, Radix UI, Lucide Icons
- **AI**: OpenAI Whisper, GPT-4
- **Database**: SQLite (dev), PostgreSQL (prod)
- **Testing**: Playwright
- **Deployment**: Railway, Docker

## 📄 License

MIT

---

Built by Izanagi for Vignu 🎯
