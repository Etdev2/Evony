# Evony Scout — System Architecture Blueprint

Status: Draft v0.1
Owner: System Design Architect

## 1. Product Architecture Goal
Build a subscription SaaS that converts user-provided map observations into structured monster intelligence, then helps individuals and alliances search, rank, share, and coordinate targets.

The MVP architecture must reach a paid beta without depending on direct game-control automation.

## 2. Core User Flow
1. User signs in.
2. User uploads or captures a supported map image.
3. Ingestion service stores the observation and creates a scan job.
4. CV service normalizes the image, detects monster candidates, OCRs level/name/coordinates where visible, and returns confidence scores.
5. Observation processor validates and normalizes the result.
6. Deduplication service resolves observations into canonical targets.
7. Targeting engine calculates distance, freshness, event relevance, and target score.
8. Alliance service publishes eligible targets to a shared board.
9. Realtime updates notify connected alliance members.
10. Entitlement middleware determines which features the subscriber may use.

## 3. Recommended Stack

### Web App
- Next.js 15 + TypeScript
- Tailwind CSS
- Server Components where practical
- Route handlers/server actions for authenticated mutations

### Data/Auth/Realtime
- Supabase Auth
- Supabase Postgres
- Row Level Security
- Supabase Realtime for alliance board updates
- Storage for screenshots during MVP

### Computer Vision
- Python FastAPI service
- OpenCV for preprocessing
- OCR engine selected after benchmark
- Object detector only if template/OCR-based approach is insufficient
- Versioned fixture dataset and benchmark runner

### Queue / Background Work
MVP: Postgres-backed scan_jobs table + worker polling/claiming with safe locks.
Scale-up: Redis/BullMQ or managed queue when throughput justifies added infrastructure.

### Billing
- Stripe Checkout
- Stripe Billing
- Stripe Customer Portal
- Signed webhook processing
- Server-side entitlement table synchronized from Stripe state

### Desktop Capture
- Tauri companion application in Phase 3
- User-controlled capture/upload
- No Evony credentials stored

### Hosting
- Vercel: Next.js app
- Supabase: Postgres/Auth/Storage/Realtime
- Container host: CV/worker service
- Sentry: frontend/backend/CV error reporting

## 4. Logical Components

### A. Web / API Gateway
Responsibilities:
- Authentication/session handling
- User/alliance dashboard
- Screenshot upload
- Search/filter UI
- Subscription gating
- Admin/support entry points

The web app never trusts client-provided entitlement state.

### B. Observation Ingestion
Input:
- image
- uploader_id
- alliance_id optional
- source type
- captured_at optional

Output:
- observation_id
- scan_job_id

Responsibilities:
- validate file type/size
- create immutable observation record
- enqueue scan
- preserve source metadata

### C. CV Recognition Service
Input contract:
- observation_id
- image_url or signed retrieval token
- recognition_version

Output contract:
- detection array
- monster_type/name candidate
- level candidate
- x/y coordinates when visible
- confidence per field
- bounding boxes
- processing metadata

Rule: uncertain fields return null/low confidence; they are never fabricated.

### D. Observation Normalizer
Responsibilities:
- schema validation
- monster catalog normalization
- coordinate parsing
- confidence thresholding
- rejection/quarantine of malformed detections

### E. Target Resolution / Deduplication
Canonical target key initially based on:
- server/world context where applicable
- normalized x/y coordinate
- monster type/level
- observation freshness window

Responsibilities:
- merge duplicate sightings
- preserve observation history
- update last_seen_at
- expire stale targets
- maintain status: active, claimed, stale, dead, unknown

### F. Geospatial & Ranking Engine
Inputs:
- target position
- user/alliance reference position
- monster metadata
- freshness
- event weighting
- user preferences

Baseline score:
score = reward_weight * rarity_weight * event_weight * freshness_weight / max(estimated_travel_cost, epsilon)

The formula must be explainable in UI and versioned when changed.

### G. Alliance Service
Core entities:
- alliance
- membership
- role
- target claim
- shared filters/presets

Roles initially:
- owner
- officer
- member

Capabilities:
- shared target board
- target claim/release
- realtime updates
- alliance-level subscription ownership

### H. Billing & Entitlements
Stripe is source of truth for payment state; local entitlement records are the fast authorization layer.

Entitlement examples:
- scans_per_day
- alliance_members_limit
- realtime_board
- advanced_filters
- desktop_capture
- analytics

Every paid feature checks entitlements server-side.

### I. Notifications
Phase 2/3 adapters:
- in-app
- Discord webhook
- email/push later

