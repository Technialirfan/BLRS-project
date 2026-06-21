# BALOCHISTAN LAND REGISTRY SYSTEM
## Complete Full-Stack QA Testing Prompt
### Frontend + Backend + MongoDB + Blockchain
### For AI Agent (Google Agentic / Any AI Agent Tool)

---

You are a Senior QA Engineer and Full-Stack Testing Expert.
Your task is to THOROUGHLY TEST the complete
"Balochistan Land Registry System (BLRS)" which includes:

  Layer 1: React.js Frontend     (localhost:5173)
  Layer 2: Node.js Backend API   (localhost:5000)
  Layer 3: MongoDB Database      (localhost:27017)
  Layer 4: Hardhat Blockchain    (localhost:8545)

Test EVERY feature, EVERY workflow, EVERY API endpoint,
EVERY smart contract function, and EVERY UI interaction.

Report PASS ✅ or FAIL ❌ for each test.
If FAIL — provide the exact error message and fix suggestion.

---

## ══════════════════════════════════════════════════
## PRE-TESTING SETUP — VERIFY ALL SERVICES RUNNING
## ══════════════════════════════════════════════════

Before running any tests, verify all 4 services are running:

```bash
# CHECK 1 — Blockchain running?
curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
# Expected: {"result":"0x..."}  ✅

# CHECK 2 — Backend API running?
curl http://localhost:5000/api/health
# Expected: {"success":true,"status":"healthy"}  ✅

# CHECK 3 — MongoDB running?
mongosh --eval "db.runCommand({ping:1})" --quiet
# Expected: { ok: 1 }  ✅

# CHECK 4 — Frontend running?
curl http://localhost:5173
# Expected: HTML response with BLRS  ✅
```

```
TEST CREDENTIALS (all passwords: Officer@2024):
  Admin:     admin@blrs.gov.pk
  Patwari:   patwari.quetta@blrs.gov.pk
  Tehsildar: tehsildar.quetta@blrs.gov.pk
  DC:        dc.quetta@blrs.gov.pk
```

---

## ══════════════════════════════════════════════════
## MODULE 1: BACKEND API HEALTH TESTS
## ══════════════════════════════════════════════════

### TEST 1.1 — Root Endpoint
```bash
curl http://localhost:5000/
```
```
Expected Response:
{
  "success": true,
  "message": "BLRS API is running",
  "version": "1.0.0",
  "system": "Balochistan Land Registry System"
}
PASS if: success=true, version present
FAIL if: connection refused or error
```

### TEST 1.2 — Health Check Endpoint
```bash
curl http://localhost:5000/api/health
```
```
Expected Response:
{
  "success": true,
  "status": "healthy",
  "uptime": [number > 0]
}
PASS if: status="healthy", uptime > 0
FAIL if: any field missing
```

### TEST 1.3 — 404 Handler
```bash
curl http://localhost:5000/api/nonexistent-route
```
```
Expected Response:
{
  "success": false,
  "message": "Route /api/nonexistent-route not found"
}
PASS if: 404 status code returned
FAIL if: server crashes or wrong status
```

### TEST 1.4 — CORS Headers
```bash
curl -I -X OPTIONS http://localhost:5000/api/auth/login \
  -H "Origin: http://localhost:5173"
```
```
Expected: Access-Control-Allow-Origin header present
PASS if: CORS headers present
FAIL if: No CORS headers
```

### TEST 1.5 — Security Headers (Helmet)
```bash
curl -I http://localhost:5000/
```
```
Expected headers:
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: present
PASS if: security headers present
FAIL if: headers missing
```

---

## ══════════════════════════════════════════════════
## MODULE 2: AUTHENTICATION TESTS
## ══════════════════════════════════════════════════

### TEST 2.1 — Admin Login (Valid)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@blrs.gov.pk",
    "password": "Officer@2024"
  }'
```
```
Expected Response:
{
  "success": true,
  "token": "eyJhbGci...",
  "officer": {
    "fullName": "System Administrator",
    "role": "admin",
    "email": "admin@blrs.gov.pk"
  }
}
PASS if: token present, role=admin, no password in response
FAIL if: no token, or password field visible in response
SAVE TOKEN as: ADMIN_TOKEN for subsequent tests
```

### TEST 2.2 — Patwari Login (Valid)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patwari.quetta@blrs.gov.pk",
    "password": "Officer@2024"
  }'
```
```
PASS if: token present, role=patwari, assignedDistrict=Quetta
SAVE TOKEN as: PATWARI_TOKEN
```

### TEST 2.3 — Tehsildar Login (Valid)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tehsildar.quetta@blrs.gov.pk",
    "password": "Officer@2024"
  }'
```
```
PASS if: token present, role=tehsildar
SAVE TOKEN as: TEHSILDAR_TOKEN
```

### TEST 2.4 — DC Login (Valid)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dc.quetta@blrs.gov.pk",
    "password": "Officer@2024"
  }'
```
```
PASS if: token present, role=dc
SAVE TOKEN as: DC_TOKEN
```

### TEST 2.5 — Invalid Password
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@blrs.gov.pk",
    "password": "WrongPassword123"
  }'
```
```
Expected: 401 status
{
  "success": false,
  "message": "Invalid email or password"
}
PASS if: 401 returned, no token issued
FAIL if: token issued for wrong password
```

### TEST 2.6 — Non-existent Email
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fake@blrs.gov.pk",
    "password": "Officer@2024"
  }'
```
```
Expected: 401 status, no token
PASS if: 401 returned
FAIL if: different error or token issued
```

### TEST 2.7 — Missing Email Field
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "Officer@2024"}'
```
```
Expected: 400 status, validation error
PASS if: 400 returned with field error
FAIL if: server crashes
```

### TEST 2.8 — Missing Password Field
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@blrs.gov.pk"}'
```
```
Expected: 400 status, validation error
PASS if: 400 returned with field error
```

### TEST 2.9 — Get My Profile (Protected)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
```
Expected: officer profile without password field
PASS if: success=true, no password field in response
FAIL if: password visible or 401 error
```

