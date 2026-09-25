const test = require('node:test');
const assert = require('node:assert');

const { buildPlant, validatePlant } = require('../validation/plants');
const { buildCareLog, validateCareLog } = require('../validation/careLogs');
const { toObjectId } = require('../controllers/plants');

const validPlant = {
    name: 'Monstera',
    species: 'Monstera deliciosa',
    category: 'Tropical',
    nickname: 'Delilah',
    location: 'Living room window',
    lightRequirement: 'Bright Indirect',
    wateringIntervalDays: 7,
    acquiredDate: '2024-03-15',
    notes: 'Splitting leaves.',
};

test('accepts a complete plant document', () => {
    const { isValid, errors } = validatePlant(buildPlant(validPlant));
    assert.strictEqual(isValid, true, errors.join(' '));
    assert.deepStrictEqual(errors, []);
});

test('reports every missing field at once', () => {
    const { isValid, errors } = validatePlant({ name: 'Monstera' });
    assert.strictEqual(isValid, false);
    assert.strictEqual(errors.length, 8);
    assert.ok(errors.includes('species is required.'));
});

test('rejects a value outside an enum', () => {
    const { isValid } = validatePlant({ ...validPlant, category: 'Alien' });
    assert.strictEqual(isValid, false);
});

test('rejects a non integer watering interval', () => {
    assert.strictEqual(validatePlant({ ...validPlant, wateringIntervalDays: 7.5 }).isValid, false);
    assert.strictEqual(validatePlant({ ...validPlant, wateringIntervalDays: 0 }).isValid, false);
    assert.strictEqual(validatePlant({ ...validPlant, wateringIntervalDays: 400 }).isValid, false);
});

test('rejects an impossible or future date', () => {
    assert.strictEqual(validatePlant({ ...validPlant, acquiredDate: '2024-02-31' }).isValid, false);
    assert.strictEqual(validatePlant({ ...validPlant, acquiredDate: '03/15/2024' }).isValid, false);
    assert.strictEqual(validatePlant({ ...validPlant, acquiredDate: '2099-01-01' }).isValid, false);
});

test('strips unknown keys and trims strings', () => {
    const plant = buildPlant({ ...validPlant, name: '  Fern  ', secret: 'do not store me' });
    assert.strictEqual(plant.name, 'Fern');
    assert.strictEqual(plant.secret, undefined);
});

test('accepts a complete care log', () => {
    const careLog = buildCareLog({
        plantId: '6ab6bd0406634384d69bc582',
        taskType: 'Watering',
        performedDate: '2025-06-01',
        durationMinutes: 12,
        notes: 'Top watered.',
    });
    assert.strictEqual(validateCareLog(careLog).isValid, true);
});

test('rejects a care log with a malformed plantId', () => {
    const { isValid, errors } = validateCareLog({
        plantId: 'not-an-id',
        taskType: 'Watering',
        performedDate: '2025-06-01',
        durationMinutes: 12,
        notes: '',
    });
    assert.strictEqual(isValid, false);
    assert.ok(errors.some((e) => e.startsWith('plantId')));
});

test('toObjectId returns null for garbage and an ObjectId for a real id', () => {
    assert.strictEqual(toObjectId('nope'), null);
    assert.strictEqual(toObjectId('12345'), null);
    assert.strictEqual(String(toObjectId('6ab6bd0406634384d69bc582')), '6ab6bd0406634384d69bc582');
});
