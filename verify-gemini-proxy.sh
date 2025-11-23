#!/bin/bash

# Gemini Proxy Setup Verification Script
# This script checks if all required components are properly set up

echo "================================================"
echo "  Gemini Proxy Setup Verification"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Check function
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

# 1. Check if functions directory exists
echo "Checking directory structure..."
test -d /workspaces/vantai/functions
check "Functions directory exists"

test -d /workspaces/vantai/functions/src
check "Functions src directory exists"

# 2. Check if required files exist
echo ""
echo "Checking required files..."

test -f /workspaces/vantai/functions/src/geminiProxy.ts
check "geminiProxy.ts exists"

test -f /workspaces/vantai/functions/src/index.ts
check "index.ts exists"

test -f /workspaces/vantai/functions/src/types.ts
check "types.ts exists"

test -f /workspaces/vantai/functions/src/config.ts
check "config.ts exists"

test -f /workspaces/vantai/functions/src/utils.ts
check "utils.ts exists"

test -f /workspaces/vantai/functions/package.json
check "package.json exists"

test -f /workspaces/vantai/functions/tsconfig.json
check "tsconfig.json exists"

# 3. Check documentation files
echo ""
echo "Checking documentation..."

test -f /workspaces/vantai/functions/README.md
check "Functions README.md exists"

test -f /workspaces/vantai/functions/DEPLOYMENT.md
check "DEPLOYMENT.md exists"

test -f /workspaces/vantai/functions/TESTING.md
check "TESTING.md exists"

test -f /workspaces/vantai/GEMINI_PROXY_SUMMARY.md
check "GEMINI_PROXY_SUMMARY.md exists"

test -f /workspaces/vantai/GEMINI_PROXY_QUICKSTART.md
check "GEMINI_PROXY_QUICKSTART.md exists"

# 4. Check client integration
echo ""
echo "Checking client integration..."

test -f /workspaces/vantai/src/lib/geminiProxyClient.ts
check "Client SDK exists"

# 5. Check if dependencies are installed
echo ""
echo "Checking dependencies..."

test -d /workspaces/vantai/functions/node_modules
check "Node modules installed"

test -d /workspaces/vantai/functions/node_modules/firebase-functions
check "firebase-functions installed"

test -d /workspaces/vantai/functions/node_modules/@google/generative-ai
check "@google/generative-ai installed"

test -d /workspaces/vantai/functions/node_modules/@google-cloud/vision
check "@google-cloud/vision installed"

# 6. Check TypeScript compilation
echo ""
echo "Checking TypeScript compilation..."

test -d /workspaces/vantai/functions/lib
check "Compiled lib directory exists"

test -f /workspaces/vantai/functions/lib/geminiProxy.js
check "geminiProxy.js compiled"

test -f /workspaces/vantai/functions/lib/index.js
check "index.js compiled"

# 7. Check configuration files
echo ""
echo "Checking configuration files..."

test -f /workspaces/vantai/functions/.env.example
check ".env.example exists"

test -f /workspaces/vantai/firebase.json
check "firebase.json exists"

# 8. Check for critical content in main files
echo ""
echo "Checking file contents..."

grep -q "performPolicyCheck" /workspaces/vantai/functions/src/geminiProxy.ts
check "Policy check function exists"

grep -q "detectFaces" /workspaces/vantai/functions/src/geminiProxy.ts
check "Face detection function exists"

grep -q "checkRateLimit" /workspaces/vantai/functions/src/geminiProxy.ts
check "Rate limiting function exists"

grep -q "generateImage" /workspaces/vantai/functions/src/geminiProxy.ts
check "Generate image endpoint exists"

grep -q "editImage" /workspaces/vantai/functions/src/geminiProxy.ts
check "Edit image endpoint exists"

grep -q "approveEdit" /workspaces/vantai/functions/src/geminiProxy.ts
check "Admin approval endpoint exists"

# 9. Count lines of code
echo ""
echo "Code statistics..."

if [ -f /workspaces/vantai/functions/src/geminiProxy.ts ]; then
    LINES=$(wc -l < /workspaces/vantai/functions/src/geminiProxy.ts)
    echo -e "${GREEN}✓${NC} geminiProxy.ts: $LINES lines"
fi

# 10. Summary
echo ""
echo "================================================"
echo "  Verification Summary"
echo "================================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set GEMINI_API_KEY in .env or Firebase config"
    echo "2. Enable Cloud Vision API and Generative Language API"
    echo "3. Deploy: cd functions && firebase deploy --only functions"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the errors above.${NC}"
    echo ""
    exit 1
fi
