## COMPLETE RESTAURANT POS SYSTEM
Modern Cloud-Based | Payment-Agnostic | Pure SaaS
## Table of Contents
1.[Executive Summary]
2.[Core Architecture]
3.[Database Schema]
4.[API Design]
5.[Frontend POS App]
6.[Kitchen Display System]
7.[Web Dashboard]
8.[Offline Mode]
9.[Payment Integration (No-Touch)]
1o.[Phase-by-Phase Roadmap]
11.[Technology Stack]
12.[Development Timeline]
13.[Testing Checklist]
14.[Deployment Guide]
15.[irst Customer Checklist]

# SUMMARY
What We're Building
A cloud-based restaurant POS system where:

Feature	Description
Modern cloud	Real-time sync, remote dashboard, automatic updates
Payment-agnostic	We never touch card data — merchant uses their own processor
Offline-first	Works without internet, syncs when back online
Multi-tenant	One server serves all restaurants
Pure SaaS	Monthly subscription only (no transaction fees)
Target Restaurant Type (Phase 1)
Quick-service & Fast Casual:

Coffee shops

Burger joints

Pizzerias

Food trucks

Sandwich shops

Ice cream parlors

Not Phase 1: Full-service (waiters, table management, course splitting) — add later.

Core Differentiators
vs. Square/Toast	Our Advantage
Forces their payments	Use any processor (lower fees)
Expensive ($100-200+/mo)	Lower subscription ($49-79/mo)
Locked in	Easy to leave (no payment contract)
Complex features	Simpler, focused on QSR
# CORE ARCHITECTURE
High-Level Diagram
```
┌─────────────────────────────────────────────────────────────────────────┐
│                          YOUR CLOUD (AWS/GCP)                           │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   API Gate   │  │   Auth       │  │   WebSocket  │                  │
│  │   (Kong)     │  │   Service    │  │   Server     │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                 │                           │
│         └─────────────────┼─────────────────┘                           │
│                           ▼                                             │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Application Services                         │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐   │    │
│  │  │ Order  │ │ Menu   │ │Employee│ │ Report │ │ Sync/Queue │   │    │
│  │  │ Service│ │ Service│ │ Service│ │ Service│ │ Service    │   │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│         ┌─────────────────┼─────────────────┐                          │
│         ▼                 ▼                 ▼                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                   │
│  │ PostgreSQL  │   │    Redis    │   │     S3      │                   │
│  │ (Primary)   │   │  (Cache +   │   │ (Receipts,  │                   │
│  │             │   │   Sessions) │   │   Logs)     │                   │
│  └─────────────┘   └─────────────┘   └─────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    HTTPS / WebSockets (TLS 1.3)
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                         RESTAURANT LOCATION                             │
│                                                                          │
│  ┌─────────────────────────┐      ┌─────────────────────────┐          │
│  │   FRONT-OF-HOUSE (iPad)  │      │   BACK-OF-HOUSE (iPad)  │          │
│  │   ┌───────────────────┐  │      │   ┌───────────────────┐  │          │
│  │   │   POS App         │  │      │   │ Kitchen Display   │  │          │
│  │   │   (React Native)  │  │      │   │ System (KDS)      │  │          │
│  │   └─────────┬─────────┘  │      │   └─────────┬─────────┘  │          │
│  │             │            │      │             │            │          │
│  │      Connected to:       │      │      Connected to:       │          │
│  │      • Receipt printer   │      │      • Kitchen printer   │          │
│  │      • Cash drawer       │      │      • Expeditor screen  │          │
│  │      • Payment terminal  │      │                         │          │
│  │        (customer's own)  │      │                         │          │
│  │      • Barcode scanner   │      │                         │          │
│  └─────────────────────────┘      └─────────────────────────┘          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │              LOCAL OFFLINE QUEUE (SQLite)                │           │
│  │   Stores up to 500 transactions when internet is down    │           │
│  └─────────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
Key Design Principles
Principle	Implementation
No payment data	POS only sends "amount" to external terminal — never sees card data
Offline-first	Local SQLite database, sync when online
Real-time	WebSockets for kitchen orders, live dashboard
Multi-tenant	Single database, restaurant_id isolation
Idempotent	All operations can be safely retried
# DATABASE SCHEMA
Complete PostgreSQL Schema
```
-- =====================================================
-- CORE TENANT (RESTAURANT)
-- =====================================================

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,  -- for subdomain: burgerjoint.yourpos.com
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    currency VARCHAR(3) DEFAULT 'USD',
    tax_rate DECIMAL(5,4) DEFAULT 0.08,  -- 8% default
    subscription_plan VARCHAR(20) DEFAULT 'basic',  -- basic, pro, enterprise
    subscription_status VARCHAR(20) DEFAULT 'trial',  -- trial, active, past_due, cancelled
    trial_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- USERS & ROLES
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    pin_code VARCHAR(255) NOT NULL,  -- hashed bcrypt
    role VARCHAR(20) DEFAULT 'cashier',  -- cashier, manager, owner
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    jwt_token TEXT,
    device_id VARCHAR(100),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- MENU MANAGEMENT
