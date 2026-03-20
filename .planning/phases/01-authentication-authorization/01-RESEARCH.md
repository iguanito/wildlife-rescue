# Phase 1: Authentication & Authorization - Research

**Researched:** 2026-03-20
**Domain:** JWT-based authentication, role-based access control, secure cookie management
**Confidence:** HIGH

## Summary

Phase 1 implements secure user authentication with email/password login and role-based access control across the application. The architecture uses JWT tokens stored in httpOnly cookies (SameSite=Strict) for XSS/CSRF protection, bcryptjs for password hashing, and Express middleware to guard all existing API routes. Frontend routes are protected with a ProtectedRoute wrapper in React Router v6, redirecting unauthenticated users to /login while preserving their destination URL for post-login redirect.

The implementation retrofits auth atomically to all three existing route modules (animals, medical, species) and seeds the first admin user via a one-time, idempotent script that reads credentials from .env.

**Primary recommendation:** Use httpOnly cookies with JWT for stateless server-side validation, middleware-based route protection on the API, and React Context + ProtectedRoute on the frontend for UX-layer gating.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Unauthenticated users hitting any protected route (e.g. `/animals`) are auto-redirected to `/login`
- **D-02:** After successful login, user is returned to their original destination (the URL they were trying to reach before being redirected to login)
- **D-03:** Login page uses a centered card layout with space for org name/logo — not a full-width form. Match existing green-800 color palette from Layout.
- **D-04:** JWT stored in httpOnly, SameSite=Strict cookie — never in localStorage or returned as a JS-accessible value
- **D-05:** Sidebar hides nav items the user's role cannot access — no showing disabled/grayed items
- **D-06:** Phase 1 nav: only "Animals" for all roles. Other nav items (Dashboard, Users, Reports) are added to the sidebar in their respective phases (3, 5, 6)
- **D-07:** Layout component receives current user from AuthContext and conditionally renders nav items
- **D-08:** First admin created via a one-time seed script (`npm run seed:admin` in `api/`)
- **D-09:** Seed script reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` — configurable, not hardcoded
- **D-10:** Seed script is idempotent — skips if an admin already exists
- **D-11:** Write actions (New Animal button, Edit, Add Medical Record) are hidden entirely for roles that cannot perform them — not shown disabled
- **D-12:** If a forbidden API call is made (direct URL, bug), the app shows a toast notification "Permission denied" — stays on current page, no redirect
- **D-13:** Frontend role gates are UX convenience only; all write routes enforce role checks server-side (API is authoritative)
- **D-14:** 4 roles: `admin`, `staff`, `vet`, `volunteer` — stored as enum on User model
- **D-15:** bcryptjs for password hashing (pure JS, no native deps)
- **D-16:** jsonwebtoken for JWT signing/verification
- **D-17:** Retrofit auth middleware to ALL existing routes atomically in this phase — `/api/animals`, `/api/medical`, `/api/species` all get auth in one go
- **D-18:** Add `createdBy` field to existing MedicalRecord schema as part of this phase's retrofit

### Claude's Discretion

- Exact JWT expiry duration (7 days is a reasonable default for "remember me")
- Specific cookie configuration flags beyond httpOnly + SameSite=Strict
- Error message wording for invalid credentials
- Toast component implementation (can use a simple custom component)

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within Phase 1 scope

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can log in with email and password | Standard: jsonwebtoken, bcryptjs; Router: POST /api/auth/login validates email/password via bcryptjs.compare(), returns JWT in httpOnly cookie |
| AUTH-02 | User session persists across browser restarts ("remember me") | Standard: JWT stored in httpOnly cookie is auto-sent by browser on each request; 7-day expiry aligns with typical "remember me" duration |
| AUTH-03 | User can log out from any page | Standard: DELETE /api/auth/logout clears httpOnly cookie; Frontend clears AuthContext on logout button click |
| AUTH-04 | Each user has one of four roles: admin, staff, vet, volunteer | Standard: User schema stores role as enum {admin, staff, vet, volunteer}; middleware extracts from decoded JWT |
| ACCESS-01 | Volunteer can view animal records but cannot create or edit | Pattern: requireRole('volunteer','staff','vet','admin') on GET routes; requireRole('staff','vet','admin') on POST/PUT animal routes |
| ACCESS-02 | Staff can create animals and add care logs | Pattern: requireRole('staff','vet','admin') middleware on POST /api/animals; Phase 2 adds care logs with staff-only gates |
| ACCESS-03 | Vet can create and edit medical records | Pattern: requireRole('vet','admin') on POST/PUT /api/medical routes |
| ACCESS-04 | Admin has full access to all features including user management | Pattern: requireRole('admin') guard on admin-only routes; Phase 5 adds user management endpoints |
| ACCESS-05 | All API write routes enforce server-side role checks | Standard: Express middleware requireRole() on every POST/PUT/DELETE route; verified by atomic retrofit in Phase 1 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsonwebtoken | 9.0.3 | JWT signing/verification | Industry standard for stateless authentication; Auth0 maintained; verified at https://www.npmjs.com/package/jsonwebtoken |
| bcryptjs | 3.0.3 | Password hashing (pure JS, no native deps) | Pure JavaScript implementation avoids native module build issues; cost factor 10 standard for password strength; verified at https://www.npmjs.com/package/bcryptjs |
| cookie-parser | 1.4.7 | Parse cookies into req.cookies | Standard Express middleware for extracting JWT from httpOnly cookies; verified at https://expressjs.com/en/resources/middleware/cookie-parser.html |
| React Router v6 | 6.22.0 | Client-side routing with protected routes | Already in project; Navigate component used for login redirect; useLocation for destination preservation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Mongoose | 8.1.1 | User model schema and queries | Already in project; store role enum, hashed passwords, deletedAt for soft deletes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| httpOnly cookies | localStorage | localStorage is XSS-vulnerable; attacker can inject JS to steal token |
| httpOnly cookies | sessionStorage | sessionStorage clears on browser close; doesn't support "remember me" requirement |
| bcryptjs | bcrypt (native) | native bcrypt has build dependencies; bcryptjs works pure JS across all platforms |
| jsonwebtoken | passport-jwt | Passport adds middleware overhead; direct jsonwebtoken.verify() is simpler for stateless auth |

**Installation:**
```bash
cd api && npm install jsonwebtoken@9.0.3 bcryptjs@3.0.3 cookie-parser@1.4.7
```

**Version verification:** All versions confirmed current as of March 2026.

## Architecture Patterns

### Recommended Project Structure
```
api/
├── models/
│   ├── Animal.js          (existing)
│   ├── MedicalRecord.js   (existing, add createdBy field)
│   ├── Species.js         (existing)
│   └── User.js            (new)
├── routes/
│   ├── animals.js         (existing, add auth middleware)
│   ├── medical.js         (existing, add auth middleware)
│   ├── species.js         (existing, add auth middleware)
│   ├── auth.js            (new: login, logout, me endpoints)
│   └── users.js           (new in Phase 5, stub for now)
├── middleware/
│   ├── authenticate.js    (new: JWT verification, attach req.user)
│   └── authorize.js       (new: requireRole() factory)
├── scripts/
│   └── seed-admin.js      (new: idempotent admin bootstrap)
├── db.js                  (existing, no change)
├── index.js               (existing, add auth middleware)
└── package.json           (update with new deps)

