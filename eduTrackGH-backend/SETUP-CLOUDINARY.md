# Cloudinary setup (attendance photo upload)

1. **Install dependencies** (if you haven’t):
   ```bash
   cd eduTrackGH-backend
   npm install
   ```

2. **Add your Cloudinary credentials to `.env`** (same folder as this file).  
   Use the same variable names as in `.env.example`:

   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

   Replace the placeholders with your real values from the [Cloudinary Dashboard](https://console.cloudinary.com/) → **Dashboard** (you’ll see Cloud name, API Key, API Secret).

3. **Restart the backend** so it picks up the new env vars:
   ```bash
   npm run dev
   ```

4. **Check it works:** In the app, go to **Mark Attendance** → choose **Present** for a student → **Take Photo** → **Capture**. The photo should upload and the URL is saved with the attendance record.

**Security:** Keep `.env` out of version control (it should already be in `.gitignore`). Don’t share your API Secret.
