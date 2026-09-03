# Comprehensive Security Audit Report

**Audit Target:** FinWise Workout Planner (Next.js 15, Supabase, IndexedDB, PWA)  
**Date:** September 3, 2026  
**Auditor:** Automated Agentic Security Suite (`/security-audit`)  
**Scope:** Full-stack architecture, dependencies, client-side storage, Supabase RLS, sync engine, API boundaries, and OWASP Top 10 compliance.  
**Overall Risk Posture:** **LOW to MODERATE** (Strong architectural fundamentals, excellent RLS enforcement and data segregation; primary action items are dependency patching and HTTP security headers).

---

## Executive Summary

A comprehensive, defense-in-depth security audit was performed across the Workout Planner application. The architecture exhibits strong security hygiene:
- **100% Row-Level Security (RLS) Coverage:** All 26 database tables have RLS explicitly enabled, with strict `auth.uid() = user_id` policies on user data and read-only locks on catalog reference data.
- **Guest Privacy Enforcement:** The offline sync outbox (`SyncOutbox`) explicitly filters out and denies cloud sync for unauthenticated guest records (`ownerKind === 'guest'`).
- **SQL Injection Immunity:** All cloud operations use Supabase PostgREST parameterized queries. Zero raw SQL string interpolation exists in application code.
- **Service Worker Security:** `public/sw.js` explicitly blocks caching of Supabase tokens, authentication responses, and API calls via regular-expression boundary filters.
- **Zero-LLM Deterministic Design:** The recommendation and adaptive engines are pure functional pipelines with no external prompt-injection or hallucination attack surfaces.

The audit identified **one Critical dependency advisory** (`next@15.2.4` vulnerable to GHSA-9qr9-h5gf-34mp), **one Medium configuration finding** (missing HTTP security headers in `next.config.mjs`), and **one architectural cleanup recommendation** (isolating server-role key references out of client modules).

---

## Findings Summary & Matrix

| ID | Title | Category | Severity | CVSS v3.1 | Status |
|---|---|---|---|---|---|
| **SEC-01** | Outdated Next.js package vulnerable to React Flight RCE | Dependency / CVE | **CRITICAL** | 9.8 | Action Required |
| **SEC-02** | Missing HTTP Security Headers (CSP, HSTS, X-Frame-Options) | Web / Configuration | **MEDIUM** | 5.3 | Action Required |
| **SEC-03** | Server Role key referenced in shared client Supabase module | Architectural / Secrets | **LOW** | 3.1 | Recommended |
| **SEC-04** | Plaintext IndexedDB storage for offline workout data | Data Protection | **LOW** | 2.5 | Acknowledged / By Design |

---

## Detailed Vulnerability Assessments

### SEC-01: Outdated Next.js Dependency (GHSA-9qr9-h5gf-34mp)
- **Severity:** **CRITICAL** (CVSS: 9.8)
- **Component:** `next@15.2.4` (in `package.json`)
- **Vulnerability Description:** Next.js versions `>=15.2.0-canary.0 <15.2.6` contain a critical vulnerability in the React Flight protocol handler where maliciously crafted request headers or payloads could trigger remote code execution in server components.
- **Impact:** High potential risk in server-rendered environments if untrusted input reaches flight decoding.
- **Remediation:**
  1. Upgrade `next` in `package.json` to `>=15.2.8` (or the latest stable Next.js 15.x release).
  2. Run `pnpm update next` followed by `pnpm audit` to verify resolution.

---

