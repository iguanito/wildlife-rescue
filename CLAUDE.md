<!-- GSD:project-start source:PROJECT.md -->
## Project

**Wildlife Rescue Manager**

A web application for managing daily operations at a wildlife rescue center. Staff, vets, and volunteers use it to track every animal from the moment it arrives through treatment and release. It replaces paper records and spreadsheets with a searchable, shared system built for high-volume centers handling thousands of animals per year.

**Core Value:** Every animal's complete journey — intake, daily care, medical treatment, and outcome — is tracked in one place so nothing falls through the cracks.

### Constraints

- **Tech Stack**: React + Express + MongoDB + Tailwind — existing stack, no changes
- **Single center**: No multi-tenancy needed, single MongoDB database
- **No dedicated mobile app**: Responsive web only
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (Node.js) - API backend
- JSX/React - Frontend UI
- JavaScript (ES6+) - Both frontend and backend
- None detected
## Runtime
- Node.js (version not specified in lockfiles)
- npm
- Lockfile: Present (`package-lock.json`)
## Frameworks
- Express.js ^4.18.2 - REST API server (`api/index.js`)
- React ^18.2.0 - UI framework (`frontend/src/App.jsx`)
- React Router DOM ^6.22.0 - Frontend routing (`frontend/src/main.jsx`)
- Leaflet ^1.9.4 - Map library for geolocation features (`frontend/src/components/MapPicker.jsx`)
- React Leaflet ^4.2.1 - React wrapper for Leaflet
- Tailwind CSS ^3.4.1 - Utility-first CSS framework (`frontend/tailwind.config.js`)
- PostCSS ^8.4.35 - CSS processing
- Autoprefixer ^10.4.17 - Browser prefix handling
- Vite ^5.1.0 - Frontend build tool (`frontend/vite.config.js`)
- @vitejs/plugin-react ^4.2.1 - React plugin for Vite
- Concurrently ^8.2.2 - Run multiple npm scripts simultaneously (`package.json`)
## Key Dependencies
- Mongoose ^8.1.1 - MongoDB ODM for database operations (`api/db.js`, `api/models/`)
- CORS ^2.8.5 - Cross-Origin Resource Sharing middleware (`api/index.js`)
- express - Web server framework
- leaflet - GIS/mapping library
- react-router-dom - Frontend navigation
- tailwindcss - Styling framework
## Configuration
- `.env` file containing `MONGODB_URI` and `PORT`
- `.env.example` provides template for required variables
- Environment variables loaded via `node --env-file=../.env` flag
- `vite.config.js` - Vite configuration with React plugin and API proxy
- `tailwind.config.js` - Tailwind CSS configuration scanning `./src/**/*.{js,jsx}`
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer plugins
## Platform Requirements
- Node.js with npm
- Two npm workspaces: `api/` and `frontend/`
- Concurrent process execution for dev server
- Node.js runtime for API server (port 3001 by default)
- Static asset serving for React build output
- Deployment exports Express app as module (compatible with Vercel serverless)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Backend models: PascalCase (e.g., `Animal.js`, `MedicalRecord.js`, `Species.js`)
- Backend routes: camelCase (e.g., `animals.js`, `medical.js`, `species.js`)
- Frontend components: PascalCase (e.g., `Layout.jsx`, `AnimalCreate.jsx`, `SpeciesAutocomplete.jsx`)
- Frontend pages: PascalCase (e.g., `AnimalList.jsx`, `AnimalDetail.jsx`)
- Utility/configuration files: camelCase (e.g., `db.js`, `index.js`, `seed.js`)
- camelCase for all function names: `handleChange`, `handleSubmit`, `connectDB`
- Helper/utility functions: camelCase (e.g., `handleSelect`, `encodeURIComponent`)
- Component functions: default export with PascalCase (e.g., `export default function AnimalCreate()`)
- camelCase for all variable declarations: `animals`, `animalGroup`, `intakeDate`, `distanceFromCenter`
- Constants in components: camelCase with UPPERCASE for semantic constants (e.g., `STATUS_COLORS`, `STATUS_LABELS`, `EMPTY_FORM`, `STEPS`)
- Destructured variables: camelCase (e.g., `{ status, species, search } = req.query`)
- Mongoose schemas use camelCase field names matching database field convention
- Schema variable naming: `[EntityName]Schema` (e.g., `animalSchema`, `medicalRecordSchema`, `speciesSchema`)
- Model export pattern: `mongoose.model('[ModelName]', [schemaVariable])`
- Props use camelCase (e.g., `label`, `field`, `value`, `onChange`, `onSelect`)
- Event handlers prefixed with `on`: `onChange`, `onSelect`, `onMouseDown`, `onFocus`, `onClick`
## Code Style
- No linter/formatter explicitly configured (eslint/prettier configs not found)
- Consistent 2-space indentation observed throughout
- Consistent trailing semicolons on statements
- No dedicated linting tool configured
- Code follows implicit conventions across the codebase
- Backend (Node.js/Express): single quotes for strings (e.g., `'mongoose'`, `'express'`)
- Frontend (React): single quotes for strings within JSX when needed (e.g., `'flex'`, `'block'`)
- JSX className strings: template literals or single quotes depending on dynamic content
## Import Organization
- Relative paths using `./` for same directory (e.g., `'./db'`)
- Relative paths using `../` for parent directories (e.g., `'../models/Animal'`)
- Absolute paths in routes (e.g., `'/api/animals'`)
- No path aliases configured
## Error Handling
- Try-catch blocks wrapping async/await operations
- Catch blocks extract error message: `catch (err) { res.status(code).json({ error: err.message }) }`
- Standardized error response format: `{ error: 'message' }`
- useState for error state: `const [error, setError] = useState(null)`
- Render error in UI: `{error && <p className="text-red-600">{error}</p>}`
- Set error on catch: `catch (err) { setError(err.message) }`
## Logging
- Backend startup logging: `console.log('API running on http://localhost:${PORT}')`
- No structured logging middleware detected
- Database connection logging minimal
## Comments
- Inline comments rare in codebase
- Comments used for semantic section breaks in seed data (e.g., `// ── MAMMALS ──`)
- No JSDoc/TSDoc documentation detected
## Function Design
- Route handlers 5-15 lines typically
- Component functions 50-120 lines for complex pages
- Helper functions 3-10 lines
- Destructuring used for req.query parameters: `const { status, species, search } = req.query`
- Component props destructured in parameters: `function Field({ label, required, children, half })`
- API routes return JSON via `res.json(data)` or `res.status(code).json(data)`
- Components return JSX
- Async functions return Promises
## Module Design
- Backend: `module.exports = [entity]` (e.g., `module.exports = router`)
- Frontend: `export default function ComponentName()` for main export
- Models: `module.exports = mongoose.model('ModelName', schema)`
- Not used; imports are always specific file paths
## Tailwind CSS Classes
- Tailwind utility classes used throughout frontend components
- Common class patterns:
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Decoupled frontend and backend codebases with independent build systems
- Express.js REST API with Mongoose ODM for MongoDB database layer
- React SPA with client-side routing using React Router
- Multi-step form UI with component composition
- Read-only species master data with search endpoints
## Layers
- Purpose: User interface for animal rescue management - displaying listings, creating new animal records, viewing details, and managing medical records
- Location: `frontend/src/`
- Contains: React components (pages, UI components), page templates, styles
- Depends on: Express API endpoints at `/api/*`
- Used by: End users in web browsers
- Purpose: Data persistence and business logic - CRUD operations on animals and medical records, species lookup
- Location: `api/`
- Contains: Express route handlers, Mongoose models, database connection utility
- Depends on: MongoDB database
- Used by: Frontend making REST calls
- Purpose: Persistent storage for animal records, medical records, and species master data
- Accessed through: Mongoose schemas and models
- Contains: Animal, MedicalRecord, Species collections
## Data Flow
- Frontend: Local React component state with `useState` for forms, loading, errors
- No global state management (Redux, Context API, Zustand)
- Backend: Stateless - each request independently queries MongoDB
- Database connection singleton pattern in `api/db.js` - caches connection on first request
## Key Abstractions
- Purpose: Schema defining animal data structure and validation
- Examples: `api/models/Animal.js`
- Pattern: Mongoose schema with embedded rescue info, clinical info, and identity fields. Uses enums for sex and status fields.
- Purpose: Schema for clinical visits and treatment records linked to animals
- Examples: `api/models/MedicalRecord.js`
- Pattern: Mongoose schema with reference to Animal ObjectId via `ref: 'Animal'` for relationship
- Purpose: Master data lookup for wildlife species with full text search support
- Examples: `api/models/Species.js`
- Pattern: Mongoose schema with text index on commonName/scientificName and categorical index on group enum
- Purpose: Express middleware that maps HTTP methods to MongoDB operations
- Examples: `api/routes/animals.js`, `api/routes/medical.js`, `api/routes/species.js`
- Pattern: Standard RESTful routes - GET list with filters, POST create, GET by ID, PUT update, DELETE remove. Cascading deletes on animal deletion remove associated medical records.
- Purpose: Full-page components handling specific routes
- Examples: `frontend/src/pages/AnimalList.jsx`, `frontend/src/pages/AnimalCreate.jsx`, `frontend/src/pages/AnimalDetail.jsx`
- Pattern: Functional components with `useState` for local state, `useEffect` for data fetching, error handling
- Purpose: Reusable UI elements (not full pages)
- Examples: `frontend/src/components/SpeciesAutocomplete.jsx`, `frontend/src/components/MapPicker.jsx`, `frontend/src/components/Layout.jsx`
- Pattern: Controlled inputs with callbacks, ref containers for click-outside detection, Leaflet map integration with custom marker handlers
## Entry Points
- Location: `frontend/src/main.jsx`
- Triggers: When user navigates to app URL in browser
- Responsibilities: Renders React root, wraps app with BrowserRouter for client-side routing, imports global CSS and Leaflet styles
- Location: `api/index.js`
- Triggers: `npm run dev` or `node index.js` or serverless function invocation
- Responsibilities: Instantiates Express app, configures CORS and JSON parsing middleware, connects to MongoDB on first request, mounts route handlers, listens on PORT (3001 for local dev)
## Error Handling
- Routes wrap async handlers in try-catch blocks
- Validation errors from Mongoose return 400 status with error message
- Not found responses return 404 with descriptive message
- Database connection failures return 500 with generic error message
- Frontend catches promise errors and displays in state/UI (via `setError`)
- Frontend shows loading states during async operations
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
