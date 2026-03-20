# Codebase Concerns

**Analysis Date:** 2026-03-20

## Data Validation & Input Sanitization

**Weak input validation on API endpoints:**
- Issue: Regular expressions constructed directly from user input without anchors or proper escaping
- Files: `api/routes/animals.js` (lines 11-12), `api/routes/species.js` (lines 11-14)
- Impact: Case-insensitive regex patterns like `new RegExp(species, 'i')` and `new RegExp(q, 'i')` could allow ReDoS (Regular Expression Denial of Service) attacks or unintended matches with malformed input
- Fix approach: Use MongoDB's text search or exact field matching instead of loose regex patterns; if regex necessary, add validation for pattern complexity and length limits

**No schema validation on incoming requests:**
- Issue: POST/PUT endpoints accept any field without validation, relying only on Mongoose schema defaults
- Files: `api/routes/animals.js` (line 23, 45), `api/routes/medical.js` (line 7)
- Impact: Invalid data types, unexpected fields, or missing required fields at form submission time aren't caught until database layer; no business logic validation (e.g., future dates, negative numbers)
- Fix approach: Implement request validation middleware (e.g., joi, zod, or express-validator) with explicit schema validation before database operations

**Frontend form doesn't validate numeric fields:**
- Issue: Weight and distance inputs use `type="number"` but no server-side validation
- Files: `frontend/src/pages/AnimalCreate.jsx` (lines 215, 273)
- Impact: Users can submit negative weights/distances; API accepts silently
- Fix approach: Add server-side range validation in Animal schema or request validator

## Database Connection Management

**Singleton connection pattern has thread safety issues:**
- Issue: `db.js` maintains a `connected` boolean flag that assumes synchronous state transitions
- Files: `api/db.js` (lines 5-9)
- Impact: In high concurrency, multiple simultaneous requests could trigger multiple `mongoose.connect()` calls before flag is set, causing connection pool exhaustion or duplicate connection attempts
- Fix approach: Use async initialization pattern with Promise queue or connection pool manager; consider using `mongoose.connection.getClient()` and connection state checks

**No connection error recovery:**
- Issue: If MongoDB connection fails on first request, subsequent requests will hang (await on unresolved promise)
- Files: `api/db.js`, `api/index.js` (lines 14-21)
- Impact: Users see generic "Database connection failed" for all requests; no retry logic or detailed error context
- Fix approach: Implement connection pooling with retry logic, timeout configuration, and proper error propagation with specific error codes

**No graceful shutdown handling:**
- Issue: No mongoose connection cleanup on server shutdown
- Files: `api/index.js`
- Impact: On Vercel cold starts/redeploys, connections may leak; Vercel's function cleanup may be delayed
- Fix approach: Add proper shutdown handlers that call `mongoose.connection.close()` and drain connection pool

## Error Handling & Logging

**Insufficient error context in API responses:**
- Issue: All error responses return generic `err.message` without distinguishing between validation errors, database errors, and network errors
- Files: `api/routes/animals.js` (lines 16, 26, 37, 51, 63, 73, 83), `api/routes/medical.js` (lines 14, 24)
- Impact: Frontend cannot reliably handle different error types; users see MongoDB validation errors directly (e.g., "Cast to ObjectId failed for value 'invalid'")
- Fix approach: Wrap database operations with error handlers that translate to HTTP status codes and user-friendly messages

**No request logging or error tracking:**
- Issue: No logging framework; errors logged only via Express's default (to stdout)
- Files: `api/index.js` (line 32)
- Impact: In production (Vercel), errors are lost after function execution; no audit trail for failed operations; hard to debug transient issues
- Fix approach: Add structured logging (winston, pino) with request correlation IDs; integrate with monitoring service (Sentry, DataDog)

**Missing error boundaries in frontend:**
- Issue: No global error handler or error boundary component
- Files: `frontend/src/App.jsx`
- Impact: Unhandled promise rejections or component errors could cause white screen of death
- Fix approach: Add React Error Boundary component and global fetch error handler with user-friendly fallback UI

## Security Concerns

