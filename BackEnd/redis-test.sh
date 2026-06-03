#!/bin/bash
# Redis Testing Script - AirBEMI

BASE_URL="http://localhost:3000"

echo "========================================"
echo "REDIS TEST SUITE"
echo "========================================"

# 1. Test connection
echo ""
echo "1️⃣  TESTING REDIS CONNECTION..."
curl -X GET "$BASE_URL/test/redis/ping" | jq .

# 2. Test set/get
echo ""
echo "2️⃣  TESTING SET/GET..."
curl -X POST "$BASE_URL/test/redis/set" \
  -H "Content-Type: application/json" \
  -d '{"key":"test:demo","value":"Hello Redis","ttl":300}' | jq .

sleep 1

curl -X GET "$BASE_URL/test/redis/get/test:demo" | jq .

# 3. Test calendar (booking dates)
echo ""
echo "3️⃣  TESTING CALENDAR/BOOKING..."
PROPERTY_ID="prop123"
DATES='["2026-06-10","2026-06-11","2026-06-12"]'

curl -X POST "$BASE_URL/test/redis/calendar/add" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"dates\":$DATES}" | jq .

# Check if dates are available
echo ""
echo "📅 Checking availability (should be FALSE - dates booked)..."
curl -X POST "$BASE_URL/test/redis/calendar/check" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"dates\":[\"2026-06-10\",\"2026-06-11\"]}" | jq .

# Check different dates (should be TRUE - not booked)
echo ""
echo "📅 Checking different dates (should be TRUE - available)..."
curl -X POST "$BASE_URL/test/redis/calendar/check" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"dates\":[\"2026-06-20\",\"2026-06-21\"]}" | jq .

# 4. Test lock (for booking)
echo ""
echo "4️⃣  TESTING LOCK (Anti double-booking)..."
curl -X POST "$BASE_URL/test/redis/lock/acquire" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"ttl\":600}" | jq .

# Try to acquire same lock (should fail)
echo ""
echo "🔒 Trying to acquire same lock again (should fail)..."
curl -X POST "$BASE_URL/test/redis/lock/acquire" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"ttl\":600}" | jq .

# Release lock
echo ""
echo "🔓 Releasing lock..."
curl -X POST "$BASE_URL/test/redis/lock/release" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\":\"$PROPERTY_ID\"}" | jq .

# 5. Test rating
echo ""
echo "5️⃣  TESTING RATING (Reviews)..."
curl -X POST "$BASE_URL/test/redis/rating/set" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"rating\":4.8,\"count\":25}" | jq .

curl -X GET "$BASE_URL/test/redis/rating/get/$PROPERTY_ID" | jq .

# 6. Test reviews
echo ""
echo "6️⃣  TESTING REVIEWS..."
curl -X POST "$BASE_URL/test/redis/review/add" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"review\":{\"userId\":\"user1\",\"rating\":5,\"comment\":\"Excellent property!\",\"createdAt\":\"2026-06-03\"}}" | jq .

curl -X POST "$BASE_URL/test/redis/review/add" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"review\":{\"userId\":\"user2\",\"rating\":4,\"comment\":\"Very good\",\"createdAt\":\"2026-06-02\"}}" | jq .

echo ""
echo "📝 Listing reviews..."
curl -X GET "$BASE_URL/test/redis/review/list/$PROPERTY_ID" | jq .

# 7. Test unread messages
echo ""
echo "7️⃣  TESTING UNREAD MESSAGES..."
curl -X POST "$BASE_URL/test/redis/unread/increment" \
  -H "Content-Type: application/json" \
  -d "{\"toUserId\":\"user1\",\"fromUserId\":\"user2\",\"count\":3}" | jq .

curl -X GET "$BASE_URL/test/redis/unread/get/user1" | jq .

# 8. Show all keys
echo ""
echo "8️⃣  ALL REDIS KEYS:"
curl -X GET "$BASE_URL/test/redis/keys/all" | jq .

echo ""
echo "========================================"
echo "✅ TEST COMPLETE!"
echo "========================================"
