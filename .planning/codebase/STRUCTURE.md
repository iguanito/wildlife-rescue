# Codebase Structure

**Analysis Date:** 2026-03-20

## Directory Layout

```
wildlife-rescue/
├── api/                      # Express REST API backend
│   ├── index.js              # Server entry point, route mounting
│   ├── db.js                 # MongoDB connection singleton
│   ├── models/               # Mongoose schemas
│   │   ├── Animal.js
│   │   ├── MedicalRecord.js
│   │   └── Species.js
│   ├── routes/               # Express route handlers
│   │   ├── animals.js        # CRUD + medical record endpoints
│   │   ├── medical.js        # Medical record update/delete
│   │   └── species.js        # Species search endpoint
│   ├── package.json
│   └── seed.js               # Database seeding script
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── main.jsx          # React root entry point
│   │   ├── App.jsx           # Router setup and route definitions
│   │   ├── index.css         # Global styles (Tailwind)
│   │   ├── pages/            # Full-page components (routed)
│   │   │   ├── AnimalList.jsx
│   │   │   ├── AnimalCreate.jsx
│   │   │   └── AnimalDetail.jsx
│   │   └── components/       # Reusable components (not routed)
│   │       ├── Layout.jsx    # Sidebar + main content wrapper
│   │       ├── SpeciesAutocomplete.jsx
│   │       └── MapPicker.jsx
│   ├── vite.config.js        # Vite build config, API proxy setup
│   ├── package.json
│   ├── index.html
│   └── tailwind.config.js
├── package.json              # Root monorepo scripts
└── .env                      # Environment variables (not committed)
```

## Directory Purposes

**api/:**
- Purpose: Node.js + Express backend server providing REST API
- Contains: Database connection, models, route handlers, seed data
- Key files: `api/index.js` (entry point), `api/db.js` (connection)

**api/models/:**
- Purpose: Mongoose schema definitions for MongoDB collections
- Contains: Animal, MedicalRecord, Species schemas with validation rules and indexes
- Key files: `api/models/Animal.js` (45 fields across identity/rescue/clinical sections)

**api/routes/:**
- Purpose: Express route handlers mapping HTTP methods to MongoDB operations
- Contains: GET/POST/PUT/DELETE endpoint implementations with error handling
- Key files: `api/routes/animals.js` (main CRUD + medical records), `api/routes/species.js` (search)

**frontend/src/:**
- Purpose: React application source code
- Contains: Entry point, router, pages, components, styles
- Key files: `frontend/src/main.jsx` (root), `frontend/src/App.jsx` (routes)

**frontend/src/pages/:**
- Purpose: Full routed pages - each corresponds to a React Router route
- Contains: AnimalList (listings with filters), AnimalCreate (4-step form), AnimalDetail (view + edit + medical)
- Key files: Used by `App.jsx` route definitions

**frontend/src/components/:**
- Purpose: Reusable UI components not directly routed
- Contains: Layout wrapper with sidebar nav, SpeciesAutocomplete (debounced dropdown search), MapPicker (Leaflet map)
- Key files: `components/Layout.jsx` (wraps all pages)

## Key File Locations

**Entry Points:**
- `api/index.js`: Express server, CORS setup, route mounting, local dev listener
- `frontend/src/main.jsx`: React root render, Router wrapper, Leaflet CSS import
- `frontend/src/App.jsx`: Route definitions (/, /animals, /animals/new, /animals/:id)

**Configuration:**
- `api/package.json`: Dependencies (express, mongoose, cors), scripts (dev, start, seed)
- `frontend/package.json`: Dependencies (react, react-router-dom, leaflet, tailwindcss), build scripts
- `frontend/vite.config.js`: Vite build config, proxy to http://localhost:3001 for /api calls
- `.env`: MONGODB_URI, PORT (referenced via process.env)

