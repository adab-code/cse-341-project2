const { getCollection } = require('../data/database');

const COLLECTION = 'users';

/**
 * Turn the GitHub profile that Passport hands us into the document we store.
 * GitHub only returns the email when the 'user:email' scope was granted, so
 * every field that may be missing falls back to null instead of crashing.
 * @param {object} profile Passport GitHub profile
 * @returns {object} the fields shared by the insert and the update
 */
const buildUser = (profile) => {
    const email = Array.isArray(profile.emails) && profile.emails.length > 0 ? profile.emails[0].value : null;
    const avatarUrl = Array.isArray(profile.photos) && profile.photos.length > 0 ? profile.photos[0].value : null;
    const username = profile.username || profile.displayName || String(profile.id);

    return {
        githubId: String(profile.id),
        username,
        displayName: profile.displayName || username,
        email: email || null,
        avatarUrl,
        profileUrl: profile.profileUrl || `https://github.com/${username}`,
    };
};

/**
 * Insert the user the first time they log in, refresh their profile and count
 * the login on every later one. This is what makes the users collection change
 * while the API is being used.
 * @param {object} profile Passport GitHub profile
 * @returns {Promise<object>} the stored user document
 */
const saveGitHubUser = async (profile) => {
    const user = buildUser(profile);
    const now = new Date();

    await getCollection(COLLECTION).updateOne(
        { githubId: user.githubId },
        {
            $set: { ...user, lastLoginAt: now },
            $setOnInsert: { createdAt: now },
            $inc: { loginCount: 1 },
        },
        { upsert: true }
    );

    return getCollection(COLLECTION).findOne({ githubId: user.githubId });
};

module.exports = { saveGitHubUser, buildUser };
