require('dotenv').config();

const { MongoClient } = require('mongodb');

let client;
let clientPromise;
let database;

const DB_NAME = process.env.MONGODB_DB || 'plantcare';

/**
 * Connect to the MongoDB cluster once and reuse the client for every request.
 * The connection promise is kept so middleware that needs the database before
 * the server starts listening (the session store) can wait on the same one.
 * @returns {Promise<import('mongodb').MongoClient>}
 */
const getClientPromise = () => {
    if (!clientPromise) {
        if (!process.env.MONGODB_URL) {
            clientPromise = Promise.reject(new Error('MONGODB_URL is not defined. Add it to your .env file.'));
        } else {
            clientPromise = MongoClient.connect(process.env.MONGODB_URL).then((mongoClient) => {
                client = mongoClient;
                database = mongoClient.db(DB_NAME);
                return mongoClient;
            });
        }
    }
    return clientPromise;
};

/**
 * Connect to the MongoDB cluster and hand the database to a node style callback.
 * @param {Function} callback node style callback (err, db)
 */
const initDb = (callback) => {
    getClientPromise()
        .then((mongoClient) => {
            console.log(`Connected to MongoDB database "${DB_NAME}"`);
            callback(null, mongoClient.db(DB_NAME));
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
        clientPromise = undefined;
    }
};

module.exports = { initDb, getCollection, getClientPromise, closeDb, DB_NAME };
