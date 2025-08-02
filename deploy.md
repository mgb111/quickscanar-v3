# MindAR Compiler Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Netlify (Recommended)
1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add MindAR compiler"
   git push origin main
   ```

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `out`
   - Deploy!

### Option 2: Vercel
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

### Option 3: GitHub Pages
1. **Create GitHub Pages**:
   - Go to your repository settings
   - Enable GitHub Pages
   - Set source to `main` branch
   - Set folder to `/docs` or `/public`

2. **Build and deploy**:
   ```bash
   npm run build
   cp -r out/* docs/
   git add docs/
   git commit -m "Deploy to GitHub Pages"
   git push
   ```

### Option 4: Surge.sh
1. **Install Surge**:
   ```bash
   npm install -g surge
   ```

2. **Deploy**:
   ```bash
   npm run build
   surge out/
   ```

## 📁 Static Files for Direct Deployment

The following files can be deployed directly to any static hosting service:

- `public/index.html` - Main landing page
- `public/mindar-compiler-index.html` - Compiler hub
- `public/mindar-compiler.html` - Simple compiler
- `public/mindar-compiler-advanced.html` - Advanced compiler

## 🔧 Manual Deployment Steps

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Copy static files**:
   ```bash
   cp -r public/* out/
   ```

3. **Upload to your hosting service**

## 🌐 Live Demo Links

Once deployed, your app will be available at:
- **Netlify**: `https://your-app-name.netlify.app`
- **Vercel**: `https://your-app-name.vercel.app`
- **GitHub Pages**: `https://username.github.io/repo-name`

## 📱 Testing

After deployment, test:
- ✅ File upload functionality
- ✅ Drag and drop
- ✅ Image preview
- ✅ Compilation process
- ✅ Download functionality
- ✅ Mobile responsiveness

## 🔗 Share Your Deployment

Once deployed, share your link with:
- The main landing page
- Direct access to compilers
- Documentation and usage instructions 