-- =====================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL,  -- $12.99 = 1299 cents
    sku VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modifier groups (e.g., "Choose your cheese")
CREATE TABLE modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    min_required INTEGER DEFAULT 0,
    max_allowed INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);

-- Modifier options (e.g., "Cheddar", "Swiss")
CREATE TABLE modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    price_cents INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0
);

-- Which modifiers apply to which products
CREATE TABLE product_modifiers (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, modifier_group_id)
);

-- =====================================================
-- ORDERS
-- =====================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),  -- cashier who took order
    order_number INTEGER,  -- sequential per restaurant per day
    order_type VARCHAR(20) DEFAULT 'dine_in',  -- dine_in, takeout, delivery
    status VARCHAR(20) DEFAULT 'open',  -- open, paid, void, refunded
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    tip_cents INTEGER DEFAULT 0,
    total_cents INTEGER NOT NULL DEFAULT 0,
    payment_method VARCHAR(20),  -- cash, card, gift_card, mixed
    external_payment_id TEXT,  -- from their payment terminal (optional)
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP,
    synced_at TIMESTAMP  -- for offline sync tracking
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(100) NOT NULL,  -- snapshot
    unit_price_cents INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,  -- "no pickles"
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    modifier_name VARCHAR(50) NOT NULL,
    modifier_price_cents INTEGER DEFAULT 0
);

-- =====================================================
-- KITCHEN DISPLAY SYSTEM
-- =====================================================

CREATE TABLE kitchen_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    order_item_id UUID REFERENCES order_items(id),  -- per-item or per-order
    course VARCHAR(20) DEFAULT 'main',  -- appetizer, main, dessert
    status VARCHAR(20) DEFAULT 'pending',  -- pending, preparing, ready, completed
    priority INTEGER DEFAULT 0,  -- higher = faster
    sent_to_kitchen_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- =====================================================
-- EMPLOYEE MANAGEMENT
-- =====================================================

CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clock_in_at TIMESTAMP DEFAULT NOW(),
    clock_out_at TIMESTAMP,
    total_sales_cents INTEGER DEFAULT 0,
    cash_drawer_start_cents INTEGER,
    cash_drawer_end_cents INTEGER
);

-- =====================================================
-- REPORTING & ANALYTICS (Aggregated)
-- =====================================================

CREATE TABLE daily_sales_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_sales_cents INTEGER,
    total_orders INTEGER,
    average_ticket_cents INTEGER,
    cash_sales_cents INTEGER,
    card_sales_cents INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(restaurant_id, date)
);

-- =====================================================
-- OFFLINE SYNC TRACKING
-- =====================================================

CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id),
    device_id VARCHAR(100),
    entity_type VARCHAR(50),  -- order, order_item, etc.
    entity_id UUID,
    operation VARCHAR(20),  -- create, update, delete
    payload JSONB,
    retry_count INTEGER DEFAULT 0,
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES (Performance)
-- =====================================================

CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX idx_sync_queue_restaurant_id ON sync_queue(restaurant_id);
CREATE INDEX idx_sync_queue_synced_at ON sync_queue(synced_at);
# API DESIGN
Base URL
```
https://api.yourpos.com/v1
Authentication
```
Header: Authorization: Bearer <jwt_token>
Header: X-Restaurant-ID: <restaurant_uuid>
Endpoints
Authentication
```
POST   /auth/login
Request:
{
    "pin_code": "1234",
    "restaurant_slug": "burgerjoint",
    "device_id": "ipad-001"
}

Response:
{
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": "uuid",
        "name": "Jane",
        "role": "cashier"
    },
    "restaurant": {
        "id": "uuid",
        "name": "Burger Joint",
        "tax_rate": 0.08
    }
}
Menu
```
GET    /menu/categories              # All categories
GET    /menu/products                # All products (with modifiers)
GET    /menu/products?category_id=X  # Filter by category
GET    /menu/sync                    # Full menu with version (for offline cache)

