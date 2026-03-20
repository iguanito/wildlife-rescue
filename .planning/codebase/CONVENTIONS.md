# Coding Conventions

**Analysis Date:** 2026-03-20

## Naming Patterns

**Files:**
- Backend models: PascalCase (e.g., `Animal.js`, `MedicalRecord.js`, `Species.js`)
- Backend routes: camelCase (e.g., `animals.js`, `medical.js`, `species.js`)
- Frontend components: PascalCase (e.g., `Layout.jsx`, `AnimalCreate.jsx`, `SpeciesAutocomplete.jsx`)
- Frontend pages: PascalCase (e.g., `AnimalList.jsx`, `AnimalDetail.jsx`)
- Utility/configuration files: camelCase (e.g., `db.js`, `index.js`, `seed.js`)

**Functions:**
- camelCase for all function names: `handleChange`, `handleSubmit`, `connectDB`
- Helper/utility functions: camelCase (e.g., `handleSelect`, `encodeURIComponent`)
- Component functions: default export with PascalCase (e.g., `export default function AnimalCreate()`)

**Variables:**
- camelCase for all variable declarations: `animals`, `animalGroup`, `intakeDate`, `distanceFromCenter`
- Constants in components: camelCase with UPPERCASE for semantic constants (e.g., `STATUS_COLORS`, `STATUS_LABELS`, `EMPTY_FORM`, `STEPS`)
- Destructured variables: camelCase (e.g., `{ status, species, search } = req.query`)

**Types/Schemas:**
- Mongoose schemas use camelCase field names matching database field convention
- Schema variable naming: `[EntityName]Schema` (e.g., `animalSchema`, `medicalRecordSchema`, `speciesSchema`)
- Model export pattern: `mongoose.model('[ModelName]', [schemaVariable])`

**React Props:**
- Props use camelCase (e.g., `label`, `field`, `value`, `onChange`, `onSelect`)
- Event handlers prefixed with `on`: `onChange`, `onSelect`, `onMouseDown`, `onFocus`, `onClick`

## Code Style

**Formatting:**
- No linter/formatter explicitly configured (eslint/prettier configs not found)
- Consistent 2-space indentation observed throughout
- Consistent trailing semicolons on statements

**Linting:**
- No dedicated linting tool configured
- Code follows implicit conventions across the codebase

**Quote Usage:**
- Backend (Node.js/Express): single quotes for strings (e.g., `'mongoose'`, `'express'`)
- Frontend (React): single quotes for strings within JSX when needed (e.g., `'flex'`, `'block'`)
- JSX className strings: template literals or single quotes depending on dynamic content

## Import Organization

**Order (Node.js/CommonJS):**
1. External library imports (e.g., `const express = require('express')`)
2. Database/ORM imports (e.g., `const mongoose = require('mongoose')`)
3. Local model imports (e.g., `const Animal = require('../models/Animal')`)
4. Local route/utility imports (e.g., `const connectDB = require('./db')`)

Example from `api/index.js`:
```javascript
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const animalsRouter = require('./routes/animals');
const medicalRouter = require('./routes/medical');
const speciesRouter = require('./routes/species');
```

**Order (React/ES6 Modules):**
1. React core imports (e.g., `import { useState } from 'react'`)
2. React Router imports (e.g., `import { Routes, Route } from 'react-router-dom'`)
3. Local component imports (e.g., `import Layout from './components/Layout'`)
4. Local page imports (e.g., `import AnimalList from './pages/AnimalList'`)

Example from `frontend/src/App.jsx`:
```javascript
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AnimalList from './pages/AnimalList';
```

**Path Style:**
- Relative paths using `./` for same directory (e.g., `'./db'`)
- Relative paths using `../` for parent directories (e.g., `'../models/Animal'`)
- Absolute paths in routes (e.g., `'/api/animals'`)
- No path aliases configured

## Error Handling

**Pattern:**
- Try-catch blocks wrapping async/await operations
- Catch blocks extract error message: `catch (err) { res.status(code).json({ error: err.message }) }`
- Standardized error response format: `{ error: 'message' }`

Example from `api/routes/animals.js`:
```javascript
router.get('/', async (req, res) => {
  try {
    const { status, species, search } = req.query;
    const filter = {};
    // ... logic
    res.json(animals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Frontend Error Handling:**
- useState for error state: `const [error, setError] = useState(null)`
- Render error in UI: `{error && <p className="text-red-600">{error}</p>}`
- Set error on catch: `catch (err) { setError(err.message) }`

## Logging

**Framework:** Native console only (no structured logging library)

**Patterns:**
- Backend startup logging: `console.log('API running on http://localhost:${PORT}')`
- No structured logging middleware detected
- Database connection logging minimal

## Comments

**When to Comment:**
- Inline comments rare in codebase
- Comments used for semantic section breaks in seed data (e.g., `// ── MAMMALS ──`)
- No JSDoc/TSDoc documentation detected

## Function Design

**Size:** Functions kept concise
- Route handlers 5-15 lines typically
- Component functions 50-120 lines for complex pages
- Helper functions 3-10 lines

**Parameters:**
- Destructuring used for req.query parameters: `const { status, species, search } = req.query`
- Component props destructured in parameters: `function Field({ label, required, children, half })`

**Return Values:**
- API routes return JSON via `res.json(data)` or `res.status(code).json(data)`
- Components return JSX
- Async functions return Promises

## Module Design

**Exports:**
- Backend: `module.exports = [entity]` (e.g., `module.exports = router`)
- Frontend: `export default function ComponentName()` for main export
- Models: `module.exports = mongoose.model('ModelName', schema)`

**Barrel Files:**
- Not used; imports are always specific file paths

## Tailwind CSS Classes

**Usage:**
- Tailwind utility classes used throughout frontend components
- Common class patterns:
  - Layout: `flex`, `flex-1`, `min-h-screen`, `w-full`, `gap-`
  - Colors: `bg-green-800`, `text-white`, `hover:bg-green-700`
  - Typography: `text-sm`, `font-medium`, `font-bold`, `uppercase`
  - Spacing: `px-3`, `py-2`, `mb-1`, `mb-6`, `space-y-1`
  - States: `focus:outline-none`, `focus:ring-2`, `hover:underline`
  - Grid layouts: `grid`, `grid-cols-2`, `col-span-2`
  - Responsive: minimal use of breakpoints observed

---

*Convention analysis: 2026-03-20*
