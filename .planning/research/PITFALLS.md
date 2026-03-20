# Pitfalls Research: Wildlife Rescue Manager

**Research date:** 2026-03-20
**Context:** Adding auth + care logging + reporting to existing React + Express + MongoDB app handling thousands of animals/year

## Critical Pitfalls

### 1. Adding Auth to Existing Routes as an Afterthought

**Warning signs:** Auth middleware added to some routes but not others; `req.user` assumed in handlers that don't enforce login.

**Risk:** Unauthenticated API access to animal data. Existing routes (`/api/animals`, `/api/species`) have no auth today.

**Prevention:**
- When adding auth middleware, audit ALL existing routes at once — don't do it incrementally
- Add a global default-deny middleware and explicitly opt-out for public routes (none in this app)
- Phase: Auth phase must retrofit existing routes, not just protect new ones

---

### 2. JWT in localStorage (XSS Vulnerability)

**Warning signs:** Storing token with `localStorage.setItem('token', ...)`.

**Risk:** Any XSS vulnerability exposes all user tokens.

**Prevention:**
- Store JWT exclusively in `httpOnly`, `SameSite=Strict` cookies
- Never return the raw token string to frontend JavaScript
- Phase: Auth implementation must spec cookies from the start

---

### 3. Role Checks Only on Frontend

**Warning signs:** Hiding UI elements based on role but not checking role in API routes.

**Risk:** Volunteer can POST to `/api/animals/:id/medical` directly via curl even if button is hidden.

**Prevention:**
- Every write route must have server-side `requireRole()` middleware
- Frontend role gates are UX only — never security
- Phase: Auth phase must include role middleware on all write routes

---

### 4. Care Log Performance at Scale (Thousands of Animals/Year)

**Warning signs:** Dashboard query takes >1s; no indexes on CareLog collection.

**Risk:** Dashboard becomes unusable after 6 months of data accumulation.

**Prevention:**
- Create compound index: `{ animalId: 1, date: -1, type: 1 }` on CareLog from day one
- Dashboard query must filter by today's date range, not scan full collection
- Phase: Care log implementation must include index creation in migration

---

### 5. Animal "Status" as a Free-Text Field

**Warning signs:** Status stored as arbitrary string; inconsistent values ("in care", "In Care", "incare").

**Risk:** Dashboard and reporting break on status mismatch; can't filter reliably.

**Prevention:**
- Define status enum in Mongoose schema (already partially done — enforce it)
- Validate status transitions (can't go from "Released" back to "Intake" without admin override)
- Phase: Review existing Animal model status field before building dashboard queries

---

### 6. No Soft Delete = Data Loss

**Warning signs:** Using `Animal.deleteOne()` for records; no way to recover accidentally deleted animals.

**Risk:** A volunteer deletes an animal record that has medical history.

**Prevention:**
- Never hard-delete Animal or MedicalRecord — add `deletedAt` field and filter on `{ deletedAt: null }`
- Admin-only delete with confirmation; volunteers have no delete access
- Phase: User management phase must enforce this via role rules

---

### 7. Reporting Queries Blocking the Event Loop

**Warning signs:** Aggregation pipeline runs on `/api/reports` without timeout; MongoDB query takes 10+ seconds on large dataset.

**Risk:** Report page hangs; blocks other API requests in Node.js single thread.

**Prevention:**
- Add `maxTimeMS` to aggregation queries
- Consider caching report results (simple in-memory cache, 5-minute TTL)
- Reporting is read-only — can run against a secondary replica if ever needed
- Phase: Reporting phase must spec query timeouts from the start

---

### 8. No Audit Trail for Medical Records

**Warning signs:** MedicalRecord has no `createdBy` field; no way to know which vet added which treatment.

**Risk:** Liability concerns; can't identify incorrect treatments.

**Prevention:**
- All new models (CareLog, outcome updates) must include `createdBy: ObjectId ref User`
- Retrofit `createdBy` to MedicalRecord when adding auth (vet role needs this)
- Phase: Auth phase should include this retrofit

---
*Research: 2026-03-20*