Response (products):
[
    {
        "id": "uuid",
        "name": "Cheeseburger",
        "price_cents": 1299,
        "category": "Burgers",
        "modifiers": [
            {
                "group_id": "uuid",
                "group_name": "Cheese",
                "min": 1,
                "max": 1,
                "options": [
                    {"name": "Cheddar", "price_cents": 0},
                    {"name": "Swiss", "price_cents": 50}
                ]
            }
        ]
    }
]
Orders
```
POST   /orders                       # Create order (open)
Request:
{
    "order_type": "dine_in",
    "user_id": "uuid",
    "items": [
        {
            "product_id": "uuid",
            "quantity": 2,
            "notes": "no pickles",
            "modifiers": [
                {"name": "Cheddar", "price_cents": 0}
            ]
        }
    ]
}

Response:
{
    "order_id": "uuid",
    "order_number": 42,
    "subtotal_cents": 2598,
    "tax_cents": 208,
    "total_cents": 2806
}

PUT    /orders/:id/items             # Add/update items
POST   /orders/:id/pay               # Mark as paid (after external payment)
Request:
{
    "payment_method": "card",
    "external_payment_id": "ref_xyz123",  # from their terminal
    "tip_cents": 500
}

Response:
{
    "status": "paid",
    "total_cents": 3306
}

GET    /orders/:id                   # Get order details
GET    /orders?status=open           # List open orders
POST   /orders/:id/void              # Void order (manager only)
Kitchen
```
GET    /kitchen/tickets?status=pending
Response:
[
    {
        "id": "uuid",
        "order_id": "uuid",
        "order_number": 42,
        "items": [
            {"name": "Cheeseburger", "quantity": 2, "notes": "no pickles"}
        ],
        "sent_at": "2025-03-30T14:32:10Z"
    }
]

PUT    /kitchen/tickets/:id/status
Request:
{
    "status": "completed"  # or preparing, ready
}
Reporting
```
GET    /reports/daily?date=2025-03-30
Response:
{
    "total_sales": 124500,  # cents
    "total_orders": 48,
    "average_ticket": 2593,
    "by_payment_type": {
        "cash": 45000,
        "card": 79500
    },
    "top_products": [
        {"name": "Cheeseburger", "quantity": 32, "revenue": 41568}
    ]
}

GET    /reports/shift
Response:
{
    "user_id": "uuid",
    "clock_in": "2025-03-30T08:00:00Z",
    "sales": 24500,
    "transactions": 12
}
Sync (Offline)
```
POST   /sync/orders                  # Batch upload offline orders
Request:
{
    "device_id": "ipad-001",
    "orders": [
        {
            "local_id": "offline_001",
            "order_number": 43,
            "items": [...],
            "total_cents": 2806,
            "created_at": "2025-03-30T14:32:10Z"
        }
    ]
}

Response:
{
    "synced": ["offline_001"],
    "conflicts": []
}

GET    /sync/menu?version=20250330   # Get menu updates since version
# FRONTEND POS APP
Technology
Layer	Choice	Why
Framework	React Native	iOS + Android from one codebase
State Management	Zustand	Lightweight, simple
Local DB	SQLite (via react-native-sqlite-storage)	Offline storage
HTTP Client	Axios	Retry logic, interceptors
Real-time	WebSockets (Socket.io)	Kitchen orders
Printing	react-native-esc-pos	ESC/POS protocol
Barcode	react-native-camera	Scan barcodes
Bluetooth	react-native-bluetooth-escpos-printer	Printer connection
App Structure
```
src/
├── App.tsx                    # Main entry
├── screens/
│   ├── LoginScreen.tsx        # PIN entry
│   ├── OrderScreen.tsx        # Main POS (cart + menu)
│   ├── MenuScreen.tsx         # Product selection
│   ├── CartScreen.tsx         # Review order
│   ├── PaymentScreen.tsx      # Trigger external terminal
│   ├── KitchenScreen.tsx      # KDS view (separate mode)
│   └── ReportsScreen.tsx      # Shift summary
├── components/
│   ├── ProductButton.tsx
│   ├── ModifierPicker.tsx
│   ├── CartItem.tsx
│   ├── NumericKeypad.tsx
│   └── ReceiptPrinter.ts
├── services/
│   ├── api.ts                 # API calls
│   ├── websocket.ts           # Real-time orders
│   ├── printer.ts             # ESC/POS printing
│   ├── payment.ts             # Trigger external terminal
│   ├── sync.ts                # Offline sync queue
│   └── storage.ts             # SQLite wrapper
├── store/
│   ├── cartStore.ts           # Zustand cart state
│   ├── orderStore.ts
│   └── syncStore.ts
└── utils/
    ├── constants.ts
    ├── helpers.ts
    └── config.ts              # API base URL
Key Code Snippets
Payment Trigger (No Payment Data)
```
// services/payment.ts
// IMPORTANT: We never see card data. Just tell external terminal to charge.

