#!/bin/sh

# Script to start the backend with fallbacks

echo "Starting Escola Backend..."

# Check if dist exists
if [ ! -d "dist" ] || [ ! -f "dist/main.js" ]; then
    echo "dist/main.js not found. Building..."
    npm run build || nest build || npx tsc
fi

# Try different start methods
if [ -f "dist/main.js" ]; then
    echo "Starting from dist/main.js..."
    node dist/main.js
elif [ -f "dist/main" ]; then
    echo "Starting from dist/main..."
    node dist/main
else
    echo "Falling back to development mode..."
    npm run start
fi