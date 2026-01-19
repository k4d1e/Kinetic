# Kinetic Backend - Setup Guide

This is the backend API for the Kinetic SEO application with Google OAuth and Search Console integration.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Google Cloud Console account
- Google Search Console property

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project called "Kinetic"
3. Enable the following APIs:
   - Google Search Console API
   - Google+ API (for profile information)
4. Create OAuth 2.0 credentials:
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Name: Kinetic - Web App
   - Authorized JavaScript origins:
     - `http://localhost:8080`
     - `http://127.0.0.1:8080`
   - Authorized redirect URIs:
     - `http://localhost:8000/auth/google/callback`
5. Save your Client ID and Client Secret

### 3. Set Up PostgreSQL Database

Create a new database:

```bash
createdb kinetic
```

Or using psql:

```sql
CREATE DATABASE kinetic;
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp env.example.txt .env
```

Edit `.env` and fill in your values:

```env
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:8080

# From Google Cloud Console
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Your PostgreSQL connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/kinetic

# Generate a random string for session secret
SESSION_SECRET=your-random-session-secret-here
```

**Generate a secure session secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Initialize Database Schema

Run the schema SQL file:

```bash
npm run init-db
```

Or manually:

```bash
psql $DATABASE_URL -f db/schema.sql
```

### 6. Start the Backend Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start on `http://localhost:8000`

## API Endpoints

### Authentication

- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/status` - Check auth status
- `POST /auth/logout` - Logout user

### Google Search Console

- `GET /api/gsc/properties` - Get user's GSC properties
- `POST /api/gsc/calibrate` - Start calibration
- `GET /api/gsc/analytics?siteUrl=<url>` - Get analytics data
- `GET /api/gsc/data/:metric?siteUrl=<url>` - Get specific metric (quick-wins, cannibalization)

## Frontend Setup

The frontend should be served from `http://localhost:8080` (or update `FRONTEND_URL` in `.env`).

Serve the frontend with any static server:

```bash
# Using Python
python -m http.server 8080

# Using npx http-server
npx http-server -p 8080

# Using VS Code Live Server
# Right-click index.html → Open with Live Server (configure port to 8080)
```

## Testing the Flow

1. Start the backend: `npm run dev`
2. Start the frontend on port 8080
3. Open `http://localhost:8080` in your browser
4. Click "Sign in with Google"
5. Authenticate with a Google account that has Search Console properties
6. Select a property from the dropdown
7. Watch the calibration checklist run

## Troubleshooting

### "Popup blocked" Error

- Allow popups for `localhost:8080` in your browser settings

### "Origin mismatch" Error

- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Check CORS settings in `server.js`

### "Database connection failed"

- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `psql -l | grep kinetic`

### "OAuth error: redirect_uri_mismatch"

- Verify redirect URI in Google Cloud Console matches exactly: `http://localhost:8000/auth/google/callback`
- Check `GOOGLE_REDIRECT_URI` in `.env`

### "No Search Console properties found"

- Ensure your Google account has at least one property in Search Console
- Visit [Google Search Console](https://search.google.com/search-console)

## Project Structure

```
backend/
├── server.js                 # Express app entry
├── package.json             # Dependencies
├── .env                     # Environment variables (create from env.example.txt)
├── routes/
│   ├── auth.js              # Authentication routes
│   └── gsc.js               # GSC API routes
├── controllers/
│   ├── authController.js    # Auth logic
│   └── gscController.js     # GSC data fetching
├── services/
│   ├── googleAuth.js        # OAuth service
│   └── gscService.js        # GSC API wrapper
├── middleware/
│   └── authMiddleware.js    # Auth checks
└── db/
    └── schema.sql           # Database schema
```

## Security Notes

- Never commit `.env` file to version control
- Refresh tokens are stored encrypted in the database
- Sessions use httpOnly cookies
- CORS is configured to only allow requests from `FRONTEND_URL`
- Rate limiting is enabled on auth endpoints

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Use a production PostgreSQL database
3. Enable HTTPS and update redirect URIs in Google Cloud Console
4. Set `cookie.secure = true` in session configuration
5. Configure proper CORS for your production domain

Recommended hosting:
- **Backend**: Heroku, Railway, DigitalOcean
- **Database**: Heroku Postgres, Railway, Supabase
- **Frontend**: Netlify, Vercel, GitHub Pages

## License

MIT
