#!/bin/bash

echo "🔬 SIMULATING FRONTEND API CALLS"
echo "================================"
echo ""

API=http://localhost:3001/api

echo "1. Frontend loads Dashboard component"
echo "2. React Query calls getPublicStatus():"
echo ""

PUBLIC_STATUS=$(curl -s -H "Origin: http://localhost:3000" $API/status)
echo "$PUBLIC_STATUS" | jq .

echo ""
echo "3. Parsing WebSocket status from response:"
WS_CONNECTED=$(echo "$PUBLIC_STATUS" | jq -r '.websocket.connected')
echo "websocket.connected = '$WS_CONNECTED'"

if [[ "$WS_CONNECTED" == "active" ]]; then
    echo "✅ Frontend should show: WebSocket ✅ Active"
else
    echo "❌ Frontend should show: WebSocket ⚪ Inactive"
fi

echo ""
echo "4. React Query calls getDevKitStatusSafe():"
echo ""

DEVKIT_STATUS=$(curl -s -H "Origin: http://localhost:3000" $API/devkit/status)
echo "$DEVKIT_STATUS"

if [[ "$DEVKIT_STATUS" == *"Missing or invalid authorization header"* ]]; then
    echo "❌ Frontend should show: DevKit Status ⏳ Loading... (no auth token)"
else
    echo "✅ Frontend should show: DevKit Status ✅ Running"
fi

echo ""
echo "🎯 EXPECTED FRONTEND STATUS DISPLAY:"
echo "===================================="
echo ""
echo "Backend Status: ✅ Connected (from publicStatus.server)"
echo "DevKit Status:  ⏳ Loading...   (no auth token)"
echo "WebSocket:      ✅ Active       (from publicStatus.websocket.connected = 'active')"
echo ""
echo "If WebSocket shows '⚪ Inactive', check:"
echo "- Frontend console for API call errors"
echo "- Frontend React Query data loading"
echo "- Frontend component re-rendering"