### TEST 2.10 — Access Protected Route Without Token
```bash
curl http://localhost:5000/api/auth/me
```
```
Expected: 401 status
{
  "success": false,
  "message": "Not authorized. Please login first."
}
PASS if: 401 returned
FAIL if: data returned without auth
```

### TEST 2.11 — Access Protected Route With Fake Token
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer fakeinvalidtoken123"
```
```
Expected: 401 status
PASS if: 401 returned with invalid token message
FAIL if: data returned
```

### TEST 2.12 — Rate Limiting on Login
```bash
# Run login with wrong password 11 times rapidly
for i in {1..11}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@blrs.gov.pk","password":"wrong"}'
done
```
```
Expected: After 10 attempts → 429 Too Many Requests
{
  "success": false,
  "message": "Too many login attempts..."
}
PASS if: 429 returned on 11th attempt
FAIL if: unlimited attempts allowed
```

---

## ══════════════════════════════════════════════════
## MODULE 3: LAND REGISTRATION TESTS
## ══════════════════════════════════════════════════

### TEST 3.1 — Register Land (Valid — Patwari)
```bash
curl -X POST http://localhost:5000/api/land/register \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parcelId": "TEST-2024-001",
    "ownerCNIC": "5430199887766",
    "ownerName": "Test Owner Khan",
    "district": "Quetta",
    "tehsil": "Quetta",
    "mouza": "Test Mouza",
    "areaSqFt": 2000,
    "landType": "residential",
    "primaryDocHash": "QmTestHash123456789",
    "gpsLat": 30.1798,
    "gpsLng": 67.0089
  }'
```
```
Expected Response:
{
  "success": true,
  "message": "Land registered successfully",
  "data": {
    "land": {
      "parcelId": "TEST-2024-001",
      "status": "Pending",
      "blockchainTxHash": "0x..."
    },
    "txHash": "0x...",
    "blockNumber": [number]
  }
}
PASS if: success=true, status=Pending, txHash present (starts with 0x)
FAIL if: no txHash, wrong status, or error
SAVE: PARCEL_ID = "TEST-2024-001"
```

### TEST 3.2 — Register Land (Duplicate Parcel ID)
```bash
curl -X POST http://localhost:5000/api/land/register \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parcelId": "TEST-2024-001",
    "ownerCNIC": "5430199887766",
    "ownerName": "Another Owner",
    "district": "Quetta",
    "tehsil": "Quetta",
    "mouza": "Test Mouza",
    "areaSqFt": 1500,
    "landType": "agricultural",
    "primaryDocHash": "QmDuplicateHash"
  }'
```
```
Expected: 400 status
{
  "success": false,
  "message": "Parcel ID already exists..."
}
PASS if: 400 returned, duplicate rejected
FAIL if: duplicate allowed
```

### TEST 3.3 — Register Land (Wrong Role — Tehsildar tries)
```bash
curl -X POST http://localhost:5000/api/land/register \
  -H "Authorization: Bearer $TEHSILDAR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parcelId": "TEST-2024-UNAUTHORIZED",
    "ownerCNIC": "5430199887700",
    "ownerName": "Unauthorized Test",
    "district": "Quetta",
    "tehsil": "Quetta",
    "mouza": "Test",
    "areaSqFt": 1000,
    "landType": "residential",
    "primaryDocHash": "QmUnauthorizedHash"
  }'
```
```
Expected: 403 status
{
  "success": false,
  "message": "Role 'tehsildar' is not authorized..."
}
PASS if: 403 returned, land NOT registered
FAIL if: Tehsildar can register land
```

### TEST 3.4 — Register Land (Invalid CNIC — not 13 digits)
```bash
curl -X POST http://localhost:5000/api/land/register \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parcelId": "TEST-2024-002",
    "ownerCNIC": "12345",
    "ownerName": "Test Owner",
    "district": "Quetta",
    "tehsil": "Quetta",
    "mouza": "Test",
    "areaSqFt": 1000,
    "landType": "residential",
    "primaryDocHash": "QmHash123"
  }'
```
```
Expected: 400 status, CNIC validation error
PASS if: 400 returned with CNIC error message
FAIL if: land registered with invalid CNIC
```

### TEST 3.5 — Register Land (Zero Area)
```bash
curl -X POST http://localhost:5000/api/land/register \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parcelId": "TEST-2024-003",
    "ownerCNIC": "5430199887755",
    "ownerName": "Test Owner",
    "district": "Quetta",
    "tehsil": "Quetta",
    "mouza": "Test",
    "areaSqFt": 0,
    "landType": "residential",
    "primaryDocHash": "QmHash456"
  }'
```
```
Expected: 400 status, area validation error
PASS if: 400 returned
FAIL if: land with 0 area registered
```

### TEST 3.6 — Get All Lands (Patwari — own lands only)
```bash
curl http://localhost:5000/api/land/all \
  -H "Authorization: Bearer $PATWARI_TOKEN"
```
```
Expected:
{
  "success": true,
  "count": [number],
  "total": [number],
  "data": { "lands": [...] }
}
PASS if: success=true, lands array present
FAIL if: error or empty when lands exist
```

### TEST 3.7 — Get Single Land
```bash
curl http://localhost:5000/api/land/TEST-2024-001 \
  -H "Authorization: Bearer $PATWARI_TOKEN"
```
```
Expected: complete land object with all fields
PASS if: parcelId=TEST-2024-001, status=Pending
FAIL if: 404 or wrong data
```

### TEST 3.8 — Get Land Dashboard Stats
```bash
curl http://localhost:5000/api/land/stats/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
```
Expected: statistics object with counts
PASS if: success=true, stats object present
FAIL if: empty or error
```

---

## ══════════════════════════════════════════════════
## MODULE 4: LAND VERIFICATION TESTS
## ══════════════════════════════════════════════════

### TEST 4.1 — Verify Land (Valid — Tehsildar)
```bash
curl -X PUT http://localhost:5000/api/land/TEST-2024-001/verify \
  -H "Authorization: Bearer $TEHSILDAR_TOKEN" \
  -H "Content-Type: application/json"
```
```
Expected:
{
  "success": true,
  "data": {
    "land": { "status": "Verified" },
    "txHash": "0x..."
  }
}
PASS if: status=Verified, txHash present
FAIL if: status unchanged or no txHash
```