import { BleManager } from 'react-native-ble-manager';

class PaymentService {
  async chargeAmount(amountCents: number, terminalId: string): Promise<PaymentResult> {
    // Connect to merchant's external payment terminal (Ingenico/Verifone/Stripe Terminal)
    // This is just a trigger — the terminal handles card data directly with processor
    
    const terminal = await this.connectToTerminal(terminalId);
    
    // Send amount to terminal (terminal talks to processor directly)
    const result = await terminal.charge({
      amount: amountCents / 100,  // Convert cents to dollars
      currency: 'USD'
    });
    
    // Terminal returns only: approved/declined + transaction_id
    // We NEVER see the card number, CVV, or track data
    return {
      approved: result.approved,
      transactionId: result.transaction_id,
      last4: result.last4,  // Optional, if terminal provides it
      message: result.message
    };
  }
  
  async connectToTerminal(terminalId: string) {
    // Bluetooth or USB connection to external terminal
    // Implementation depends on terminal brand
  }
}
Offline Sync Queue
```
// services/sync.ts
import SQLite from 'react-native-sqlite-storage';

class SyncService {
  async queueOrder(order: OfflineOrder): Promise<void> {
    const db = await SQLite.open({ name: 'pos.db' });
    
    await db.executeSql(`
      INSERT INTO sync_queue (
        id, restaurant_id, entity_type, entity_id, payload, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      order.local_id,
      order.restaurant_id,
      'order',
      order.local_id,
      JSON.stringify(order),
      Date.now()
    ]);
  }
  
  async syncAll(): Promise<void> {
    const db = await SQLite.open({ name: 'pos.db' });
    const results = await db.executeSql(`
      SELECT * FROM sync_queue WHERE synced_at IS NULL
    `);
    
    for (const row of results.rows.raw()) {
      try {
        await api.post('/sync/orders', {
          device_id: deviceId,
          orders: [JSON.parse(row.payload)]
        });
        
        // Mark as synced
        await db.executeSql(`
          UPDATE sync_queue SET synced_at = ? WHERE id = ?
        `, [Date.now(), row.id]);
      } catch (error) {
        console.log('Sync failed, will retry', error);
        // Exponential backoff handled by retry_count
      }
    }
  }
}
KITCHEN DISPLAY SYSTEM (KDS)
Purpose
Show pending orders to kitchen staff, mark items as complete.

Two Modes
Mode	Device	Use case
Printer mode	Thermal printer	Small kitchens, simple orders
Screen mode	iPad/Android tablet	Busy kitchens, need visibility
KDS App Features
```
┌─────────────────────────────────────────────────────────────┐
│  KITCHEN DISPLAY                    [Burger Joint]  14:32   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   ORDER #42         │  │   ORDER #43         │          │
│  │   [PENDING]         │  │   [PREPARING]       │          │
│  │   Sent: 14:30       │  │   Sent: 14:32       │          │
│  │                     │  │                     │          │
│  │   2x Cheeseburger   │  │   1x Veggie Burger  │          │
│  │      - no pickles   │  │   2x Fries          │          │
│  │   1x Fries          │  │                     │          │
│  │                     │  │  [START] [COMPLETE] │          │
│  │  [START] [COMPLETE] │  │                     │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                              │
│  ┌─────────────────────┐                                    │
│  │   ORDER #44         │                                    │
│  │   [READY]           │                                    │
│  │   3x Milkshake      │                                    │
│  │                     │                                    │
│  │  [COMPLETE]         │                                    │
│  └─────────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
WebSocket Events
```
// Kitchen listens to these events
socket.on('new_order', (order) => {
  addToPendingOrders(order);
  printKitchenTicket(order);  // if printer connected
  playSound();
});

