# Build Plan — Overnight Dev Agent Run

## Priority Task List

### ✅ Completed — Build Fixes
1. 🔴 Fix build — TypeScript `any` type error in page.tsx
2. 🔴 Fix build — Prisma `_count` error in export route
3. 🔴 Fix build — Missing JWT_SECRET environment variable

### 🎯 Tasks to Build (Priority Order)

1. **Dark Mode Toggle** (#38) — P2 but quick (~1 hour)
   - Add toggle button to header
   - Implement theme provider with localStorage
   - System preference detection

2. **Content Deletion UI** (#36) — P1 (~2 hours)
   - Delete button in dashboard
   - Confirmation modal
   - DELETE API route
   - Cascade delete

3. **Dashboard Search and Filter** (#37) — P1 (~3 hours)
   - Search input with debounce
   - Status and source type filters
   - Date sort dropdown
   - API query params

4. **User Settings Page** (#39) — P1 (~2-3 hours)
   - Settings page layout
   - Profile update (name)
   - Password change
   - Usage stats display
   - Account deletion

5. **Inline Content Editing** (#40) — P1 (~3-4 hours)
   - Edit mode toggle for each output
   - Textarea inputs for editable content
   - Save button with API update
   - Updated copy behavior

---

## Time Allocation Estimate
- Dark Mode: 1 hour
- Content Deletion: 2 hours
- Search & Filter: 3 hours
- User Settings: 3 hours
- Content Editing: 4 hours

**Total: ~13 hours** (may not complete all in one run)

---

## Features to Skip (No Time)
- Bulk delete (can be Phase 2)
- Advanced search filters
- Theme customization beyond dark/light
- Export filtered results

---

## Notes
- Existing PRs (#26, #27, #28, #32) may cover some of these features
- Will check and reference existing work where applicable
- Focus on shipping clean, complete features
- Test each feature before PR
