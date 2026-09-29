const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const { getClientPromise, DB_NAME } = require('../data/database');

// Name of the session cookie. Also used to clear it on logout and to document
// the security scheme in the Swagger spec.
const COOKIE_NAME = 'plantcare.sid';

// One day, both for the browser cookie and for the MongoDB TTL index.
const MAX_AGE_MS = 1000 * 60 * 60 * 24;

/**
 * Build the session store on top of the same MongoClient the API already uses.
 * Keeping the sessions in MongoDB means the login survives the restarts of the
 * Render free tier, which would otherwise log the user out on its own.
 * @returns {import('connect-mongo').MongoStore}
 */
const createSessionStore = () =>
    MongoStore.create({
        clientPromise: getClientPromise(),
        dbName: DB_NAME,
        collectionName: 'sessions',
        ttl: MAX_AGE_MS / 1000,
        autoRemove: 'native',
    });

module.exports = { COOKIE_NAME, MAX_AGE_MS, createSessionStore };
