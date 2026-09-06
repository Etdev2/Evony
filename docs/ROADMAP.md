# Evony Scout — Roadmap

## North Star
Deliver a subscription SaaS that helps Evony alliances discover, organize, prioritize, and act on monster/map intelligence faster than manual scouting.

## Phase 0 — Product Foundation (1–2 days)
- Architecture and agent ownership
- Repository workflow and CI baseline
- Product requirements and data model
- Auth/environment strategy
- Subscription entitlement design
- Test strategy and risk register

Exit: team can work concurrently against stable interfaces.

## Phase 1 — Map Scanner Proof of Concept (5–10 working days)
- Screenshot/image ingestion
- Image normalization and supported-resolution matrix
- Boss/monster recognition
- OCR name/level/coordinates where visible
- Confidence scoring
- Observation JSON contract
- Fixture-based accuracy tests

Targets: >95% boss detection precision on supported fixtures; >98% coordinate extraction when coordinates are clearly visible.

## Phase 2 — Subscription-Capable MVP (1–2 additional weeks)
- Auth and profiles
- Upload/scan UI
- Persistent monster observations
- Search/filter/sort
- Target ranking
- Shared alliance monster board
- Basic roles
- Stripe plans, entitlements, checkout/webhooks/portal
- Beta deployment and telemetry

Exit: invited users can subscribe and use the scanner/dashboard end to end.

Cumulative target: ~3–4 weeks.

## Phase 3 — Live Scouting & Alliance Coordination (2–3 additional weeks)
- Desktop capture companion
- Near-live observations
- Stronger deduplication/stale-target cleanup
- Target claiming/reservation
- Alliance permissions
- Discord/webhook notifications
- Event-specific filters/scoring
- Rally/stamina/reward analytics

Cumulative target: ~5–7 weeks.

## Phase 4 — Rally Orchestration Layer (2–4 additional weeks)
- Rally job model
- March/rally profiles
- Target reservation and assignment
- Multi-rally optimization
- Result tracking
- User-confirmed execution workflows
- Any direct game-control adapter remains isolated and requires separate technical/policy authorization review

Cumulative target: ~7–11 weeks.

## Phase 5 — Commercial Hardening (2–4 additional weeks)
- Onboarding
- Annual/monthly pricing
- Trials/coupons
- Rate and usage limits
- Admin/support tools
- Reliability/SLO work
- Security/privacy review
- Revenue and retention analytics
- Production release process

Target: ~9–15 weeks for a polished commercial product, with a paid beta much earlier.

## Critical Path
Scanner accuracy -> observation model -> monster board -> alliance sharing -> subscription entitlement -> paid beta.

Do not let speculative automation work block the paid scanner beta.
