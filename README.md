# CSE 341 Project 2 - Plant Care API

REST API for managing houseplants and the care tasks performed on them, stored in
MongoDB. Built with Node.js, Express and the native MongoDB driver.

**Status:** Part 1 (CRUD, validation, error handling) and Part 2 (OAuth with
GitHub) are both complete.

**Repository:** <https://github.com/adab-code/cse-341-project2>
**Live deployment:** <https://project2-shmi.onrender.com>
**Interactive documentation:** <https://project2-shmi.onrender.com/api-docs>

## Database

The project uses the same MongoDB Atlas cluster as Project 1 but its own
database, `plantcare`.

| Collection | Fields | Description |
| --- | --- | --- |
| `plants` | 9 (+ `_id`) | One document per houseplant. |
| `careLogs` | 5 (+ `_id`) | One document per care task, referencing a plant. |
| `users` | 9 (+ `_id`) | One document per GitHub account that logged in. |
| `sessions` | managed by `connect-mongo` | Server side sessions, so a login survives a restart. |

### `plants`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required, 1-80 characters |
| `species` | string | required, 1-80 characters |
| `category` | string | required, one of `Succulent`, `Tropical`, `Fern`, `Orchid`, `Cactus`, `Palm`, `Herb`, `Other` |
| `nickname` | string | required, 1-40 characters |
| `location` | string | required, 1-60 characters |
| `lightRequirement` | string | required, one of `Low Light`, `Medium Light`, `Bright Indirect`, `Direct Sun` |
| `wateringIntervalDays` | integer | required, 1-365 |
| `acquiredDate` | string | required, a real past date in `YYYY-MM-DD` format |
| `notes` | string | required, 500 characters or fewer |

### `careLogs`

| Field | Type | Rules |
| --- | --- | --- |
| `plantId` | ObjectId | required, must reference an existing plant |
| `taskType` | string | required, one of `Watering`, `Fertilizing`, `Repotting`, `Pruning`, `Pest Treatment`, `Repositioning` |
| `performedDate` | string | required, a real past date in `YYYY-MM-DD` format |
| `durationMinutes` | integer | required, 1-1440 |
| `notes` | string | required, 500 characters or fewer |

### `users`

Written by the OAuth callback, not by hand. No password is ever stored: GitHub
authenticates the person and the app only keeps the public profile.

| Field | Type | Rules |
| --- | --- | --- |
| `githubId` | string | required, the id GitHub gave the account, unique |
| `username` | string | required, the GitHub handle |
| `displayName` | string | required, falls back to the username |
| `email` | string or null | the address GitHub returned, null when it is private |
| `avatarUrl` | string or null | GitHub avatar |
| `profileUrl` | string | link to the GitHub profile |
| `loginCount` | integer | incremented on every login |
| `createdAt` | date | set the first time the account logs in |
| `lastLoginAt` | date | set on every login |

## Endpoints

Base URL locally: `http://localhost:3001`

Reading is public. Every route that changes data needs a session started with
GitHub, and answers `401` without one.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | public | Welcome message and session status |
| `GET` | `/auth/github` | public | Opens the GitHub authorization page (JSON URL for Swagger UI) |
| `GET` | `/auth/github/callback` | public | Where GitHub sends the browser back (redirect) |
| `GET` | `/auth/me` | public | The logged in user, or `401` |
| `POST` | `/auth/logout` | public | Closes the session, answers JSON |
| `GET` | `/auth/logout` | public | Closes the session, redirects home |
| `GET` | `/plants` | public | Get all plants (optional `?category=` and `?lightRequirement=`) |
| `GET` | `/plants/{id}` | public | Get one plant |
| `POST` | `/plants` | **session** | Create a plant |
| `PUT` | `/plants/{id}` | **session** | Replace a plant |
| `DELETE` | `/plants/{id}` | **session** | Delete a plant (409 if it still has care logs) |
| `GET` | `/careLogs` | public | Get all care logs (optional `?plantId=` and `?taskType=`) |
| `GET` | `/careLogs/{id}` | public | Get one care log |
| `POST` | `/careLogs` | **session** | Create a care log |
| `PUT` | `/careLogs/{id}` | **session** | Replace a care log |
| `DELETE` | `/careLogs/{id}` | **session** | Delete a care log |

Interactive documentation: **`/api-docs`**

## Authentication

Login uses the OAuth 2.0 authorization code flow with Passport and GitHub. No
password is ever typed into this app or written to MongoDB.

1. `GET /auth/github` takes the browser to GitHub with the `read:user` and
   `user:email` scopes. The route answers `200` with a small page that forwards
   on its own, because a `302` to another origin makes Swagger UI report a CORS
   failure; called from Swagger UI or curl it answers the same URL as JSON.
2. The person authorizes the app and GitHub redirects to
   `GET /auth/github/callback`, which has to match the **Authorization callback
   URL** of the GitHub OAuth app character for character. A handshake that fails
   comes back to `/?login=failed` instead of an error page.
