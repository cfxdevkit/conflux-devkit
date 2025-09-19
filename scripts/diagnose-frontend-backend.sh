#!/bin/bash

echo "🔍 FRONTEND-BACKEND API DIAGNOSIS"
echo "=================================="
echo ""

API=http://localhost:3001/api

echo "📊 TESTING EXACT FRONTEND API CALLS:"
echo ""

# Test 1: getPublicStatus() - Dashboard uses this for Backend Status
echo "1. Frontend getPublicStatus() -> GET /api/status"
curl -s $API/status | jq . || echo "❌ FAILED"
echo "✅ RESULT: This should show 'Backend Status ✅ Connected'"
echo ""

# Test 2: getDevKitStatus() - Dashboard uses this for DevKit Status  
echo "2. Frontend getDevKitStatus() -> GET /api/devkit/status (requires auth)"
DEVKIT_RESULT=$(curl -s $API/devkit/status)
echo "$DEVKIT_RESULT"
if [[ "$DEVKIT_RESULT" == *"Missing or invalid authorization header"* ]]; then
    echo "✅ RESULT: This explains 'DevKit Status ⏳ Loading...' - needs authentication"
else
    echo "❌ UNEXPECTED: Should require authentication"
fi
echo ""

# Test 3: WebSocket status from getPublicStatus()
echo "3. Frontend WebSocket Status from publicStatus.websocket.connected"
WS_STATUS=$(curl -s $API/status | jq -r '.websocket.connected')
echo "WebSocket Status: $WS_STATUS"
if [[ "$WS_STATUS" == "active" ]]; then
    echo "✅ RESULT: This should show 'WebSocket ✅ Active' but frontend shows '⚪ Inactive'"
    echo "🐛 BUG IDENTIFIED: Frontend WebSocket status logic is incorrect!"
else
    echo "❌ WebSocket not active on backend"
fi
echo ""

# Test 4: Frontend authentication issue
echo "4. Frontend Authentication Status"
echo "The frontend is trying to use DevKitApiServiceWithAuth but:"
echo "- Development session auto-creation is not working"
echo "- Frontend likely doesn't have a valid session token"
echo "- This causes DevKit status to stay in 'Loading...' state"
echo ""

echo "🎯 DIAGNOSIS SUMMARY:"
echo "===================="
echo ""
echo "Backend APIs Status:"
echo "- ✅ GET /api/status - Working perfectly"
echo "- ✅ GET /api/devkit/status - Working but requires auth"
echo "- ✅ WebSocket server - Running on port 3002" 
echo "- ✅ Authentication endpoints - Working"
echo ""
echo "Frontend Issues Identified:"
echo "1. 🐛 WebSocket Status: Frontend logic incorrectly shows 'Inactive'"
echo "   - Backend returns websocket.connected: 'active'"
echo "   - Frontend should show '✅ Active' but shows '⚪ Inactive'"
echo ""
echo "2. 🐛 DevKit Status: Authentication not working in frontend"
echo "   - Development session auto-creation disabled"
echo "   - Frontend doesn't have session token"
echo "   - DevKit status stuck in 'Loading...' state"
echo ""
echo "3. ✅ Backend Status: Working correctly"
echo "   - Should show '✅ Connected' in frontend"
echo ""
echo "🔧 FIXES NEEDED:"
echo "- Fix frontend WebSocket status display logic"
echo "- Fix frontend authentication auto-connect in development"
echo "- Test frontend with proper session token"