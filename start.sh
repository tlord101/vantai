#!/bin/bash

# Liquid Glass Chat - Startup Script

echo "🌊 Starting Liquid Glass Chat App..."
echo ""

# Check if .env file exists and has Gemini API key
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

if grep -q "YOUR_GEMINI_API_KEY_HERE" .env; then
    echo "⚠️  Warning: Please update your Gemini API key in .env file"
    echo "   Get your key from: https://makersuite.google.com/app/apikey"
    echo ""
    echo "   Edit .env and replace YOUR_GEMINI_API_KEY_HERE with your actual key"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✨ Launching development server..."
echo ""
echo "🎨 Liquid glass effects: Active"
echo "🤖 Gemini AI: Ready"
echo "📱 Mobile optimized: Yes"
echo ""

npm run dev