3. The callback saves the profile in `users`, keeps only the GitHub id in the
   session and redirects to the home page.
4. Passport puts the user back on `req.user` on every following request, and
   `requireAuth` lets the protected routes through.

| Piece | File |
| --- | --- |
| Session and cookie | `auth/session.js`, `auth/middleware.js` |
| GitHub strategy, `serializeUser` / `deserializeUser` | `auth/passport.js` |
| Log in, log out, current user | `routes/auth.js` |
| The guard used by the protected routes | `auth/middleware.js` |
| Where the GitHub profile is stored | `controllers/users.js` |

The session id travels in the `plantcare.sid` cookie, which is `httpOnly` and
`sameSite=lax` so it survives the redirect back from GitHub. On Render the app
runs behind a proxy, so `app.set('trust proxy', 1)` makes Express see the real
https request and the cookie gets the `secure` flag. Sessions are kept in the
`sessions` collection with `connect-mongo`, otherwise a restart of the free tier
would log everybody out.

Six routes are protected: `POST`, `PUT` and `DELETE` of both `plants` and
`careLogs`. They are marked with the `sessionCookie` security scheme in
`swagger.json`, so the docs show a lock on them and a `401` response.

## Error handling

| Status | When it is returned |
| --- | --- |
| `400` | Malformed JSON, a malformed ObjectId, or a body that fails validation. Validation errors come back as `{ "error": "Validation failed.", "details": [ ... ] }` with one message per problem. |
| `401` | A protected route was called without a session. |
| `404` | No document exists with the requested id, or a `plantId` does not reference a plant. |
| `409` | Deleting a plant that still has care logs attached. |
| `500` | Any unhandled server error, caught by the central error handler. |

Unknown routes return a `404` JSON response instead of the default HTML page.

## Getting started

```bash
npm install
```

Create your own `.env` from the example. `.env` is gitignored, so credentials are
never pushed to GitHub.

```bash
cp .env.example .env
```

```
MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.<clusterid>.mongodb.net
MONGODB_DB=plantcare
PORT=3001

GITHUB_CLIENT_ID=<from the GitHub OAuth app>
GITHUB_CLIENT_SECRET=<from the GitHub OAuth app>
CALLBACK_URL=https://<your-service>.onrender.com/auth/github/callback
SESSION_SECRET=<long random string>
CORS_ORIGIN=http://localhost:3001
NODE_ENV=development
```

`CALLBACK_URL` must be identical to the Authorization callback URL of the GitHub
OAuth app. GitHub only accepts one callback per app, so with the deployed value
the handshake has to run on that host; the server answers `400` with an
explanation if it is reached somewhere else. To log in against
`http://localhost:3001`, point `CALLBACK_URL` at localhost and register a second
OAuth app with `http://localhost:3001/auth/github/callback`.

Then run the server:

```bash
npm start     # node server.js
npm run dev   # nodemon, restarts on save
```

Regenerate `swagger.json` after changing any route or its annotations:

```bash
npm run swagger
```

Run the tests:

```bash
npm test
```

## Project structure

```
├── auth/
│   ├── middleware.js     # requireAuth, the guard on the protected routes
│   ├── passport.js       # GitHub strategy, serialize/deserialize
│   └── session.js        # express-session plus the connect-mongo store
├── controllers/        # talks to MongoDB, sends the response
│   ├── careLogs.js
│   ├── plants.js
│   └── users.js        # stores the GitHub profile on login
├── data/
│   └── database.js     # single shared MongoClient
├── routes/             # URL -> controller, carries the Swagger annotations
│   ├── auth.js
│   ├── careLogs.js
│   ├── index.js
│   ├── plants.js
│   └── swagger.js
├── tests/
│   ├── auth.test.js
│   └── validation.test.js
├── validation/         # field rules, no database involved
│   ├── careLogs.js
│   ├── helpers.js
│   └── plants.js
├── .env.example
├── routes.rest         # ready made requests for the REST Client extension
├── server.js
├── swagger.js          # generates swagger.json from the routes
└── swagger.json
```

## Deploying to Render

1. Push this repository to GitHub.
2. In Render create a new **Web Service** and connect the repository.
3. Under **Environment** add the same variables as your `.env`:
   - `MONGODB_URL` and `MONGODB_DB`
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` from the GitHub OAuth app
   - `CALLBACK_URL=https://<your-service>.onrender.com/auth/github/callback`
   - `SESSION_SECRET`, any long random string
   - `CORS_ORIGIN=https://<your-service>.onrender.com` (no trailing dot)
   - `NODE_ENV=production`, which turns on the `secure` flag of the cookie

   Render injects `PORT` automatically.
4. Deploy. The API is served at `https://<your-service>.onrender.com`, the docs
   at `https://<your-service>.onrender.com/api-docs`, and the OAuth callback URL
   of the GitHub app has to be that same address.

Render runs `npm install` and then `npm start`, so no build command is needed.
