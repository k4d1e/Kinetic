// services/googleAuth.js - Google OAuth 2.0 configuration and helpers
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { google } = require('googleapis');

/**
 * Configure Passport Google OAuth Strategy
 * @param {Pool} pool - PostgreSQL connection pool
 */
function configureGoogleAuth(pool) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/auth/google/callback',
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/webmasters.readonly'
    ],
    accessType: 'offline',
    prompt: 'consent' // Always get refresh token
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const name = profile.displayName;
      const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      // Calculate token expiry (1 hour from now)
      const tokenExpiry = new Date(Date.now() + 3600 * 1000);

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId]
      );

      let user;

      if (existingUser.rows.length > 0) {
        // Update existing user with new tokens
        const updateResult = await pool.query(
          `UPDATE users 
           SET access_token = $1, 
               refresh_token = COALESCE($2, refresh_token),
               token_expiry = $3,
               name = $4,
               profile_picture = $5,
               updated_at = NOW()
           WHERE google_id = $6
           RETURNING *`,
          [accessToken, refreshToken, tokenExpiry, name, profilePicture, googleId]
        );
        user = updateResult.rows[0];
        console.log(`✓ User ${email} logged in`);
      } else {
        // Create new user
        const insertResult = await pool.query(
          `INSERT INTO users (google_id, email, name, profile_picture, access_token, refresh_token, token_expiry)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [googleId, email, name, profilePicture, accessToken, refreshToken, tokenExpiry]
        );
        user = insertResult.rows[0];
        console.log(`✓ New user ${email} registered`);
      }

      return done(null, user);
    } catch (error) {
      console.error('Error in Google OAuth strategy:', error);
      return done(error, null);
    }
  }));
}

/**
 * Get a valid OAuth2 client for a user
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @returns {Promise<OAuth2Client>} - Google OAuth2 client
 */
async function getOAuth2Client(pool, userId) {
  const result = await pool.query(
    'SELECT access_token, refresh_token, token_expiry FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: user.access_token,
    refresh_token: user.refresh_token,
    expiry_date: user.token_expiry ? new Date(user.token_expiry).getTime() : null
  });

  // Handle token refresh automatically
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      // Update refresh token if we got a new one
      await pool.query(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [tokens.refresh_token, userId]
      );
    }
    
    if (tokens.access_token) {
      // Update access token
      const tokenExpiry = new Date(Date.now() + 3600 * 1000);
      await pool.query(
        'UPDATE users SET access_token = $1, token_expiry = $2, updated_at = NOW() WHERE id = $3',
        [tokens.access_token, tokenExpiry, userId]
      );
    }
  });

  return oauth2Client;
}

/**
 * Refresh access token if expired
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @returns {Promise<string>} - Fresh access token
 */
async function ensureFreshToken(pool, userId) {
  const oauth2Client = await getOAuth2Client(pool, userId);
  
  try {
    // This will automatically refresh if needed
    const { credentials } = await oauth2Client.getAccessToken();
    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Failed to refresh access token. Please re-authenticate.');
  }
}

module.exports = {
  configureGoogleAuth,
  getOAuth2Client,
  ensureFreshToken
};