**CORS allows all origins:**
- Issue: `cors()` middleware with no configuration
- Files: `api/index.js` (line 10)
- Impact: If deployed to production domain, API accepts requests from any origin, enabling CSRF attacks and unauthorized API consumption
- Fix approach: Restrict CORS to specific frontend domain: `cors({ origin: process.env.FRONTEND_URL })`

**No authentication or authorization:**
- Issue: All endpoints are completely open; no user authentication or role-based access control
- Files: `api/routes/animals.js`, `api/routes/medical.js`, `api/routes/species.js`
- Impact: Any public visitor can create, edit, delete animals and medical records; no audit trail of who made changes
- Fix approach: Implement authentication (JWT or session-based), add user ownership fields to records, enforce authorization checks

**No rate limiting:**
- Issue: No rate limiting on API endpoints
- Files: `api/index.js`, `api/routes/animals.js`
- Impact: Malicious users could hammer the API causing DoS; seed/species endpoints could be scraped
- Fix approach: Add rate limiting middleware (express-rate-limit) with per-IP or per-user limits

**Environment variable not validated:**
- Issue: `process.env.MONGODB_URI` used without existence check
- Files: `api/db.js` (line 7)
- Impact: If env var is missing or malformed, connection fails silently; no early validation
- Fix approach: Add startup validation that ensures required env vars exist and are properly formatted

## Frontend Data Handling

**Missing error handling in async operations:**
- Issue: Several fetch calls don't check response status or handle network errors
- Files: `frontend/src/pages/AnimalList.jsx` (line 30), `frontend/src/pages/AnimalDetail.jsx` (line 29-30)
- Impact: Network failures or API errors display as runtime errors; users see JSON parsing errors instead of meaningful messages
- Fix approach: Add response.ok checks and catch blocks to all fetch calls; centralize error handling

**State synchronization risk in AnimalDetail:**
- Issue: Form state (`editForm`) initialized from animal data but not resynced if edit is cancelled
- Files: `frontend/src/pages/AnimalDetail.jsx` (lines 20-21, 34, 49-50)
- Impact: If user starts editing, then cancels, then edits again, previous unsaved changes persist in form
- Fix approach: Reset editForm when entering edit mode or when cancelling

**Potential data loss on navigation:**
- Issue: No unsaved changes warning when user navigates away from form
- Files: `frontend/src/pages/AnimalCreate.jsx`, `frontend/src/pages/AnimalDetail.jsx`
- Impact: Users could accidentally lose multi-step form data by clicking back or navigating away
- Fix approach: Add `beforeunload` event listener or router transition guard to warn on unsaved changes

## Performance Issues

**N+1 query problem in animal detail view:**
- Issue: Fetches animal, then separately fetches medical records
- Files: `frontend/src/pages/AnimalDetail.jsx` (lines 28-31)
- Impact: Minor for single animal, but list view queries each animal separately if lazy-loading
- Fix approach: For list view, consider adding `/api/animals?includeStats=true` endpoint; for detail, current pattern is acceptable

**No pagination on animal list:**
- Issue: Queries return all animals with no limit
- Files: `api/routes/animals.js` (line 13), `frontend/src/pages/AnimalList.jsx`
- Impact: With thousands of animals, page becomes slow; all records loaded into memory
- Fix approach: Add pagination query parameters (`limit`, `skip`) to both API and frontend

**Species search limited to 10 results:**
- Issue: Search results hardcoded to 10 items
- Files: `api/routes/species.js` (line 16)
- Impact: If more than 10 species match, user can't discover them
- Fix approach: Add configurable limit parameter or increase to reasonable default (50-100)

**Map component loads external images on every render:**
- Issue: Leaflet tile layer requests are made on every component render
- Files: `frontend/src/components/MapPicker.jsx` (lines 36-39)
- Impact: Minor, but could cause unnecessary network requests if parent re-renders
- Fix approach: Memoize MapContainer or add React.memo to prevent re-initialization

## Missing Features / Incomplete Implementation

