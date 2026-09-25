const { ObjectId } = require('mongodb');
const { getCollection } = require('../data/database');
const { buildPlant, validatePlant } = require('../validation/plants');

const COLLECTION = 'plants';

/**
 * Turn a route parameter into an ObjectId, or null when the client sent garbage.
 * @param {string} id raw id from the URL
 * @returns {ObjectId|null}
 */
const toObjectId = (id) => {
    if (typeof id !== 'string' || !ObjectId.isValid(id.trim())) {
        return null;
    }
    return new ObjectId(id.trim());
};

const getAllPlants = async (req, res, next) => {
    try {
        const filter = {};
        // Optional filter so the collection can be queried by category or light need.
        if (req.query.category) {
            filter.category = String(req.query.category).trim();
        }
        if (req.query.lightRequirement) {
            filter.lightRequirement = String(req.query.lightRequirement).trim();
        }

        const plants = await getCollection(COLLECTION).find(filter).sort({ name: 1 }).toArray();
        res.status(200).json(plants);
    } catch (err) {
        next(err);
    }
};

const getPlantById = async (req, res, next) => {
    const plantId = toObjectId(req.params.id);
    if (!plantId) {
        return res.status(400).json({ error: 'Invalid plant id. It must be a 24 character hex string.' });
    }

    try {
        const plant = await getCollection(COLLECTION).findOne({ _id: plantId });
        if (!plant) {
            return res.status(404).json({ error: `No plant found with id ${req.params.id}.` });
        }
        res.status(200).json(plant);
    } catch (err) {
        next(err);
    }
};

const createPlant = async (req, res, next) => {
    const plant = buildPlant(req.body);
    const { isValid, errors } = validatePlant(plant);

    if (!isValid) {
        return res.status(400).json({ error: 'Validation failed.', details: errors });
    }

    try {
        const result = await getCollection(COLLECTION).insertOne(plant);
        res.status(201).json({ _id: result.insertedId });
    } catch (err) {
        next(err);
    }
};

const updatePlant = async (req, res, next) => {
    const plantId = toObjectId(req.params.id);
    if (!plantId) {
        return res.status(400).json({ error: 'Invalid plant id. It must be a 24 character hex string.' });
    }

    const plant = buildPlant(req.body);
    const { isValid, errors } = validatePlant(plant);

    if (!isValid) {
        return res.status(400).json({ error: 'Validation failed.', details: errors });
    }

    try {
        const result = await getCollection(COLLECTION).replaceOne({ _id: plantId }, plant);
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: `No plant found with id ${req.params.id}.` });
        }
        res.status(200).json({ message: 'Plant updated successfully.', updatedId: plantId });
    } catch (err) {
        next(err);
    }
};

const deletePlant = async (req, res, next) => {
    const plantId = toObjectId(req.params.id);
    if (!plantId) {
        return res.status(400).json({ error: 'Invalid plant id. It must be a 24 character hex string.' });
    }

    try {
        // Refuse to orphan the care logs that point at this plant.
        const careLogCount = await getCollection('careLogs').countDocuments({ plantId });
        if (careLogCount > 0) {
            return res.status(409).json({
                error: `This plant still has ${careLogCount} care log(s). Delete those before deleting the plant.`,
            });
        }

        const result = await getCollection(COLLECTION).deleteOne({ _id: plantId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: `No plant found with id ${req.params.id}.` });
        }
        res.status(200).json({ message: 'Plant deleted successfully.', deletedId: plantId });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    toObjectId,
    getAllPlants,
    getPlantById,
    createPlant,
    updatePlant,
    deletePlant,
};
