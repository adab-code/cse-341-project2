const { getCollection } = require('../data/database');
const { toObjectId } = require('./plants');
const { buildCareLog, validateCareLog } = require('../validation/careLogs');

const COLLECTION = 'careLogs';

const getAllCareLogs = async (req, res, next) => {
    try {
        const filter = {};
        // Optional ?plantId= filter to only return the history of one plant.
        if (req.query.plantId !== undefined) {
            const plantId = toObjectId(String(req.query.plantId));
            if (!plantId) {
                return res.status(400).json({ error: 'Invalid plantId query parameter.' });
            }
            filter.plantId = plantId;
        }
        if (req.query.taskType) {
            filter.taskType = String(req.query.taskType).trim();
        }

        const careLogs = await getCollection(COLLECTION)
            .find(filter)
            .sort({ performedDate: -1 })
            .toArray();
        res.status(200).json(careLogs);
    } catch (err) {
        next(err);
    }
};

const getCareLogById = async (req, res, next) => {
    const careLogId = toObjectId(req.params.id);
    if (!careLogId) {
        return res.status(400).json({ error: 'Invalid care log id. It must be a 24 character hex string.' });
    }

    try {
        const careLog = await getCollection(COLLECTION).findOne({ _id: careLogId });
        if (!careLog) {
            return res.status(404).json({ error: `No care log found with id ${req.params.id}.` });
        }
        res.status(200).json(careLog);
    } catch (err) {
        next(err);
    }
};

const createCareLog = async (req, res, next) => {
    const careLog = buildCareLog(req.body);
    const { isValid, errors } = validateCareLog(careLog);

    if (!isValid) {
        return res.status(400).json({ error: 'Validation failed.', details: errors });
    }

    try {
        // The referenced plant has to exist, otherwise the log is useless.
        const plantId = toObjectId(careLog.plantId);
        const plantExists = await getCollection('plants').findOne({ _id: plantId }, { projection: { _id: 1 } });
        if (!plantExists) {
            return res.status(404).json({ error: `No plant found with id ${careLog.plantId}.` });
        }

        careLog.plantId = plantId;
        const result = await getCollection(COLLECTION).insertOne(careLog);
        res.status(201).json({ _id: result.insertedId });
    } catch (err) {
        next(err);
    }
};

const updateCareLog = async (req, res, next) => {
    const careLogId = toObjectId(req.params.id);
    if (!careLogId) {
        return res.status(400).json({ error: 'Invalid care log id. It must be a 24 character hex string.' });
    }

    const careLog = buildCareLog(req.body);
    const { isValid, errors } = validateCareLog(careLog);

    if (!isValid) {
        return res.status(400).json({ error: 'Validation failed.', details: errors });
    }

    try {
        const plantId = toObjectId(careLog.plantId);
        const plantExists = await getCollection('plants').findOne({ _id: plantId }, { projection: { _id: 1 } });
        if (!plantExists) {
            return res.status(404).json({ error: `No plant found with id ${careLog.plantId}.` });
        }

        careLog.plantId = plantId;
        const result = await getCollection(COLLECTION).replaceOne({ _id: careLogId }, careLog);
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: `No care log found with id ${req.params.id}.` });
        }
        res.status(200).json({ message: 'Care log updated successfully.', updatedId: careLogId });
    } catch (err) {
        next(err);
    }
};

const deleteCareLog = async (req, res, next) => {
    const careLogId = toObjectId(req.params.id);
    if (!careLogId) {
        return res.status(400).json({ error: 'Invalid care log id. It must be a 24 character hex string.' });
    }

    try {
        const result = await getCollection(COLLECTION).deleteOne({ _id: careLogId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: `No care log found with id ${req.params.id}.` });
        }
        res.status(200).json({ message: 'Care log deleted successfully.', deletedId: careLogId });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllCareLogs,
    getCareLogById,
    createCareLog,
    updateCareLog,
    deleteCareLog,
};
