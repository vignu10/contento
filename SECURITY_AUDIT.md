# Security Audit Report: Contento

**Repository:** https://github.com/vignu10/contento  
**Audit Date:** 2026-03-06  
**Auditor:** Debugger 🔍  
**Severity Scale:** CRITICAL > HIGH > MEDIUM > LOW > INFO

---

## Executive Summary

This application has **several critical security vulnerabilities** that must be addressed before production deployment. The most severe issues involve:

1. **Insecure password hashing** (SHA256 instead of bcrypt)
2. **Hardcoded JWT secret fallback**
3. **Broken access control** (IDOR vulnerabilities)
4. **Missing input validation**

---

## 🔴 CRITICAL SEVERITY

### 1. Insecure Password Hashing with SHA256

**Location:** `src/app/api/auth/route.ts:10-12`

```typescript
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}
```

**Issue:** SHA256 is designed for data integrity, NOT password storage. It's extremely fast — modern GPUs can compute billions of SHA256 hashes per second, making brute-force attacks trivial.

**Attack Scenario:**
1. Attacker obtains database (SQL injection, backup leak, insider threat)
2. Runs hashcat with SHA256: `hashcat -m 1400 -a 0 hashes.txt rockyou.txt`
3. Cracks most passwords in minutes/hours

**Fix:**
```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Impact:** All user credentials are at risk if database is compromised.

---

### 2. Hardcoded JWT Secret Fallback

**Location:** `src/app/api/auth/route.ts:7`, `src/app/api/content/route.ts:10`, `src/app/api/content/[id]/generate/route.ts:9`

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
```

**Issue:** If `JWT_SECRET` environment variable is not set in production, the application uses a KNOWN secret string. This allows anyone to forge valid JWT tokens.

**Attack Scenario:**
1. Attacker notices auth tokens work without JWT_SECRET set
2. Creates a token: `jwt.sign({ userId: 'any-user-id' }, 'dev-secret-change-in-prod')`
3. Gains access to any user's account

**Fix:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

**Better:** Validate all required env vars at startup:
```typescript
// src/lib/config.ts
export const config = {
  jwtSecret: process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET required') })(),
  openaiKey: process.env.OPENAI_API_KEY ?? (() => { throw new Error('OPENAI_API_KEY required') })(),
  // ...
};
```

---

### 3. IDOR: Unauthenticated Content Access & Deletion

**Location:** `src/app/api/content/[id]/route.ts`

```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const content = await prisma.content.findUnique({
    where: { id: params.id },  // ❌ No userId check!
    include: { outputs: true },
  });
  // ...
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.content.delete({
    where: { id: params.id },  // ❌ No userId check!
  });
  // ...
}
```

**Issue:** Any authenticated user can view or delete ANY content by guessing the ID. CUIDs are predictable enough that enumeration is feasible.

**Attack Scenario:**
1. Attacker creates account, notes their content ID format: `clh123abc...`
2. Iterates through similar IDs: `/api/content/clh124abc...`
3. Reads other users' transcripts, outputs, and deletes their content

**Fix:**
```typescript
import { getUserId } from '@/lib/auth'; // Extract to shared util

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const content = await prisma.content.findFirst({
    where: { id: params.id, userId },  // ✅ Enforce ownership
    include: { outputs: true },
  });

  if (!content) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // ...
}
```

---

### 4. IDOR: Outputs Endpoint Missing Authorization

**Location:** `src/app/api/content/[id]/outputs/route.ts`

```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const outputs = await prisma.output.findMany({
    where: { contentId: params.id },  // ❌ No ownership check
  });
  // ...
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { outputId, editedData } = body;
  const output = await prisma.output.update({
    where: { id: outputId },  // ❌ No ownership check
    data: { editedData },
  });
  // ...
}
```

**Issue:** Anyone can read or modify outputs for any content.

**Fix:** Add userId verification via content ownership check.

---

## 🟠 HIGH SEVERITY

### 5. Middleware Only Checks Cookie Existence, Not Validity

**Location:** `src/middleware.ts:18-21`

```typescript
const token = request.cookies.get('auth-token')?.value;
if (!token) {
  // reject
}
// Token exists - let the request through ❌
```

**Issue:** Middleware doesn't verify JWT signature. An attacker can set `auth-token=anything` and bypass middleware. While API routes verify, this wastes resources and could be combined with other vulnerabilities.

**Fix:**
```typescript
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET required');

export function middleware(request: NextRequest) {
  // ...
  const token = request.cookies.get('auth-token')?.value;
  if (!token) { /* reject */ }

  try {
    verify(token, JWT_SECRET);  // ✅ Verify signature
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

---

### 6. Missing Input Validation (Zod Unused)

**Location:** `src/app/api/auth/route.ts`

**Issue:** The project includes `zod` but doesn't use it for input validation. Email format, password strength, and name sanitization are missing.

**Fix:**
```typescript
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z.string().min(1).max(100).trim(),
});

