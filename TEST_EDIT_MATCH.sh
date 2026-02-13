#!/bin/bash

# Test Edit Match API
# This script tests the PUT /matches/:id endpoint

echo "🧪 Testing Edit Match API"
echo "=========================="

# Step 1: Login to get token
echo ""
echo "Step 1: Login to get access token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parthik@gmail.com",
    "password": "parthik123"
  }')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.'

# Extract access token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
echo ""
echo "Access Token: $ACCESS_TOKEN"

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token"
  exit 1
fi

# Step 2: Get a match to edit
echo ""
echo "Step 2: Getting list of matches..."
MATCHES_RESPONSE=$(curl -s -X GET http://localhost:3000/matches \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Matches Response:"
echo "$MATCHES_RESPONSE" | jq '.'

# Extract first match ID
MATCH_ID=$(echo "$MATCHES_RESPONSE" | jq -r '.data[0].id')
echo ""
echo "Match ID to edit: $MATCH_ID"

if [ "$MATCH_ID" = "null" ] || [ -z "$MATCH_ID" ]; then
  echo "❌ No matches found"
  exit 1
fi

# Step 3: Test PUT endpoint
echo ""
echo "Step 3: Testing PUT /matches/$MATCH_ID..."
echo "Sending update request..."

PUT_RESPONSE=$(curl -s -X PUT http://localhost:3000/matches/$MATCH_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchType": "ODI",
    "overs": 50,
    "venue": "Test Venue Updated"
  }')

echo "PUT Response:"
echo "$PUT_RESPONSE" | jq '.'

# Check if successful
if echo "$PUT_RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
  echo ""
  echo "✅ PUT endpoint works!"
  echo "Match updated successfully"
else
  echo ""
  echo "❌ PUT endpoint failed"
  echo "Response: $PUT_RESPONSE"
fi

echo ""
echo "=========================="
echo "Test complete!"
