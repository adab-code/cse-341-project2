const express = require('express');
const router = express.Router();

const { passport, isEnabled, SCOPES } = require('../auth/passport');
const { COOKIE_NAME } = require('../auth/session');

/**
 * GitHub only accepts the one callback URL registered on the OAuth app, so a
 * request coming from a different host can never finish the handshake. Saying
 * so here beats a confusing error page from GitHub.
 * @param {object} req Express request
 * @returns {string|null} the host of the registered callback
 */
const registeredHost = () => {
    try {
        return new URL(process.env.CALLBACK_URL).host;
    } catch {
        return null;
    }
};

/**
 * Close the session: drop the passport data and delete the server side record.
 * The response is left to the caller, so the redirect and the JSON versions of
 * the logout stay separate.
 * @param {object} req Express request
 * @param {Function} next next middleware
 * @param {Function} done runs once the session is gone
 */
const destroySession = (req, next, done) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        if (req.session) {
            return req.session.destroy(() => done());
        }
        return done();
    });
};

router.get('/github', (req, res, next) => {
    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Log in with GitHub'
    #swagger.description = 'Starts the OAuth handshake. GitHub sends the browser back to /auth/github/callback, which stores the user in the session and returns to the home page. Use it from a browser, it answers with a redirect to github.com.'
    #swagger.produces = ['text/html']
    #swagger.responses[302] = { description: 'Redirect to the GitHub authorization page.' }
    #swagger.responses[400] = { description: 'Bad Request - This server is not the one registered as the OAuth callback.' }
    #swagger.responses[503] = { description: 'Service Unavailable - The GitHub OAuth credentials are not configured on the server.' }
    */
    if (!isEnabled) {
        return res.status(503).json({
            error: 'GitHub login is not configured on this server. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET and CALLBACK_URL.',
        });
    }

    if (registeredHost() !== null && registeredHost() !== req.get('host')) {
        return res.status(400).json({
            error: `This server is not the one registered on the GitHub OAuth app. The registered callback is ${process.env.CALLBACK_URL}, so log in on that host.`,
        });
    }

    return passport.authenticate('github', { scope: SCOPES })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'GitHub OAuth callback'
    #swagger.description = 'The URL GitHub redirects to after the user authorizes the app. It saves the profile in the users collection, opens the session and redirects to the home page. Not called by hand.'
    #swagger.produces = ['text/html']
    #swagger.responses[302] = { description: 'Redirect to the home page once the session is open.' }
    #swagger.responses[401] = { description: 'Unauthorized - GitHub did not return a valid authorization code.' }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    return passport.authenticate('github', { failureRedirect: '/', session: true })(req, res, next);
});

router.get('/logout', (req, res, next) => {
    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Log out'
    #swagger.description = 'Closes the session, clears the session cookie and redirects to the home page.'
    #swagger.produces = ['text/html']
    #swagger.responses[302] = { description: 'Redirect to the home page.' }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    return destroySession(req, next, () => {
        res.clearCookie(COOKIE_NAME);
        res.redirect('/');
    });
});

router.post('/logout', (req, res, next) => {
    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Log out and answer with JSON'
    #swagger.description = 'Same as GET /auth/logout but returns JSON, which is the one to use from the Swagger docs.'
    #swagger.produces = ['application/json']
    #swagger.responses[200] = { description: 'OK - The session was closed.', schema: { $ref: '#/definitions/MessageResponse' } }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    return destroySession(req, next, () => {
        res.clearCookie(COOKIE_NAME);
        res.status(200).json({ message: 'Logged out successfully.' });
    });
});

router.get('/me', (req, res) => {
    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Get the logged in user'
    #swagger.description = 'Returns the GitHub profile stored for the current session. Answers 401 when nobody is logged in.'
    #swagger.produces = ['application/json']
    #swagger.responses[200] = { description: 'OK - Returns the session user.', schema: { $ref: '#/definitions/SessionUser' } }
    #swagger.responses[401] = { description: 'Unauthorized - There is no active session.', schema: { $ref: '#/definitions/AuthError' } }
    */
    if (typeof req.isAuthenticated !== 'function' || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'There is no active session. Log in with GitHub at /auth/github.' });
    }

    return res.status(200).json({ authenticated: true, user: req.user });
});

module.exports = router;
