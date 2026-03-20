# External Integrations

**Analysis Date:** 2026-03-20

## APIs & External Services

**Mapping:**
- Leaflet/OpenStreetMap - Provides map tiles and geolocation features
  - No SDK authentication required - public OSM tiles used
  - Component: `frontend/src/components/MapPicker.jsx`

## Data Storage

**Databases:**
- MongoDB (MongoDB Atlas)
  - Connection: `MONGODB_URI` environment variable
  - Connection string format: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/wildlife-rescue?retryWrites=true&w=majority`
  - Client: Mongoose ^8.1.1 (`api/db.js`)
  - Collections:
    - `animals` - Animal records with rescue, clinical, and status info
    - `medicalrecords` - Medical history per animal
    - `species` - Reference data for species (seeded from `api/seed.js`)

**File Storage:**
- Not implemented - file uploads not supported

**Caching:**
- None detected - caching layer not present

## Authentication & Identity

**Auth Provider:**
- None - Application has no authentication system
- All API endpoints are publicly accessible
- No user management or access control

## Monitoring & Observability

**Error Tracking:**
- None detected - no error tracking service configured

**Logs:**
- Console logging only
- Vercel serverless export suggests potential structured logging via platform

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from serverless export in `api/index.js`: `module.exports = app;`)
- Local development on `localhost:3001` (API) and `localhost:5173` (Vite default)

**CI Pipeline:**
- None detected - no GitHub Actions, GitLab CI, or other pipeline configuration

## Environment Configuration

**Required env vars:**
- `MONGODB_URI` - MongoDB connection string
- `PORT` - API port (defaults to 3001 if not set)

**Secrets location:**
- `.env` file (not committed)
- Template provided in `.env.example`
- Loaded via Node.js `--env-file` flag

## API Endpoints

**Animal Management:**
- `GET /api/animals` - List animals with optional filtering (status, species, search)
- `POST /api/animals` - Create new animal record
- `GET /api/animals/:id` - Get single animal details
- `PUT /api/animals/:id` - Update animal record
- `DELETE /api/animals/:id` - Delete animal and associated medical records

**Medical Records:**
- `GET /api/animals/:id/medical` - Get medical history for animal
- `POST /api/animals/:id/medical` - Add medical record for animal
- `DELETE /api/medical/:id` - Delete medical record (inferred from schema)

**Species Reference:**
- `GET /api/species` - List species (used by autocomplete)

**Health Check:**
- `GET /api/health` - API health endpoint returning `{status: 'ok'}`

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Frontend-to-API Communication

**Pattern:**
- Direct `fetch()` API calls from React components
- No abstraction layer or API client library
- Vite dev server proxies `/api/*` requests to `http://localhost:3001` (`frontend/vite.config.js`)

**Example:**
```javascript
// From frontend/src/pages/AnimalList.jsx
fetch(`/api/animals?${params}`)
  .then((r) => r.json())
  .then(setAnimals)
  .catch((e) => setError(e.message))
```

---

*Integration audit: 2026-03-20*