Notification events should be produced from domain events, not hard-coded directly into core write paths.

## 5. Core Data Model

### users
- id
- display_name
- created_at

### alliances
- id
- owner_user_id
- name
- created_at

### alliance_members
- alliance_id
- user_id
- role
- joined_at

### observations
- id
- uploader_user_id
- alliance_id nullable
- image_path
- source_type
- captured_at
- created_at

### scan_jobs
- id
- observation_id
- status
- attempt_count
- recognition_version
- claimed_at
- completed_at
- error_code

### detections
- id
- observation_id
- raw_name
- normalized_monster_id nullable
- level nullable
- x nullable
- y nullable
- confidence_name
- confidence_level
- confidence_coordinates
- bounding_box jsonb

### monsters
- id
- canonical_name
- category
- level_min
- level_max
- metadata jsonb

### targets
- id
- monster_id
- level
- x
- y
- status
- first_seen_at
- last_seen_at
- canonical_confidence

### target_observations
- target_id
- observation_id
- detection_id

### target_claims
- id
- target_id
- alliance_id
- claimed_by_user_id
- expires_at
- released_at

### subscriptions
- id
- owner_type user|alliance
- owner_id
- stripe_customer_id
- stripe_subscription_id
- status
- plan_key
- current_period_end

### entitlements
- owner_type
- owner_id
- entitlement_key
- value jsonb
- source
- updated_at

### domain_events
- id
- type
- aggregate_type
- aggregate_id
- payload jsonb
- created_at

## 6. Security & Trust Boundaries
- Supabase RLS protects user/alliance records.
- Signed upload/read URLs expire quickly.
- Stripe webhooks require signature verification and idempotency.
- CV service receives narrowly scoped image access.
- Secrets exist only in deployment secret stores.
- No game passwords stored.
- No protocol interception/reverse-engineering dependency in MVP.
- Direct game-control automation, if ever pursued, lives behind a separate adapter/interface and separate approval decision.

## 7. API / Event Contracts

### POST /api/observations
Creates observation + scan job.

### GET /api/targets
Filters:
- monster
- level min/max
- max distance
- freshness
- status
- claimed/unclaimed

### POST /api/targets/:id/claim
Creates a time-bounded alliance claim with optimistic conflict handling.

### DELETE /api/targets/:id/claim
Releases caller-owned claim or officer override.

### POST /api/stripe/webhook
Idempotently synchronizes subscription and entitlements.

### Domain Events
- observation.created
- scan.completed
- detection.accepted
- target.created
- target.updated
- target.claimed
- target.released
- target.expired
- subscription.updated

## 8. Realtime Consistency Rules
- Database is source of truth.
- Realtime is a delivery mechanism, not authoritative state.
- Target claim operation must be atomic at database level.
- Claims have expiry to recover from abandoned sessions.
- Clients refetch canonical state after reconnect.

## 9. Performance Budgets
MVP targets:
- upload request acknowledgement: <1 second excluding client upload time
- scan result visible: <5 seconds cloud target, <2 seconds local/optimized target when feasible
- target-board query: p95 <500 ms
- target claim: p95 <500 ms
- realtime board update propagation: <2 seconds typical

## 10. Architecture Decisions

### ADR-001: Separate CV service from web app
Reason: Python/CV dependencies, independent scaling, benchmarkability, and future GPU support.

### ADR-002: Supabase as MVP system of record
Reason: fast auth/Postgres/RLS/realtime integration and reduced infrastructure overhead.

### ADR-003: Server-side entitlement enforcement
Reason: subscription state must not be bypassable by client manipulation.

### ADR-004: Start with Postgres-backed jobs
Reason: fewer moving parts for MVP; introduce dedicated queue only when throughput/latency demands it.

### ADR-005: Automation is not a core dependency
Reason: paid scanner/alliance value should stand on its own and remain technically separable from any future action adapter.

## 11. Implementation Dependency Order
1. Repository/app scaffold + CI
2. Supabase schema/auth/RLS baseline
3. Observation/scan-job contract
4. CV fixture harness + proof of concept
5. Target normalization/deduplication
6. Searchable target board
7. Alliance model + realtime claims
8. Stripe subscriptions + entitlement middleware
9. Paid beta instrumentation
10. Desktop capture
11. Advanced ranking/analytics

## 12. Architect Release Gates
No subsystem is considered ready until:
- interface contract exists
- acceptance tests exist
- security boundary is explicit
- error behavior is defined
- telemetry is available
- ownership is assigned

This document is the initial coordination contract for all specialist agents.