#!/bin/bash

echo "=== Simple Workflow Test ==="
echo "Testing AI workflow without Milvus dependency"
echo

# Test backend health
echo "1. Backend Health Check:"
curl -s -m 5 http://34.27.49.185:4000/api/health || echo "Backend not responding"
echo

# Create test client
echo "2. Creating Test Client:"
# Generate unique email with timestamp
TIMESTAMP=$(date +%s)
CLIENT_DATA='{
  "name": "Test Client",
  "company": "Test Company",
  "email": "test'$TIMESTAMP'@example.com",
  "industry": "Technology", 
  "description": "Testing workflow",
  "challenges": ["AI workflow testing"],
  "goals": ["Successful execution"]
}'

CLIENT_RESPONSE=$(curl -s -m 10 -X POST http://34.27.49.185:4000/api/clients \
  -H "Content-Type: application/json" \
  -d "$CLIENT_DATA")

echo "Client Response: $CLIENT_RESPONSE"

# Extract client ID
CLIENT_ID=$(echo "$CLIENT_RESPONSE" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$CLIENT_ID" ]; then
  CLIENT_ID=$(echo "$CLIENT_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
fi

echo "Extracted Client ID: $CLIENT_ID"

if [ -n "$CLIENT_ID" ]; then
  echo
  echo "3. Testing Discovery Workflow:"
  WORKFLOW_RESPONSE=$(curl -s -m 30 -X POST "http://34.27.49.185:4000/api/clients/$CLIENT_ID/discovery" \
    -H "Content-Type: application/json")
  
  echo "Workflow Response: $WORKFLOW_RESPONSE"
else
  echo "Failed to create client - cannot test workflow"
fi

echo
echo "=== Test Complete ==="