### TEST 4.2 — Verify Land (Wrong Role — Patwari tries)
```bash
curl -X PUT http://localhost:5000/api/land/TEST-2024-001/verify \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json"
```
```
Expected: 403 status
PASS if: 403 returned
FAIL if: Patwari can verify
```

### TEST 4.3 — Verify Already Verified Land
```bash
curl -X PUT http://localhost:5000/api/land/TEST-2024-001/verify \
  -H "Authorization: Bearer $TEHSILDAR_TOKEN" \
  -H "Content-Type: application/json"
```
```
Expected: 400 or 422 status — cannot verify non-Pending land
PASS if: error returned
FAIL if: double verification allowed
```

### TEST 4.4 — Reject Pending Land (Tehsildar)
```bash
# First register a new land to reject
curl -X POST http://localhost:5000/api/land/register \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parcelId": "TEST-REJECT-001",
    "ownerCNIC": "5430188776655",
    "ownerName": "Rejection Test Owner",
    "district": "Quetta",
    "tehsil": "Quetta",
    "mouza": "Test Mouza",
    "areaSqFt": 1200,
    "landType": "agricultural",
    "primaryDocHash": "QmRejectHash123"
  }'

# Then reject it
curl -X PUT http://localhost:5000/api/land/TEST-REJECT-001/reject \
  -H "Authorization: Bearer $TEHSILDAR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Documents are incomplete and not properly attested by concerned authority"}'
```
```
Expected:
{
  "success": true,
  "data": {
    "land": {
      "status": "Rejected",
      "rejectionReason": "Documents are incomplete..."
    }
  }
}
PASS if: status=Rejected, reason saved
FAIL if: rejection without reason saved
```

### TEST 4.5 — Reject With Short Reason (less than 10 chars)
```bash
curl -X PUT http://localhost:5000/api/land/TEST-REJECT-001/reject \
  -H "Authorization: Bearer $TEHSILDAR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Bad"}'
```
```
Expected: 400 status — reason too short
PASS if: validation error returned
FAIL if: rejected with short reason
```

---

## ══════════════════════════════════════════════════
## MODULE 5: LAND APPROVAL TESTS
## ══════════════════════════════════════════════════

### TEST 5.1 — Approve Verified Land (DC)
```bash
curl -X PUT http://localhost:5000/api/land/TEST-2024-001/approve \
  -H "Authorization: Bearer $DC_TOKEN" \
  -H "Content-Type: application/json"
```
```
Expected:
{
  "success": true,
  "data": {
    "land": { "status": "Registered" },
    "txHash": "0x...",
    "nftTokenId": [number]
  }
}
PASS if: status=Registered, txHash present, nftTokenId is a number
FAIL if: status not Registered or no NFT token ID
```

### TEST 5.2 — Approve Land (Wrong Role — Patwari tries)
```bash
curl -X PUT http://localhost:5000/api/land/TEST-2024-001/approve \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json"
```
```
Expected: 403 status
PASS if: 403 returned
FAIL if: Patwari can approve
```

### TEST 5.3 — Approve Already Approved Land
```bash
curl -X PUT http://localhost:5000/api/land/TEST-2024-001/approve \
  -H "Authorization: Bearer $DC_TOKEN" \
  -H "Content-Type: application/json"
```
```
Expected: 400 or 422 — cannot approve non-Verified land
PASS if: error returned
FAIL if: double approval allowed
```

---

## ══════════════════════════════════════════════════
## MODULE 6: OWNERSHIP TRANSFER TESTS
## ══════════════════════════════════════════════════

### TEST 6.1 — Initiate Transfer (Patwari on Registered land)
```bash
curl -X POST \
  http://localhost:5000/api/land/TEST-2024-001/transfer/initiate \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newOwnerCNIC": "5430177665544",
    "newOwnerName": "New Owner Ahmed Khan",
    "transferDocHash": "QmTransferDoc123456",
    "reason": "Sale of property"
  }'
```
```
Expected:
{
  "success": true,
  "data": {
    "land": { "status": "TransferPending" },
    "txHash": "0x..."
  }
}
PASS if: status=TransferPending, txHash present
FAIL if: status unchanged
```

### TEST 6.2 — Approve Transfer (DC)
```bash
curl -X PUT \
  http://localhost:5000/api/land/TEST-2024-001/transfer/approve \
  -H "Authorization: Bearer $DC_TOKEN" \
  -H "Content-Type: application/json"
```
```
Expected:
{
  "success": true,
  "data": {
    "land": {
      "status": "Registered",
      "ownerCNIC": "5430177665544",
      "ownerName": "New Owner Ahmed Khan"
    },
    "txHash": "0x..."
  }
}
PASS if: ownerCNIC updated, status=Registered, txHash present
FAIL if: ownership not updated
```

### TEST 6.3 — Verify Ownership History Updated
```bash
curl http://localhost:5000/api/land/TEST-2024-001/history \
  -H "Authorization: Bearer $DC_TOKEN"
```
```
Expected: array with 2 entries
  Entry 1: initial_registration
  Entry 2: transfer (to new owner)
PASS if: 2 history entries with correct types
FAIL if: history not updated
```

### TEST 6.4 — Reject Transfer (DC)
```bash
# Register and fully approve a new land first
# Then initiate transfer
# Then reject it

curl -X PUT \
  http://localhost:5000/api/land/[NEW-PARCEL]/transfer/reject \
  -H "Authorization: Bearer $DC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Transfer documents not properly verified by local revenue office"}'
```
```
Expected:
{
  "success": true,
  "data": {
    "land": { "status": "Registered" }
  }
}
PASS if: status reverts to Registered after rejection
FAIL if: stuck in TransferPending
```

---

## ══════════════════════════════════════════════════
## MODULE 7: DISPUTE RESOLUTION TESTS
## ══════════════════════════════════════════════════

