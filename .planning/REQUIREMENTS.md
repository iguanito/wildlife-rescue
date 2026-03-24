# Requirements: Wildlife Rescue Manager

**Defined:** 2026-03-20
**Core Value:** Every animal's complete journey — intake, daily care, medical treatment, and outcome — is tracked in one place so nothing falls through the cracks.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can log in with email and password
- [x] **AUTH-02**: User session persists across browser restarts ("remember me")
- [x] **AUTH-03**: User can log out from any page
- [x] **AUTH-04**: Each user has one of four roles: admin, staff, vet, volunteer

### Access Control

- [x] **ACCESS-01**: Volunteer can view animal records but cannot create or edit
- [x] **ACCESS-02**: Staff can create animals and add care logs
- [x] **ACCESS-03**: Vet can create and edit medical records
- [x] **ACCESS-04**: Admin has full access to all features including user management
- [x] **ACCESS-05**: All API write routes enforce server-side role checks

### User Management

- [ ] **USER-01**: Admin can create new user accounts with email, password, and role
- [ ] **USER-02**: Admin can deactivate user accounts
- [ ] **USER-03**: Admin can change a user's role

### Daily Care Logs

- [x] **CARE-01**: Staff can add a care log entry to an animal (type: feeding, weight, observation)
- [x] **CARE-02**: Care logs include date, type, value/notes, and the user who created it
- [x] **CARE-03**: Staff can view all care logs for a given animal

### Animal Detail & Timeline

- [x] **DETAIL-01**: User can view an animal's full history in chronological order: intake info, care logs, medical records, and outcome
- [x] **DETAIL-02**: Animal detail page shows current status and all key fields from intake

### Outcome Recording

- [ ] **OUTCOME-01**: Staff can record an animal's outcome: released, transferred to another center, or deceased
- [ ] **OUTCOME-02**: Outcome record includes date, type, and notes (release location, transfer destination, cause of death)
- [ ] **OUTCOME-03**: Once outcome is recorded, animal status updates to a terminal state

### Dashboard

- [x] **DASH-01**: Staff sees a "today's tasks" view showing which animals need care entries today
- [x] **DASH-02**: Dashboard shows count of animals by status (in care, ready for release, released, etc.)
- [x] **DASH-03**: Clicking an animal in the dashboard navigates to its detail page

### Reporting & Statistics

- [ ] **REPORT-01**: Admin can view summary statistics: total animals received, breakdown by species, and outcomes count
- [ ] **REPORT-02**: Statistics can be filtered by date range (this month, this year, custom range)

## v2 Requirements

### Authentication
- **AUTH-V2-01**: User can reset password via email link
- **AUTH-V2-02**: Admin can force password reset for a user

### Care Logs
- **CARE-V2-01**: Care log templates per species (pre-filled fields for common species)
- **CARE-V2-02**: Bulk care log entry for multiple animals at once

### Reporting
- **REPORT-V2-01**: Export report as CSV or PDF
- **REPORT-V2-02**: Recovery rate statistics by species

### Notifications
- **NOTIF-V2-01**: In-app alert when an animal has had no care log for 24+ hours

## Out of Scope

| Feature | Reason |
|---------|--------|
| Password reset via email | Requires email service setup; v2 |
| Volunteer scheduling / shifts | Separate HR-like problem |
| Inventory / supply tracking | Separate logistics domain |
| Public adoption portal | Internal tool only |
| Mobile native app | Responsive web is sufficient |
| Multi-center data sharing | Single location only |
| Financial / fundraising management | Out of scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| ACCESS-01 | Phase 1 | Complete |
| ACCESS-02 | Phase 1 | Complete |
| ACCESS-03 | Phase 1 | Complete |
| ACCESS-04 | Phase 1 | Complete |
| ACCESS-05 | Phase 1 | Complete |
| USER-01 | Phase 5 | Pending |
| USER-02 | Phase 5 | Pending |
| USER-03 | Phase 5 | Pending |
| CARE-01 | Phase 2 | Complete |
| CARE-02 | Phase 2 | Complete |
| CARE-03 | Phase 2 | Complete |
| DETAIL-01 | Phase 2 | Complete |
| DETAIL-02 | Phase 2 | Complete |
| OUTCOME-01 | Phase 4 | Pending |
| OUTCOME-02 | Phase 4 | Pending |
| OUTCOME-03 | Phase 4 | Pending |
| DASH-01 | Phase 3 | Complete |
| DASH-02 | Phase 3 | Complete |
| DASH-03 | Phase 3 | Complete |
| REPORT-01 | Phase 6 | Pending |
| REPORT-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