socket.on('order_updated', (orderId, status) => {
  updateOrderStatus(orderId, status);
});

// POS sends to kitchen
socket.emit('send_to_kitchen', {
  order_id: 'uuid',
  items: [...]
});
# WEB DASHBOARD
For Restaurant Owners
Built with React (web). Accessible at https://burgerjoint.yourpos.com

Screens
Screen	Features
Dashboard	Today's sales, orders, average ticket (real-time)
Orders	All orders, filter by date, export CSV
Menu	Add/edit products, categories, modifiers
Employees	Add/remove cashiers, reset PINs, view shifts
Reports	Sales by day/week/month, product performance
Settings	Tax rate, receipt template, printer config
Sample Report
```
┌─────────────────────────────────────────────────────────┐
│  DAILY SALES REPORT - March 30, 2025                    │
├─────────────────────────────────────────────────────────┤
│  Total Sales:    $1,245.00                              │
│  Total Orders:   48                                     │
│  Average Ticket: $25.94                                 │
│                                                         │
│  By Payment:                                            │
│    Cash:         $450.00  (36%)                         │
│    Card:         $795.00  (64%)                         │
│                                                         │
│  Top Products:                                          │
│    1. Cheeseburger    32 sold   $415.68                 │
│    2. Fries           28 sold   $111.72                 │
│    3. Milkshake       15 sold   $89.85                  │
│                                                         │
│  Employee Performance:                                  │
│    Jane (10am-6pm):   24 orders   $620.00               │
│    John (12pm-8pm):   24 orders   $625.00               │
└─────────────────────────────────────────────────────────┘
# OFFLINE MODE
How It Works
```
┌─────────────────────────────────────────────────────────┐
│                    NORMAL MODE (Online)                  │
│                                                          │
│  POS App ──► API ──► Cloud DB ──► KDS (WebSocket)       │
│                                                          │
│  Every order saved to cloud immediately                 │
└─────────────────────────────────────────────────────────┘

                          ⬇ Internet dies ⬇

┌─────────────────────────────────────────────────────────┐
│                    OFFLINE MODE                          │
│                                                          │
│  POS App ──► Local SQLite (queue)                       │
│                │                                         │
│                └── Orders saved locally                 │
│                └── Menu from local cache                │
│                                                          │
│  KDS: Kitchen printer still works (local network)       │
│  Payments: Cash only (or external terminal works)       │
└─────────────────────────────────────────────────────────┘

                          ⬇ Internet returns ⬇

┌─────────────────────────────────────────────────────────┐
│                    SYNC MODE                             │
│                                                          │
│  POS App ──► Upload queued orders to API                │
│                │                                         │
│                └── Cloud checks for duplicates          │
│                └── Orders appear in reports             │
└─────────────────────────────────────────────────────────┘
Offline Data Limits
Item	Limit
Offline orders stored	500 max
Menu cache version	Latest 7 days
Sync retry	Exponential backoff (1s, 2s, 4s, 8s... up to 1 hour)
Local DB encryption	SQLite encryption enabled
PAYMENT INTEGRATION (NO-TOUCH)
This is your differentiator
We never process payments. The merchant brings their own:

Processor	How POS talks to it
Stripe Terminal	Stripe SDK in POS app
Square Terminal	Square API (read-only, just trigger)
Ingenico/Verifone	Bluetooth serial command
Clover	Clover SDK
Any processor	Manual entry: "Cash" or "Card (external)"
Workflow
```
1. POS calculates total: $32.37
2. Cashier taps "Charge Card" button
3. POS app sends amount to external terminal (via Bluetooth/USB)
4. External terminal handles card swipe/tap
5. Terminal communicates directly with processor
6. Terminal returns "Approved" + transaction_id
7. POS records sale with external_payment_id
8. Receipt prints
POS Payment Screen Code
```
// PaymentScreen.tsx
const handleCardPayment = async () => {
  const { total_cents } = cartStore.getState();
  
  // Tell external terminal to charge
  const result = await PaymentService.chargeAmount(total_cents, connectedTerminalId);
  
  if (result.approved) {
    // Save order with external payment ID
    await api.post(`/orders/${orderId}/pay`, {
      payment_method: 'card',
      external_payment_id: result.transactionId,
      last4: result.last4
    });
    
    // Print receipt
    await PrinterService.printReceipt(orderId);
    
    // Close order
    navigation.navigate('OrderComplete');
  } else {
    alert(`Payment declined: ${result.message}`);
  }
};
# PHASE-BY-PHASE ROADMAP
Phase 1: MVP (Months 1-3)
Goal: A restaurant can take orders, take payment, print receipt.