const body = signupSchema.parse(await request.json());
```

---

### 7. File Upload Vulnerabilities

**Location:** `src/app/api/content/route.ts:35-60`

**Issues:**
1. **No server-side file type validation** — Only checks if file exists, not its actual type (MIME magic bytes)
2. **File extension trusted** — `file.name.split('.').pop()` can be manipulated: `malware.exe.jpg`
3. **Local filesystem storage** — Won't work in serverless (Vercel, AWS Lambda)
4. **Predictable filenames** — Timestamp-based naming enables enumeration

**Fix:**
```typescript
import { createReadStream } from 'fs';
import * as fileType from 'file-type';

// Validate actual file type
async function validateFileType(buffer: Buffer, allowedTypes: string[]): Promise<boolean> {
  const type = await fileType.fromBuffer(buffer);
  return type && allowedTypes.includes(type.mime);
}

// Use UUID for filenames
import { v4 as uuidv4 } from 'uuid';
const filename = `${uuidv4()}.${ext}`;
```

---

### 8. Potential SSRF via YouTube URL

**Location:** `src/services/youtube.ts:16-17`

```typescript
const response = await axios.get(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
```

**Issue:** While `videoId` is extracted via regex, the extraction pattern might allow unexpected values. The noembed service will make outbound requests.

**Fix:** Strictly validate YouTube video ID format:
```typescript
function validateVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}
```

---

## 🟡 MEDIUM SEVERITY

### 9. Redis URL Parsing is Fragile

**Location:** `src/lib/queue.ts:4-7`

```typescript
const redisConfig: RedisOptions = {
  host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
  port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
};
```

**Issue:** This parsing fails for:
- URLs with passwords: `redis://:password@host:6379`
- URLs with usernames: `redis://user:pass@host:6379`
- Rediss (TLS) URLs

**Fix:**
```typescript
import { URL } from 'url';

function parseRedisUrl(url: string): RedisOptions {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 6379,
    password: parsed.password || undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
  };
}
```

---

### 10. Missing Security Headers

**Location:** `next.config.js`

**Issue:** No security headers configured (CSP, HSTS, X-Frame-Options, etc.)

**Fix:**
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { 
            key: 'Content-Security-Policy', 
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          },
        ],
      },
    ];
  },
};
```

---

### 11. Transcription Service Fetches Local Paths

**Location:** `src/services/transcription.ts:18`

```typescript
file: await fetch(audioPath).then(r => r.blob()) as any,
```

**Issue:** This tries to fetch a local file path as a URL, which will fail. The worker version uses `getFile()` correctly.

---

### 12. OpenAI API Key Not Validated at Startup

**Location:** `src/services/ai.ts:3-5`

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

**Issue:** If `OPENAI_API_KEY` is missing, errors only occur at runtime when AI features are used.

---

## 🔵 LOW SEVERITY

### 13. Verbose Error Messages

**Location:** Multiple API routes

```typescript
console.error('Error creating content:', error);
```

**Issue:** Internal errors are logged but also expose generic messages to users. Consider structured logging and error tracking (Sentry).

---

### 14. No Rate Limiting

**Issue:** No rate limiting on auth endpoints, allowing brute-force attacks.

**Fix:** Add rate limiting middleware:
```typescript
import rateLimit from 'express-rate-limit';
// Or use Upstash Redis for serverless
```

---

### 15. Duplicate Code: JWT Verification

**Location:** `src/app/api/auth/route.ts`, `src/app/api/content/route.ts`, `src/app/api/content/[id]/generate/route.ts`

**Issue:** `getUserId()` function is duplicated across files.

**Fix:** Extract to `src/lib/auth.ts` and reuse.

---

### 16. SQLite in Production Schema

**Location:** `prisma/schema.prisma:10`

```prisma
provider = "sqlite"
```

**Issue:** SQLite is not suitable for production concurrent access. The README mentions PostgreSQL but schema uses SQLite.

---

## 📋 RECOMMENDATIONS

### Immediate Actions (Before Any Deployment)

1. ✅ Replace SHA256 with bcrypt for password hashing
2. ✅ Remove JWT secret fallback, fail fast if not set
3. ✅ Add userId checks to all content/outputs endpoints
4. ✅ Add input validation with Zod

### Short-term Actions

1. Add security headers to next.config.js
2. Implement rate limiting on auth endpoints
3. Fix file upload validation (server-side MIME check)
4. Add CSRF protection
5. Switch to PostgreSQL for production

### Long-term Actions

1. Add comprehensive logging and monitoring
2. Implement audit logging for sensitive operations
3. Add integration tests for auth flows
4. Consider using NextAuth.js instead of custom auth
5. Add CSP reporting

---

## FILES REQUIRING IMMEDIATE CHANGES

| File | Issues |
|------|--------|
| `src/app/api/auth/route.ts` | Password hashing, JWT secret, input validation |
| `src/app/api/content/[id]/route.ts` | IDOR (GET/DELETE) |
| `src/app/api/content/[id]/outputs/route.ts` | IDOR (GET/PUT) |
| `src/middleware.ts` | Token validation |
| `src/lib/queue.ts` | Redis URL parsing |
| `next.config.js` | Security headers |

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 4 |
| 🟠 HIGH | 4 |
| 🟡 MEDIUM | 4 |
| 🔵 LOW | 4 |

**Verdict:** This application is NOT ready for production. Address all CRITICAL and HIGH issues before any deployment.

---

*Audit completed by Debugger 🔍*
