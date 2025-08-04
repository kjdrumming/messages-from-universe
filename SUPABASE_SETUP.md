# Supabase Setup Guide for Messages from the Universe

## 🎯 Quick Setup Steps

### 1. **✅ Project Created** 
Your Supabase project is ready at: https://yrrxbcsoqwamukarkzqa.supabase.co

### 2. **✅ Credentials Configured**
Your `.env` file has been updated with your credentials.

### 3. **🔥 Run the SQL Script NOW**
1. Go to your Supabase dashboard: https://yrrxbcsoqwamukarkzqa.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase-setup.sql` and paste it
5. Click **Run** to execute all the database setup

### 4. **🔑 Configure Authentication Settings**
1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Auth Settings**, configure:
   - **Site URL**: `http://localhost:8081` (current dev server port)
   - **Redirect URLs**: Add these URLs:
     - `http://localhost:8081/auth/callback`
     - `http://localhost:8080/auth/callback` (backup)
     - `http://localhost:3000/auth/callback` (if you change ports)
3. Under **Auth Providers**, ensure **Email** is enabled
4. **Save** your changes

### 5. **Test Your Setup**
1. Restart your development server: `npm run dev`
2. Go to http://localhost:8080
3. Try registering as both a customer and admin user

## 3. Run the SQL Scripts

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the entire content from `supabase-setup.sql`
3. Paste it into the SQL Editor and click "Run"
4. This will create all the necessary tables, policies, and sample data

## 4. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Under "Site URL", add your local development URL: `http://localhost:8080`
3. Under "Redirect URLs", add: `http://localhost:8080/auth/callback`
4. Make sure "Enable email confirmations" is turned ON
5. Configure your email settings or use the built-in development email service

## 5. Test the Application

1. Start your development server: `npm run dev`
2. Go to `http://localhost:8080`
3. Try registering as both a customer and admin user
4. Check your email for the magic links
5. Test the authentication flow

## Database Schema Overview

### Tables Created:

1. **customer_users** - Stores customer account information
   - Links to Supabase auth.users table
   - Stores notification preferences and timezone settings

2. **admin_users** - Stores admin account information
   - Links to Supabase auth.users table
   - Stores admin role and permissions

3. **motivational_messages** - Stores all motivational content
   - Can be managed by admins
   - Has status (active/draft) for content control

4. **user_message_history** - Tracks which messages were sent to which users
   - Useful for analytics and preventing duplicate sends

### Security Features:

- **Row Level Security (RLS)** enabled on all tables
- **Policies** ensure users can only access their own data
- **Separate user types** with distinct permissions
- **Passwordless authentication** using magic links

## Authentication Flow:

1. User selects Customer or Admin portal
2. Enters email address
3. Clicks "Sign In" or "Register"
4. System checks if user exists in respective table
5. Sends magic link via email
6. User clicks magic link to authenticate
7. System creates profile if registering, or signs in existing user

## Development vs Production:

- In development, Supabase provides a built-in email service
- For production, configure your own email provider (SendGrid, AWS SES, etc.)
- Make sure to update redirect URLs for your production domain

## Need Help?

## 🛠 **Troubleshooting Guide**

### **Issue: 404 Error After Clicking Magic Link**
- ✅ **FIXED**: Added `/auth/callback` route to handle magic link redirects
- **Cause**: Missing auth callback route in the application
- **Solution**: The route has been added to `App.tsx` automatically

### **Issue: Can't Register as Admin**
- ✅ **FIXED**: Updated SQL script to allow NULL `created_by` values  
- **Cause**: Sample messages had foreign key constraints without existing admins
- **Solution**: Re-run the updated SQL script in your Supabase dashboard

### **Important Setup Steps:**

1. **Update Auth Settings in Supabase:**
   - Go to **Authentication** → **Settings**
   - **Site URL**: `http://localhost:8081` (your current port)
   - **Redirect URLs**: Add `http://localhost:8081/auth/callback`

2. **Re-run the SQL Script:**
   - Copy the updated `supabase-setup.sql` content
   - Run it in your Supabase SQL Editor
   - This fixes the admin registration issue

### **Common Issues:**
- **Magic links not working**: Check redirect URLs match your dev server port
- **Database errors**: Ensure SQL script ran without errors
- **Permission denied**: Verify RLS policies are applied correctly
- **Environment variables**: Restart dev server after updating `.env`

### **Your Current Setup:**
- ✅ Supabase URL: `https://yrrxbcsoqwamukarkzqa.supabase.co`
- ✅ App running on: `http://localhost:8081`
- ✅ Auth callback route: Added to handle magic links
- ✅ Environment variables: Configured

**Next Step**: Run the updated SQL script in your Supabase dashboard, then test both customer and admin registration!

- Check the Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Review the authentication guide: [https://supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
- Test your database setup in the Supabase dashboard SQL editor
