# Backend setup

## Configure admin access

The admin API requires an owner password and a signing secret. Keep both in
`backend/.env`; never commit that file or place these values in frontend code.

1. Open a **second** VS Code terminal and switch to the backend folder:

   ```powershell
   cd C:\Pro\KELAS_EXPRESS\Portofolio\backend
   ```

2. Generate a password hash. Enter a password with at least 12 characters
   when prompted; the password itself is not displayed:

   ```powershell
   npm run admin:hash
   ```

   Copy the single `ADMIN_PASSWORD_HASH=...` line printed by the command.

3. Generate a signing secret:

   ```powershell
   node -p "require('crypto').randomBytes(32).toString('hex')"
   ```

4. In VS Code, create a file named `.env` inside the `backend` folder. Paste
   these three lines, replacing the two placeholders with the generated values:

   ```env
   ADMIN_PASSWORD_HASH=<paste-the-generated-hash-here>
   AUTH_SECRET=<paste-the-generated-secret-here>
   FRONTEND_ORIGIN=http://localhost:3001
   ```

5. Restart the backend from the backend terminal:

   Stop the running server with `Ctrl+C`, then start it again:

   ```powershell
   node src/app.js
   ```

6. Refresh `/admin` and sign in. The HttpOnly session cookie lasts seven days;
   use **Sign out** to end it early.

For production, set the same environment variables through the hosting
provider's secret configuration, set `FRONTEND_ORIGIN` to the exact public
frontend origin, and serve the site over HTTPS. The session cookie is marked
Secure automatically when `NODE_ENV=production`.

Admin write endpoints and message-management endpoints require the signed
session. Public portfolio read endpoints and the public contact form remain
available without signing in.