### TEST 7.1 — File Dispute (Any Officer)
```bash
# Register and approve a new land first for dispute testing
# Then file dispute:
curl -X POST http://localhost:5000/api/disputes/file \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parcelId": "TEST-2024-001",
    "claimantCNIC": "5430155443322",
    "claimantName": "Dispute Claimant Khan",
    "claimantPhone": "03001234567",
    "disputeType": "ownership_claim",
    "description": "The claimant states that the land was inherited from his father and the current registration is fraudulent based on forged documents submitted in 2023",
    "evidenceHashes": ["QmEvidence001", "QmEvidence002"],
    "evidenceTypes": ["Court Order", "Inheritance Certificate"]
  }'
```
```
Expected:
{
  "success": true,
  "data": {
    "dispute": {
      "disputeId": [number],
      "status": "Filed"
    },
    "txHash": "0x..."
  }
}
PASS if: status=Filed, disputeId assigned, txHash present
FAIL if: dispute not created or no txHash
SAVE: DISPUTE_ID from response
```

### TEST 7.2 — Verify Land Marked as Disputed
```bash
curl http://localhost:5000/api/land/TEST-2024-001 \
  -H "Authorization: Bearer $PATWARI_TOKEN"
```
```
Expected: land.isDisputed = true, land.status = "Disputed"
PASS if: both fields updated correctly
FAIL if: land status not changed to Disputed
```

### TEST 7.3 — File Dispute With Short Description
```bash
curl -X POST http://localhost:5000/api/disputes/file \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parcelId": "TEST-2024-001",
    "claimantCNIC": "5430155443300",
    "claimantName": "Short Desc Test",
    "disputeType": "fraud",
    "description": "Too short"
  }'
```
```
Expected: 400 status — description too short (min 50 chars)
PASS if: validation error returned
FAIL if: dispute with short description accepted
```

### TEST 7.4 — Mark Dispute Under Review (Tehsildar)
```bash
curl -X PUT \
  http://localhost:5000/api/disputes/$DISPUTE_ID/review \
  -H "Authorization: Bearer $TEHSILDAR_TOKEN" \
  -H "Content-Type: application/json"
```
```
Expected:
{
  "success": true,
  "data": {
    "dispute": { "status": "UnderReview" }
  }
}
PASS if: status=UnderReview
FAIL if: status unchanged
```

### TEST 7.5 — Resolve Dispute (DC)
```bash
curl -X PUT \
  http://localhost:5000/api/disputes/$DISPUTE_ID/resolve \
  -H "Authorization: Bearer $DC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resolution": "After thorough investigation and review of all submitted documents, the dispute is resolved in favor of the original registered owner. The claimant failed to provide sufficient evidence of fraudulent registration."}'
```
```
Expected:
{
  "success": true,
  "data": {
    "dispute": { "status": "Resolved" }
  }
}
PASS if: status=Resolved, resolution saved
FAIL if: status unchanged
```

### TEST 7.6 — Verify Land Cleared After Resolution
```bash
curl http://localhost:5000/api/land/TEST-2024-001 \
  -H "Authorization: Bearer $DC_TOKEN"
```
```
Expected: land.isDisputed = false, land.status = "Registered"
PASS if: dispute cleared from land
FAIL if: land still shows Disputed after resolution
```

### TEST 7.7 — Get All Disputes
```bash
curl http://localhost:5000/api/disputes/all \
  -H "Authorization: Bearer $TEHSILDAR_TOKEN"
```
```
Expected: list of disputes
PASS if: success=true, disputes array present
FAIL if: empty or error
```

---

## ══════════════════════════════════════════════════
## MODULE 8: PUBLIC SEARCH TESTS (No Auth)
## ══════════════════════════════════════════════════

### TEST 8.1 — Search by CNIC (Valid)
```bash
curl "http://localhost:5000/api/public/search?cnic=5430199887766"
```
```
Expected: land records for that CNIC
PASS if: success=true, lands array returned
FAIL if: error or empty when records exist
```

### TEST 8.2 — Search by Parcel ID (Valid)
```bash
curl "http://localhost:5000/api/public/search?parcelId=TEST-2024-001"
```
```
Expected: single land record with safe fields only
PASS if: success=true, land returned
FAIL if: error
```

### TEST 8.3 — CRITICAL: Sensitive Data NOT Exposed
```bash
curl "http://localhost:5000/api/public/search?cnic=5430199887766"
```
```
Check response carefully — these fields must NOT be present:
  ❌ ownerCNIC              (must be hidden)
  ❌ walletAddress          (must be hidden)
  ❌ registeredByPatwari    (must be hidden)
  ❌ verifiedByTehsildar    (must be hidden)
  ❌ approvedByDC           (must be hidden)
  ❌ rejectionReason        (must be hidden)
  ❌ primaryDocHash         (must be hidden)
  ❌ allDocHashes           (must be hidden)

These fields MUST be present:
  ✅ parcelId
  ✅ ownerName
  ✅ district
  ✅ status
  ✅ areaSqFt or areaMarla

PASS if: NO sensitive fields in public response
FAIL if: ANY sensitive field exposed — CRITICAL SECURITY BUG
```

### TEST 8.4 — Search Non-existent CNIC
```bash
curl "http://localhost:5000/api/public/search?cnic=0000000000000"
```
```
Expected: empty lands array, NOT an error
{
  "success": true,
  "count": 0,
  "data": { "lands": [] }
}
PASS if: empty array returned gracefully
FAIL if: error or crash
```

### TEST 8.5 — Public Search Without Any Parameter
```bash
curl "http://localhost:5000/api/public/search"
```
```
Expected: 400 status — either cnic or parcelId required
PASS if: validation error returned
FAIL if: all lands returned (security issue)
```

### TEST 8.6 — Public Stats Endpoint
```bash
curl "http://localhost:5000/api/public/stats"
```
```
Expected: public statistics without sensitive data
PASS if: success=true, stats present
FAIL if: officer details or sensitive data in response
```

---

## ══════════════════════════════════════════════════
## MODULE 9: DOCUMENT UPLOAD TESTS
## ══════════════════════════════════════════════════

### TEST 9.1 — Upload Valid PDF Document
```bash
# Create a test PDF file first
echo "Test document content" > /tmp/test-doc.pdf

curl -X POST http://localhost:5000/api/documents/upload \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -F "document=@/tmp/test-doc.pdf"
```
```
Expected:
{
  "success": true,
  "data": {
    "ipfsHash": "Qm...",
    "ipfsUrl": "https://gateway.pinata.cloud/ipfs/Qm..."
  }
}
PASS if: ipfsHash returned (real or fake fallback)
FAIL if: upload fails completely
```

