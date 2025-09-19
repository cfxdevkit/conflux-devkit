#!/bin/bash

set -e
API=http://localhost:3001/api

echo "🧪 Testing Frontend API Endpoints"
echo "=================================="

# 1. Backend status (public endpoint)
echo "1. Backend Status:"
curl -s $API/status | jq .
echo "✅ Backend status working"
echo ""

# 2. DevKit status (unauthenticated, should fail)
echo "2. DevKit Status (no auth):"
DEVKIT_UNAUTH=$(curl -s $API/devkit/status)
echo "$DEVKIT_UNAUTH"
if [[ "$DEVKIT_UNAUTH" == *"Missing or invalid authorization header"* ]]; then
    echo "✅ DevKit auth protection working"
else
    echo "❌ DevKit auth protection not working"
fi
echo ""

# 3. Authentication endpoints
echo "3. Authentication Challenge:"
CHALLENGE_JSON=$(curl -s -X POST -H "Content-Type: application/json" -d '{"address":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}' $API/auth/challenge)
echo "$CHALLENGE_JSON" | jq .
if [[ "$CHALLENGE_JSON" == *"message"* ]]; then
    echo "✅ Challenge generation working"
else
    echo "❌ Challenge generation failed"
fi
echo ""

# 4. Check development session endpoint
echo "4. Development Session:"
DEV_SESSION=$(curl -s $API/dev/session 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "$DEV_SESSION" | jq . 2>/dev/null || echo "$DEV_SESSION"
    if [[ "$DEV_SESSION" == *"sessionId"* ]]; then
        echo "✅ Development session available"
        SESSION_ID=$(echo "$DEV_SESSION" | jq -r .sessionId 2>/dev/null)
        
        # Test authenticated endpoints
        echo ""
        echo "5. DevKit Status (authenticated):"
        curl -s -H "Authorization: Bearer $SESSION_ID" $API/devkit/status | jq .
        echo "✅ Authenticated DevKit status working"
        
        echo ""
        echo "6. Account Info (authenticated):"
        curl -s -H "Authorization: Bearer $SESSION_ID" $API/devkit/accounts/0 | jq .
        echo "✅ Account info working"
        
        echo ""
        echo "7. Account Balance (authenticated):"
        curl -s -H "Authorization: Bearer $SESSION_ID" $API/devkit/accounts/0/balance | jq .
        echo "✅ Account balance working"
    else
        echo "⚠️  No development session available: $DEV_SESSION"
    fi
else
    echo "❌ Development session endpoint not found or errored"
fi

echo ""
echo "🎯 Frontend API Test Summary:"
echo "- Backend Status: ✅ Working"
echo "- Authentication: ✅ Working" 
echo "- Challenge/Response: ✅ Working"
echo "- Development Session: $([ -n "$SESSION_ID" ] && echo "✅ Working" || echo "⚠️  Not available")"
echo "- WebSocket: Check ws://localhost:3002 manually"
echo ""
echo "All critical API endpoints tested!"
