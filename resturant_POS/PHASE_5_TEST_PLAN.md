# Phase 5 Authentication Testing Plan

## Overview
This document outlines the testing plan to verify all three user types can login and access their allowed data.

## User Types
1. **Platform Admin** - Super Admin Dashboard access
2. **Restaurant Owner** - Restaurant Owner Dashboard access
3. **Staff** - Mobile POS App access (Cashier/Manager/Kitchen)

## Test Environment
- Backend API: http://localhost:4000/api/v1
- Super Admin Dashboard: http://localhost:5173
- Restaurant Owner Dashboard: http://localhost:5174
- Mobile POS App: Expo development server

## Test Cases

### 1. Platform Admin Authentication

#### 1.1 Login Test
- **Endpoint**: `POST /auth/login-email`
- **Credentials**: Platform admin email and password
- **Expected Result**: 
  - Returns access token and refresh token
  - Token stored in localStorage as 'admin_token'
  - Redirects to dashboard

#### 1.2 Access Verification
- **Test Endpoints**:
  - `GET /platform-admin/restaurants` - Should return all restaurants
  - `GET /platform-admin/analytics` - Should return platform-wide analytics
  - `GET /platform-admin/plans` - Should return all subscription plans
  - `GET /platform-admin/billing` - Should return billing data
  - `GET /platform-admin/audit-logs` - Should return audit logs

#### 1.3 Authorization Test
- **Test**: Access owner-specific endpoints with admin token
- **Expected**: Should fail or return 403 for owner-only endpoints

### 2. Restaurant Owner Authentication

#### 2.1 Login Test
- **Endpoint**: `POST /auth/login-email`
- **Credentials**: Owner email and password
- **Expected Result**:
  - Returns access token and refresh token
  - Token stored in localStorage as 'owner_token'
  - Restaurant ID stored as 'owner_restaurant_id'
  - Redirects to dashboard

#### 2.2 Access Verification
- **Test Endpoints** (with X-Restaurant-ID header):
  - `GET /menu/categories` - Should return restaurant's menu categories
  - `GET /menu/products` - Should return restaurant's products
  - `GET /staff` - Should return restaurant's staff
  - `GET /tables` - Should return restaurant's tables
  - `GET /analytics/sales` - Should return restaurant's sales data
  - `GET /inventory/ingredients` - Should return restaurant's inventory
  - `GET /reservations` - Should return restaurant's reservations
  - `GET /settings/restaurant` - Should return restaurant settings

#### 2.3 Authorization Test
- **Test**: Access platform admin endpoints with owner token
- **Expected**: Should fail with 403 Forbidden

### 3. Staff Authentication

#### 3.1 PIN Login Test
- **Endpoint**: `POST /auth/login`
- **Credentials**: Staff PIN
- **Expected Result**:
  - Returns access token and refresh token
  - Token stored securely using expo-secure-store
  - User role and restaurant ID included in response

#### 3.2 Access Verification by Role

**Cashier Role**:
- Should access: Orders, Tables, Cart, Customers
- Should NOT access: Settings, Staff management, Analytics

**Manager Role**:
- Should access: All Cashier features + Staff management, basic Analytics
- Should NOT access: Platform admin features

**Kitchen Role**:
- Should access: Kitchen display, Order tickets
- Should NOT access: POS, Settings, Analytics

#### 3.3 Mobile App Token Storage
- **Test**: Verify tokens are stored using expo-secure-store
- **Keys**:
  - `access_token`
  - `refresh_token`
  - `user_data`
  - `restaurant_id`

### 4. Token Refresh Test

#### 4.1 Refresh Token Flow
- **Endpoint**: `POST /auth/refresh`
- **Test**: Use refresh token to get new access token
- **Expected**: New access token returned, old token invalidated

### 5. Logout Test

#### 5.1 Token Clearance
- **Test**: Verify tokens are cleared from storage on logout
- **Expected**: 
  - localStorage cleared (web)
  - Secure store cleared (mobile)
  - WebSocket disconnected

### 6. Cross-User Access Prevention

#### 6.1 Owner Accessing Other Restaurants
- **Test**: Owner tries to access data with different restaurant ID
- **Expected**: Should fail with 403 Forbidden

#### 6.2 Staff Accessing Other Restaurants
- **Test**: Staff tries to access data with different restaurant ID
- **Expected**: Should fail with 403 Forbidden

## Test Execution Steps

### Step 1: Start Backend Server
```bash
cd apps/api
npm run dev
```

### Step 2: Start Super Admin Dashboard
```bash
cd apps/super-admin-dashboard
npm run dev
```

### Step 3: Start Restaurant Owner Dashboard
```bash
cd apps/dashboard-web
npm run dev
```

### Step 4: Start Mobile App
```bash
cd apps/pos-mobile
npm start
```

### Step 5: Run Manual Tests
1. Test Platform Admin login and access
2. Test Restaurant Owner login and access
3. Test Staff PIN login and access
4. Test token refresh functionality
5. Test logout functionality
6. Test cross-user access prevention

## Expected Outcomes

### Success Criteria
- ✅ All three user types can successfully login
- ✅ Each user type can access their allowed endpoints
- ✅ Users cannot access endpoints outside their role
- ✅ Token refresh works correctly
- ✅ Logout clears all tokens
- ✅ Cross-user access is prevented

### Known Limitations
- Password reset and email verification require database schema updates (token storage fields)
- Email sending requires transactional email service integration
- Owner invite acceptance requires invite storage table in database

## Database Schema Requirements (for full functionality)

To fully implement password reset and email verification, add these fields to the User model:

```prisma
model User {
  // Existing fields...
  
  // Email verification
  emailVerified          Boolean  @default(false)
  emailVerificationToken String?
  emailVerificationExpiry DateTime?
  
  // Password reset
  passwordResetToken     String?
  passwordResetExpiry    DateTime?
}

// Owner invite table
model OwnerInvite {
  id             String    @id @default(cuid())
  email          String
  restaurantName String
  token          String    @unique
  expiresAt      DateTime
  acceptedAt     DateTime?
  createdAt      DateTime  @default(now())
}
```

## Conclusion

The authentication infrastructure is in place with proper token-based authentication, role-based access control, and secure token storage. The remaining work requires database schema updates to fully enable password reset, email verification, and owner invite functionality.
