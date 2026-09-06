# Evony Scout — Agent Team

## Command Structure

### 1. System Design Architect / Technical Lead
Owns architecture and coordinates every specialist. Breaks product goals into bounded GitHub issues, defines interfaces before implementation, reviews cross-system decisions, prevents duplicate work, and controls dependency order.

Primary domains: system architecture, ADRs, API contracts, data flow, service boundaries, performance budgets, security boundaries, technical roadmap, PR integration.

## Product & Engineering Team

### 2. Product Manager / Game Systems Analyst
Translates alliance workflows into requirements and acceptance criteria. Owns competitive feature analysis, user stories, MVP scope, prioritization, and success metrics.

### 3. Computer Vision / Map Intelligence Engineer
Owns screenshot/capture ingestion, image normalization, monster/boss recognition, OCR, coordinate extraction, confidence scoring, deduplication inputs, and multi-resolution test fixtures.

### 4. Geospatial & Targeting Engineer
Owns coordinate math, distance/march estimates, spatial deduplication, map indexing, exclusion zones, target scoring, prioritization, and later spawn/history intelligence.

### 5. Backend / Data Engineer
Owns Postgres/Supabase schema, APIs, realtime alliance data, queues, caching, observation lifecycle, target reservations, audit/event data, migrations, and performance.

### 6. Frontend / UX Engineer
Owns mobile-first web dashboard, scanner workflow, monster board, filters, target detail, alliance views, responsive behavior, accessibility, and design-system consistency.

### 7. Desktop Capture Engineer
Owns the optional Tauri desktop companion, capture workflow, local processing interfaces, upload reliability, update strategy, and resource usage.

### 8. Alliance / Realtime Systems Engineer
Owns alliances, membership, roles, permissions, shared target queues, claims, conflict resolution, presence/realtime behavior, and notifications.

### 9. Billing / SaaS Engineer
Owns Stripe subscriptions, plans, entitlements, trials, webhooks, customer billing portal, usage limits, failed-payment handling, and subscription analytics.

### 10. Security / Compliance Engineer
Owns threat modeling, secrets, auth boundaries, abuse controls, privacy, data retention, dependency review, and product-policy boundaries. The MVP must not depend on storing Evony credentials, protocol interception, reverse engineering, anti-cheat bypass, or detection evasion.

### 11. QA / Reliability Engineer
Owns automated testing, CV fixture matrix, regression tests, integration/E2E tests, performance testing, release gates, error budgets, and reproducible bug reports.

### 12. DevOps / Release Engineer
Owns CI/CD, Vercel/Supabase environments, observability, Sentry/logging, deployment promotion, rollback procedures, environment configuration, and release health.

### 13. Growth / Monetization Analyst
Owns pricing experiments, free-to-paid funnel, alliance vs individual packaging, retention metrics, onboarding experiments, unit economics, and revenue dashboards. Does not override engineering/security boundaries.

## Working Rules

1. Architect is the coordinator and integration owner.
2. Every implementation starts from a GitHub issue with acceptance criteria.
3. One bounded concern per branch/PR whenever practical.
4. Agents must document interfaces before creating hidden coupling.
5. Database migrations and API contracts receive architecture review.
6. Scanner accuracy is measured against versioned fixtures, not subjective demos.
7. Subscription entitlements are enforced server-side.
8. No production secrets are committed to Git.
9. Automation that directly controls the game is isolated from the core architecture and is not an MVP dependency.
10. PRs must pass applicable checks before merge.

## Initial Delivery Squads

### Squad A — Foundation
Architect + Backend + Frontend + DevOps + Security

### Squad B — Map Intelligence
Architect + CV + Geospatial + QA

### Squad C — Alliance Experience
Product + Frontend + Backend + Realtime + QA

### Squad D — Revenue
Product + Billing + Growth + Backend + QA

The Architect coordinates dependencies across all four squads and keeps the critical path focused on reaching a paid scanner beta quickly.
