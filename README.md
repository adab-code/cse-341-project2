# CSE 341 Project 2 - Plant Care API

REST API for managing houseplants and the care tasks performed on them, stored in
MongoDB. Built with Node.js, Express and the native MongoDB driver.

**Status:** Part 1 complete (CRUD, validation and error handling). Authentication
with OAuth is added in Part 2 during Week 04.

**Repository:** <https://github.com/adab-code/cse-341-project2>
**Live deployment:** <https://project2-shmi.onrender.com>
**Interactive documentation:** <https://project2-shmi.onrender.com/api-docs>

## Database

The project uses the same MongoDB Atlas cluster as Project 1 but its own
database, `plantcare`, with two collections.

| Collection | Fields | Description |
| --- | --- | --- |
| `plants` | 9 (+ `_id`) | One document per houseplant. |
| `careLogs` | 5 (+ `_id`) | One document per care task, referencing a plant. |

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

## Endpoints

Base URL locally: `http://localhost:3001`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Welcome message |
| `GET` | `/plants` | Get all plants (optional `?category=` and `?lightRequirement=`) |
| `GET` | `/plants/{id}` | Get one plant |
| `POST` | `/plants` | Create a plant |
| `PUT` | `/plants/{id}` | Replace a plant |
| `DELETE` | `/plants/{id}` | Delete a plant (409 if it still has care logs) |
| `GET` | `/careLogs` | Get all care logs (optional `?plantId=` and `?taskType=`) |
| `GET` | `/careLogs/{id}` | Get one care log |
| `POST` | `/careLogs` | Create a care log |
| `PUT` | `/careLogs/{id}` | Replace a care log |
| `DELETE` | `/careLogs/{id}` | Delete a care log |

Interactive documentation: **`/api-docs`**

## Error handling

| Status | When it is returned |
| --- | --- |
| `400` | Malformed JSON, a malformed ObjectId, or a body that fails validation. Validation errors come back as `{ "error": "Validation failed.", "details": [ ... ] }` with one message per problem. |
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
```

Then run the server:

```bash
npm start     # node server.js
npm run dev   # nodemon, restarts on save
```

Regenerate `swagger.json` after changing any route or its annotations:

```bash
npm run swagger
```

Run the validation tests:

```bash
npm test
```

## Project structure

```
├── controllers/        # talks to MongoDB, sends the response
│   ├── careLogs.js
│   └── plants.js
├── data/
│   └── database.js     # single shared MongoClient
├── routes/             # URL -> controller, carries the Swagger annotations
│   ├── careLogs.js
│   ├── index.js
│   ├── plants.js
│   └── swagger.js
├── tests/
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
   `MONGODB_URL` and `MONGODB_DB`. Render injects `PORT` automatically.
4. Deploy. The API is served at `https://<your-service>.onrender.com` and the
   docs at `https://<your-service>.onrender.com/api-docs`.

Render runs `npm install` and then `npm start`, so no build command is needed.
