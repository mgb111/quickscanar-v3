# Python MindAR Service Deployment Guide

This guide will help you deploy the Python MindAR service to fix the RangeError in your AR experiences.

## 🚀 Quick Deploy to Railway (Recommended)

### Step 1: Create GitHub Repository

1. **Create a new repository on GitHub**
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it: `python-mindar-service`
   - Make it public
   - Don't initialize with README

2. **Push the Python service to GitHub**
   ```bash
   # In the python-mindar-service directory
   git init
   git add .
   git commit -m "Initial commit: Python MindAR service"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/python-mindar-service.git
   git push -u origin main
   ```

### Step 2: Deploy to Railway

1. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project"

2. **Deploy from GitHub**
   - Select "Deploy from GitHub repo"
   - Choose your `python-mindar-service` repository
   - Railway will automatically detect it's a Python app

3. **Get your service URL**
   - After deployment, Railway will give you a URL like:
   - `https://your-app-name.railway.app`
   - Copy this URL

### Step 3: Configure Your Next.js App

1. **Add environment variable to your Next.js app**
   - In your `.env.local` file, add:
   ```env
   PYTHON_MINDAR_SERVICE_URL=https://your-app-name.railway.app
   ```

2. **Add to Vercel (if deploying)**
   - Go to your Vercel project settings
   - Add environment variable:
   ```
   PYTHON_MINDAR_SERVICE_URL=https://your-app-name.railway.app
   ```

## 🧪 Test Your Deployment

### Test 1: Health Check
```bash
curl https://your-app-name.railway.app/health
```
Should return: `{"status":"healthy","service":"mindar-compiler","version":"1.0.0"}`

### Test 2: Test with Your Next.js App
1. **Go to your test page**: `http://localhost:3000/test-current-setup.html`
2. **Click "Test Python Service"**
3. **Should show**: "Python service is available and healthy"

### Test 3: Test MindAR Compilation
1. **Go to your test page**: `http://localhost:3000/test-current-setup.html`
2. **Click "Test MindAR Compilation"**
3. **Should show**: "Method used: python-service"

## 🔧 Alternative Deployment Options

### Option 2: Deploy to Render

1. **Go to Render**
   - Visit [render.com](https://render.com)
   - Sign up with GitHub
   - Click "New Web Service"

2. **Configure Service**
   - Connect your GitHub repository
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - Click "Create Web Service"

3. **Get your URL**
   - Render will give you a URL like: `https://your-app-name.onrender.com`

### Option 3: Deploy to Vercel

1. **Add vercel.json to your Python service**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "app.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "app.py"
       }
     ]
   }
   ```

2. **Deploy with Vercel CLI**
   ```bash
   npm i -g vercel
   vercel
   ```

## 🧪 Local Testing

### Test the Python Service Locally

1. **Install dependencies**
   ```bash
   cd python-mindar-service
   pip install -r requirements.txt
   ```

2. **Run the service**
   ```bash
   python app.py
   ```

3. **Test with the test script**
   ```bash
   python test_service.py
   ```

4. **Test with your Next.js app**
   - Update your `.env.local`:
   ```env
   PYTHON_MINDAR_SERVICE_URL=http://localhost:8000
   ```
   - Restart your Next.js app
   - Test at: `http://localhost:3000/test-current-setup.html`

## ✅ Verification Checklist

After deployment, verify these work:

- [ ] **Health check returns 200**: `curl https://your-service.railway.app/health`
- [ ] **Python service test passes**: Shows "Python service is available"
- [ ] **MindAR compilation uses Python service**: Shows "Method used: python-service"
- [ ] **AR experience works**: No more RangeError
- [ ] **Scanner icon appears**: AR tracking works
- [ ] **Your marker image displays**: Custom marker shows correctly

## 🐛 Troubleshooting

### Common Issues

1. **Service not responding**
   - Check Railway/Render logs
   - Verify the service URL is correct
   - Test with curl: `curl https://your-service.railway.app/health`

2. **CORS errors**
   - The service includes CORS headers
   - Check if your service URL is accessible

3. **MindAR compilation still fails**
   - Check the environment variable is set correctly
   - Verify the service is responding
   - Check the Next.js logs for errors

4. **AR still shows RangeError**
   - The automatic fallback should handle this
   - Check the debug panel in your AR experience
   - Should show "Using Python service generated MindAR file"

## 🎉 Success!

Once deployed and configured:

1. **Your AR experiences will use proper MindAR files**
2. **No more RangeError**
3. **Better AR tracking with your custom markers**
4. **Automatic fallback if needed**

Your AR experiences should now work perfectly with your uploaded marker images! 🚀 