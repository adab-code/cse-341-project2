const {
    isLengthBetween,
    isOneOf,
    isIntegerBetween,
    isNotInFuture,
} = require('./helpers');

// The nine fields a plant document stores.
const PLANT_FIELDS = [
    'name',
    'species',
    'category',
    'nickname',
    'location',
    'lightRequirement',
    'wateringIntervalDays',
    'acquiredDate',
    'notes',
];

const PLANT_CATEGORIES = [
    'Succulent',
    'Tropical',
    'Fern',
    'Orchid',
    'Cactus',
    'Palm',
    'Herb',
    'Other',
];

const LIGHT_REQUIREMENTS = [
    'Low Light',
    'Medium Light',
    'Bright Indirect',
    'Direct Sun',
];

// Rules per field: [label, test, message]
const PLANT_RULES = {
    name: ['name', (v) => isLengthBetween(v, 1, 80), 'name must be a string between 1 and 80 characters.'],
    species: ['species', (v) => isLengthBetween(v, 1, 80), 'species must be a string between 1 and 80 characters.'],
    category: [
        'category',
        (v) => isOneOf(v, PLANT_CATEGORIES),
        `category must be one of: ${PLANT_CATEGORIES.join(', ')}.`,
    ],
    nickname: ['nickname', (v) => isLengthBetween(v, 1, 40), 'nickname must be a string between 1 and 40 characters.'],
    location: ['location', (v) => isLengthBetween(v, 1, 60), 'location must be a string between 1 and 60 characters.'],
    lightRequirement: [
        'lightRequirement',
        (v) => isOneOf(v, LIGHT_REQUIREMENTS),
        `lightRequirement must be one of: ${LIGHT_REQUIREMENTS.join(', ')}.`,
    ],
    wateringIntervalDays: [
        'wateringIntervalDays',
        (v) => isIntegerBetween(v, 1, 365),
        'wateringIntervalDays must be a whole number between 1 and 365.',
    ],
    acquiredDate: [
        'acquiredDate',
        (v) => isNotInFuture(v),
        'acquiredDate must be a real past date in YYYY-MM-DD format.',
    ],
    notes: ['notes', (v) => typeof v === 'string' && v.length <= 500, 'notes must be a string of 500 characters or fewer.'],
};

/**
 * Keep only the known plant fields so a client can never inject extra keys.
 * @param {object} body request body
 * @returns {object} sanitized plant
 */
const buildPlant = (body) => {
    const plant = {};
    for (const field of PLANT_FIELDS) {
        if (body[field] !== undefined) {
            plant[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
        }
    }
    return plant;
};

/**
 * Validate a plant document.
 * @param {object} plant sanitized plant
 * @param {Array<string>} [fields] fields to require, defaults to every field
 * @returns {{isValid: boolean, errors: string[]}}
 */
const validatePlant = (plant, fields = PLANT_FIELDS) => {
    const errors = [];

    for (const field of fields) {
        const value = plant[field];

        if (value === undefined || value === null) {
            errors.push(`${field} is required.`);
            continue;
        }

        const [label, test, message] = PLANT_RULES[field];
        if (!test(value)) {
            errors.push(message.replace(label, field));
        }
    }

    return { isValid: errors.length === 0, errors };
};

module.exports = {
    PLANT_FIELDS,
    PLANT_CATEGORIES,
    LIGHT_REQUIREMENTS,
    buildPlant,
    validatePlant,
};
