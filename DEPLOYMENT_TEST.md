# Deployment Test Guide

## Pre-Deployment Checklist

### ✅ Local Testing
1. **Health Endpoint**: `curl http://localhost:3000/api/python/health`
2. **AR Experience**: Visit `http://localhost:3000/experience/[your-id]`
3. **Test Page**: Visit `http://localhost:3000/test-current-setup.html`

### ✅ Configuration Files
1. **vercel.json**: ✅ Correct Python runtime format
2. **api/python/mindar.py**: ✅ Fixed path handling
3. **api/python/requirements.txt**: ✅ Dependencies listed
4. **app/api/compile-mind/route.ts**: ✅ Integrated Python service calls

## Deployment Steps

### Step 1: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: quickscanar-v3
# - Directory: ./
# - Override settings? No
```

### Step 2: Add Environment Variables
In Vercel dashboard:
1. Go to Project Settings > Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Test Production
1. **Health Check**: `curl https://your-app.vercel.app/api/python/health`
2. **AR Experience**: `https://your-app.vercel.app/experience/[your-id]`
3. **Test Page**: `https://your-app.vercel.app/test-current-setup.html`

## Expected Results

### ✅ Success Indicators
- Health endpoint returns: `{"status":"healthy","service":"mindar-compiler","version":"1.0.0"}`
- AR experience loads without RangeError
- Scanner icon appears
- Custom marker images work
- Debug panel shows "Using integrated Python service"

### ❌ Failure Indicators
- Health endpoint returns 404 or 500
- AR experience shows RangeError
- Scanner icon doesn't appear
- Debug panel shows "Using fallback"

## Troubleshooting

### If Python Function Fails
1. Check Vercel function logs
2. Verify `vercel.json` configuration
3. Check Python requirements compatibility

### If AR Doesn't Work
1. Verify HTTPS is enabled
2. Check browser console for errors
3. Test on mobile device
4. Verify camera permissions

## Rollback Plan
If issues occur:
1. Use fallback MindAR files (already implemented)
2. Disable Python service temporarily
3. Revert to basic compilation

---

**Ready for deployment!** 🚀 