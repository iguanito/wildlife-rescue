# Wildlife Rescue Manager

## What This Is

A web application for managing daily operations at a wildlife rescue center. Staff, vets, and volunteers use it to track every animal from the moment it arrives through treatment and release. It replaces paper records and spreadsheets with a searchable, shared system built for high-volume centers handling thousands of animals per year.

## Core Value

Every animal's complete journey — intake, daily care, medical treatment, and outcome — is tracked in one place so nothing falls through the cracks.

## Requirements

### Validated

- ✓ Animal can be created with a 4-step intake form (Animal Info, Rescue Info, Clinical Info, Status) — existing
- ✓ Animals can be listed with filtering by status and text search — existing
- ✓ Medical records can be added to an animal — existing
- ✓ Species lookup with autocomplete from master data — existing
- ✓ Rescue location can be captured via map picker — existing

### Active

- [ ] Staff can log daily care entries (feeding, weight, behavioral notes) for each animal
- [ ] Animal detail page shows full history: intake, care logs, medical records, outcome
- [ ] Animals can be marked as released, transferred, or deceased with outcome details
- [ ] Users can log in with email/password with role-based access (staff, vet, volunteer, admin)
- [ ] Admin can manage user accounts (create, assign roles, deactivate)
- [ ] Dashboard shows today's animals requiring attention and pending tasks
- [ ] App generates summary statistics (animals received, by species, outcomes, recovery rates)

### Out of Scope

- Mobile native app — web-first, accessible on mobile browser is sufficient
- Multi-center data sharing — single location only
- Financial/fundraising management — separate concern
- Public-facing adoption portal — internal tool only

## Context

**Brownfield project.** The animal intake form and animal listing are already built using React + Express + MongoDB + Tailwind CSS. The existing code establishes the data model (Animal, MedicalRecord, Species collections) and the React SPA architecture. All new features build on this foundation.

The center handles thousands of animals per year — data volume is real. Search, filtering, and quick data entry matter more than visual polish.

## Constraints

- **Tech Stack**: React + Express + MongoDB + Tailwind — existing stack, no changes
- **Single center**: No multi-tenancy needed, single MongoDB database
- **No dedicated mobile app**: Responsive web only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MongoDB for data storage | Already in use, flexible schema suits variable animal data | — Pending |
| Role-based auth | 4 distinct user types with different data access needs | — Pending |
| REST API | Already established pattern in codebase | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-20 after initialization*
