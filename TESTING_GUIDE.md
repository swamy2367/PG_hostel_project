# How to Test: Registration → Login → Room Management

## Issue Fixed
Room types were stored as "Double Sharing" but API was looking for "double". Now fixed to use lowercase: "double", "triple", "four".

## Step-by-Step Testing Guide

### Step 1: Clean Everything

#### A. Clear Browser
1. Open http://localhost:5174
2. Press F12 to open Developer Console
3. Go to Console tab
4. Run these commands:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

#### B. Clean MongoDB Compass
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Select database: `hostel_management`
4. Delete ALL documents from these collections:
   - **admins** collection → Delete all
   - **rooms** collection → Delete all
   - **students** collection → Delete all

### Step 2: Register Admin (First Time Only)

1. Go to http://localhost:5174
2. Click **"Login as Admin"**
3. Click **"Register"** tab
4. Fill the form:
   ```
   Hostel Name: Rajesh Hostel
   Username: admin
   Email: admin@rajesh.com
   Password: admin123
   Confirm Password: admin123
   
   Room Configuration:
   - Double Sharing: 30 rooms, Start from: 201
   - Triple Sharing: 30 rooms, Start from: 301
   - Four Sharing: 40 rooms, Start from: 401
   ```
5. Click **"🚀 Register & Setup"**
6. Wait for success message
7. You'll be redirected to Admin Dashboard

### Step 3: Verify in MongoDB Compass

1. Refresh MongoDB Compass
2. Check **admins** collection:
   - Should have 1 document
   - username: "admin"
   - password: (hashed string starting with $2b$)
   - hostelName: "Rajesh Hostel"
   
3. Check **rooms** collection:
   - Should have **100 documents** (30+30+40)
   - 30 rooms with type: "double" (201-230)
   - 30 rooms with type: "triple" (301-330)
   - 40 rooms with type: "four" (401-440)
   - All should have status: "available"
   - All should have occupants: []

### Step 4: Login (Every Time After Registration)

1. Go to http://localhost:5174/login
2. Enter credentials:
   ```
   Username: admin
   Password: admin123
   ```
3. Click **"Login to Dashboard"**
4. You'll see Admin Dashboard

### Step 5: View Rooms

From Admin Dashboard, click any room type:

#### **Double Sharing Rooms:**
- Click "Double Sharing Rooms" card
- Should show:
  - 30 TOTAL ROOMS
  - 30 AVAILABLE (green)
  - 0 OCCUPIED (red)
  - 0 RESERVED (purple)
- All rooms 201-230 displayed with green borders

#### **Triple Sharing Rooms:**
- Click "Triple Sharing Rooms" card
- Should show:
  - 30 TOTAL ROOMS
  - 30 AVAILABLE
  - 0 OCCUPIED
  - 0 RESERVED
- All rooms 301-330 displayed

#### **Four Sharing Rooms:**
- Click "Four Sharing Rooms" card
- Should show:
  - 40 TOTAL ROOMS
  - 40 AVAILABLE
  - 0 OCCUPIED
  - 0 RESERVED
- All rooms 401-440 displayed

### Step 6: Allocate a Student

1. Click on any room (e.g., Room 201)
2. Modal opens showing room details
3. Fill the **Add New Student** form:
   ```
   Full Name*: Rahul Kumar
   Student ID*: STU001
   Phone*: 9876543210
   Email: rahul@example.com (optional)
   Course: Computer Science (optional)
   Year: 1st Year (optional)
   ```
4. Click **"✓ Allocate Student"**
5. Success message appears
6. Room 201 changes from GREEN to RED border
7. Stats update: 29 Available, 1 Occupied

### Step 7: Verify Student in MongoDB

1. Refresh MongoDB Compass
2. Check **students** collection:
   - Should have 1 document
   - name: "Rahul Kumar"
   - studentId: "STU001"
   - room: 201
   - roomType: "double"
   
3. Check **rooms** collection:
   - Find room with number: 201
   - status: "occupied"
   - occupants: [array with student's ObjectId]

### Step 8: View in Fee Management

1. Go back to Admin Dashboard
2. Click **"Fee Management"**
3. Click **"Double Sharing"** tab
4. You should see:
   - Student: Rahul Kumar (STU001)
   - Room: 201
   - Status: Unpaid (red badge)
   - Monthly Fee: ₹0 (you can set this later)

## Important Notes

### ✅ What Happens During Registration:
1. Admin account created in MongoDB
2. Password hashed with bcrypt
3. **All rooms created automatically** based on your configuration
4. JWT token generated
5. Redirected to dashboard

### ✅ What Happens During Login:
1. Username/password verified
2. JWT token generated
3. Redirected to dashboard
4. **Rooms already exist** from registration
5. No new rooms created

### ✅ Room Persistence:
- Rooms are created **ONCE** during registration
- They persist in MongoDB forever
- Every login shows the same rooms
- Students can be added/removed anytime
- Room status can be changed anytime

### ❌ What NOT to Do:
- Don't register multiple times with same username/email
- Don't manually edit MongoDB documents
- Don't clear localStorage while logged in (will log you out)

## Workflow Summary

```
Registration (One Time):
├── Fill registration form
├── Set room configuration (30+30+40)
├── Click Register
├── Backend creates admin + 100 rooms in MongoDB
└── Auto login to dashboard

Login (Every Time):
├── Enter username + password
├── Backend verifies credentials
├── JWT token generated
└── Dashboard shows existing rooms from MongoDB

Room Allocation (Anytime):
├── Click room type (Double/Triple/Four)
├── See all rooms (fetched from MongoDB)
├── Click a room
├── Add student details
├── Student saved to MongoDB
├── Room status updated
└── Reflects in fee management
```

## Troubleshooting

### Problem: Still seeing 0 rooms after login
**Solution:**
1. Clear localStorage
2. Delete all data from MongoDB
3. Register fresh
4. Check MongoDB Compass - rooms should be there
5. Login again - should see rooms

### Problem: "Network error" on registration
**Solution:**
1. Check backend server is running on port 5000
2. Check MongoDB is running
3. Look at server console for errors

### Problem: Rooms created but not showing
**Solution:**
1. Check browser console for errors
2. Verify JWT token exists: `localStorage.getItem('token')`
3. Check room type matches: should be "double", "triple", "four"
4. Check adminId matches in rooms collection

---

**Everything is now ready! Just follow the steps above to test.** 🎉