Week	Tasks
1-2	Setup cloud: PostgreSQL, API boilerplate, auth
3-4	POS app: Login screen, menu display, cart
5-6	POS app: Add to cart, modifiers, calculate total
7-8	Payment: Trigger external terminal (simulator first)
9-10	Printing: Receipt printer integration
11-12	Basic reporting, deploy to TestFlight, 5 beta restaurants
Deliverable: Working POS for coffee shop

Phase 2: Core Features (Months 4-6)
Week	Tasks
13-14	Kitchen Display System (screen + printer)
15-16	Offline mode (SQLite + sync queue)
17-18	Tipping, discounts, refunds
19-20	Employee clock-in/out, shift reports
21-22	Web dashboard (owner view)
23-24	20 beta restaurants, iterate
Deliverable: Full QSR feature set

Phase 3: Growth (Months 7-9)
Week	Tasks
25-26	Multi-location support
27-28	Advanced reporting (COGS, labor)
29-30	Online ordering integration
31-32	Loyalty program (basic)
33-34	API for third-party devs
35-36	Public launch, first paying customers
Deliverable: Production-ready, 50+ restaurants

Phase 4: Scale (Months 10-12)
Week	Tasks
37-38	Delivery integrations (DoorDash, Uber Eats)
39-40	Advanced inventory (supplier orders)
41-42	Customer marketing tools (SMS/Email)
43-44	Full-service restaurant features (tables, courses)
45-46	App marketplace
47-48	200+ restaurants, profitable
# TECHNOLOGY STACK
Backend
Component	Choice	Alternative
Language	Node.js (TypeScript)	Python (FastAPI), Go
Framework	Express.js	Fastify, NestJS
Database	PostgreSQL (Supabase/Neon)	AWS RDS
Cache	Redis (Upstash)	Memory cache
Real-time	Socket.io	WebSockets
File storage	S3 / R2	Cloudinary
Hosting	Fly.io / Railway	AWS ECS, Render
API Gateway	None (start simple)	Kong, AWS API Gateway
Frontend (POS)
Component	Choice
Framework	React Native (Expo or bare)
State	Zustand
Local DB	SQLite + react-native-sqlite-storage
Navigation	React Navigation
HTTP	Axios
Real-time	Socket.io-client
Printing	react-native-esc-pos
Barcode	react-native-camera
Bluetooth	react-native-bluetooth-escpos-printer
Web Dashboard
Component	Choice
Framework	React (Vite)
UI Library	shadcn/ui or Tailwind
Charts	Recharts
State	Zustand
HTTP	React Query + Axios
DevOps
Component	Choice
CI/CD	GitHub Actions
Hosting (API)	Fly.io
Hosting (DB)	Supabase
Hosting (Web)	Vercel
Monitoring	Sentry + LogRocket
Analytics	PostHog (self-host or cloud)
DEVELOPMENT TIMELINE (DETAILED)
Month 1: Foundation
```
Week 1:
- Set up GitHub repo
- Initialize PostgreSQL (Supabase)
- Create database schema
- Set up API boilerplate (Express + TypeScript)

Week 2:
- Auth: JWT, login with PIN
- Restaurant CRUD
- User CRUD

Week 3:
- Menu API (products, categories, modifiers)
- Basic API tests

Week 4:
- React Native app init (Expo)
- Login screen
- API integration (axios)
Month 2: Core POS
```
Week 5:
- Menu screen (fetch from API)
- Product buttons grid
- Category filter

Week 6:
- Cart screen
- Add/remove items
- Modifier picker (basic)

Week 7:
- Order summary
- Tax calculation
- Total display

