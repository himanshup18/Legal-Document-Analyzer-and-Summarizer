# MongoDB Authentication Fix

## The Problem
Your MongoDB connection is failing with "bad auth: authentication failed". This means the username or password in your connection string is incorrect.

## How to Fix It

### Option 1: Get the Correct Connection String from MongoDB Atlas (Recommended)

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Log in** to your account
3. **Click on "Connect"** button for your cluster
4. **Choose "Connect your application"**
5. **Copy the connection string** - it will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace the placeholders**:
   - Replace `<username>` with your actual database username
   - Replace `<password>` with your actual database password
   - **Important**: If your password has special characters, you need to URL encode them:
     - `@` becomes `%40`
     - `<` becomes `%3C`
     - `>` becomes `%3E`
     - `#` becomes `%23`
     - `%` becomes `%25`
     - `&` becomes `%26`
     - `?` becomes `%3F`
     - `/` becomes `%2F`
     - `:` becomes `%3A`
     - `;` becomes `%3B`
     - `=` becomes `%3D`
     - `+` becomes `%2B`
     - `$` becomes `%24`
     - `,` becomes `%2C`
     - ` ` (space) becomes `%20`

7. **Add the database name** before the `?`:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/legal-documents?retryWrites=true&w=majority
   ```

8. **Update your `.env` file** with the corrected connection string

### Option 2: Reset Your MongoDB Atlas Password

If you're not sure about your password:

1. Go to MongoDB Atlas
2. Click on "Database Access" in the left menu
3. Find your database user
4. Click "Edit" → "Edit Password"
5. Set a new password (preferably without special characters to avoid encoding issues)
6. Copy the new connection string and update your `.env` file

### Option 3: Create a New Database User

1. Go to MongoDB Atlas → "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (avoid special characters)
5. Set user privileges (at minimum: "Read and write to any database")
6. Click "Add User"
7. Get the connection string and update your `.env` file

## Quick Password Encoding Tool

If your password is `<Hp12345@>`, here's how to encode it:
- `<` = `%3C`
- `Hp12345` = `Hp12345` (no change)
- `@` = `%40`
- `>` = `%3E`

So `<Hp12345@>` becomes: `%3CHp12345%40%3E`

## Verify Your Connection String Format

Your connection string should look like this:
```
mongodb+srv://username:encoded_password@cluster0.xxxxx.mongodb.net/legal-documents?retryWrites=true&w=majority
```

## After Updating

1. Save your `.env` file
2. Restart your server
3. Check the console - you should see "MongoDB connected successfully"

## Common Issues

- **Wrong username**: Make sure you're using the database username, not your Atlas account email
- **Password not encoded**: Special characters must be URL encoded
- **Database name missing**: Add `/legal-documents` before the `?` in the connection string
- **IP not whitelisted**: In Atlas, go to "Network Access" and add `0.0.0.0/0` (allow from anywhere) for development
