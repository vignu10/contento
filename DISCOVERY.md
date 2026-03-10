# Product Discovery Log — Contento (Content Repurposing Pipeline)
**Date:** 2026-03-11
**Repo:** vignu10/contento

---

## Product Summary
**App:** AI-powered content repurposing platform — transforms one piece of long-form content into 10+ formats for all platforms
**Users:** Content creators (YouTubers, podcasters, coaches), marketers, agencies
**Core journey:** Upload/paste content → AI transcribes & generates formats → Review/edit → Export/schedule
**Health:** Functional (core features work, but incomplete UX)

---

## Technical Recon
**Backend:** Next.js 15, Node.js, Prisma ORM, SQLite DB, Bull/Redis queues
**Frontend:** React, Tailwind CSS, shadcn/ui components
**AI:** OpenAI Whisper (transcription), GPT-4 (content generation)
**Component lib:** Radix UI primitives + shadcn/ui
**Build:** `npm run build` — ✅ passing (after fixes)
**Tests:** Playwright e2e — Port conflict issue (non-critical)

---

## What's Working ✅
- Build compiles successfully
- Authentication (login/signup)
- Dashboard with file upload & YouTube URL
- Content detail page with all 7 output formats
- Transcription service (Whisper) implemented
- AI content generation (GPT-4) implemented
- Export functionality (JSON, transcript)
- Playwright test framework exists

---

## What's Half-Built 🔶
1. **Settings page** — PRD exists (`docs/prd/user-settings.md`), UI not implemented
2. **Content deletion** — PR #27 exists, not merged
3. **Content editing** — PR #26 exists, not merged
4. **Search/filter** — PR #32 exists, not merged
5. **Retry functionality** — PR #35 exists, not merged
6. **Export functionality** — PR #34 exists, not merged

---

## What's Missing ❌
1. **Content deletion UI** — No way to delete processed content
2. **Inline editing of outputs** — Users can't edit generated content before export
3. **Search & filter** — No way to search/filter content library
4. **Settings page** — No profile, password change, usage stats, account deletion
5. **Dark mode toggle** — No way to switch between light/dark themes
6. **Empty states** — Some views lack meaningful empty states
7. **Loading states** — Some operations lack loading feedback
8. **Error handling** — Generic error messages in some places

---

## Existing PRDs (in docs/prd/)
- user-settings.md — Settings page with profile, security, usage
- content-editing.md — Inline editing for all output formats
- content-export.md — Export content as JSON/transcript
- content-retry.md — Retry failed content processing
- real-ai-content-generation.md — Real AI integration (already built)
- real-transcription-service.md — Real transcription (already built)

---

## Open PRs (unmerged)
- #33 feat(content): integrate real AI content generation
- #32 feat(dashboard): add search and filter
- #29 feat(content): integrate real transcription and AI generation
- #28 feat(settings): add user settings page
- #27 feat(dashboard): add content deletion UI
- #26 feat(content): add inline editing capabilities
- #16 fix(react): Fix React Hook useEffect dependencies

---

## Competitive Standard (2026)
For this type of product, users expect:
- ✅ Multi-format generation (implemented)
- ❌ Content editing (missing)
- ❌ Brand kits/templates (missing — Phase 2)
- ❌ Direct scheduling (missing — Phase 2)
- ✅ Export functionality (implemented)
- ❌ Search/filter (missing)
- ❌ Usage analytics (basic only)
- ❌ Dark mode (missing)

---

## Build Issues Fixed This Session
1. **Fixed TypeScript error:** Removed `any` type in page.tsx (line 143)
2. **Fixed Prisma error:** Removed invalid `_count: true` in export route
3. **Fixed build:** Added .env with JWT_SECRET placeholder