**Medical records form doesn't properly set default date:**
- Issue: Medical record form has `date` field but doesn't default to today's date
- Files: `frontend/src/pages/AnimalDetail.jsx` (line 23, 185)
- Impact: Users must manually enter today's date every time; likely data entry error source
- Fix approach: Set `medForm.date` default to `new Date().toISOString().split('T')[0]` on form initialization

**AnimalDetail references removed fields:**
- Issue: Form references `animal.name`, `animal.species`, `animal.notes` which don't exist in schema
- Files: `frontend/src/pages/AnimalDetail.jsx` (lines 34, 54, 94-95, 140-142, 149-152)
- Impact: Edit form shows undefined values; form fields will be empty even if data was saved
- Fix approach: Either add these fields to Animal schema or use correct field names (`commonName`/`scientificName` instead of `species`, remove `notes`)

**Missing medical record date handling:**
- Issue: Medical records create with `date` but schema defaults to `createdAt`
- Files: `frontend/src/pages/AnimalDetail.jsx` (lines 66, 185), `api/models/MedicalRecord.js` (lines 5-6)
- Impact: If user provides a date, it's sent but the schema validation passes empty date through
- Fix approach: Ensure form sends all fields correctly; validate schema accepts provided dates

## Test Coverage Gaps

**No automated tests:**
- Issue: No test files exist for any route, model, or component
- Files: Entire project
- Impact: Regressions go unnoticed; animal data deletion has no safeguards; refactoring dangerous
- Fix approach: Add jest/vitest for backend routes and frontend components; prioritize medical records and deletion logic

**No validation tests:**
- Issue: Input validation behavior never tested
- Impact: Data integrity issues could develop silently
- Fix approach: Add test suite for edge cases (empty strings, negative numbers, missing required fields, very long inputs)

## Deployment & Configuration

**No build configuration for API:**
- Issue: API has no build step; runs directly with `node index.js`
- Files: `api/package.json`, `vercel.json`
- Impact: Hard to add code linting, TypeScript, or build-time optimizations
- Fix approach: Optional TypeScript migration would help catch bugs; at minimum add ESLint

**Frontend build destination may conflict:**
- Issue: Vercel config expects dist at `frontend/dist` but vite.config.js not checked
- Files: `vercel.json` (line 11), `frontend/vite.config.js`
- Impact: If Vite config differs, deployment fails silently
- Fix approach: Verify vite.config.js explicitly sets `build.outDir` to 'dist'

**No environment validation at startup:**
- Issue: No startup check that MONGODB_URI is set before server accepts connections
- Files: `api/index.js`, `api/db.js`
- Impact: Server starts and accepts requests, then fails on first database access
- Fix approach: Add startup validation middleware that fails early if env vars missing

## Fragile Areas

**Regex-based filtering is brittle:**
- Issue: Animal and species lookup uses `new RegExp()` without escaping special regex characters
- Files: `api/routes/animals.js` (lines 11-12), `api/routes/species.js` (lines 11-14)
- Impact: If user searches for species like "C++" or "(something)", regex breaks
- Fix approach: Use MongoDB text search indexes or sanitize regex input with escape function

**Animal deletion cascades to medical records without transaction:**
- Issue: Delete animal, then separately delete medical records; no transaction
- Files: `api/routes/animals.js` (lines 56-65)
- Impact: If deletion fails midway, orphaned medical records remain in database
- Fix approach: Wrap deletion in MongoDB session/transaction or use cascade delete at schema level

**Form step navigation has no validation:**
- Issue: AnimalCreate multi-step form allows moving between steps without validating current step
- Files: `frontend/src/pages/AnimalCreate.jsx` (lines 123, 202, 266)
- Impact: User can skip required fields by going back/forward; invalid data submitted
- Fix approach: Add validation before allowing step transitions; disable next button if required fields empty

## Type Safety

**JavaScript without type checking:**
- Issue: Entire backend in plain JavaScript with no JSDoc or TypeScript
- Files: `api/**/*.js`
- Impact: Hard to catch type mismatches; unclear function signatures; refactoring risky
- Fix approach: Add JSDoc annotations or migrate to TypeScript; even basic JSDoc helps with IDE support

---

*Concerns audit: 2026-03-20*
