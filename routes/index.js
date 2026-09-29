const router = require('express').Router();

router.use('/api-docs', require('./swagger'));

router.get('/', (req, res) => {
    /*
    #swagger.tags = ['Home']
    #swagger.summary = 'Welcome message and session status'
    #swagger.description = 'Base route of the Plant Care API. It also says whether there is an active session, and points to the log in, log out and documentation links.'
    #swagger.produces['text/plain'] = { example: 'Welcome to the Plant Care API!\n\nYou are not logged in. Log in with GitHub: /auth/github\nDocumentation: /api-docs' }
    #swagger.responses[200] = { description: 'OK - Returns a welcome message with the current session status.' }
    */
    const isLoggedIn = typeof req.isAuthenticated === 'function' && req.isAuthenticated();
    const session = isLoggedIn
        ? `Signed in as ${req.user.displayName} (${req.user.username}). Log out: GET /auth/logout`
        : 'You are not logged in. Log in with GitHub: /auth/github';

    res.send(`Welcome to the Plant Care API!\n\n${session}\nDocumentation: /api-docs`);
});

router.use('/auth', require('./auth'));
router.use('/plants', require('./plants'));
router.use('/careLogs', require('./careLogs'));

module.exports = router;
