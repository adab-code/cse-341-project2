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

// Documented endpoint of GitHub, used to hand the URL to clients that cannot
// follow a redirect out of this origin.
const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';

// Missing credentials should not take the whole API down, only the login.
const isEnabled = Boolean(CLIENT_ID && CLIENT_SECRET && CALLBACK_URL);

/**
 * The exact URL a browser has to open to start the handshake. Swagger UI and
 * curl cannot follow a redirect that leaves the origin, so they get this link
 * as a JSON body and open it in a browser.
 * @returns {string|null} the GitHub authorization URL, null when not configured
 */
const getLoginUrl = () => {
    if (!isEnabled) {
        return null;
    }

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: CALLBACK_URL,
        scope: SCOPES.join(' '),
        response_type: 'code',
    });

    return `${AUTHORIZE_URL}?${params.toString()}`;
};

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

module.exports = { passport, isEnabled, getLoginUrl, SCOPES };
