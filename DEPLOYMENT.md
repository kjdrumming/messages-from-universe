# Deployment Guide: Messages from the Universe

## 🚀 Production Deployment Checklist

### Prerequisites
- [x] Supabase project configured with all tables and functions
- [x] Supabase RLS (Row Level Security) policies configured
- [x] Application tested locally
- [x] Production build tested (`npm run build`)

### Environment Variables Required

You'll need these from your Supabase project:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### Deployment Steps

#### Option 1: Vercel (Recommended)

1. **Build the project locally first**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel
   ```
   - Follow the prompts
   - Set up environment variables when prompted
   - Choose production settings

3. **Configure Environment Variables in Vercel**:
   - Go to your Vercel dashboard
   - Navigate to your project > Settings > Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **Redeploy**:
   ```bash
   npx vercel --prod
   ```

#### Option 2: Netlify

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Or use Git-based deployment**:
   - Push code to GitHub/GitLab
   - Connect repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

### Post-Deployment Tasks

1. **Update Supabase Authentication Settings**:
   - Add your production domain to Supabase Auth > URL Configuration
   - Update Site URL and redirect URLs

2. **Configure Custom Domain** (Optional):
   - Add custom domain in Vercel/Netlify dashboard
   - Update DNS records
   - SSL will be automatically configured

3. **Test Production App**:
   - [ ] Customer registration/login
   - [ ] Admin portal access
   - [ ] Notification scheduling
   - [ ] Message generation
   - [ ] Real-time updates

### Production Optimizations Applied

- ✅ Vite production build with minification
- ✅ Automatic code splitting
- ✅ Tree shaking for smaller bundle size
- ✅ Environment variables for security
- ✅ SPA routing configuration
- ✅ Gzip compression enabled

### Monitoring & Maintenance

- **Vercel Analytics**: Enabled by default
- **Error Monitoring**: Consider adding Sentry
- **Performance**: Monitor Core Web Vitals
- **Database**: Monitor Supabase usage and performance

### Security Notes

- ✅ Environment variables properly configured
- ✅ Supabase RLS policies active
- ✅ No sensitive data in client-side code
- ✅ HTTPS enforced by default

### Support & Documentation

- **Supabase Dashboard**: Monitor database and auth
- **Vercel Dashboard**: Deployment logs and analytics
- **Application Logs**: Check browser console for errors

---

## Quick Deploy Commands

```bash
# Test build
npm run build

# Deploy to Vercel
npx vercel

# Deploy to production
npx vercel --prod
```

Your app will be live at: `https://your-app-name.vercel.app`

---

## 🔄 Deployment Trigger
**Last Updated:** August 3, 2025 - Database functions deployed, ready for production deployment
