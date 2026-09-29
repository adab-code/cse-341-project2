const express = require('express');
const router = express.Router();

const { passport, isEnabled, getLoginUrl, SCOPES } = require('../auth/passport');
const { COOKIE_NAME } = require('../auth/session');

/**
 * Page shown to a browser: it sends the visitor straight to GitHub and keeps a
 * link around in case the automatic redirect is blocked.
 * @param {string} loginUrl GitHub authorization URL
 * @returns {string} an HTML document
 */
const loginPage = (loginUrl) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Plant Care API - log in</title>
<meta http-equiv="refresh" content="0; url=${loginUrl}">
<style>
    body { font-family: system-ui, sans-serif; margin: 4rem auto; max-width: 34rem; line-height: 1.5; }
    a { color: #0969da; }
</style>
</head>
<body>
<h1>Plant Care API</h1>
<p>Sending you to GitHub to authorize the app. It comes back to <code>/auth/github/callback</code> and opens your session.</p>
<p><a href="${loginUrl}">Continue to GitHub</a></p>
</body>
</html>`;

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
 * True when the request is a browser navigating to the page, which sends
 * 'text/html' in Accept. Swagger UI and curl do not, and get JSON instead.
 * @param {object} req Express request
 * @returns {boolean}
 */
const isBrowserNavigation = (req) => String(req.headers.accept || '').toLowerCase().includes('text/html');

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
    #swagger.description = 'Starts the OAuth handshake. A browser gets a page that goes to GitHub right away; GitHub sends it back to /auth/github/callback, which stores the user in the session and returns to the home page. Swagger UI and curl cannot follow a redirect that leaves this origin, so they get the same URL as JSON to open in a browser.'
    #swagger.produces = ['text/html', 'application/json']
    #swagger.responses[200] = { description: 'OK - A page that forwards to GitHub, or JSON with the URL to open.', schema: { $ref: '#/definitions/LoginUrl' } }
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

    // Handing over a 302 would leave the origin and Swagger UI would report a
    // CORS failure, so the browser gets a page that forwards by itself.
    if (isBrowserNavigation(req)) {
        return res.status(200).type('html').send(loginPage(getLoginUrl()));
    }

    return res.status(200).json({
        message: 'Open this URL in a browser to log in with GitHub.',
        loginUrl: getLoginUrl(),
    });
});

router.get('/github/callback', (req, res) => {
    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'GitHub OAuth callback'
    #swagger.description = 'The URL GitHub redirects to after the user authorizes the app. It saves the profile in the users collection, opens the session and redirects to the home page. Not called by hand.'
    #swagger.produces = ['text/html']
    #swagger.responses[302] = { description: 'Redirect to the home page once the session is open, or to the home page with login=failed when GitHub did not authorize.' }
    #swagger.responses[401] = { description: 'Unauthorized - GitHub did not return a valid authorization code.' }
    #swagger.responses[500] = { description: 'Internal Server Error' }
    */
    // A failed handshake goes back to the home page with a notice instead of
    // falling through to the 404 handler.
    return passport.authenticate('github', { failureRedirect: '/?login=failed', session: true })(req, res, (err) => {
        if (err) {
            console.error('[auth] GitHub login failed:', err.message);
            return res.redirect('/?login=failed');
        }
        return res.redirect('/');
    });
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