### TEST 9.2 — Upload Without Auth
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "document=@/tmp/test-doc.pdf"
```
```
Expected: 401 status
PASS if: 401 returned
FAIL if: upload allowed without auth
```

### TEST 9.3 — Upload Unsupported File Type
```bash
echo "test" > /tmp/test.exe
curl -X POST http://localhost:5000/api/documents/upload \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -F "document=@/tmp/test.exe"
```
```
Expected: 400 status — file type not allowed
PASS if: rejection with allowed types message
FAIL if: .exe file accepted
```

---

## ══════════════════════════════════════════════════
## MODULE 10: ADMIN MODULE TESTS
## ══════════════════════════════════════════════════

### TEST 10.1 — Get All Officers (Admin)
```bash
curl http://localhost:5000/api/admin/officers \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
```
Expected: list of all officers without passwords
PASS if: officers array, no password fields visible
FAIL if: passwords visible or error
```

### TEST 10.2 — Create New Officer (Admin)
```bash
curl -X POST http://localhost:5000/api/admin/officers/create \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Patwari Officer",
    "cnic": "5430111222333",
    "email": "test.patwari@blrs.gov.pk",
    "password": "Officer@2024",
    "phone": "03051234567",
    "role": "patwari",
    "assignedDistrict": "Gwadar"
  }'
```
```
Expected:
{
  "success": true,
  "data": {
    "officer": {
      "email": "test.patwari@blrs.gov.pk",
      "role": "patwari"
    }
  }
}
PASS if: officer created, no password in response
FAIL if: creation fails or password visible
SAVE: NEW_OFFICER_ID from response
```

### TEST 10.3 — Create Officer (Non-Admin tries)
```bash
curl -X POST http://localhost:5000/api/admin/officers/create \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Unauthorized Officer",
    "cnic": "5430144455566",
    "email": "unauthorized@blrs.gov.pk",
    "password": "Officer@2024",
    "role": "patwari",
    "assignedDistrict": "Quetta"
  }'
```
```
Expected: 403 status
PASS if: 403 returned
FAIL if: non-admin can create officers
```

### TEST 10.4 — Duplicate Email Officer Creation
```bash
curl -X POST http://localhost:5000/api/admin/officers/create \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Duplicate Email Test",
    "cnic": "5430199900011",
    "email": "admin@blrs.gov.pk",
    "password": "Officer@2024",
    "role": "patwari",
    "assignedDistrict": "Quetta"
  }'
```
```
Expected: 400 status — email already exists
PASS if: duplicate rejected
FAIL if: duplicate email allowed
```

### TEST 10.5 — Toggle Officer Active Status
```bash
curl -X PUT \
  http://localhost:5000/api/admin/officers/$NEW_OFFICER_ID/toggle \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
```
Expected: isActive toggled (true→false or false→true)
PASS if: isActive value changed
FAIL if: value unchanged
```

### TEST 10.6 — Deactivated Officer Cannot Login
```bash
# After deactivating the test officer:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.patwari@blrs.gov.pk",
    "password": "Officer@2024"
  }'
```
```
Expected: 401 status — account deactivated
PASS if: login rejected with deactivated message
FAIL if: deactivated officer can still login
```

### TEST 10.7 — Get Audit Logs (Admin)
```bash
curl "http://localhost:5000/api/admin/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
```
Expected: paginated audit logs
PASS if: logs array with actions, timestamps, officer info
FAIL if: empty when actions were performed
```

### TEST 10.8 — Get System Statistics
```bash
curl http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
```
Expected: comprehensive stats object with:
  - lands by status breakdown
  - lands by district
  - lands by type
  - officer counts by role
  - dispute statistics
PASS if: all categories present with counts
FAIL if: empty or partial stats
```

---

## ══════════════════════════════════════════════════
## MODULE 11: MONGODB DATABASE TESTS
## ══════════════════════════════════════════════════

### TEST 11.1 — Verify Officers Collection
```bash
mongosh blrs_db --eval "
  const count = db.officers.countDocuments();
  const admin = db.officers.findOne({email: 'admin@blrs.gov.pk'});
  print('Total officers:', count);
  print('Admin found:', admin ? 'YES' : 'NO');
  print('Admin role:', admin ? admin.role : 'N/A');
  print('Password hashed:', admin && admin.password.startsWith('\$2b') ? 'YES (bcrypt)' : 'NO - SECURITY ISSUE');
"
```
```
PASS if:
  - count >= 5
  - admin found
  - password starts with $2b (bcrypt hash)
FAIL if:
  - password is plain text — CRITICAL SECURITY BUG
  - officers missing
```

### TEST 11.2 — Verify Lands Collection
```bash
mongosh blrs_db --eval "
  const count = db.lands.countDocuments();
  const land = db.lands.findOne({parcelId: 'TEST-2024-001'});
  print('Total lands:', count);
  print('Test land found:', land ? 'YES' : 'NO');
  print('Land status:', land ? land.status : 'N/A');
  print('TX Hash present:', land && land.blockchainTxHash ? 'YES' : 'NO');
  print('Area Marla calculated:', land && land.areaMarla ? 'YES' : 'NO');
"
```
```
PASS if:
  - test land exists
  - blockchainTxHash is NOT null
  - areaMarla is auto-calculated
FAIL if:
  - land missing from DB
  - txHash null (blockchain not connected)
  - areaMarla not calculated
```

### TEST 11.3 — Verify Disputes Collection
```bash
mongosh blrs_db --eval "
  const count = db.disputes.countDocuments();
  const dispute = db.disputes.findOne({status: 'Resolved'});
  print('Total disputes:', count);
  print('Resolved dispute found:', dispute ? 'YES' : 'NO');
  print('Resolution saved:', dispute && dispute.resolution ? 'YES' : 'NO');