**Core Logic:**
- `api/db.js`: Lazy-loaded MongoDB connection with singleton pattern
- `api/models/Animal.js`: Full animal record schema with 45+ fields
- `api/models/MedicalRecord.js`: Linked records with animal ObjectId reference
- `api/models/Species.js`: Master data with text/group indexes for search
- `api/routes/animals.js`: CRUD routes + cascading medical record delete
- `frontend/src/pages/AnimalCreate.jsx`: 4-step form with state management (270+ lines)

**Testing:**
- Not found - no test files in codebase

## Naming Conventions

**Files:**
- API route files: lowercase noun plural (`animals.js`, `medical.js`, `species.js`)
- API model files: PascalCase noun singular (`Animal.js`, `MedicalRecord.js`, `Species.js`)
- React page files: PascalCase with "Page" suffix (AnimalList, AnimalCreate, AnimalDetail)
- React component files: PascalCase without suffix (Layout, SpeciesAutocomplete, MapPicker)

**Directories:**
- Backend: lowercase plural for collections (`models/`, `routes/`)
- Frontend: lowercase for code organization (`pages/`, `components/`, `src/`)

**Code Identifiers:**
- Database fields: camelCase (givenName, scientificName, incomeReasons, distanceFromCenter)
- Variable names: camelCase (isOpen, setAnimal, editForm)
- React state: plain camelCase (animals, loading, error) + setState camelCase (setAnimals, setLoading)
- Constants: UPPERCASE with underscores for constants (STATUS_COLORS, STATUS_LABELS, EMPTY_FORM, STEPS)
- CSS classes: Tailwind utility classes (px-6, py-3, bg-green-700, text-gray-900)

## Where to Add New Code

**New Feature (e.g., Diet Management):**
- Backend data model: `api/models/Diet.js` - Mongoose schema with animal reference
- Backend routes: `api/routes/diet.js` - GET/POST/PUT/DELETE handlers
- Frontend page: `frontend/src/pages/DietList.jsx` - listing/management page
- Add route to `frontend/src/App.jsx`: `<Route path="/diet" element={<DietList />} />`
- Add nav item to `frontend/src/components/Layout.jsx` navItems array

**New Component (e.g., ConfirmDialog):**
- Create: `frontend/src/components/ConfirmDialog.jsx`
- Pattern: Functional component with onClick/onConfirm callbacks, controlled visibility
- Use: Import in pages where needed and call via `setShowConfirmDialog(true)`

**Utilities/Helpers:**
- No utilities directory exists - add to `frontend/src/` if needed
- Consider: `frontend/src/utils/dateFormatters.js`, `frontend/src/utils/apiClient.js`

**API Middleware (e.g., auth validation):**
- Create middleware function in `api/index.js` or dedicated file
- Apply before route mounting: `app.use(authMiddleware)` before `app.use('/api/animals', animalsRouter)`

## Special Directories

**frontend/public/:**
- Purpose: Static assets served as-is by Vite dev server
- Generated: No
- Committed: Yes (contains favicon, index.html entry)

**api/node_modules/, frontend/node_modules/:**
- Purpose: Installed npm dependencies
- Generated: Yes (from package-lock.json)
- Committed: No (.gitignore excludes)

**.vercel/:**
- Purpose: Vercel deployment configuration
- Generated: Yes (auto-created by Vercel CLI)
- Committed: Yes

**.env:**
- Purpose: Environment variables (MONGODB_URI, PORT)
- Generated: No (developer creates)
- Committed: No (.gitignore excludes - never commit secrets)

## File Organization Patterns

**API Route Handler Pattern:**
```javascript
// api/routes/animals.js
const router = require('express').Router();
const Model = require('../models/Model');

router.get('/', async (req, res) => {
  try {
    const items = await Model.find(filter);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

**React Page Pattern:**
```javascript
// frontend/src/pages/PageName.jsx
import { useEffect, useState } from 'react';

export default function PageName() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/endpoint')
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-gray-500">Loading...</p>}
      {/* Content */}
    </div>
  );
}
```

**React Component Pattern:**
```javascript
// frontend/src/components/ComponentName.jsx
import { useState, useRef } from 'react';

export default function ComponentName({ prop1, onCallback }) {
  const [state, setState] = useState(null);
  const ref = useRef(null);

  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```
