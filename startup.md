# Evently — Startup Guide

How to get the project running locally.

## Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** (ships with Node)
- **MongoDB** — either a local instance or a MongoDB Atlas connection string
- A modern browser (Chrome/Firefox/Safari)

## 1. Clone & install

```bash
git clone <repo-url>
cd Techcora_Event_Management_App

# install backend deps
cd backend && npm install && cd ..

# install frontend deps
cd frontend && npm install && cd ..
```

## 2. Environment variables

### `backend/.env`

```env
# Core
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=<long-random-string>
CLIENT_ORIGIN=http://localhost:5173

# Cloudinary (image / file uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Nodemailer — Gmail App Password works)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=

# AI helpers
GROQ_API_KEY=
GEMINI_API_KEY=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=<same as backend GOOGLE_CLIENT_ID>
VITE_GITHUB_CLIENT_ID=<same as backend GITHUB_CLIENT_ID>
VITE_LOCATIONIQ_KEY=<locationiq.com key>
```

## 3. Seed the database (optional but recommended)

Creates 3 test accounts (student / organizer / admin) and clears any existing data:

```bash
cd backend
node src/seed.js
```

Default credentials after seeding:

| Role      | Email                | Password    |
|-----------|----------------------|-------------|
| student   | `student@test.com`   | `password`  |
| organizer | `organizer@test.com` | `password`  |
| admin     | `admin@test.com`     | `password`  |

(Confirm exact values in `backend/src/seed.js` if changed.)

## 4. Run the dev servers

Open **two terminals**:

**Terminal 1 — backend** (port 5000)

```bash
cd backend
npm run dev
```

**Terminal 2 — frontend** (port 5173)

```bash
cd frontend
npm run dev
```

Then open: **http://localhost:5173**

## 5. Useful commands

```bash
# Backend
npm run dev     # nodemon, hot reload
npm start       # production node
npm test        # vitest unit tests

# Frontend
npm run dev     # vite dev server
npm run build   # production bundle to dist/
npm run preview # serve the built bundle
npm run lint    # eslint
```

End-to-end tests (Playwright):

```bash
cd frontend
npx playwright test
```

## 6. OAuth setup notes

- **Google**: Cloud Console → OAuth 2.0 Client → add `http://localhost:5173` to authorized JS origins and `http://localhost:5173/oauth/google/callback` to redirect URIs.
- **GitHub**: Developer Settings → OAuth App → Homepage `http://localhost:5173`, callback `http://localhost:5173/oauth/github/callback`.

## 7. Troubleshooting

- **`MongoDB connection error`** → check `MONGO_URI`; if using Atlas, whitelist your IP.
- **`429 Too Many Requests`** → backend rate limit; restart backend or wait 15 min.
- **Live page camera black** → reload; the Jitsi container only mounts once per session.
- **Port already in use** → `lsof -i :5000` / `lsof -i :5173` and kill the stale process.
- **OAuth `redirect_uri_mismatch`** → callback URL in provider console must match `frontend/.env` and route exactly.
