# Interview Preparation — Evently Event Management Platform

## Complete Question & Answer Guide
### From Basic to Advanced | Project-Specific + Conceptual + Fractal-Focused

---

## Table of Contents
1. [Project Overview Questions](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Frontend (React) Questions](#3-frontend-react)
4. [Backend (Node/Express) Questions](#4-backend-nodeexpress)
5. [Database (MongoDB) Questions](#5-database-mongodb)
6. [Authentication & Security](#6-authentication--security)
7. [Real-Time Features (Socket.io)](#7-real-time-socketio)
8. [Video Streaming (Jitsi)](#8-video-streaming)
9. [Analytics & Data](#9-analytics--data)
10. [System Design Questions](#10-system-design)
11. [Fractal Analytics Specific Questions](#11-fractal-analytics-specific)
12. [Most Asked React Conceptual Questions](#12-react-conceptual)
13. [Most Asked MongoDB Conceptual Questions](#13-mongodb-conceptual)
14. [Most Asked Node.js Conceptual Questions](#14-nodejs-conceptual)
15. [Behavioral & Situational Questions](#15-behavioral)

---

## 1. Project Overview

### Q: Tell me about your project.
**A:** Evently is a full-stack event management platform built with the MERN stack. It supports three user roles — students, organizers, and admins. Students can discover, register for, and attend events (including online streaming). Organizers can create events with a 4-step wizard, manage attendees, go live with Jitsi-based video streaming with real-time chat, and track analytics. Admins oversee the platform with user management, event moderation, and platform-wide reporting. The app features Google/GitHub OAuth, LocationIQ maps, QR-coded tickets, a mock payment system, progressive field locking on edits, and 80+ automated tests.

### Q: What problem does this solve?
**A:** Campus communities lack a unified platform for event discovery and management. Students browse multiple channels (WhatsApp groups, notice boards, emails) to find events. Organizers have no way to track registrations, manage capacity, or stream online events. Evently centralizes everything — from event creation to live streaming to post-event analytics — in one platform.

### Q: What makes your project different from a basic CRUD app?
**A:** Several production-grade features elevate it beyond CRUD:
- Real-time seat updates via Socket.io (no stale data)
- Jitsi video streaming with custom overlay controls, glass chat panel, polls, reactions, smart message stacking
- Progressive field locking (event edits restricted based on lifecycle: no registrations → has registrations → live → ended)
- OAuth with role selection for new users
- Stream lobby (students wait until organizer goes live)
- Waitlist auto-promotion with conflict detection
- 15-minute anti-abuse ban after cancellation
- Mock payment system mirroring Razorpay architecture

### Q: How many pages, endpoints, and models does it have?
**A:** ~45 frontend pages, 52+ API endpoints, 8 database models (User, Event, Registration, SavedEvent, Notification, Review, Payment, plus dynamic collections for announcements), 80+ automated tests (39 backend unit + 41 Playwright E2E).

### Q: Walk me through the user journey for each role.
**A:**
- **Student:** Sign up (email or Google/GitHub) → Browse/search events → Register (with conflict detection) → Get QR ticket → Attend in-person or join live stream → Leave review after event
- **Organizer:** Sign up → Create event (4-step wizard: info → schedule → details → media) → Manage attendees → Go live (Jitsi) → Send announcements/polls during stream → View analytics & revenue → Upload recording after stream
- **Admin:** Login → View platform stats → Manage users (roles, suspend, delete) → Moderate events → View reports with charts → Manage categories → System settings

---

## 2. Tech Stack & Architecture

### Q: What is your tech stack and why did you choose it?
**A:**
- **Frontend:** React 19 + Vite + Tailwind CSS + Recharts + Leaflet
- **Backend:** Express 5 + Mongoose + Socket.io + JWT
- **Database:** MongoDB Atlas
- **External:** Cloudinary (images), Jitsi (video), LocationIQ (maps), Google/GitHub OAuth

**Why this stack:**
- React: Component-based, huge ecosystem, industry standard for SPAs
- Vite over CRA: 10-50x faster build times, native ESM, better DX
- Tailwind over CSS/SCSS: Utility-first = faster development, consistent design system, no class naming
- Express 5: Lightweight, async error handling built-in, middleware ecosystem
- MongoDB: Flexible schema for events with variable fields (agenda, FAQ, speakers), geospatial support for maps
- Socket.io: Automatic fallback (WebSocket → long polling), room-based for event chat

### Q: Why MongoDB instead of PostgreSQL?
**A:** Events have highly variable schemas — some have agendas, speakers, FAQs, tags; others don't. MongoDB's flexible schema avoids empty columns and complex JOINs. Also, MongoDB Atlas provides free hosting, geospatial indexing for nearby events (future feature), and aggregation pipelines for analytics. For a normalized relational model, PostgreSQL would be better — but for this use case, document-based is cleaner.

### Q: Explain your project architecture.
**A:**
```
Frontend (React SPA on Vite)
    ↓ Axios (JWT in Authorization header)
Backend (Express REST API)
    ↓ Mongoose ODM
MongoDB Atlas
    ↑
Socket.io (bidirectional real-time)
    ↑
Cloudinary (image/file CDN)
Jitsi (video streaming)
LocationIQ (geocoding)
Google/GitHub (OAuth)
```

**Frontend architecture:**
- `GuestLayout` for public pages (login, landing, about)
- `DashboardLayout` with collapsible sidebar for authenticated users
- Role-based routing (`/student/*`, `/organizer/*`, `/admin/*`)
- Shared components for Profile, Settings across roles

**Backend architecture:**
- MVC pattern: Models → Controllers → Routes
- Middleware chain: CORS → Helmet → Rate Limiter → Auth → Route Handler → Error Handler
- Services layer: Email (Nodemailer), Cron (node-cron), Socket events

### Q: How do you handle environment configuration?
**A:** Using `.env` files with `dotenv`. Backend has MongoDB URI, JWT secret, Cloudinary keys, OAuth secrets, email credentials. Frontend uses `VITE_` prefixed vars for public keys only (Google Client ID, LocationIQ key). Sensitive secrets never reach the frontend. `.env` is gitignored, and we use `git-filter-repo` to scrub any accidentally committed secrets from history.

---

## 3. Frontend (React)

### Q: How do you handle routing and role-based access?
**A:** React Router v7 with nested layouts. Three layout groups:
- `GuestLayout` — public pages (landing, login, register)
- `DashboardLayout` — authenticated pages with sidebar

`DashboardLayout` accepts an `allowedRoles` prop. If user's role doesn't match, they're redirected to their own dashboard. A `DashboardRedirect` component routes `/dashboard` to the correct role-specific path.

### Q: How does your auth flow work on the frontend?
**A:** `AuthContext` stores user + token in state and localStorage. `login()` saves both, `logout()` clears both. Axios interceptor automatically adds `Authorization: Bearer <token>` to every request. `GuestOnly` wrapper redirects logged-in users away from login/register. Protected routes check auth in `DashboardLayout`.

### Q: How do you prevent unnecessary re-renders?
**A:**
- `useMemo` for computed analytics data (metrics, chart data, insights)
- `useCallback` for Jitsi initialization to prevent recreation on every render
- `useRef` for Jitsi API instance (doesn't trigger re-renders)
- Pre-fetching registration/saved status at page level (Explore) instead of per-EventCard (eliminated N+1 API calls)

### Q: Explain the EventCard role-based rendering.
**A:** EventCard accepts `initialRegStatus` and `initialSaved` props from parent to avoid per-card API calls. It checks `user.role` and `isOwnEvent` to render different UIs:
- Student: Register/Waitlist button, save bookmark, join live
- Organizer (own event): Fill bar, edit/attendees/go-live buttons
- Organizer (other's): View only, watch live link
- Guest: "Log in to Register"
- Admin: Same as organizer + moderate

### Q: How does the multi-step event creation wizard work?
**A:** 4 steps with local state, step validation before `Next`:
1. Basic Info (title, description, category, event mode, price)
2. Schedule & Venue (conditional — online hides venue fields, shows "Virtual Event" card)
3. Details (tags, speakers, FAQ — all dynamic add/remove)
4. Media & Review (image upload, full summary)

Data sent as `FormData` with JSON-stringified arrays for tags/agenda/faqs/speakers. Backend parses these in the controller.

### Q: How does the progressive field locking work on the frontend?
**A:** EditEvent page fetches the event, determines lifecycle state:
- `open`: no registrations → all editable
- `has_registrations`: price locked (greyed out with lock icon + explanation), venue/time show amber warnings
- `live`: only description editable
- `ended`: read-only except description

Locked fields get `disabled` prop + visual indicators. Only changed fields are sent to backend to avoid triggering locks on unchanged data.

---

## 4. Backend (Node/Express)

### Q: How do you structure your Express app?
**A:**
```
src/
  app.js          — Express setup, middleware, route mounting
  server.js       — HTTP server + Socket.io init + DB connect
  config/         — db.js, socket.js, logger.js
  controllers/    — Business logic (auth, event, registration, etc.)
  models/         — Mongoose schemas
  routes/         — Route definitions with middleware chains
  middleware/     — auth, upload, rateLimiter, error handler
  services/       — email, cron jobs
```

### Q: How does your auth middleware work?
**A:** `protect` middleware extracts JWT from `Authorization: Bearer <token>`, verifies with `jwt.verify()`, fetches user from DB (excluding password), attaches to `req.user`. `restrictTo(...roles)` checks `req.user.role` against allowed roles. Both are composable — routes chain them: `router.get("/", protect, restrictTo("admin"), handler)`.

### Q: How do you handle the registration system?
**A:** Complex business logic:
1. Check user role (only students)
2. Check for previous registration (banned for 15 min after cancel)
3. Schedule conflict detection via MongoDB aggregation (overlap check)
4. Seat availability → register or waitlist
5. Generate QR code (qrcode library)
6. Send confirmation email (non-blocking)
7. Create notification
8. Emit Socket.io events for real-time updates
9. On cancellation: promote first waitlisted person, send promotion email

### Q: Explain the progressive field locking on the backend.
**A:** `updateEvent` controller determines lifecycle state from timestamps and registration count:
- `isEnded`: only description/images/tags allowed, else 403
- `isLive`: only description/images, else 403
- `hasRegistrations`: price change blocked with message, time/venue changes return warnings array
- Capacity floor enforced: can't go below occupied seats
- Response includes `warnings[]` for frontend to display as toasts

### Q: How do you handle file uploads?
**A:** Multer with Cloudinary storage adapter (`multer-storage-cloudinary`). Files go directly to Cloudinary CDN — no local storage. 5MB limit enforced by Multer. Cloudinary returns a URL that's stored in the database. Used for event images, avatars, and stream recordings.

---

## 5. Database (MongoDB)

### Q: Describe your database schema design.
**A:** 8 models:
- **User**: name, email, password (bcrypt), role, avatar, bio, interests, socialLinks, googleId, githubId, authProvider, notificationPreferences
- **Event**: title, description, category, organizer (ref), venue, times, capacity, seatsAvailable, price, tags[], agenda[], faqs[], speakers[], eventMode, streamConfig{roomId, isLive, recordingUrl}
- **Registration**: event (ref), student (ref), status (registered/waitlisted/cancelled), qrCode, cancelledAt (for 15-min ban)
- **SavedEvent**: user + event (unique compound index)
- **Notification**: user, type (enum), title, message, link, read, event (ref)
- **Review**: event + user (unique), rating (1-5), comment
- **Payment**: user, event, orderId, paymentId, amount, status, method, metadata, refundId

### Q: What indexes do you use and why?
**A:**
- `Registration: { event: 1, student: 1 }` — unique compound, prevents duplicate registrations
- `Event: { title: "text", description: "text" }` — text index for search
- `Event: { category: 1, venueName: 1 }` — compound for filtered queries
- `Notification: { user: 1, read: 1 }` — efficient unread count queries
- `SavedEvent: { user: 1, event: 1 }` — unique compound
- `Payment: { user: 1, event: 1 }` — lookup user's payments per event

### Q: How do you handle the waitlist promotion?
**A:** When a registered user cancels:
1. `Registration.findOneAndUpdate` with `{ status: "waitlisted" }`, sorted by `createdAt: 1` (oldest first), updates to `registered`
2. Seat count adjusted: +1 for cancellation, -1 for promotion
3. Email sent to promoted user with QR code
4. Notification created
5. Socket.io emits `promotion` event

### Q: How do you detect schedule conflicts?
**A:** MongoDB aggregation pipeline:
```javascript
Registration.aggregate([
  { $match: { student: ObjectId, status: "registered" } },
  { $lookup: { from: "events", localField: "event", foreignField: "_id", as: "registeredEvent" } },
  { $unwind: "$registeredEvent" },
  { $match: { $and: [
    { "registeredEvent.endTime": { $gt: newEventStart } },
    { "registeredEvent.startTime": { $lt: newEventEnd } }
  ]}}
])
```
Returns conflicting events. If any found, registration is rejected with the conflicting event name.

---

## 6. Authentication & Security

### Q: How does your JWT authentication work?
**A:** On login/register, server generates a JWT with `{ id, role }` payload, 7-day expiry, signed with `JWT_SECRET`. Token sent in response, stored in localStorage. Axios interceptor adds it to every request. `protect` middleware verifies on each API call.

### Q: How does Google OAuth work in your app?
**A:** Authorization Code Flow:
1. Frontend redirects to Google with client_id, redirect_uri, response_type=code
2. User authenticates, Google redirects back with `?code=`
3. Frontend sends code to our backend (`POST /api/auth/google`)
4. Backend exchanges code for tokens via Google's token endpoint (using client_secret)
5. Backend verifies id_token via Google's tokeninfo endpoint
6. If user exists (by email or googleId) → login. If new → return `isNewUser: true` with OAuth data
7. Frontend shows role selection → sends chosen role to `POST /api/auth/oauth/complete`
8. Account created with chosen role

### Q: How does GitHub OAuth differ?
**A:** Similar flow but:
- Code exchanged at `github.com/login/oauth/access_token`
- Then fetches user info from `api.github.com/user` and emails from `api.github.com/user/emails`
- Primary email extracted from emails array
- Rest of the flow (account linking, role selection) is identical

### Q: What security measures do you have?
**A:**
- **Helmet**: Security headers (X-Frame-Options, CSP, etc.)
- **CORS**: Whitelist-based origin checking
- **Rate limiting**: 1000 req/15min general (100 in prod), 200/15min auth (30 in prod)
- **bcrypt**: Password hashing with 10 salt rounds
- **JWT**: Stateless authentication, 7-day expiry
- **Role-based access**: `restrictTo()` middleware
- **Registration restrictions**: Only students can register (backend enforced)
- **Anti-abuse**: 15-minute re-registration ban after cancellation
- **Input validation**: Mongoose schema validators, controller-level checks
- **Structured logging**: Pino (no `console.log` in production)

### Q: Why not use Passport.js for OAuth?
**A:** Direct OAuth 2.0 is simpler for our use case — just two HTTP calls (exchange code, verify token). Passport.js adds abstraction, session management, and serialize/deserialize complexity we don't need with JWT-based stateless auth. Fewer dependencies, easier to understand, and the code is clearer.

---

## 7. Real-Time (Socket.io)

### Q: How do you use Socket.io in the project?
**A:** Three main use cases:
1. **Event updates**: When someone registers/cancels, `eventUpdated` emitted to all connected clients → Home/Explore pages auto-refresh seat counts
2. **Live stream chat**: Room-based (`event:${eventId}`). Events: joinEventRoom, leaveEventRoom, sendEventChatMessage, pinEventMessage, createEventPoll, voteEventPoll, reactToEventMessage
3. **Viewer count**: Tracked per room via Set, broadcast on join/leave/disconnect

### Q: How do you handle chat rooms?
**A:** Each live event gets a Socket.io room named `event:${eventId}`. On join, socket joins the room and we track viewer count in a `Map<eventId, Set<socketId>>`. Messages are broadcast only to that room. On disconnect, cleanup removes from room and updates count.

### Q: How do polls work in real-time?
**A:** Organizer emits `createEventPoll` with question + options. Server stores poll in memory (`roomPolls` map), broadcasts to room. Students emit `voteEventPoll` with optionIndex. Server increments vote count, broadcasts updated poll. Organizer can emit `endEventPoll` to close.

### Q: How does smart message stacking work?
**A:** Frontend-side logic. Short messages ("ok", "yes", "nice", "thanks", etc.) are intercepted before adding to message list. Instead, they increment a counter in `stackedReactions` state. Displayed as floating badges ("ok ×15") that auto-clear after 30 seconds. Keeps chat clean during high-traffic moments.

---

## 8. Video Streaming

### Q: How does the live streaming work?
**A:** Jitsi Meet External API embedded in a React component. Organizer clicks "Go Live" → backend sets `event.streamConfig.isLive = true` → Jitsi room created with auto-generated roomId → Students poll `/stream/status` every 5s until live → auto-connect when ready.

### Q: Why Jitsi instead of building your own WebRTC?
**A:** Building WebRTC from scratch requires STUN/TURN servers, SFU (Selective Forwarding Unit), media negotiation, codec handling — months of work. Jitsi provides all this free, open-source, with no API key needed. We customized it via External API: hidden toolbar, custom controls, glass chat overlay, branded watermark.

### Q: How do you ensure the organizer is always the moderator?
**A:** Stream lobby system. Backend tracks `isLive` state. Students can't connect to Jitsi until organizer sets `isLive = true`. Since organizer joins first, Jitsi automatically assigns them moderator role. Students see "Waiting for host" screen with polling.

### Q: How does the custom video UI work?
**A:** Jitsi's native toolbar is hidden (`toolbarButtons: []`). We overlay our own controls using absolute positioning:
- Top-left: Back button + LIVE badge + viewer count + timer (glass pill)
- Top-right: Chat toggle + fullscreen button (glass pills)
- Right side: Glass chat panel with backdrop-blur
- Bottom center: Mic/Camera/ScreenShare/Leave (glass bar)
- Keyboard shortcut: 'F' toggles fullscreen

---

## 9. Analytics & Data

### Q: How does the analytics dashboard work?
**A:** Single page with two controls:
1. Event selector dropdown: "All Events (Aggregate)" or specific event
2. Chart type dropdown: Registrations | Category | Fill Rate | Revenue | Table

All data computed client-side from the events API response using `useMemo`. Charts via Recharts (Line, Area, Pie). Smart insights auto-generated by analyzing the data (best performer, revenue leader, fill rate assessment, next event countdown).

### Q: How are the smart insights generated?
**A:** Pure frontend logic in `useMemo`:
- Sort events by fill rate → "Top performer: X at 95%"
- Filter paid events, find max revenue → "Highest revenue: X at ₹12K"
- Check overall fill rate → "Strong demand" or "Low fill rate — consider promoting"
- Count by category → "Most active: Technical (5 events)"
- Find next upcoming → "Next event in 3 days — 40% filled"

Color-coded: green (positive), red (needs attention), blue (neutral).

### Q: If you had to build server-side analytics, how would you?
**A:** MongoDB aggregation pipelines:
```javascript
// Registrations per day for an event
Registration.aggregate([
  { $match: { event: eventId, status: "registered" } },
  { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
])
```
For high scale: pre-compute metrics in a `EventStats` collection via cron jobs, or use MongoDB Change Streams for real-time aggregation.

---

## 10. System Design Questions

### Q: How would you scale this to 100K users?
**A:**
- **Database**: MongoDB Atlas auto-scaling, read replicas, proper indexing
- **API**: Horizontal scaling with PM2 cluster mode or Kubernetes pods behind a load balancer
- **Caching**: Redis for session data, event cache, rate limiting
- **CDN**: Cloudinary already serves images via CDN. Add CloudFront for static assets
- **Socket.io**: Redis adapter for multi-server Socket.io (rooms shared across nodes)
- **Video**: Self-hosted Jitsi or LiveKit instead of free meet.jit.si
- **Search**: Elasticsearch instead of MongoDB text index
- **Queue**: Bull/BullMQ for email sending, notification creation (async)

### Q: How would you handle 10,000 concurrent viewers on a live stream?
**A:** Current: Jitsi handles video distribution. Chat is the bottleneck — 10K messages/second would overwhelm Socket.io. Solutions:
- Rate limit chat messages (1 per second per user)
- Smart stacking handles volume (already built)
- Redis pub/sub for Socket.io scaling across servers
- Consider server-sent events (SSE) for one-way updates instead of full duplex
- For video: HLS streaming via a media server (Jitsi SFU handles up to ~75 per room, beyond that need multiple Jitsi shards)

### Q: Design a notification system for this platform.
**A:** Already implemented:
- **Model**: Notification with type enum, user ref, read boolean, event ref
- **Creation**: Called from registration controller, payment controller
- **Delivery**: REST API for fetch/mark-read, Socket.io for real-time push
- **Polling**: TopBar polls unread count every 30s
- **At scale**: Would add: push notifications (FCM), email digest (cron), WebSocket per-user channels, Redis for real-time counter

---

## 11. Fractal Analytics Specific Questions

*Fractal is a major analytics/AI company. They focus on decision science, data engineering, and AI-driven insights. Their interviews test analytical thinking, data modeling, and system design.*

### Q: How would you build a recommendation engine for events?
**A:** Collaborative filtering:
1. Track user's registered categories, tags, organizers
2. Find similar users (same category preferences)
3. Recommend events those similar users registered for
4. Combine with content-based: match user's `interests[]` with event `tags[]` and `category`
5. Weight by recency and fill rate (popular events rank higher)

Implementation: MongoDB aggregation or a separate Python microservice with scikit-learn.

### Q: How would you detect fraudulent registrations?
**A:** Signals to look for:
- Same IP registering multiple accounts
- Burst registrations (bot-like timing)
- Registrations immediately followed by cancellations (gaming waitlist)
- Already built: 15-minute anti-abuse ban after cancellation

Advanced: anomaly detection on registration patterns using time-series analysis. Flag accounts with >90% cancellation rate.

### Q: How would you build a real-time analytics dashboard?
**A:**
- **Data pipeline**: MongoDB Change Streams → process events → update materialized views
- **Storage**: Pre-aggregated stats in a dedicated collection (EventAnalytics)
- **Delivery**: WebSocket pushes metric updates to dashboard
- **Visualization**: Time-series charts with configurable granularity (minute/hour/day)
- **Current implementation**: Client-side computation from raw data — works for small scale, move to server-side for production

### Q: How would you measure event success?
**A:** Metrics framework:
- **Reach**: Impressions, page views, social shares
- **Conversion**: Registration rate (views → registrations)
- **Engagement**: Attendance rate, chat activity during stream, poll participation
- **Satisfaction**: Post-event reviews (1-5 stars), NPS score
- **Financial**: Revenue, refund rate, revenue per attendee
- **Retention**: Repeat attendee rate, organizer return rate

### Q: Explain how you'd handle A/B testing for event pages.
**A:**
- Assign users to cohorts (50/50 split) based on user ID hash
- Serve different EventDetails layouts per cohort
- Track: time on page, registration rate, scroll depth
- Statistical significance test after N impressions
- Implementation: feature flag system in frontend, analytics events sent to backend

### Q: How would you build a data pipeline for this platform?
**A:**
```
Events (MongoDB) → Change Streams → Kafka/SQS →
  → Aggregation Service → Analytics DB (ClickHouse/TimescaleDB)
  → Email Service (notifications, digests)
  → Search Index (Elasticsearch)
  → ML Pipeline (recommendations)
```

---

## 12. React Conceptual Questions (Most Asked)

### Q: What is the Virtual DOM and how does it work?
**A:** The Virtual DOM is a lightweight JavaScript representation of the actual DOM. When state changes, React creates a new Virtual DOM tree, diffs it with the previous one (reconciliation), and only updates the actual DOM nodes that changed. This minimizes expensive DOM operations.

### Q: Explain useState vs useReducer.
**A:** `useState` is for simple, independent state values. `useReducer` is for complex state logic with multiple sub-values or when next state depends on previous. In our project, EventCard uses `useState` for simple toggles (loading, muted). The analytics page could benefit from `useReducer` for managing filter+chart+data states together.

### Q: What are React 19's key features?
**A:**
- Automatic batching of state updates (even in async callbacks)
- `useTransition` for non-urgent updates
- Improved Suspense for data fetching
- Server Components (not used in our SPA)
- `use()` hook for reading promises
- Note: React 19 StrictMode double-invokes effects in dev — we hit this bug with OAuth callbacks (GitHub code used twice)

### Q: Explain useEffect cleanup and why it matters.
**A:** The cleanup function runs before the effect re-runs and on unmount. Critical for:
- Removing Socket.io listeners (prevent memory leaks and duplicate handlers)
- Clearing intervals (polling, elapsed timer)
- Disposing Jitsi instances (prevent zombie iframes)
- Aborting API calls (prevent state updates on unmounted components)

In our LiveEvent, we clean up: Jitsi API, Socket.io listeners, polling intervals, elapsed timer.

### Q: What is prop drilling and how do you avoid it?
**A:** Passing props through many component levels that don't use them. We avoid it with:
- `AuthContext` — provides user/login/logout globally
- Pre-fetching data at page level and passing as props (Explore fetches registrations once, passes to EventCards)
- Shared components that accept role-aware props (Profile, Settings)

### Q: Explain React.memo, useMemo, and useCallback.
**A:**
- `React.memo`: Memoizes a component, skips re-render if props haven't changed
- `useMemo`: Memoizes a computed value. Used in Analytics for metrics, chart data, insights
- `useCallback`: Memoizes a function. Used for `startJitsi` callback to prevent Jitsi reinit

### Q: How does React Router v7 work?
**A:** File-based routing with `<Routes>` and `<Route>`. Supports nested layouts via `<Outlet>`. We use it for:
- Layout nesting: `GuestLayout` wraps public routes, `DashboardLayout` wraps auth routes
- Dynamic params: `/events/:id` for event details
- Redirects: `<Navigate>` for legacy routes
- Search params: `useSearchParams` for Explore filters and Analytics event selection

---

## 13. MongoDB Conceptual Questions (Most Asked)

### Q: SQL vs NoSQL — when to use which?
**A:** **SQL** when: strong relationships, ACID transactions, fixed schema, complex JOINs. **NoSQL** when: flexible schema, horizontal scaling, document-oriented data, rapid iteration. Our Event model has variable sub-documents (agenda, FAQ, speakers) — perfect for MongoDB. A banking system would need PostgreSQL.

### Q: What is the aggregation framework?
**A:** MongoDB's data processing pipeline. Stages include `$match` (filter), `$group` (aggregate), `$lookup` (join), `$unwind` (flatten arrays), `$sort`, `$project`. We use it for: schedule conflict detection, admin platform stats (users by role, events by category), and potential analytics aggregations.

### Q: Explain indexing strategies.
**A:** Indexes speed up queries but slow down writes and use memory. Strategies:
- **Single field**: `{ email: 1 }` on User for login lookup
- **Compound**: `{ event: 1, student: 1 }` on Registration for duplicate check
- **Text**: `{ title: "text", description: "text" }` on Event for search
- **Unique**: Prevents duplicates (email, registration per event)
- **Sparse**: `{ googleId: 1 }` — only indexes documents that have the field

### Q: What is the difference between `findOneAndUpdate` and `updateOne`?
**A:** `findOneAndUpdate` returns the document (before or after update). `updateOne` returns just the operation result (matched/modified count). We use `findOneAndUpdate` for waitlist promotion — we need the promoted registration document to send the email and emit Socket event.

### Q: How do you handle data consistency without transactions?
**A:**
- Atomic operations on single documents (MongoDB guarantees single-doc atomicity)
- For multi-document: careful ordering (create registration → then update event seats)
- Compensating actions on failure (if email fails, still save the registration)
- For critical flows (payment): would use MongoDB multi-document transactions (`session.startTransaction()`)

---

## 14. Node.js Conceptual Questions (Most Asked)

### Q: Explain the event loop.
**A:** Node.js runs on a single thread with an event loop that handles async operations. Phases: timers → I/O callbacks → idle → poll → check → close. When an async operation (DB query, file read) starts, Node registers a callback and continues. When the operation completes, the callback is pushed to the appropriate queue. This is why Node handles thousands of concurrent connections despite being single-threaded.

### Q: How does middleware work in Express?
**A:** Functions with `(req, res, next)` signature. Called in order of `app.use()`. Each can modify req/res, end the response, or call `next()` to pass control. Our middleware chain: `helmet → json → cors → pinoHttp → rateLimiter → routes → errorHandler`. Auth middleware checks JWT and attaches user to `req.user`.

### Q: What is the difference between `require` and `import`?
**A:** `require` is CommonJS (synchronous, runtime). `import` is ES Modules (can be async, static analysis). Our project uses ES Modules (`"type": "module"` in package.json) with `import/export`. Benefits: tree-shaking, top-level await, better tooling support.

### Q: How do you handle errors in Express?
**A:**
- Try-catch in async controller functions
- Global error handler middleware `(err, req, res, next)` at the end of middleware chain
- Structured logging with Pino (not console.log)
- Sentry integration for production error tracking
- Non-blocking email errors (catch and log, don't crash)

### Q: Explain streams in Node.js.
**A:** Readable, Writable, Duplex, Transform. Process data chunk by chunk instead of loading entirely into memory. Used internally by: Express request/response, file uploads (Multer), database cursors. For our CSV export (planned): would pipe MongoDB cursor → Transform (format row) → Response stream.

---

## 15. Behavioral & Situational Questions

### Q: Tell me about a technical challenge you faced.
**A:** The Jitsi video integration. Initially used raw iframe embedding — blocked by X-Frame-Options. Switched to External API — black screen due to container height issues. Tried 4 different CSS approaches (h-screen, 100dvh, fixed positioning, flex) before landing on the padding-bottom aspect ratio trick with absolute positioning. The chat overlay required glass morphism (backdrop-blur) and smart stacking for message volume. Each iteration taught me something about CSS containment, viewport units, and flex layout.

### Q: How did you decide the architecture?
**A:** Started with a simple prototype (13 pages, 3 models). Identified scaling needs through the planning phase — documented everything in project-docs. Built incrementally: layouts first, then user system, then event expansion, then admin panel, then streaming. Each phase had its own commit, tests, and dev-log entry. The dual-layout pattern (public + dashboard) was decided after researching how Eventbrite, Meetup, and Hopin structure their apps.

### Q: How do you approach debugging?
**A:**
1. Read the error message carefully (most people skip this)
2. Check browser console AND server logs simultaneously
3. Isolate: is it frontend, backend, or database?
4. For API issues: test with Postman/curl first
5. For React: check component re-render cycle, useEffect dependencies
6. For real-time: check Socket.io connection, room membership
7. Add structured logging at key points, not random console.logs

### Q: How do you ensure code quality?
**A:**
- 80+ automated tests (39 backend + 41 E2E)
- Playwright for visual verification (screenshots)
- Backend tests verify: route imports, controller exports, model schemas, auth protection
- Progressive locking tested via lifecycle states
- Dev-log documents every decision for future reference
- Git history with descriptive commit messages