"
```
```
PASS if: disputes exist with proper status values
FAIL if: disputes missing or resolution not saved
```

### TEST 11.4 — Verify Audit Logs Collection
```bash
mongosh blrs_db --eval "
  const count = db.auditlogs.countDocuments();
  const loginLog = db.auditlogs.findOne({action: 'OFFICER_LOGIN'});
  const landLog = db.auditlogs.findOne({action: 'LAND_REGISTERED'});
  print('Total audit logs:', count);
  print('Login logs exist:', loginLog ? 'YES' : 'NO');
  print('Land registration logs exist:', landLog ? 'YES' : 'NO');
"
```
```
PASS if:
  - count > 0 (logs being written)
  - login logs exist
  - land registration logs exist
FAIL if:
  - no logs (audit logging broken)
```

### TEST 11.5 — Verify Indexes
```bash
mongosh blrs_db --eval "
  print('=== Officers Indexes ===');
  db.officers.getIndexes().forEach(i => print(JSON.stringify(i.key)));
  print('=== Lands Indexes ===');
  db.lands.getIndexes().forEach(i => print(JSON.stringify(i.key)));
"
```
```
PASS if:
  - Officers: indexes on email, cnic, role
  - Lands: indexes on parcelId, ownerCNIC, status
FAIL if: no indexes (performance issue)
```

### TEST 11.6 — Verify Data Integrity (Land + Blockchain Sync)
```bash
mongosh blrs_db --eval "
  const registeredLands = db.lands.find({
    status: 'Registered',
    blockchainTxHash: null
  }).count();
  print('Registered lands without TX hash:', registeredLands);
  print('PASS if: 0 (all registered lands have TX hash)');
"
```
```
PASS if: 0 registered lands without TX hash
FAIL if: any registered land has null txHash (blockchain sync broken)
```

---

## ══════════════════════════════════════════════════
## MODULE 12: BLOCKCHAIN SMART CONTRACT TESTS
## ══════════════════════════════════════════════════

### TEST 12.1 — Verify Contracts Deployed
```bash
# Check each contract has code at its address
# Replace addresses with your actual deployed addresses

curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getCode",
    "params":["'$ROLE_MANAGER_ADDRESS'","latest"],
    "id":1
  }'
```
```
Expected: result is NOT "0x" (empty)
PASS if: result contains contract bytecode (long hex string)
FAIL if: result = "0x" (contract not deployed)

Run this for ALL 4 contracts:
  - ROLE_MANAGER_ADDRESS
  - LAND_REGISTRY_ADDRESS
  - DISPUTE_RESOLUTION_ADDRESS
  - LAND_TOKEN_ADDRESS
```

### TEST 12.2 — Run Hardhat Tests
```bash
cd blrs-blockchain
npx hardhat test 2>&1
```
```
Expected output:
  RoleManager
    ✓ Should deploy with correct admin
    ✓ Should allow admin to add Patwari
    ...
  LandRegistry
    ✓ Should register land
    ...
  [N] passing
  0 failing

PASS if: 0 failing tests
FAIL if: any failing tests — list which ones
```

### TEST 12.3 — Verify Land on Blockchain
```bash
cd blrs-blockchain
npx hardhat console --network localhost
```
```javascript
// In Hardhat console:
const LandRegistry = await ethers.getContractAt(
  "LandRegistry",
  process.env.LAND_REGISTRY_ADDRESS
);
const land = await LandRegistry.getLand("TEST-2024-001");
console.log("Owner:", land.ownerName);
console.log("Status:", land.status.toString());
console.log("CNIC:", land.ownerCNIC);
```
```
PASS if: land data matches what was registered via API
FAIL if: land not found on blockchain
```

### TEST 12.4 — Verify NFT Minted
```bash
# In Hardhat console:
const LandToken = await ethers.getContractAt(
  "LandToken",
  process.env.LAND_TOKEN_ADDRESS
);
const hasToken = await LandToken.parcelHasToken("TEST-2024-001");
const tokenId  = await LandToken.getTokenByParcel("TEST-2024-001");
console.log("Has NFT:", hasToken);
console.log("Token ID:", tokenId.toString());
```
```
PASS if: hasToken=true, tokenId > 0
FAIL if: hasToken=false (NFT not minted on approval)
```

### TEST 12.5 — Verify Role Access Control on Blockchain
```bash
# In Hardhat console:
const [admin, patwari, tehsildar, dc] = await ethers.getSigners();
const RoleManager = await ethers.getContractAt(
  "RoleManager",
  process.env.ROLE_MANAGER_ADDRESS
);
const isPatwari   = await RoleManager.isPatwari(patwari.address);
const isTehsildar = await RoleManager.isTehsildar(tehsildar.address);
const isDC        = await RoleManager.isDC(dc.address);
console.log("Patwari:", isPatwari);
console.log("Tehsildar:", isTehsildar);
console.log("DC:", isDC);
```
```
PASS if: all 3 return true
FAIL if: any returns false (roles not set correctly)
```

### TEST 12.6 — Verify Immutability (Cannot Alter Record)
```bash
# Try to call a function with wrong role — must REVERT
# In Hardhat console:
try {
  const LandRegistry = await ethers.getContractAt(
    "LandRegistry",
    process.env.LAND_REGISTRY_ADDRESS
  );
  // Patwari tries to verify — must fail
  const [admin, patwari] = await ethers.getSigners();
  await LandRegistry.connect(patwari).verifyLand("TEST-2024-001");
  console.log("FAIL: should have reverted!");
} catch(e) {
  console.log("PASS: correctly reverted:", e.message.includes("TEHSILDAR"));
}
```
```
PASS if: transaction reverts with authorization error
FAIL if: Patwari can verify land on blockchain
```

### TEST 12.7 — Verify Gas Usage Report
```bash
cd blrs-blockchain
REPORT_GAS=true npx hardhat test 2>&1 | grep -A 50 "Gas usage"
```
```
Expected: gas report table showing each function cost
PASS if: report generated with reasonable gas values
FAIL if: any function uses > 1,000,000 gas (optimization needed)
```

---

## ══════════════════════════════════════════════════
## MODULE 13: FRONTEND UI TESTS
## ══════════════════════════════════════════════════

### TEST 13.1 — Landing Page Loads
```
Open browser: http://localhost:5173
Check:
  ✅ Page loads without white screen
  ✅ Hero section visible with BLRS title
  ✅ Navigation bar visible (Home, About, Contact, Login)
  ✅ Dark mode toggle visible
  ✅ "Check Your Land Status" button visible
  ✅ No console errors (F12 → Console tab)