Week 8:
- Payment trigger (simulator)
- Receipt printing (mock)
- Save order to API
Month 3: MVP Completion
```
Week 9:
- Receipt printing (real hardware)
- External terminal integration (Ingenico SDK)

Week 10:
- Basic reporting (daily sales)
- Employee shift tracking
- Offline queue (SQLite)

Week 11:
- Beta testing with 2 restaurants
- Bug fixes
- Performance optimization

Week 12:
- Deploy to TestFlight
- 5 beta restaurants
- Documentation
# TESTING CHECKLIST
Hardware Testing
Device	Tested?	Notes
iPad (various models)	☐	iOS 15+
Android tablet	☐	Optional
Epson TM-m30 printer	☐	Bluetooth + USB
Star TSP654 printer	☐	Bluetooth
Cash drawer (RJ11)	☐	Opens via printer
Ingenico Lane/5000	☐	Payment trigger
Verifone e285	☐	Payment trigger
Barcode scanner	☐	USB/Bluetooth
Offline Testing
Scenario	Tested?
No internet, take 10 orders	☐
Sync after internet returns	☐
Duplicate order prevention	☐
Printer works offline	☐
App crash during offline order	☐
Edge Cases
Scenario	Tested?
Void order after payment	☐
Refund partial order	☐
Split payment (cash + card)	☐
Modifier with price	☐
Tax on modifiers	☐
Discount on specific items	☐
Employee clock out mid-shift	☐
# DEPLOYMENT GUIDE
Step 1: Cloud Setup (Day 1)
bash
# 1. Create Supabase project (free tier)
# 2. Run schema.sql in Supabase SQL editor
# 3. Get database URL and API keys

# 4. Set up Fly.io (or Railway)
fly launch --name pos-api
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set JWT_SECRET="your-secret"

# 5. Deploy API
fly deploy
Step 2: POS App Setup
bash
# 1. Create Expo project
npx create-expo-app pos-app --template blank-typescript

# 2. Install dependencies
npm install axios zustand react-native-sqlite-storage socket.io-client

# 3. Configure API base URL in config.ts
export const API_URL = "https://pos-api.fly.dev/v1"

# 4. Build for iOS
eas build --platform ios

# 5. Distribute via TestFlight
Step 3: First Restaurant Onboarding
bash
# 1. Create restaurant in database
INSERT INTO restaurants (name, slug, email) 
VALUES ('Burger Joint', 'burgerjoint', 'owner@burgerjoint.com');

# 2. Create first user (owner)
INSERT INTO users (restaurant_id, name, pin_code, role) 
VALUES (restaurant_uuid, 'Owner', bcrypt_hash('1234'), 'owner');

# 3. Add sample menu (SQL or via API)

# 4. Send TestFlight invite to owner's iPad

# 5. Guide owner through printer + terminal pairing
# FIRST CUSTOMER CHECKLIST
Before First Customer Signs Up
API deployed and stable

POS app on TestFlight

Receipt printing works

Payment trigger works with at least one terminal type

Offline mode tested

Web dashboard basic reports work

Support email (support@yourpos.com) set up

Stripe Connect (for subscription billing) set up

First Customer Onboarding Call
```
1. Welcome and introduction (5 min)
2. Create account and login (5 min)
3. Add menu items (15 min)
4. Pair printer (10 min)
5. Pair payment terminal (10 min)
6. Test first transaction (5 min)
7. Show basic reporting (5 min)
8. Q&A (5 min)
Week 1 After Launch
Daily check-in with customer

Fix any bugs immediately

Log feature requests

Get testimonial

Success Metrics for First 10 Customers
Metric	Target
Daily orders per restaurant	20+
Uptime	99.5%
Support response time	< 2 hours
Offline sync success rate	99%
Customer satisfaction	4.5/5
SUMMARY: WHAT YOU'RE BUILDING
Aspect	Your Answer
Product	Cloud restaurant POS
Target	Quick-service restaurants
Payment model	Merchant brings own processor (you never touch card data)
Revenue	Monthly subscription ($49-129/terminal)
Architecture	React Native POS + Node.js API + PostgreSQL + Redis
Offline	Yes (SQLite local queue)
Real-time	WebSockets for kitchen
Timeline	3 months to MVP, 6 months to full features
First milestone	5 beta restaurants (Month 3)
Break-even	50-100 customers ($5k-10k MRR)
NEXT ACTIONS (TODAY)
Priority	Action
1	Set up Supabase (free) and run the schema
2	Build the first API endpoint: GET /menu/products
3	Initialize React Native app and fetch products
4	Buy an Epson TM-m30 printer ($200) and pair with iPad
5	Find one restaurant owner willing to test