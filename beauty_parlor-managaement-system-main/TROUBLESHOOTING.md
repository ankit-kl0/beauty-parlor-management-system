# Troubleshooting Guide

This guide helps you resolve common issues when running the Beauty Parlor Management System.

## Authentication & JWT Issues

### Error: "secretOrPrivateKey must have a value"

**Problem:** Login or registration fails with this error:
```
Login error: Error: secretOrPrivateKey must have a value
    at module.exports [as sign] (...backend/node_modules/jsonwebtoken/sign.js:111:20)
    at (...backend/routes/auth.js:50:23)
```

**Cause:** The `JWT_SECRET` environment variable is not configured in your `.env` file.

**Solution:**

1. **Quick Fix - Run the setup script:**
   ```bash
   cd backend
   npm run setup
   ```
   This will automatically create a `.env` file with `JWT_SECRET` and other required variables.

2. **Manual Fix - Create/Edit .env file:**
   - Open (or create) `backend/.env`
   - Add this line:
     ```
     JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
     ```
   - Replace the value with a long, random, secure string

3. **Restart the backend server** after making changes

**Prevention:** Always run `npm run setup` before starting the backend for the first time.

---

### Error: "jwt malformed" or "invalid token"

**Problem:** API calls fail with JWT token errors.

**Solutions:**
- Clear browser localStorage: Open DevTools → Application → Local Storage → Clear
- Logout and login again
- Verify `JWT_SECRET` hasn't changed (tokens become invalid if secret changes)

---

## Database Issues

### Database Connection Failed

**Problem:** Backend shows:
```
Database connection error: ...
Server will still start, but API endpoints that require the database will return errors
```

**Solutions:**

1. **Verify MySQL is running:**
   ```bash
   # On macOS/Linux:
   sudo systemctl status mysql
   # or
   mysql -u root -p
   ```

2. **Check .env credentials:**
   - Open `backend/.env`
   - Verify `DB_USER` and `DB_PASSWORD` are correct
   - Verify `DB_NAME=beauty_parlor`

3. **Ensure database exists:**
   ```bash
   mysql -u root -p
   CREATE DATABASE IF NOT EXISTS beauty_parlor;
   exit
   ```

4. **Run schema script:**
   ```bash
   mysql -u root -p beauty_parlor < backend/database/schema.sql
   ```

---

### Table doesn't exist errors

**Problem:** API calls fail with "Table 'beauty_parlor.users' doesn't exist"

**Solution:**
```bash
cd backend
mysql -u root -p beauty_parlor < database/schema.sql
```

This creates all required tables.

---

## Server Startup Issues

### Port Already in Use

**Problem:** 
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solutions:**

1. **Change the port:**
   - Edit `backend/.env`
   - Change `PORT=5001` to `PORT=5002` (or another available port)
   - Update frontend API calls to use new port

2. **Kill process using the port:**
   ```bash
   # Find process
   lsof -i :5001
   
   # Kill it (replace PID with actual process ID)
   kill -9 <PID>
   ```

---

### Module Not Found Errors

**Problem:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

Do the same for frontend if needed:
```bash
cd beauty-parlor-frontend
rm -rf node_modules package-lock.json
npm install
```

---

### Missing Environment Variables

**Problem:** Server exits immediately with:
```
❌ ERROR: Missing required environment variables:
   - JWT_SECRET
```

**Solution:** This is intentional! The server won't start without required configuration.

Run:
```bash
cd backend
npm run setup
```

Then restart the server.

---

## Frontend Issues

### CORS Errors

**Problem:** Browser console shows CORS policy errors.

**Solutions:**

1. **Verify backend is running:**
   - Backend should be at `http://localhost:5001`
   - Check terminal for "Server running on port 5001"

2. **Check API base URL:**
   - Open `beauty-parlor-frontend/src/services/api.js`
   - Verify `baseURL` matches your backend port

---

### "Cannot read property of undefined" errors

**Problem:** Frontend crashes with undefined property errors.

**Solutions:**

1. **Clear browser cache:**
   - Hard reload: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for API errors or network failures

3. **Verify backend is responding:**
   ```bash
   curl http://localhost:5001/api/services
   ```

---

### Login doesn't work / redirects back to login

**Problem:** After entering credentials, you're redirected back to login page.

**Solutions:**

1. **Check browser console for errors**

2. **Verify admin user exists:**
   ```bash
   cd backend
   node scripts/createAdmin.js
   ```

3. **Clear localStorage:**
   - DevTools → Application → Local Storage → Clear All

4. **Verify credentials:**
   - Default: `admin@beautyparlor.com` / `admin123`

---

## Installation Issues

### npm install fails

**Problem:** Package installation errors during `npm install`.

**Solutions:**

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be v18 or higher. Update if needed.

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check internet connection:**
   - Verify you can access npm registry
   - Try: `npm ping`

---

### Permission denied errors

**Problem:** 
```
EACCES: permission denied
```

**Solutions:**

1. **Don't use sudo with npm** (can cause issues)

2. **Fix npm permissions:**
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   # Add to .bashrc or .zshrc:
   export PATH=~/.npm-global/bin:$PATH
   ```

3. **Change ownership:**
   ```bash
   sudo chown -R $USER:$USER .
   ```

---

## Development Issues

### Changes not reflecting

**Problem:** Code changes don't appear in the browser.

**Solutions:**

**Backend:**
- Use `npm run dev` instead of `npm start` for auto-reload
- Restart server manually if needed

**Frontend:**
- React hot reload should work automatically
- Hard refresh browser: `Ctrl+Shift+R`
- Check terminal for compilation errors

---

### Hot reload not working

**Problem:** nodemon or React dev server doesn't detect changes.

**Solutions:**

1. **Check file watchers limit (Linux):**
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart dev server**

---

## Production Deployment Issues

### JWT_SECRET in production

**Important:** Never commit `.env` files to git!

**Best Practice:**
- Use environment variables on your hosting platform
- Generate strong, random JWT_SECRET
- Never use default or example secrets in production

---

### Performance issues

**Solutions:**

1. **Build optimized frontend:**
   ```bash
   cd beauty-parlor-frontend
   npm run build
   ```

2. **Set NODE_ENV:**
   ```bash
   NODE_ENV=production npm start
   ```

3. **Use PM2 or similar for process management**

---

## Still Having Issues?

1. **Check the logs:**
   - Backend: Terminal where you ran `npm start`
   - Frontend: Browser console (F12)
   - Database: MySQL error logs

2. **Verify all steps:**
   - Follow QUICK_START.md exactly
   - Don't skip the `npm run setup` step

3. **Common mistakes:**
   - Forgetting to run `npm install`
   - Not creating the database
   - Using wrong database credentials
   - Missing `.env` file or `JWT_SECRET`

4. **Report an issue:**
   - Include error messages
   - Include relevant logs
   - Mention your OS and Node.js version
