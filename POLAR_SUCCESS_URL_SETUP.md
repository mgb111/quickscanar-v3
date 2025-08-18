# 🎯 Polar.sh Success URL Setup Guide

## ⚠️ CRITICAL REQUIREMENT

Polar.sh **requires** you to configure a success URL that includes the `{CHECKOUT_ID}` parameter. This is **mandatory** for the integration to work properly.

## 🔧 What You Need to Do

### 1. Configure in Polar.sh Dashboard

1. **Login to Polar.sh Dashboard**
2. **Go to Settings → Payment Settings**
3. **Set Success URL to:**
   ```
   https://quickscanar.com/subscription/success?checkout_id={CHECKOUT_ID}
   ```
4. **Set Cancel URL to:**
   ```
   https://quickscanar.com/subscription/cancel
   ```
5. **Save Changes**

### 2. Update Environment Variables

Add these to your `.env.local` file:

```env
# Polar.sh Success URL Configuration
POLAR_SUCCESS_URL=https://quickscanar.com/subscription/success?checkout_id={CHECKOUT_ID}
POLAR_CANCEL_URL=https://quickscanar.com/subscription/cancel
```

**✅ Domain already configured: `quickscanar.com`**

### 3. URL Format Requirements

- ✅ **Correct:** `https://quickscanar.com/subscription/success?checkout_id={CHECKOUT_ID}`
- ❌ **Wrong:** `https://quickscanar.com/subscription/success`
- ❌ **Wrong:** `https://quickscanar.com/subscription/success?checkout_id=CHECKOUT_ID`
- ❌ **Wrong:** `http://localhost:3000/subscription/success?checkout_id={CHECKOUT_ID}`

## 🧪 Testing Your Setup

### Quick Test

1. **Visit your success page with a test checkout ID:**
   ```
   https://quickscanar.com/subscription/success?checkout_id=test123
   ```

2. **Verify the page loads and shows:**
   - ✅ Page loads without errors
   - ✅ "test123" appears in the checkout ID field
   - ✅ No "Page not found" errors

### Run Test Script

```bash
node test-success-url.js
```

**✅ Domain already updated in the script!**

## 🚨 Common Issues & Solutions

### Issue: "Page not found" on success
**Solution:** Check that `/subscription/success` route exists and is accessible

### Issue: Checkout ID not showing
**Solution:** Verify the `{CHECKOUT_ID}` parameter is included in your Polar.sh dashboard

### Issue: Using localhost
**Solution:** ✅ Already using production domain: `quickscanar.com`

### Issue: Missing environment variables
**Solution:** Ensure `POLAR_SUCCESS_URL` and `POLAR_CANCEL_URL` are set in `.env.local`

## 📋 Checklist

- [ ] Success URL configured in Polar.sh dashboard with `{CHECKOUT_ID}`
- [ ] Cancel URL configured in Polar.sh dashboard
- [ ] Environment variables set correctly
- [ ] Success page accessible at `/subscription/success`
- [ ] Cancel page accessible at `/subscription/cancel`
- [ ] Tested with sample checkout ID
- [ ] No errors when loading success page

## 🔗 What Happens When Payment Succeeds

1. **User completes payment** on Polar.sh
2. **Polar.sh redirects** to: `https://quickscanar.com/subscription/success?checkout_id=ch_1234567890`
3. **Your success page** receives the `checkout_id` parameter
4. **Page displays** subscription confirmation
5. **User gets access** to premium features

## 🎯 Polar.sh Checkout URL

**Your checkout URL:** `https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d`

This URL is already integrated into your subscription plans and will open the Polar.sh checkout when users click subscribe.

## 🆘 Need Help?

1. **Check the logs** in your browser console
2. **Verify URLs** in Polar.sh dashboard
3. **Test manually** with sample checkout ID
4. **Check environment** variables are loaded
5. **Ensure pages** are accessible without parameters

---

**Remember:** The `{CHECKOUT_ID}` parameter is **REQUIRED** by Polar.sh and must be included exactly as shown!

**✅ Your setup is almost complete! Just configure the success URL in your Polar.sh dashboard.**
