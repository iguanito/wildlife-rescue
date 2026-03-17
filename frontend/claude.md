# Wildlife Rescue Center App

## Project Overview
Full-stack web app to manage animals in a wildlife rescue center.
Monorepo with a React frontend and Express backend (Vercel serverless).

## Architecture
- /frontend: React + Vite + React Router + Tailwind CSS
- /api: Express.js adapted for Vercel serverless functions
- Database: MongoDB Atlas via Mongoose
- Hosting: Vercel (both frontend and backend)

## Commands
### Frontend
- `cd frontend && npm run dev` - Start frontend dev server (port 5173)
- `cd frontend && npm run build` - Build for production
- `cd frontend && npm run lint` - Run ESLint

### Backend
- `cd api && npm run dev` - Start backend locally with vercel dev
- `vercel dev` - Run full stack locally (recommended)

## Environment Variables
- `MONGODB_URI` - MongoDB Atlas connection string
- Never commit .env files — use .env.example as reference

## Code Conventions
- Use async/await, never callbacks
- Always handle errors with try/catch in API routes
- Use Mongoose models for all DB access — never raw queries
- React components go in /frontend/src/components
- API routes go in /api/routes/
- Keep components small — split if over 100 lines

## Data Models
- Animal: name, species, intakeDate, status (intake/treatment/ready/adopted), notes
- MedicalRecord: animalId (ref), date, description, treatment, vet
- Adoption: animalId (ref), adopterName, adopterContact, adoptionDate

## API Structure
- GET/POST /api/animals
- GET/PUT/DELETE /api/animals/:id
- GET/POST /api/animals/:id/medical-records
- GET/POST /api/animals/:id/adoption

## Frontend Routes
- / - Animal list dashboard
- /animals/new - Intake form
- /animals/:id - Animal detail + medical records
- /animals/:id/adopt - Adoption form

## Deployment
- Frontend and backend deploy together via Vercel
- vercel.json routes /api/* to Express, everything else to React
- Always test with `vercel dev` before deploying

## What NOT to do
- Don't use SQL or any database other than MongoDB/Mongoose
- Don't create separate Vercel projects for frontend and backend
- Don't use class components in React — functional only
- Don't store sensitive data in frontend code