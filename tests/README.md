# Playwright Tests

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Run tests in debug mode
npx playwright test --debug
```

## Test Structure

```
tests/
├── auth.spec.ts          # Authentication tests
├── dashboard.spec.ts     # Dashboard tests
├── content/
│   └── detail.spec.ts    # Content detail page tests
└── e2e.spec.ts           # End-to-end user journey tests
```

## Test Coverage

### Authentication (`auth.spec.ts`)
- ✅ Landing page display
- ✅ Login/Signup tab switching
- ✅ Invalid credentials error
- ✅ Successful signup
- ✅ Field validation
- ✅ Password length validation
- ✅ Logout functionality

### Dashboard (`dashboard.spec.ts`)
- ✅ Dashboard elements display
- ✅ Tab switching (YouTube vs File)
- ✅ Empty state
- ✅ YouTube URL processing
- ✅ File upload interface
- ✅ Content list display
- ✅ Navigation to detail
- ✅ Status badges
- ✅ Mobile responsiveness

### Content Detail (`content/detail.spec.ts`)
- ✅ Page elements display
- ✅ All 7 output formats
- ✅ Copy to clipboard
- ✅ Transcript toggle
- ✅ Back navigation
- ✅ Processing state
- ✅ Mobile layout

### E2E (`e2e.spec.ts`)
- ✅ Complete user journey
- ✅ File upload flow
- ✅ Multiple content items
- ✅ Session persistence
- ✅ Responsive design
- ✅ Error handling

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Mobile Tests
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Debug Mode
```bash
npx playwright test --debug
```

### Generate Code
```bash
npx playwright codegen
```

## CI Integration

Tests run automatically in CI with:
- 2 retries
- 1 worker
- All browsers
- Screenshots on failure
- Videos on failure

## Test Data

Tests use dynamic timestamps for unique emails:
```typescript
const timestamp = Date.now();
const email = `test-${timestamp}@example.com`;
```

## Assertions

All tests use Playwright's auto-waiting assertions:
```typescript
await expect(page.getByText('Content')).toBeVisible();
await expect(page).toHaveURL(/.*dashboard/);
```

## Best Practices

1. **Use data-testid** for stable selectors
2. **Wait for network idle** when needed
3. **Clean up** test data after tests
4. **Use beforeAll/beforeEach** for common setup
5. **Group related tests** with test.describe()
6. **Use meaningful test names**

## Debugging Failed Tests

1. Check screenshots in `test-results/`
2. Check videos in `test-results/`
3. Check traces in `test-results/`
4. Run with `--debug` flag
5. Use Playwright Inspector

## Performance

- Tests run in parallel by default
- Use `test.describe.serial()` for sequential tests
- Use `test.skip()` to skip tests
- Use `test.only()` to run specific tests
