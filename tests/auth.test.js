const test = require('node:test');
const assert = require('node:assert');

const { requireAuth } = require('../auth/middleware');

/**
 * Minimal stand in for an Express response, it only records what was sent.
 */
const fakeRes = () => {
    const res = { statusCode: null, body: null, ended: false };
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (payload) => {
        res.body = payload;
        res.ended = true;
        return res;
    };
    return res;
};

test('requireAuth answers 401 when there is no session', () => {
    const req = { isAuthenticated: () => false };
    const res = fakeRes();
    let nextCalled = false;

    requireAuth(req, res, () => {
        nextCalled = true;
    });

    assert.strictEqual(nextCalled, false, 'the controller must not run');
    assert.strictEqual(res.statusCode, 401);
    assert.ok(res.ended);
    assert.match(res.body.error, /Authentication required/);
    assert.match(res.body.error, /\/auth\/github/);
});

test('requireAuth answers 401 when Passport is not attached to the request', () => {
    const res = fakeRes();
    let nextCalled = false;

    requireAuth({}, res, () => {
        nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
});

test('requireAuth lets an authenticated request through', () => {
    const req = { isAuthenticated: () => true, user: { githubId: '12345678' } };
    const res = fakeRes();
    let nextCalled = false;

    requireAuth(req, res, () => {
        nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, 'the controller must run');
    assert.strictEqual(res.ended, false, 'nothing is sent before the controller');
    assert.strictEqual(res.statusCode, null);
});
