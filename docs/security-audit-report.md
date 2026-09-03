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

The audit identified **one Critical dependency advisory** (`next@15.2.4` vulnerable to GHSA-9qr9-h5gf-34mp), **one Medium configuration finding** (missing HTTP security headers in `next.config.mjs`), **one architectural cleanup recommendation** (isolating server-role key references out of client modules), and **one acknowledged Low-severity finding** (plaintext IndexedDB storage standard for local-first PWAs).

---

## Findings Summary & Matrix

| ID | Title | Category | Severity | CVSS v3.1 | Status |
|---|---|---|---|---|---|
| **SEC-01** | Outdated Next.js package vulnerable to React Flight RCE | Dependency / CVE | **CRITICAL** | 9.8 | Action Required |
| **SEC-02** | HTTP Security Headers Configuration (HSTS outstanding) | Web / Configuration | **LOW** | 3.7 | Partially Remediated (HSTS outstanding) |
| **SEC-03** | Server Role key referenced in shared client Supabase module | Architectural / Secrets | **LOW** | 3.1 | Remediated |
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

### SEC-02: HTTP Security Headers Configuration
- **Severity:** **LOW** (CVSS: 3.7)
- **Component:** `next.config.mjs`
- **Vulnerability Description:** `next.config.mjs` configures custom HTTP response headers across all paths (`/:path*`), enforcing:
  - `Content-Security-Policy` (CSP with strict script, connect, and frame rules)
  - `X-Frame-Options: DENY` (anti-clickjacking)
  - `X-Content-Type-Options: nosniff` (anti-MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  However, `Strict-Transport-Security` (HSTS) is currently not configured in `next.config.mjs`.
- **Impact:** Core browser protections against clickjacking, MIME-type confusion, and sensitive device API access are active. Without HSTS, browsers do not automatically upgrade cleartext HTTP connections before TLS handshakes occur on first contact.
- **Remediation / Status:** Core headers are fully implemented and active in production responses. Add `Strict-Transport-Security` (e.g. `max-age=63072000; includeSubDomains; preload`) once custom production domains with managed SSL/TLS certificates are active.

---

### SEC-03: Shared Supabase Client File References Server-Role Keys
- **Severity:** **LOW** (CVSS: 3.1)
- **Component:** `lib/supabase-client.ts`
- **Status:** **REMEDIATED**
- **Vulnerability Description:** `getSupabaseServerClient()` has been removed from `lib/supabase-client.ts`. All server-side client operations now exclusively import and instantiate the client from `lib/supabase/server-client.ts`.
- **Impact:** The shared browser client module (`lib/supabase-client.ts`) references only public environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), eliminating architectural leakage risks and preserving strict client/server boundary separation.
- **Remediation:** Completed. Server-side Supabase clients are quarantined to server modules only.

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
| **A05: Security Misconfiguration** | Core security headers (CSP, X-Frame, nosniff) configured in next.config.mjs; HSTS remains outstanding. | **HARDENED (HSTS Pending)** |
| **A06: Vulnerable & Outdated Components** | Next.js 15.2.4 contains known CVE (GHSA-9qr9-h5gf-34mp) (SEC-01). | **NEEDS UPGRADE** |
| **A07: Identification & Auth Failures** | Delegated to Supabase Auth with session refresh; no custom password hashing. | **PROTECTED** |
| **A08: Software & Data Integrity Failures** | Offline fixture migrations handle corrupt JSON gracefully; SW cache is scoped. | **PROTECTED** |
| **A09: Security Logging & Monitoring** | `sync_operations` tracks cloud sync attempts; error states logged to console. | **PROTECTED** |
| **A10: Server-Side Request Forgery (SSRF)** | The client does not accept arbitrary URLs for server-side fetching. | **NOT APPLICABLE** |

---

## Recommended Action Plan

1. **Immediate (P0):** Upgrade `next` dependency to patch GHSA-9qr9-h5gf-34mp.
2. **Configuration (P1):** Core HTTP security headers configured in `next.config.mjs` (CSP, X-Frame, X-Content-Type, Referrer-Policy, Permissions-Policy); add `Strict-Transport-Security` (HSTS) when production custom domain TLS is provisioned.
3. **Remediated (P2):** Removed `getSupabaseServerClient` from `lib/supabase-client.ts`; server operations now strictly use `lib/supabase/server-client.ts`.
4. **Validation (P3):** Rerun `pnpm audit`, `pnpm test`, and `pnpm build` to verify that all patches pass without regressions.
