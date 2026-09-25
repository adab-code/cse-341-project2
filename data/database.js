require('dotenv').config();

const { MongoClient } = require('mongodb');

let client;
let database;

const DB_NAME = process.env.MONGODB_DB || 'plantcare';

/**
 * Connect to the MongoDB cluster once and reuse the client for every request.
 * @param {Function} callback node style callback (err, db)
 */
const initDb = (callback) => {
    if (database) {
        return callback(null, database);
    }

    if (!process.env.MONGODB_URL) {
        return callback(new Error('MONGODB_URL is not defined. Add it to your .env file.'));
    }

    MongoClient.connect(process.env.MONGODB_URL)
        .then((mongoClient) => {
            client = mongoClient;
            database = client.db(DB_NAME);
            console.log(`Connected to MongoDB database "${DB_NAME}"`);
            callback(null, database);
        })
        .catch((err) => callback(err));
};

/**
 * Give the controllers access to a named collection.
 * @param {string} name collection name
 * @returns {import('mongodb').Collection}
 */
const getCollection = (name) => {
    if (!database) {
        throw new Error('Database not initialized');
    }
    return database.collection(name);
};

const closeDb = async () => {
    if (client) {
        await client.close();
        client = undefined;
        database = undefined;
    }
};

module.exports = { initDb, getCollection, closeDb, DB_NAME };
