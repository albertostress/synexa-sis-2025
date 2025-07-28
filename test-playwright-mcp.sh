#!/bin/bash

echo "Testing Playwright MCP installation..."
echo "=========================="

# Test 1: Check if npx exists
echo "1. Checking npx availability:"
which npx
npx --version

# Test 2: Try to run Playwright MCP directly
echo -e "\n2. Testing Playwright MCP execution:"
timeout 5s npx -y @playwright/mcp@latest 2>&1 | head -20

# Test 3: Check npm global packages
echo -e "\n3. Checking npm global packages:"
npm list -g --depth=0 | grep playwright || echo "No global playwright packages found"

# Test 4: Try alternative installation
echo -e "\n4. Testing alternative command format:"
timeout 5s npx @playwright/mcp@latest 2>&1 | head -20

echo -e "\n=========================="
echo "Test complete."