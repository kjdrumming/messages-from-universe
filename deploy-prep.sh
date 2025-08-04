#!/bin/bash

echo "🚀 Messages from the Universe - Production Deployment Prep"
echo "========================================================="

# Check if build works
echo "📦 Testing production build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📊 Build Statistics:"
    ls -lh dist/assets/
    echo ""
    echo "🌐 Your app is ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://vercel.com or https://netlify.com"
    echo "2. Upload your project or connect via GitHub"
    echo "3. Add your Supabase environment variables"
    echo "4. Deploy!"
    echo ""
    echo "Environment variables needed:"
    echo "- VITE_SUPABASE_URL"
    echo "- VITE_SUPABASE_ANON_KEY"
    echo ""
    echo "📖 See PRODUCTION_READY.md for detailed instructions"
else
    echo "❌ Build failed. Please check the errors above."
fi