PASS if: all items visible, no console errors
FAIL if: white screen, missing elements, or console errors
```

### TEST 13.2 — Public Search Works
```
1. Click "Check Your Land Status" on landing page
   OR go to: http://localhost:5173/search
2. Enter CNIC: 5430199887766
3. Click Search

PASS if: land results shown with parcelId, district, status
FAIL if: error message or empty when land exists
```

### TEST 13.3 — Officer Login Works
```
1. Go to: http://localhost:5173/login
2. Enter: admin@blrs.gov.pk / Officer@2024
3. Click Login

PASS if: redirected to admin dashboard
FAIL if: error or stuck on login page

Repeat for all 4 roles:
  patwari.quetta@blrs.gov.pk → Patwari dashboard
  tehsildar.quetta@blrs.gov.pk → Tehsildar dashboard
  dc.quetta@blrs.gov.pk → DC dashboard
```

### TEST 13.4 — Role-Based Dashboard Shown
```
After login as Patwari:
PASS if: Patwari dashboard with "Register Land" button visible
FAIL if: wrong dashboard or admin controls visible

After login as Tehsildar:
PASS if: Tehsildar dashboard with pending verifications
FAIL if: register land button visible (wrong role)
```

### TEST 13.5 — Land Registration Form (5 Steps)
```
Login as Patwari → click Register Land

Step 1: Enter parcel info
  - Parcel ID: UI-TEST-001
  - Owner CNIC: 5430111223344
  - Owner Name: UI Test Owner
  - Click Next

Step 2: Location
  - District: Quetta
  - Tehsil: Quetta
  - Mouza: Test Village
  - Click Next

Step 3: Land Details
  - Area: 1500 sqft
  - Land Type: Residential
  - Click Next

Step 4: Upload document
  - Upload any PDF file
  - Click Next

Step 5: GPS & Review
  - Click Submit

PASS if: success message shown with TX hash
FAIL if: error at any step or no TX hash in success message
```

### TEST 13.6 — Dark Mode Toggle
```
1. Click dark mode toggle in navbar
2. Page should switch to dark theme
3. Click again — should switch back to light

PASS if: smooth theme switching, all elements readable in dark mode
FAIL if: toggle broken or elements invisible in dark mode
```

### TEST 13.7 — PDF Certificate Generation
```
1. Login as any officer
2. Go to any Registered land details page
3. Click "Download Certificate" or "Generate PDF"

PASS if: PDF downloads with land details
FAIL if: PDF download fails or blank PDF
```

### TEST 13.8 — About Page
```
Go to: http://localhost:5173/about

PASS if: page loads with all sections visible:
  - Hero banner
  - Mission & Vision cards
  - Department information
  - Technology stack
  - System roles

FAIL if: blank page or 404
```

### TEST 13.9 — Contact Page
```
Go to: http://localhost:5173/contact

1. Fill in the complaint form:
   Name: Test User
   CNIC: 5430199001122
   Phone: 03001234567
   District: Quetta
   Query Type: General Inquiry
   Subject: Test submission
   Message: This is a test complaint message that is more than 50 characters long for validation testing purposes

2. Click Submit

PASS if:
   - Form validates fields correctly
   - Success message shown after submit
   - Reference number generated

FAIL if: form crashes or no success state
```

### TEST 13.10 — Unauthorized Access Redirect
```
1. Go to: http://localhost:5173/dashboard/admin (without login)

PASS if: redirected to login page or unauthorized page
FAIL if: admin dashboard accessible without login
```

### TEST 13.11 — Role-Based Page Protection
```
1. Login as Patwari
2. Manually go to: http://localhost:5173/admin/users

PASS if: redirected to unauthorized page
FAIL if: Patwari can see admin user management
```

### TEST 13.12 — Responsive Design
```
1. Open browser DevTools (F12)
2. Switch to mobile view (375px width)
3. Check all main pages:
   - Landing page
   - Login page
   - Dashboard
   - Land details

PASS if: all pages readable and functional on mobile
FAIL if: content overflows or buttons inaccessible
```

---

## ══════════════════════════════════════════════════
## MODULE 14: END-TO-END WORKFLOW TESTS
## ══════════════════════════════════════════════════

### TEST 14.1 — Complete Registration Workflow
```
This is the MOST IMPORTANT test — runs the full workflow:

STEP 1: Login as Patwari → Register land "E2E-TEST-001"
  Verify: status = Pending in DB + Blockchain

STEP 2: Login as Tehsildar → Verify "E2E-TEST-001"
  Verify: status = Verified in DB + Blockchain

STEP 3: Login as DC → Approve "E2E-TEST-001"
  Verify:
    - status = Registered in DB + Blockchain
    - nftTokenId > 0 in DB
    - NFT exists on blockchain (LandToken.parcelHasToken)
    - TX hash saved in DB

STEP 4: Login as citizen (public search)
  Search CNIC used in registration
  Verify: land appears in results with status=Registered

PASS if: all 4 steps complete successfully with blockchain proof
FAIL if: any step fails or blockchain not updated
```

### TEST 14.2 — Complete Transfer Workflow
```
Using E2E-TEST-001 (Registered from previous test):

STEP 1: Login as Patwari → Initiate transfer
  New owner CNIC: 5430100099988
  New owner name: Transfer Test Owner
  Verify: status = TransferPending

STEP 2: Login as DC → Approve transfer
  Verify:
    - ownerCNIC = 5430100099988 (new CNIC)
    - ownerName = Transfer Test Owner
    - status = Registered
    - ownership history has 2 entries
    - blockchain ownership updated

PASS if: ownership fully transferred with history
FAIL if: ownership not updated
```

### TEST 14.3 — Complete Dispute Workflow
```
STEP 1: Login as Patwari → File dispute on any Registered land
  Verify: land status = Disputed

STEP 2: Login as Tehsildar → Mark Under Review
  Verify: dispute status = UnderReview