frontend/src/
├── pages/
│   ├── AnimalList.jsx     (existing)
│   ├── AnimalCreate.jsx   (existing)
│   ├── AnimalDetail.jsx   (existing)
│   └── Login.jsx          (new)
├── components/
│   ├── Layout.jsx         (existing, update for role-aware nav)
│   ├── ProtectedRoute.jsx (new)
│   └── Toast.jsx          (new, simple toast for permission denied)
├── context/
│   └── AuthContext.jsx    (new)
├── App.jsx                (existing, wrap with ProtectedRoute)
└── main.jsx               (existing, wrap with AuthContext.Provider)
```

### Pattern 1: JWT Authentication Flow

**What:** User submits email/password → server verifies with bcryptjs → JWT signed with secret → stored in httpOnly cookie → on each request, cookie auto-sent → middleware verifies JWT → attaches req.user

**When to use:** Every request needs `req.user` for audit trails (createdBy fields) and access control

**Example:**
```javascript
// api/middleware/authenticate.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user; // { _id, email, role }
    next();
  });
}

module.exports = authenticateToken;
```

Source: https://www.syncfusion.com/blogs/post/implement-jwt-authentication-in-react

### Pattern 2: Role-Based Access Control Middleware

**What:** Middleware factory that returns a gate checking if user's role is in allowed list

**When to use:** Protect routes by role: `router.post('/', requireRole('staff', 'admin'), createAnimal)`

**Example:**
```javascript
// api/middleware/authorize.js
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = requireRole;
```

Source: https://permify.co/post/role-based-access-control-rbac-nodejs-expressjs/

### Pattern 3: Login Endpoint with httpOnly Cookie

**What:** Validates credentials, signs JWT, sets secure httpOnly cookie

**When to use:** POST /api/auth/login

**Example:**
```javascript
// api/routes/auth.js
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !await bcryptjs.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
    });

    res.json({ user: { _id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

Source: https://dev.to/idurar/advanced-nodejs-reactjs-auth-httponly-in-cookies-2911

### Pattern 4: React Context for Auth State

**What:** Global auth context provides user and login/logout; wraps app at root level; ProtectedRoute checks isAuthenticated

**When to use:** Every route needs access to current user; frontend role gates use context

**Example:**
```javascript
// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch /api/auth/me on mount to restore session from httpOnly cookie
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'DELETE' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

Source: https://www.syncfusion.com/blogs/post/implement-jwt-authentication-in-react

### Pattern 5: ProtectedRoute with Destination Preservation

**What:** Wrapper component that checks auth before rendering; redirects to /login if not authenticated and saves destination

**When to use:** Wrap routes that require authentication

**Example:**
```javascript
// frontend/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} />;
  }

  return children;
}
```

Source: https://blog.logrocket.com/authentication-react-router-v6/

### Pattern 6: Idempotent Admin Seed Script

**What:** Script that checks if admin exists before seeding; reads credentials from .env; hashes password; runs once per deployment

**When to use:** `npm run seed:admin` in api/ directory after deploying

**Example:**
```javascript
// api/scripts/seed-admin.js
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const connectDB = require('../db');
const User = require('../models/User');

async function seedAdmin() {
  await connectDB();

  const adminExists = await User.findOne({ role: 'admin' });
  if (adminExists) {
    console.log('Admin already exists, skipping seed');
    process.exit(0);
  }

  const passwordHash = await bcryptjs.hash(process.env.ADMIN_PASSWORD, 10);
  const admin = await User.create({
    email: process.env.ADMIN_EMAIL,
    passwordHash,
    role: 'admin'
  });

  console.log('Admin created:', admin.email);
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
```

Source: https://medium.com/@emdadulislam162/setting-up-seeders-in-node-js-and-mongoose-with-example-828da1bf89f1

### Anti-Patterns to Avoid

- **Storing JWT in localStorage:** XSS attack → attacker injects JS → reads localStorage → steals token. httpOnly cookie is immune to JS access.
- **No SameSite flag on cookies:** CSRF attacks possible — attacker's site sends request to your API, browser auto-includes cookie. SameSite=Strict blocks this.
- **Role checks only on frontend:** User can modify browser state or make direct API calls. API must validate every write operation.
- **Same expiry for all token scenarios:** Refresh tokens should live 30-90 days; access tokens 15-60 minutes. Single long-lived token is a larger attack surface.
- **Hashing passwords with plaintext comparison:** Use bcryptjs.compare() to safely check hashed passwords; never store plaintext.
- **Auth middleware after route mounts:** Middleware must be applied BEFORE routes so every request is checked. Mounting routes first means some requests bypass auth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signing/verification | Custom crypto | jsonwebtoken (9.0.3) | Handles algorithm selection, expiry claims, signature validation — easy to mess up |
| Password hashing | MD5, SHA-1, custom salt | bcryptjs (3.0.3) | bcryptjs has cost-factor adjustment (makes slow brute-force attack expensive) and handles salt generation |
| Cookie parsing | Manual req.headers.cookie split | cookie-parser (1.4.7) | Handles URL-encoding, signed cookies, malformed input gracefully |
| Protected routes | Manual fetch + redirect logic | React Router v6 Navigate + ProtectedRoute | Handles race conditions (loading states), browser history, query parameters |
| Role authorization | if/else per role on routes | requireRole() middleware factory | Scales to N roles; keeps route handler clean; single point of change for access logic |

**Key insight:** Auth is deceptively complex — session fixation, token replay, CSRF, XSS, timing attacks. Use battle-tested libraries.

## Runtime State Inventory

> This is a greenfield auth implementation (no existing User model or auth routes to rename). No runtime state to migrate.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — User model created new | No migration needed |
| Live service config | None — auth endpoints created new | No config change needed |
| OS-registered state | None — no task scheduler or service registrations | No re-registration needed |
| Secrets/env vars | ADMIN_EMAIL, ADMIN_PASSWORD added to .env | Add to .env (not in git); seed script reads at runtime |
| Build artifacts | None — new modules, no legacy installs | npm install jsonwebtoken bcryptjs cookie-parser |

## Common Pitfalls

### Pitfall 1: Auth Middleware Placed After Route Mounting

**What goes wrong:** Routes mounted before middleware → requests hit route handler before auth check → unauthenticated access allowed

**Why it happens:** Express processes middleware in order; if route handler is registered first, it runs before subsequent middleware

**How to avoid:** Always place `app.use(authenticateToken)` BEFORE `app.use('/api/animals', animalsRouter)` in `api/index.js`

**Warning signs:** Unauthenticated requests succeed on protected routes; check `api/index.js` middleware order

### Pitfall 2: JWT Stored in localStorage

**What goes wrong:** XSS vulnerability → attacker injects `<script>` → reads `localStorage.getItem('token')` → exfiltrates JWT → impersonates user

**Why it happens:** localStorage is easier than cookies; developer assumes XSS is rare, focuses on CSRF

**How to avoid:** Use httpOnly cookies only; frontend cannot read httpOnly, so attacker can't steal it via JS

**Warning signs:** Token in browser's Application → Local Storage tab instead of Cookies tab

### Pitfall 3: Role Checks Only on Frontend

**What goes wrong:** User opens DevTools → modifies `user.role` in React state → POST request sent with modified role → API accepts it because no server-side validation

**Why it happens:** Frontend role gates are for UX (hiding buttons); developers forget API also needs validation

**How to avoid:** Every write endpoint (POST/PUT/DELETE) must have `requireRole()` middleware checking req.user.role

**Warning signs:** Frontend shows "Permission denied" but API call succeeds; audit logs show actions from unauthorized roles

### Pitfall 4: Seed Script Not Idempotent

**What goes wrong:** Script runs twice → creates duplicate admin users → breaks unique email constraint

**Why it happens:** Developer forgets to check if admin exists before inserting

**How to avoid:** Always check `await User.findOne({ role: 'admin' })` and skip if found

**Warning signs:** `npm run seed:admin` fails on second run with duplicate key error

### Pitfall 5: Redirect Loop on ProtectedRoute

**What goes wrong:** ProtectedRoute redirects to /login if not authenticated; /login is also wrapped by ProtectedRoute; user bounces between /login and /animals forever

**Why it happens:** /login is a public route and should NOT be wrapped by ProtectedRoute

**How to avoid:** Only wrap protected routes; keep /login and /signup outside ProtectedRoute wrapper

**Warning signs:** User stuck on blank page; browser history alternates between /login and /animals

### Pitfall 6: Middleware Signature Wrong

**What goes wrong:** Middleware defined as `authenticateToken = (req, res) => {}` without `next` → route handler never runs

**Why it happens:** Middleware must call `next()` to pass control to next handler

**How to avoid:** Always use three parameters: `(req, res, next)` and call `next()` at end

**Warning signs:** POST /api/auth/login hangs (times out) before responding

### Pitfall 7: JWT Secret Exposed in Code

**What goes wrong:** `process.env.JWT_SECRET` hardcoded or in git → attacker reads source → forges tokens → logs in as any user

**Why it happens:** Developer tests locally, commits .env file accidentally

**How to avoid:** Store in .env (gitignored); use `process.env.JWT_SECRET` in code; .env never committed

**Warning signs:** git log shows .env commit; secret visible in plaintext in GitHub

## Code Examples

Verified patterns from official sources and community best practices:

### Login Endpoint

```javascript
// api/routes/auth.js
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Compare password
    const isValid = await bcryptjs.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    // Sign JWT
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user: { _id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

Source: https://dev.to/idurar/advanced-nodejs-reactjs-auth-httponly-in-cookies-2911

### Authentication Middleware

```javascript
// api/middleware/authenticate.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Token expired or invalid
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
```

Source: https://medium.com/@softwareengineermangesh/node-js-jwt-authentication-with-http-only-cookie-by-mangesh-pal-c41f0ddafac4

### Authorization Middleware

```javascript
// api/middleware/authorize.js
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

module.exports = requireRole;
```

Source: https://www.permit.io/blog/how-to-implement-rbac-in-an-expressjs-application

### User Model

```javascript
// api/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'staff', 'vet', 'volunteer'],
    default: 'volunteer'
  },
  deletedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

### ProtectedRoute Component

```javascript
// frontend/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}
```

Source: https://blog.logrocket.com/authentication-react-router-v6/

### Login Page

```javascript
// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const from = searchParams.get('from') || '/animals';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="bg-green-800 text-white px-6 py-5">
          <h1 className="text-2xl font-bold">Wildlife Rescue Center</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-800 text-white py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Integrating Auth Middleware in api/index.js

```javascript
// api/index.js (updated)
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./db');

const authenticateToken = require('./middleware/authenticate');
const animalsRouter = require('./routes/animals');
const medicalRouter = require('./routes/medical');
const speciesRouter = require('./routes/species');
const authRouter = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Connect to DB before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes — all subsequent routes require auth
app.use(authenticateToken);

app.use('/api/animals', animalsRouter);
app.use('/api/medical', medicalRouter);
app.use('/api/species', speciesRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', user: req.user }));

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

module.exports = app;
```

### Logout Endpoint

```javascript
// api/routes/auth.js (continued)
router.delete('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  res.json({ message: 'Logged out' });
});

router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: req.user });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Session-based auth (server stores session in DB/memory) | Stateless JWT (server validates signature, no DB query) | ~2015 | Scales better; works for distributed systems; easier to test |
| Refresh tokens in localStorage | Refresh tokens in secure httpOnly cookies | ~2018 (after XSS epidemics) | Protects against XSS; smaller attack surface |
| Single long-lived JWT | Access token (15-60 min) + Refresh token (7-30 days) | ~2019 | Reduces damage from stolen access token; refresh tokens revocable |
| SameSite not set | SameSite=Strict or Lax by default | ~2020 (Chrome enforcement) | Prevents CSRF; now standard in modern frameworks |

**Deprecated/outdated:**
- **MongoDB auto_increment:** MongoDB ObjectId is standard now; auto_increment pattern is legacy
- **Passport.js for simple auth:** Direct jsonwebtoken + bcryptjs is simpler for SPAs; Passport is overkill
- **Storing JWT in Authorization header:** httpOnly cookies are more convenient (auto-sent, can't be stolen via XSS)

## Open Questions

1. **Refresh token rotation strategy for Phase 2+**
   - What we know: Phase 1 uses single 7-day JWT; no refresh token yet
   - What's unclear: Should Phase 2 implement refresh token rotation (issue new refresh token on use, revoke old)?
   - Recommendation: Phase 1 simpler with single JWT. If future requirements add "logout all devices" or "revoke tokens", Phase 2 can add refresh tokens stored in DB with rotation.

2. **Toast implementation library**
   - What we know: D-12 requires "Permission denied" toast on forbidden API call
   - What's unclear: Use simple custom Toast component or add library like react-toastify?
   - Recommendation: Custom Toast component (50 lines) is simpler than adding dependency; Phase 1 only needs error toast.

3. **Password reset / forgot password**
   - What we know: Out of scope for Phase 1 (v2 requirement)
   - What's unclear: When implemented, will email service be available?
   - Recommendation: Phase 1 does not need this; Phase v2 research will address email integration.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — Wave 0 gap |
| Config file | None |
| Quick run command | N/A (no tests yet) |
| Full suite command | N/A (no tests yet) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | POST /api/auth/login with valid credentials returns user and sets httpOnly cookie | integration | `npm test -- auth.login.valid` | ❌ Wave 0 |
| AUTH-01 | POST /api/auth/login with invalid credentials returns 401 | integration | `npm test -- auth.login.invalid` | ❌ Wave 0 |
| AUTH-02 | httpOnly cookie persists across requests (simulated browser restart) | integration | `npm test -- auth.cookie.persist` | ❌ Wave 0 |
| AUTH-03 | DELETE /api/auth/logout clears cookie; subsequent /api/auth/me returns 401 | integration | `npm test -- auth.logout` | ❌ Wave 0 |
| AUTH-04 | User model stores role enum {admin, staff, vet, volunteer} | unit | `npm test -- user.role.enum` | ❌ Wave 0 |
| ACCESS-01 | GET /api/animals with volunteer role succeeds; POST /api/animals with volunteer returns 403 | integration | `npm test -- access.volunteer` | ❌ Wave 0 |
| ACCESS-02 | POST /api/animals with staff role succeeds; GET returns 200 | integration | `npm test -- access.staff` | ❌ Wave 0 |
| ACCESS-03 | POST /api/medical with vet role succeeds; GET /api/medical with volunteer succeeds | integration | `npm test -- access.vet` | ❌ Wave 0 |
| ACCESS-04 | Admin can POST /api/animals, PUT /api/animals/:id, DELETE /api/medical/:id | integration | `npm test -- access.admin` | ❌ Wave 0 |
| ACCESS-05 | All write endpoints (POST/PUT/DELETE) on animals, medical, species require auth middleware | integration | `npm test -- auth.required.all-endpoints` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Run integration tests for the endpoint being modified (e.g., auth tests when adding login)
- **Per wave merge:** Run full test suite (all 10 requirements + middleware tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/` directory structure
- [ ] Test framework selection and setup (Jest, Mocha, or Vitest)
- [ ] API test utilities (supertest for HTTP, MongoDB mock or test DB)
- [ ] Test data fixtures (seed test user with known password)
- [ ] Auth middleware tests (verify JWT validation, role checks)
- [ ] Route permission tests (verify access control on all endpoints)
- [ ] Framework install: Choose test framework and install (e.g., `npm install --save-dev jest supertest`)

## Sources

### Primary (HIGH confidence)
- jsonwebtoken npm package — JWT signing/verification library verified against registry
- bcryptjs npm package — Password hashing library verified against registry
- cookie-parser npm package — Cookie parsing middleware verified against Express docs
- React Router v6 documentation — ProtectedRoute patterns and Navigate component
- Mongoose documentation — User schema and model creation

### Secondary (MEDIUM confidence)
- [Authentication in Node.js with MongoDB, bcrypt, and JWT - DEV Community](https://dev.to/nyctonio/authentication-in-node-js-with-mongodb-bcrypt-and-jwt-web-tokens-with-cookies-hl3) — validated pattern for JWT + httpOnly + bcryptjs
- [Advanced Node.js React.js Auth JWT - DEV Community](https://dev.to/idurar/advanced-nodejs-reactjs-auth-httponly-in-cookies-2911) — code examples for login endpoint and cookie setup
- [JWT Authentication in React: Secure Routes, Context, and Token Handling - Syncfusion](https://www.syncfusion.com/blogs/post/implement-jwt-authentication-in-react) — React Context pattern for auth state
- [Authentication with React Router v6 - LogRocket](https://blog.logrocket.com/authentication-react-router-v6/) — ProtectedRoute wrapper and useLocation pattern
- [Implementing RBAC in Node.js and Express - Permify](https://permify.co/post/role-based-access-control-rbac-nodejs-expressjs/) — Role-based middleware factory pattern
- [OWASP Cross-Site Request Forgery Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) — httpOnly + SameSite=Strict defense strategy
- [JWT Storage in React: LocalStorage vs httpOnly Cookies - CyberSierra](https://cybersierra.co/blog/react-jwt-storage-guide/) — Security comparison of storage methods
- [JWT Token Lifecycle Management - SkyCload](https://skycloak.io/blog/jwt-token-lifecycle-management-expiration-refresh-revocation-strategies/) — Token expiry best practices (7-day for "remember me")

### Tertiary (LOW confidence - verification recommended)
- None — all critical claims verified with official docs or cross-referenced sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified current (jsonwebtoken 9.0.3, bcryptjs 3.0.3 as of March 2026); patterns from Auth0 and official docs
- Architecture: HIGH — JWT + httpOnly cookie pattern is industry standard (OWASP endorsed); React Router v6 ProtectedRoute verified against official docs
- Pitfalls: MEDIUM-HIGH — common patterns documented in OWASP and major frameworks; some edge cases discovered through community patterns
- Test gaps: HIGH — no test framework exists yet; Wave 0 work required before implementation

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (30 days; auth patterns stable)
