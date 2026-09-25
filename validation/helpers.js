/**
 * Small validation helpers shared by every controller.
 * Each validator returns null when the value is fine, or a message describing
 * exactly what is wrong so the API can answer with a 400.
 */

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

const isLengthBetween = (value, min, max) =>
    isNonEmptyString(value) && value.trim().length >= min && value.trim().length <= max;

const isOneOf = (value, allowed) => isNonEmptyString(value) && allowed.includes(value.trim());

const isIntegerBetween = (value, min, max) => {
    // Reject "12abc" and 12.5, only real integers inside the range are valid.
    if (typeof value === 'number') {
        return Number.isInteger(value) && value >= min && value <= max;
    }
    if (!isNonEmptyString(value) || !/^-?\d+$/.test(value.trim())) {
        return false;
    }
    const parsed = Number(value.trim());
    return Number.isInteger(parsed) && parsed >= min && parsed <= max;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (value) => {
    if (!DATE_PATTERN.test(value) || !isNonEmptyString(value)) {
        return false;
    }
    const [year, month, day] = value.trim().split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

const isNotInFuture = (value) => {
    if (!isValidDateString(value)) {
        return false;
    }
    const [year, month, day] = value.trim().split('-').map(Number);
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return Date.UTC(year, month - 1, day) <= todayUtc;
};

module.exports = {
    isNonEmptyString,
    isLengthBetween,
    isOneOf,
    isIntegerBetween,
    isValidDateString,
    isNotInFuture,
    DATE_PATTERN,
};