STEP 3: Login as DC → Resolve dispute
  Verify:
    - dispute status = Resolved
    - land.isDisputed = false
    - land.status = Registered

PASS if: complete dispute lifecycle works
FAIL if: any step fails
```

### TEST 14.4 — Rejection Workflow
```
STEP 1: Login as Patwari → Register "REJECT-E2E-001"
  Verify: status = Pending

STEP 2: Login as Tehsildar → Reject with reason
  Reason: "Land boundary documents are not verified by the concerned Survey Department"
  Verify: status = Rejected, reason saved

PASS if: rejection with proper reason works
FAIL if: rejection without saving reason
```

---

## ══════════════════════════════════════════════════
## MODULE 15: SECURITY PENETRATION TESTS
## ══════════════════════════════════════════════════

### TEST 15.1 — SQL/NoSQL Injection Attempt
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$gt": ""},
    "password": {"$gt": ""}
  }'
```
```
Expected: 400 status — sanitized, not logged in
PASS if: login fails (injection blocked)
FAIL if: login succeeds — CRITICAL SECURITY BUG
```

### TEST 15.2 — XSS Attempt in Land Registration
```bash
curl -X POST http://localhost:5000/api/land/register \
  -H "Authorization: Bearer $PATWARI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parcelId": "XSS-TEST-001",
    "ownerCNIC": "5430100011199",
    "ownerName": "<script>alert(document.cookie)</script>",
    "district": "Quetta",
    "tehsil": "Quetta",
    "mouza": "Test",
    "areaSqFt": 1000,
    "landType": "residential",
    "primaryDocHash": "QmXSSTest"
  }'
```
```
Expected: script tags sanitized or rejected
PASS if: script tags stripped/escaped in stored data
FAIL if: raw script stored — XSS vulnerability
```

### TEST 15.3 — JWT Token Manipulation
```bash
# Modify JWT payload to claim admin role
FAKE_TOKEN="eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImZha2VpZCIsInJvbGUiOiJhZG1pbiJ9.fakesignature"

curl http://localhost:5000/api/admin/officers \
  -H "Authorization: Bearer $FAKE_TOKEN"
```
```
Expected: 401 status — invalid token signature
PASS if: 401 returned
FAIL if: admin data returned with fake token
```

### TEST 15.4 — Password in Response Check
```bash
# Check that password is NEVER in any response
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blrs.gov.pk","password":"Officer@2024"}' \
  | grep -i "password"
```
```
Expected: NO "password" field in response
PASS if: grep returns nothing
FAIL if: password field visible in response — CRITICAL SECURITY BUG
```

### TEST 15.5 — Rate Limit Headers Present
```bash
curl -I http://localhost:5000/api/land/all \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
```
Expected headers:
  RateLimit-Limit: 100
  RateLimit-Remaining: [number < 100]
PASS if: rate limit headers present
FAIL if: headers missing (rate limiting may not be configured)
```

---

## ══════════════════════════════════════════════════
## MODULE 16: PERFORMANCE TESTS
## ══════════════════════════════════════════════════

### TEST 16.1 — API Response Time
```bash
# Measure response time for key endpoints
time curl http://localhost:5000/api/health
time curl http://localhost:5000/api/land/all \
  -H "Authorization: Bearer $ADMIN_TOKEN"
time curl "http://localhost:5000/api/public/search?cnic=5430199887766"
```
```
PASS if: all responses under 500ms
FAIL if: any response over 2000ms (performance issue)
```

### TEST 16.2 — Concurrent Requests
```bash
# Send 10 concurrent requests
for i in {1..10}; do
  curl http://localhost:5000/api/health &
done
wait
```
```
PASS if: all 10 requests return success
FAIL if: server crashes under concurrent load
```

---

## ══════════════════════════════════════════════════
## FINAL TEST REPORT FORMAT
## ══════════════════════════════════════════════════

After running ALL tests, produce this report:

```
╔══════════════════════════════════════════════════════════════╗
║           BLRS FULL-STACK TEST REPORT                         ║
╠══════════════════════════════════════════════════════════════╣
║  Date:     [today]                                           ║
║  Tester:   AI QA Agent                                       ║
╠══════════════════════════════════════════════════════════════╣
║  MODULE                          PASS    FAIL    SKIP        ║
╠══════════════════════════════════════════════════════════════╣
║  1. Backend Health               [n]     [n]     [n]         ║
║  2. Authentication               [n]     [n]     [n]         ║
║  3. Land Registration            [n]     [n]     [n]         ║
║  4. Land Verification            [n]     [n]     [n]         ║
║  5. Land Approval                [n]     [n]     [n]         ║
║  6. Ownership Transfer           [n]     [n]     [n]         ║
║  7. Dispute Resolution           [n]     [n]     [n]         ║
║  8. Public Search                [n]     [n]     [n]         ║
║  9. Document Upload              [n]     [n]     [n]         ║
║  10. Admin Module                [n]     [n]     [n]         ║
║  11. MongoDB Database            [n]     [n]     [n]         ║
║  12. Blockchain Contracts        [n]     [n]     [n]         ║
║  13. Frontend UI                 [n]     [n]     [n]         ║
║  14. End-to-End Workflows        [n]     [n]     [n]         ║
║  15. Security Tests              [n]     [n]     [n]         ║
║  16. Performance Tests           [n]     [n]     [n]         ║
╠══════════════════════════════════════════════════════════════╣
║  TOTAL                           [n]     [n]     [n]         ║
╠══════════════════════════════════════════════════════════════╣
║  OVERALL STATUS:  [ PASS / FAIL / PARTIAL ]                  ║
╚══════════════════════════════════════════════════════════════╝

CRITICAL FAILURES (must fix before FYP demo):
  ❌ [list any critical failures here]

NON-CRITICAL ISSUES (can fix later):
  ⚠️  [list minor issues here]

RECOMMENDED FIXES:
  1. [specific fix with file name and line]
  2. [specific fix]
  ...
```

---

RUN ALL 80+ TESTS.
Report PASS or FAIL for every single test.
For every FAIL — provide exact error + fix suggestion.
Start testing now.
```
