const passport = require('passport');
const { Strategy: GitHubStrategy } = require('passport-github2');
const { getCollection } = require('../data/database');
const { saveGitHubUser } = require('../controllers/users');

const USERS_COLLECTION = 'users';

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;

// Scopes: read:user for the public profile, user:email for the address.
const SCOPES = ['read:user', 'user:email'];

// Missing credentials should not take the whole API down, only the login.
const isEnabled = Boolean(CLIENT_ID && CLIENT_SECRET && CALLBACK_URL);

/**
 * Log in with GitHub, then mirror the GitHub profile into the users collection.
 * The session only ever keeps the GitHub id, the rest is read back on demand.
 */
if (isEnabled) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                callbackURL: CALLBACK_URL,
                scope: SCOPES,
                userAgent: 'plant-care-api',
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    done(null, await saveGitHubUser(profile));
                } catch (err) {
                    done(err);
                }
            }
        )
    );
} else {
    console.warn(
        '[auth] GitHub login is disabled. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET and CALLBACK_URL in .env (Render: Environment).'
    );
}

// Passport only stores the GitHub id in the session and rebuilds the user from
// MongoDB on the following requests.
passport.serializeUser((user, done) => {
    done(null, user.githubId);
});

passport.deserializeUser(async (githubId, done) => {
    try {
        const user = await getCollection(USERS_COLLECTION).findOne({ githubId });
        done(null, user || false);
    } catch (err) {
        done(err);
    }
});

module.exports = { passport, isEnabled, SCOPES };
