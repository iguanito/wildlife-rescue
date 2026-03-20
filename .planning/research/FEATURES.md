# Features Research: Wildlife Rescue Manager

**Research date:** 2026-03-20
**Domain:** Wildlife rescue / animal shelter management software

## Already Built

- Animal intake (4-step form: species, rescue location, clinical info, status)
- Animal listing with search + status filter
- Medical records per animal
- Species autocomplete from master data

## Table Stakes (Must Have)

These are features users expect and will notice if missing:

### Animal Care Tracking
- **Daily care log** — feeding records, weight, behavioral notes per day. Center staff open this every morning.
- **Animal status lifecycle** — Clear states: Intake → In Care → Ready for Release → Released / Transferred / Deceased
- **Outcome recording** — Where/when released, transferred to which center, or cause of death

### User Management & Auth
- **Login with email/password** — Multiple people need accounts; shared password is not viable
- **Role-based access** — Vets need medical write access; volunteers should only see their assigned animals or have read-only
- **User admin panel** — Someone needs to create/deactivate accounts

### Dashboard
- **"Today" view** — Which animals need feeding, medication, weight check today? This is the screen staff open every morning.
- **Animal count by status** — At-a-glance: how many in care, how many critical, how many ready for release

### Animal Detail Page
- **Full timeline** — Chronological view of all events: intake → care logs → medical records → outcome
- **Quick-add care log** — From the detail page without navigating away

## Differentiators (Nice to Have for v1)

- **Statistics / reporting** — Animals received this month, by species, survival rates. Useful for grant reports and annual reports.
- **Search by species/date range** — Beyond current status filter
- **Bulk status update** — For centers doing batch releases

## Anti-Features (Do NOT Build in v1)

| Feature | Why not |
|---------|---------|
| Volunteer scheduling / shift management | Separate HR-like problem, out of core scope |
| Public adoption portal | This is an internal tool; adoption is not the use case |
| Inventory / supply tracking | Separate logistics domain |
| Mobile native app | Responsive web is sufficient |
| Email notifications | Adds backend complexity; staff can check the app |
| Multi-center data sharing | Single location only |

## Feature Dependencies

```
Auth/Login
  └── Role-based access
      └── User management (admin only)

Animal intake (exists)
  └── Daily care log
      └── Dashboard ("today" view)
  └── Outcome recording
      └── Statistics/reporting
  └── Animal detail page (full timeline)
```

## Complexity Notes

| Feature | Complexity | Notes |
|---------|------------|-------|
| Auth + JWT | Medium | Standard Express middleware pattern |
| Role-based access | Low | Simple role check on existing routes |
| Daily care log | Low | New model + form, similar to existing MedicalRecord |
| Animal detail timeline | Medium | Aggregating multiple collections in order |
| Dashboard "today" | Medium | Querying care logs to find gaps |
| Statistics | Medium | MongoDB aggregation pipelines |
| User management | Low | CRUD on User model, admin only |
| Outcome recording | Low | Extend existing animal status workflow |

---
*Research: 2026-03-20*
