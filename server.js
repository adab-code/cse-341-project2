// Core Express setup for the Plant Care API.
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');

const mongodb = require('./data/database');
const { COOKIE_NAME, MAX_AGE_MS, createSessionStore } = require('./auth/session');
const { passport } = require('./auth/passport');

const app = express();

const port = process.env.PORT || 3001;

// Render terminates TLS in front of the app, so this is what makes
// req.protocol and the secure cookie flag see the real https request.
app.set('trust proxy', 1);

// Only the listed origin may send credentialed requests, which is what the
// session cookie needs. Without CORS_ORIGIN no cross origin header is sent at
// all, so the browser blocks other sites; same origin calls are unaffected.
const corsOptions = {
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((value) => value.trim())
        : false,
    credentials: true,
};
app.use(cors(corsOptions));

// Parse incoming JSON request bodies.
app.use(express.json());

// Reject a malformed JSON body with a 400 instead of letting it throw later.
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Request body is not valid JSON.' });
    }
    next(err);
});

// Sessions hold the GitHub id of the logged in user between requests.
app.use(
    session({
        store: createSessionStore(),
        name: COOKIE_NAME,
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        // 'lax' is required: GitHub comes back with a top level GET redirect and
        // a 'strict' cookie would be left behind on the way in.
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: MAX_AGE_MS,
        },
    })
);

// Ties req.user and req.isAuthenticated() to the session.
app.use(passport.initialize());
app.use(passport.session());

// Mount the main router.
app.use('/', require('./routes'));

// Fallback for any route that does not exist.
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Central error handler so no request can take the process down.
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
});

// Only start the server once the database is ready.
mongodb.initDb((err) => {
    if (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }
    app.listen(port, () => {
        console.log(`Database is listening and Server is running on port ${port}`);
    });
});
