#!/bin/bash

# Build script for Vercel deployment
echo "Building chat application for Vercel..."

# Install dependencies
npm install

# Build the client
npm run build

# Create api directory structure for Vercel
mkdir -p api

# Copy server files to api directory for serverless deployment
echo "export default app;" >> api/index.js

echo "Build complete! Ready for Vercel deployment."