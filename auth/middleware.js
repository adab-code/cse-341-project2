/**
 * Guard for the routes that need a session. An anonymous request never reaches
 * the controller, it gets a 401 with the same JSON shape as every other error.
 * @param {object} req Express request
 * @param {object} res Express response
 * @param {Function} next next middleware
 */
const requireAuth = (req, res, next) => {
    if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
        return next();
    }

    return res.status(401).json({
        error: 'Authentication required. Log in with GitHub at /auth/github and try again.',
    });
};

module.exports = { requireAuth };
