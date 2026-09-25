// Core Express setup for the Plant Care API.
require('dotenv').config();

const express = require('express');
const mongodb = require('./data/database');
const app = express();

const port = process.env.PORT || 3001;

// Parse incoming JSON request bodies.
app.use(express.json());

// Reject a malformed JSON body with a 400 instead of letting it throw later.
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Request body is not valid JSON.' });
    }
    next(err);
});

// Enable CORS so any client can call the API.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

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
