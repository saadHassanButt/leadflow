# Quick Setup Guide - Fix Lead Addition Error

## The Problem
You're getting "Failed to add lead to Google Sheets" error because the current webhook doesn't exist.

## Quick Fix (5 minutes)

### Step 1: Create Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Delete the default code
4. Copy and paste the code from `simple-google-apps-script.js`
5. Save the project (Ctrl+S)

### Step 2: Deploy as Web App
1. Click "Deploy" → "New deployment"
2. Choose "Web app" as the type
3. Set "Execute as" to "Me"
4. Set "Who has access" to "Anyone"
5. Click "Deploy"
6. **Copy the web app URL** (it looks like: `https://script.google.com/macros/s/.../exec`)

### Step 3: Update Your API
1. Open `src/app/api/leads/route.ts`
2. Find line 117: `const googleAppsScriptUrl = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';`
3. Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with your copied URL
4. Save the file

### Step 4: Test
1. Restart your Next.js server
2. Go to a project's leads page
3. Click "Add Lead" and fill out the form
4. Submit - it should work now!

## Alternative: Manual Addition (Temporary)
If you want to test the frontend immediately without setting up the script:

1. The current code logs all lead data to the console
2. Open browser dev tools (F12)
3. Try adding a lead
4. Check the console for the logged data
5. Manually copy the data to your Google Sheet

## What This Does
- Adds leads directly to your existing "Leads" tab
- Maintains the correct column structure
- Uses the project ID from the current project
- Generates proper timestamps and IDs

## Troubleshooting
- Make sure the web app URL is correct
- Check that the sheet name is "Leads" (case-sensitive)
- Verify you have edit access to the Google Sheet
- Check browser console for any error messages
