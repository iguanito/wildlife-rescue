# Technology Stack

**Analysis Date:** 2026-03-20

## Languages

**Primary:**
- JavaScript (Node.js) - API backend
- JSX/React - Frontend UI
- JavaScript (ES6+) - Both frontend and backend

**Secondary:**
- None detected

## Runtime

**Environment:**
- Node.js (version not specified in lockfiles)

**Package Manager:**
- npm
- Lockfile: Present (`package-lock.json`)

## Frameworks

**Core:**
- Express.js ^4.18.2 - REST API server (`api/index.js`)
- React ^18.2.0 - UI framework (`frontend/src/App.jsx`)

**Routing:**
- React Router DOM ^6.22.0 - Frontend routing (`frontend/src/main.jsx`)

**Maps:**
- Leaflet ^1.9.4 - Map library for geolocation features (`frontend/src/components/MapPicker.jsx`)
- React Leaflet ^4.2.1 - React wrapper for Leaflet

**Styling:**
- Tailwind CSS ^3.4.1 - Utility-first CSS framework (`frontend/tailwind.config.js`)
- PostCSS ^8.4.35 - CSS processing
- Autoprefixer ^10.4.17 - Browser prefix handling

**Build/Dev:**
- Vite ^5.1.0 - Frontend build tool (`frontend/vite.config.js`)
- @vitejs/plugin-react ^4.2.1 - React plugin for Vite
- Concurrently ^8.2.2 - Run multiple npm scripts simultaneously (`package.json`)

## Key Dependencies

**Critical:**
- Mongoose ^8.1.1 - MongoDB ODM for database operations (`api/db.js`, `api/models/`)
- CORS ^2.8.5 - Cross-Origin Resource Sharing middleware (`api/index.js`)

**Infrastructure:**
- express - Web server framework
- leaflet - GIS/mapping library
- react-router-dom - Frontend navigation
- tailwindcss - Styling framework

## Configuration

**Environment:**
- `.env` file containing `MONGODB_URI` and `PORT`
- `.env.example` provides template for required variables
- Environment variables loaded via `node --env-file=../.env` flag

**Build:**
- `vite.config.js` - Vite configuration with React plugin and API proxy
- `tailwind.config.js` - Tailwind CSS configuration scanning `./src/**/*.{js,jsx}`
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer plugins

## Platform Requirements

**Development:**
- Node.js with npm
- Two npm workspaces: `api/` and `frontend/`
- Concurrent process execution for dev server

**Production:**
- Node.js runtime for API server (port 3001 by default)
- Static asset serving for React build output
- Deployment exports Express app as module (compatible with Vercel serverless)

---

*Stack analysis: 2026-03-20*
