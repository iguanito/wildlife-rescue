# Architecture

**Analysis Date:** 2026-03-20

## Pattern Overview

**Overall:** Monorepo with separate frontend and API layers, following a classic client-server architecture with clear separation of concerns.

**Key Characteristics:**
- Decoupled frontend and backend codebases with independent build systems
- Express.js REST API with Mongoose ODM for MongoDB database layer
- React SPA with client-side routing using React Router
- Multi-step form UI with component composition
- Read-only species master data with search endpoints

## Layers

**Frontend (React/Vite):**
- Purpose: User interface for animal rescue management - displaying listings, creating new animal records, viewing details, and managing medical records
- Location: `frontend/src/`
- Contains: React components (pages, UI components), page templates, styles
- Depends on: Express API endpoints at `/api/*`
- Used by: End users in web browsers

**Backend API (Express):**
- Purpose: Data persistence and business logic - CRUD operations on animals and medical records, species lookup
- Location: `api/`
- Contains: Express route handlers, Mongoose models, database connection utility
- Depends on: MongoDB database
- Used by: Frontend making REST calls

**Data Layer (MongoDB/Mongoose):**
- Purpose: Persistent storage for animal records, medical records, and species master data
- Accessed through: Mongoose schemas and models
- Contains: Animal, MedicalRecord, Species collections

## Data Flow

**Animal Creation Flow:**

1. User opens `/animals/new` page → `AnimalCreate` component renders multi-step form
2. User fills 4-step form (Animal Info, Rescue Info, Clinical Info, Status)
3. On submit, form data POSTed to `/api/animals`
4. API receives request in `api/routes/animals.js` → `POST /api/animals` handler
5. Handler calls `Animal.create(req.body)` via `api/models/Animal.js` Mongoose schema
6. MongoDB stores document, returns `_id`
7. Response returned to frontend, navigates to detail page

**Animal Listing & Filtering:**

1. `AnimalList` component on mount → fetches `/api/animals?status=...&search=...`
2. API handler applies MongoDB query filters using regex on fields
3. Results sorted by `createdAt` descending
4. Frontend renders table with status badges and links to detail view

**Medical Record Management:**

1. On animal detail page, user adds medical record via form
2. Form POSTed to `/api/animals/:id/medical`
3. API handler creates `MedicalRecord` with reference to animal's ObjectId
4. Medical records fetched separately via `/api/animals/:id/medical` GET
5. Records displayed in reverse chronological order

**Species Autocomplete:**

1. User types in species search field → `SpeciesAutocomplete` component
2. Debounced (250ms) fetch to `/api/species?q=query` on 2+ characters
3. API queries Species collection with text/regex search on commonName and scientificName
4. Results limited to 10, sorted by commonName
5. Dropdown displays matching species with group badge

**State Management:**

- Frontend: Local React component state with `useState` for forms, loading, errors
- No global state management (Redux, Context API, Zustand)
- Backend: Stateless - each request independently queries MongoDB
- Database connection singleton pattern in `api/db.js` - caches connection on first request

## Key Abstractions

**Animal Model:**
- Purpose: Schema defining animal data structure and validation
- Examples: `api/models/Animal.js`
- Pattern: Mongoose schema with embedded rescue info, clinical info, and identity fields. Uses enums for sex and status fields.

**MedicalRecord Model:**
- Purpose: Schema for clinical visits and treatment records linked to animals
- Examples: `api/models/MedicalRecord.js`
- Pattern: Mongoose schema with reference to Animal ObjectId via `ref: 'Animal'` for relationship

**Species Model:**
- Purpose: Master data lookup for wildlife species with full text search support
- Examples: `api/models/Species.js`
- Pattern: Mongoose schema with text index on commonName/scientificName and categorical index on group enum

**Route Handlers:**
- Purpose: Express middleware that maps HTTP methods to MongoDB operations
- Examples: `api/routes/animals.js`, `api/routes/medical.js`, `api/routes/species.js`
- Pattern: Standard RESTful routes - GET list with filters, POST create, GET by ID, PUT update, DELETE remove. Cascading deletes on animal deletion remove associated medical records.

**React Pages:**
- Purpose: Full-page components handling specific routes
- Examples: `frontend/src/pages/AnimalList.jsx`, `frontend/src/pages/AnimalCreate.jsx`, `frontend/src/pages/AnimalDetail.jsx`
- Pattern: Functional components with `useState` for local state, `useEffect` for data fetching, error handling

**React Components:**
- Purpose: Reusable UI elements (not full pages)
- Examples: `frontend/src/components/SpeciesAutocomplete.jsx`, `frontend/src/components/MapPicker.jsx`, `frontend/src/components/Layout.jsx`
- Pattern: Controlled inputs with callbacks, ref containers for click-outside detection, Leaflet map integration with custom marker handlers

## Entry Points

**Frontend:**
- Location: `frontend/src/main.jsx`
- Triggers: When user navigates to app URL in browser
- Responsibilities: Renders React root, wraps app with BrowserRouter for client-side routing, imports global CSS and Leaflet styles

**API Server:**
- Location: `api/index.js`
- Triggers: `npm run dev` or `node index.js` or serverless function invocation
- Responsibilities: Instantiates Express app, configures CORS and JSON parsing middleware, connects to MongoDB on first request, mounts route handlers, listens on PORT (3001 for local dev)

## Error Handling

**Strategy:** Basic try-catch in route handlers with JSON error responses

**Patterns:**
- Routes wrap async handlers in try-catch blocks
- Validation errors from Mongoose return 400 status with error message
- Not found responses return 404 with descriptive message
- Database connection failures return 500 with generic error message
- Frontend catches promise errors and displays in state/UI (via `setError`)
- Frontend shows loading states during async operations

## Cross-Cutting Concerns

**Logging:** None - console.log only used for startup message in development server

**Validation:** Mongoose schema validation on writes (create/update) with `runValidators: true` on updates. Frontend form validation is minimal (mostly HTML5 form attributes).

**Authentication:** Not implemented - no auth middleware, all endpoints public

**CORS:** Enabled globally on all routes via `cors()` middleware, allows any origin

**Database Connection:** Lazy connection pattern - first request to any endpoint triggers `connectDB()`. Connection state cached in module-level variable.
