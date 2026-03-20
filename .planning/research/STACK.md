# Stack Research: Wildlife Rescue Manager

**Research date:** 2026-03-20
**Milestone context:** Subsequent — adding to existing React + Express + MongoDB + Tailwind stack

## Existing Stack (Locked)

- React 18 + Vite — frontend
- Express 4 + Mongoose 8 — API
- MongoDB — database
- Tailwind CSS 3 — styling
- React Router 6 — navigation
- Leaflet + React Leaflet — maps

## Libraries to Add

### Authentication

**Recommendation:** `jsonwebtoken` + `bcryptjs` (HIGH confidence)

- `jsonwebtoken ^9.0.0` — JWT signing/verification on Express API
- `bcryptjs ^2.4.3` — Password hashing (pure JS, no native deps — easier deployment)
- Store JWT in `httpOnly` cookie (not localStorage) to prevent XSS

Do NOT use: Passport.js (overkill for this scale), Auth0/Clerk (external dependency, cost)

### Role-Based Access Control

**Recommendation:** Custom Express middleware (HIGH confidence)

Simple array-based roles (`admin`, `staff`, `vet`, `volunteer`) checked via middleware. No library needed at this scale. Example pattern:

```js
// middleware/requireRole.js
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};
```

### Daily Care Logs

No additional library needed. New Mongoose model (`CareLog`) with references to `Animal._id`. Index on `animalId` + `date` for fast queries.

### Reporting / Statistics

**Recommendation:** Aggregate MongoDB queries + `recharts ^2.10.0` (HIGH confidence)

- `recharts` — React-native charting, Tailwind-friendly, lightweight (~500KB)
- All stats computed via MongoDB `$aggregate` pipelines on the API
- Do NOT use Chart.js (less React-idiomatic), D3 (too low-level for this use case)

### CSV / PDF Export

**Recommendation:** `papaparse ^5.4.1` for CSV + `@react-pdf/renderer ^3.3.0` for PDF (MEDIUM confidence)

- `papaparse` — Browser-side CSV generation, no server needed
- `@react-pdf/renderer` — React-component-based PDF generation, runs in browser
- Alternative: server-side PDF with `pdfkit` if browser PDF proves unreliable

### Form Handling (already partially in use)

No new library — keep current uncontrolled forms pattern. Consider `react-hook-form ^7.51.0` if form complexity grows, but not required for v1.

### Date Handling

**Recommendation:** `date-fns ^3.3.1` (HIGH confidence)

- Small, tree-shakeable, no global state (unlike moment.js)
- Needed for: care log date grouping, age calculations, reporting date ranges

## What NOT to Add

| Library | Reason to avoid |
|---------|----------------|
| Redux / Zustand | Overkill — React state + fetch is sufficient at this scale |
| TypeScript migration | Too much churn on existing codebase mid-project |
| GraphQL | REST is already established and working |
| Prisma / Sequelize | Already using Mongoose, no SQL |
| Socket.io | No real-time requirements identified |

---
*Research: 2026-03-20*
