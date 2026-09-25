const { ObjectId } = require('mongodb');
const { isLengthBetween, isOneOf, isIntegerBetween, isNotInFuture } = require('./helpers');

const CARE_LOG_FIELDS = ['plantId', 'taskType', 'performedDate', 'durationMinutes', 'notes'];

const TASK_TYPES = [
    'Watering',
    'Fertilizing',
    'Repotting',
    'Pruning',
    'Pest Treatment',
    'Repositioning',
];

const CARE_LOG_RULES = {
    plantId: [
        'plantId',
        (v) => typeof v === 'string' && ObjectId.isValid(v.trim()),
        'plantId must be a valid MongoDB ObjectId of an existing plant.',
    ],
    taskType: [
        'taskType',
        (v) => isOneOf(v, TASK_TYPES),
        `taskType must be one of: ${TASK_TYPES.join(', ')}.`,
    ],
    performedDate: [
        'performedDate',
        (v) => isNotInFuture(v),
        'performedDate must be a real past date in YYYY-MM-DD format.',
    ],
    durationMinutes: [
        'durationMinutes',
        (v) => isIntegerBetween(v, 1, 1440),
        'durationMinutes must be a whole number between 1 and 1440.',
    ],
    notes: ['notes', (v) => typeof v === 'string' && v.length <= 500, 'notes must be a string of 500 characters or fewer.'],
};

/**
 * Keep only the known care log fields.
 * @param {object} body request body
 * @returns {object} sanitized care log
 */
const buildCareLog = (body) => {
    const careLog = {};
    for (const field of CARE_LOG_FIELDS) {
        if (body[field] !== undefined) {
            careLog[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
        }
    }
    return careLog;
};

/**
 * Validate a care log document.
 * @param {object} careLog sanitized care log
 * @param {Array<string>} [fields] fields to require, defaults to every field
 * @returns {{isValid: boolean, errors: string[]}}
 */
const validateCareLog = (careLog, fields = CARE_LOG_FIELDS) => {
    const errors = [];

    for (const field of fields) {
        const value = careLog[field];

        if (value === undefined || value === null) {
            errors.push(`${field} is required.`);
            continue;
        }

        const [label, test, message] = CARE_LOG_RULES[field];
        if (!test(value)) {
            errors.push(message.replace(label, field));
        }
    }

    return { isValid: errors.length === 0, errors };
};

module.exports = {
    CARE_LOG_FIELDS,
    TASK_TYPES,
    buildCareLog,
    validateCareLog,
};
