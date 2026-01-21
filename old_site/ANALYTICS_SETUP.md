# 📊 Google Analytics 4 Setup Guide

## Overview
We've integrated Google Analytics 4 (GA4) to track visits and button clicks across all pages:
- `landing.html`
- `index.html`
- `simulator.html`

## 🚀 Setup Instructions

### Step 1: Create Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **"Start measuring"** (or **"Admin"** if you already have an account)
3. Create an **Account** (e.g., "Better Investor")
4. Create a **Property** (e.g., "Better Investor Website")
5. Select **"Web"** as the platform
6. Enter your website details:
   - **Website URL**: `https://tom.better-investor.co`
   - **Website name**: Better Investor
7. Click **"Create stream"**

### Step 2: Get Your Measurement ID

1. After creating the data stream, you'll see your **Measurement ID**
2. It looks like: `G-XXXXXXXXXX` (starts with "G-")
3. Copy this ID

### Step 3: Update Your Files

Replace `G-XXXXXXXXXX` with your actual Measurement ID in these files:
- `landing.html` (lines 6-12)
- `index.html` (lines 7-13)
- `simulator.html` (lines 7-13)

**Find this code:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Replace BOTH occurrences** of `G-XXXXXXXXXX` with your real Measurement ID.

### Step 4: Commit & Deploy

```bash
git add landing.html index.html simulator.html
git commit -m "Add GA4 Measurement ID"
git push
```

Changes will be live in ~30 seconds via GitHub Actions.

---

## 📈 What Gets Tracked

### Automatic Tracking (GA4 Default)
- ✅ **Page views** on all pages
- ✅ **Session duration**
- ✅ **Bounce rate**
- ✅ **User location** (country, city)
- ✅ **Device type** (mobile, desktop, tablet)
- ✅ **Traffic sources** (direct, referral, organic search)

### Custom Events We Track

#### 1. Landing Page CTAs (`landing.html`)
- **Event Name**: `click_cta`
- **Parameters**:
  - `button_location`: "hero" or "bottom"
  - `button_text`: The button's text
- **Triggered When**: User clicks "Start Your Journey" or "Calculate Your Freedom Number"

#### 2. Retirement Calculator (`index.html`)
- **Event Name**: `calculate_retirement`
- **Parameters**:
  - `event_category`: "engagement"
  - `event_label`: "Generate My Retirement Path"
- **Triggered When**: User clicks the main calculate button

#### 3. Investment Simulator (`simulator.html`)
- **Event Name**: `run_simulation`
- **Parameters**:
  - `event_category`: "engagement"
  - `event_label`: "Run Simulation"
- **Triggered When**: User runs the investment simulation

---

## 🎯 How to View Your Data

### Real-Time Monitoring
1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property: **Better Investor Website**
3. Click **"Reports"** → **"Realtime"**
4. See live visitors and their actions

### Event Tracking
1. Go to **"Reports"** → **"Engagement"** → **"Events"**
2. You'll see:
   - `page_view` (automatic)
   - `click_cta` (your custom events)
   - `calculate_retirement`
   - `run_simulation`
3. Click any event to see details (count, users, average engagement)

### Traffic Sources
1. Go to **"Reports"** → **"Acquisition"** → **"Traffic acquisition"**
2. See where your visitors come from (Google, social media, direct, etc.)

### Demographics
1. Go to **"Reports"** → **"User"** → **"Demographics"**
2. See user age, gender, location, interests

---

## 🔍 Advanced: Custom Reporting

### Create a Custom Report for Button Clicks

1. Go to **"Explore"** (left sidebar)
2. Click **"Blank"** to create a new exploration
3. Add dimensions:
   - `Event name`
   - `button_location`
   - `button_text`
4. Add metrics:
   - `Event count`
   - `Total users`
5. Click **"Apply"**

Now you have a detailed report showing:
- How many times each button was clicked
- Which button performs better (hero vs. bottom CTA)

---

## 🛠️ Troubleshooting

### Issue: No data appearing

**Solution:**
1. Wait 24-48 hours (GA4 can take time to populate)
2. Check Realtime view (should show instant data)
3. Verify your Measurement ID is correct
4. Make sure you replaced `G-XXXXXXXXXX` in **ALL 3 files**
5. Clear browser cache and visit your site
6. Check browser console for errors (F12 → Console)

### Issue: Events not showing

**Solution:**
1. Open browser console (F12)
2. Visit your site and click a button
3. Type `dataLayer` in console and press Enter
4. You should see event data being pushed
5. If not, check that the tracking code was deployed correctly

### Issue: GA4 says "Data collection not active"

**Solution:**
1. Go to **Admin** → **Data Streams**
2. Click your stream (tom.better-investor.co)
3. Check if "Enhanced measurement" is ON
4. Check if the stream status is "Active"

---

## 📊 What Success Looks Like

After 1 week, you should see:
- **Page views**: How many people visited each page
- **CTA clicks**: Which buttons get clicked the most
- **Conversion funnel**: Landing → Index → Calculation
- **Traffic sources**: Where your visitors come from
- **Devices**: Mobile vs. Desktop usage
- **Location**: What countries your users are from

---

## 🚨 Important Notes

1. **Privacy**: GA4 is GDPR compliant by default, but consider adding a cookie consent banner if targeting EU users
2. **Accuracy**: GA4 uses "cookieless tracking" and estimates, so numbers may not be 100% exact
3. **Data Retention**: Default is 2 months. Go to **Admin** → **Data Settings** → **Data Retention** to extend to 14 months
4. **Free Forever**: GA4 is completely free (up to 10M events/month, way more than you need)

---

## 🎓 Learn More

- [GA4 Official Documentation](https://support.google.com/analytics/answer/9304153)
- [GA4 Event Tracking Guide](https://support.google.com/analytics/answer/9267735)
- [GA4 vs Universal Analytics](https://support.google.com/analytics/answer/11583528)

---

**Need Help?**  
Contact: tom@better-investor.co