### SEC-02: Missing HTTP Security Headers in Next.js
- **Severity:** **MEDIUM** (CVSS: 5.3)
- **Component:** `next.config.mjs`
- **Vulnerability Description:** The application configuration does not declare custom HTTP response headers. It is missing:
  - `Content-Security-Policy` (CSP)
  - `X-Frame-Options: DENY` (anti-clickjacking)
  - `X-Content-Type-Options: nosniff` (anti-MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security` (HSTS)
- **Impact:** Leaves the application susceptible to clickjacking within foreign iframes, MIME-type confusion attacks, and unconstrained browser API usage.
- **Remediation:**
  Add a `headers()` block in `next.config.mjs`:
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
            },
          ],
        },
      ];
    },
    eslint: { ignoreDuringBuilds: false },
    typescript: { ignoreBuildErrors: false },
    images: { unoptimized: true },
  };

  export default nextConfig;
  ```

---

### SEC-03: Shared Supabase Client File References Server-Role Keys
- **Severity:** **LOW** (CVSS: 3.1)
- **Component:** `lib/supabase-client.ts`
- **Vulnerability Description:** `lib/supabase-client.ts` exports `getSupabaseServerClient()` which references `process.env.SUPABASE_SERVICE_ROLE_KEY`. Because this file also creates the browser-side client (`getBrowserSupabaseClient`), bundling server functions in a client file creates an architectural leakage risk if developer imports inadvertently cross environments.
- **Impact:** Next.js does not expose server env vars to the client unless prefixed with `NEXT_PUBLIC_`, so the actual secret is not leaked in current bundles. However, the pattern violates defense-in-depth isolation.
- **Remediation:**
  Remove `getSupabaseServerClient()` from `lib/supabase-client.ts`. All server-side client operations should exclusively import from `lib/supabase/server-client.ts`.

---

### SEC-04: Client-Side IndexedDB Storage Considerations
- **Severity:** **LOW** (CVSS: 2.5)
- **Component:** Client IndexedDB (`STORES.WORKOUT_SESSIONS`, `STORES.LOCAL_PROFILES`)
- **Vulnerability Description:** User workout sessions, feedback, and guest profile data are stored unencrypted in browser IndexedDB.
- **Impact:** Anyone with local physical or root/debugger access to the client browser profile can view workout history and preferences.
- **Risk Assessment:** This is standard architecture for Progressive Web Apps (PWAs) and local-first software. No financial, health insurance, or sensitive identity documents are stored.
- **Remediation:** Provide an explicit "Clear Local Data" button in settings/profile, and ensure sensitive auth tokens are managed solely by Supabase GoTrue secure cookie/session storage.

---

## OWASP Top 10 Evaluation Matrix

| OWASP Vulnerability | Project Assessment | Status |
|---|---|---|
| **A01: Broken Access Control** | RLS enforced on all tables with `auth.uid() = user_id`. `SyncOutbox` drops guest sync. | **PROTECTED** |
| **A02: Cryptographic Failures** | HTTPS/WSS enforced for all Supabase calls. SW filters auth tokens from cache. | **PROTECTED** |
| **A03: Injection** | Zero raw SQL string interpolation. All queries use PostgREST parameterized builders. | **PROTECTED** |
| **A04: Insecure Design** | Deterministic domain architecture, local-first outbox, explicit conflict resolution. | **PROTECTED** |
| **A05: Security Misconfiguration** | Missing HTTP security headers in `next.config.mjs` (SEC-02). | **NEEDS HARDENING** |
| **A06: Vulnerable & Outdated Components** | Next.js 15.2.4 contains known CVE (GHSA-9qr9-h5gf-34mp) (SEC-01). | **NEEDS UPGRADE** |
| **A07: Identification & Auth Failures** | Delegated to Supabase Auth with session refresh; no custom password hashing. | **PROTECTED** |
| **A08: Software & Data Integrity Failures** | Offline fixture migrations handle corrupt JSON gracefully; SW cache is scoped. | **PROTECTED** |
| **A09: Security Logging & Monitoring** | `sync_operations` tracks cloud sync attempts; error states logged to console. | **PROTECTED** |
| **A10: Server-Side Request Forgery (SSRF)** | The client does not accept arbitrary URLs for server-side fetching. | **NOT APPLICABLE** |

---

## Recommended Action Plan

1. **Immediate (P0):** Upgrade `next` dependency to patch GHSA-9qr9-h5gf-34mp.
2. **Immediate (P1):** Configure HTTP security headers in `next.config.mjs` (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
3. **Short-Term (P2):** Remove `getSupabaseServerClient` from `lib/supabase-client.ts` to maintain strict client/server boundary separation.
4. **Validation (P3):** Rerun `pnpm audit`, `pnpm test`, and `pnpm build` to verify that all patches pass without regressions.
