#!/bin/bash

# Nimbus Cloudflare Worker Deployment Script

echo "🚀 Deploying Nimbus Cloudflare Worker..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔑 Please login to Cloudflare:"
    wrangler login
fi

# Check if OpenAI API key is set
echo "🔍 Checking OpenAI API key..."
if ! wrangler secret list | grep -q "OPENAI_API_KEY"; then
    echo "🔑 Setting OpenAI API key..."
    echo "Please enter your OpenAI API key:"
    wrangler secret put OPENAI_API_KEY
else
    echo "✅ OpenAI API key is configured"
fi

# Deploy to staging first
echo "📦 Deploying to staging..."
wrangler deploy --env staging

if [ $? -eq 0 ]; then
    echo "✅ Staging deployment successful!"
    
    # Ask if user wants to deploy to production
    read -p "🤔 Deploy to production? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Deploying to production..."
        wrangler deploy --env production
        
        if [ $? -eq 0 ]; then
            echo "🎉 Production deployment successful!"
            echo ""
            echo "📋 Next steps:"
            echo "1. Copy the worker URL from the output above"
            echo "2. Update gulp/tasks/propose.js with your worker URL"
            echo "3. Test with: gulp nimbus:propose --batch test-batch --worker-url YOUR_URL"
        else
            echo "❌ Production deployment failed"
            exit 1
        fi
    fi
else
    echo "❌ Staging deployment failed"
    exit 1
fi

echo ""
echo "🎉 Deployment complete!"
