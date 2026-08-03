# Complete Restaurant POS System Documentation
**Modern Cloud-Based POS Platform for Quick-Service Restaurants**

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Modules](#core-modules)
4. [Getting Started](#getting-started)
5. [API Reference](#api-reference)
6. [Frontend POS App](#frontend-pos-app)
7. [Kitchen Display System](#kitchen-display-system)
8. [Web Dashboard](#web-dashboard)
9. [Offline Mode](#offline-mode)
10. [Payment Integration](#payment-integration)
11. [Database Schema](#database-schema)
12. [Reporting & Analytics](#reporting--analytics)
13. [Deployment Guide](#deployment-guide)
14. [Testing](#testing)
15. [Roadmap](#roadmap)
16. [FAQ](#faq)

---

## Overview

### What This System Does

This restaurant POS system is a cloud-based, offline-capable, multi-tenant platform designed for quick-service and fast-casual restaurants. It handles restaurant operations such as menu management, order taking, kitchen workflows, employee sessions, reporting, and syncing across devices.

### Key Features

| Feature | Description |
|---|---|
| Cloud-Based | Real-time sync, remote management, centralized data |
| Offline-First | Orders continue locally when internet is unavailable |
| Multi-Tenant | One backend supports multiple restaurants securely |
| Payment-Agnostic | Merchants keep their own processor and terminal |
| Kitchen Integration | Real-time kitchen tickets and status updates |
| Web Dashboard | Owners can manage menus, staff, and reports |
| Mobile POS | Tablet-based ordering and checkout flow |

### What This System Does NOT Do

- ❌ Process card payments directly
- ❌ Store raw cardholder data
- ❌ Replace merchant payment processors
- ❌ Act as accounting software
- ❌ Handle full enterprise ERP workflows

---

## Architecture

### High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          YOUR CLOUD (AWS/GCP)                           │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ API Gateway  │  │ Auth Service │  │ WebSocket    │                  │
│  │              │  │              │  │ Server       │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                 │                          │
│         └─────────────────┼─────────────────┘                          │
│                           ▼                                            │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Application Services                         │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐   │    │
│  │  │ Orders │ │ Menu   │ │ Users  │ │ Reports│ │ Sync Queue │   │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│         ┌─────────────────┼─────────────────┐                          │
│         ▼                 ▼                 ▼                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                  │
│  │ PostgreSQL  │   │ Redis       │   │ Object      │                  │
│  │             │   │             │   │ Storage     │                  │
│  └─────────────┘   └─────────────┘   └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                           HTTPS / WebSockets
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                         RESTAURANT LOCATION                             │
│                                                                         │
│  ┌─────────────────────────┐      ┌─────────────────────────┐          │
│  │ Front-of-House Tablet   │      │ Back-of-House Tablet    │          │
│  │ POS App                 │      │ Kitchen Display         │          │
│  └──────────────┬──────────┘      └──────────────┬──────────┘          │
│                 │                                 │                     │
│        Receipt Printer /                          Kitchen Printer /     │
│        Cash Drawer / Barcode                      Expeditor Screen      │
│        Scanner / Payment Terminal                                       │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                  Local Offline Queue (SQLite)                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Technology | Responsibility |
|---|---|---|
| API Gateway | Node.js / Express | Request routing and API access |
| Authentication | JWT + PIN Login | User access and device sessions |
| POS Backend | TypeScript Services | Orders, menus, reports, sync |
| Database | PostgreSQL | Persistent restaurant data |
| Cache / Realtime | Redis + WebSockets | Live updates and session performance |
| Offline Storage | SQLite | Local queue when internet is down |
| POS App | React Native | Front-of-house ordering |
| KDS App | React Native / Tablet UI | Kitchen ticket management |
| Dashboard | React Web | Owner settings and analytics |

---

## Core Modules

| Module | Purpose |
|---|---|
| Authentication | User login, sessions, restaurant isolation |
| Menu Management | Categories, products, modifiers |
| Orders | Cart, checkout, payments, voids, refunds |
| Kitchen | Ticket creation, preparation flow, completion |
| Reporting | Daily sales, shift reports, product performance |
| Employee Management | Roles, sessions, shifts |
| Offline Sync | Queueing and later synchronization |
| Settings | Taxes, terminals, printer setup, restaurant preferences |

---

## Getting Started

### Prerequisites

- Node.js / TypeScript backend environment
- PostgreSQL database
- Redis instance
- React Native environment for POS tablets
- SQLite enabled on POS devices
- Receipt printer and optional kitchen printer
- External payment terminal

### Installation

```bash
# Clone repository
git clone https://github.com/yourcompany/restaurant-pos.git
cd restaurant-pos

# Install backend dependencies
npm install

# Start Postgres and Redis (if using Docker)
docker compose up -d

# Copy environment file for the API
cp .env.example apps/api/.env

# Run database migrations from the API app
cd apps/api
npx prisma migrate dev

# Start backend
npm run dev
```

### Environment Variables

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/restaurant_pos
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret
API_BASE_URL=https://api.yourpos.com/v1
STORAGE_BUCKET=your-pos-assets
WEBSOCKET_URL=wss://api.yourpos.com
```

---

## API Reference

### Base URL

```text
https://api.yourpos.com/v1
```

### Authentication Headers

```text
Authorization: Bearer <jwt_token>
X-Restaurant-ID: <restaurant_uuid>
```

### Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/login | Login with PIN |
| GET | /menu/categories | Get menu categories |
| GET | /menu/products | Get products and modifiers |
| POST | /orders | Create a new order |
| PUT | /orders/{id}/items | Add or update order items |
| POST | /orders/{id}/pay | Mark order as paid |
| POST | /orders/{id}/void | Void order |
| GET | /kitchen/tickets | Get pending kitchen tickets |
| PUT | /kitchen/tickets/{id}/status | Update kitchen status |
| GET | /reports/daily | Get daily sales report |
| POST | /sync/orders | Sync offline orders |

---

## Frontend POS App

### Main Screens

| Screen | Purpose |
|---|---|
| Login Screen | PIN-based staff login |
| Order Screen | Main cart and item selection |
| Menu Screen | Browse categories and products |
| Cart Screen | Review current order |
| Payment Screen | Trigger external terminal / mark cash |
| Kitchen Screen | Optional KDS mode |
| Reports Screen | Shift and sales summary |

### App Structure

```text
src/
├── screens/
├── components/
├── services/
├── store/
└── utils/
```

---

## Kitchen Display System

### Purpose

The KDS receives live order tickets, displays preparation status, and allows kitchen staff to move tickets from pending to preparing to ready.

### Ticket States

| Status | Meaning |
|---|---|
| pending | Newly received by kitchen |
| preparing | Currently being worked on |
| ready | Ready for pickup or service |
| completed | Finished and archived |

---

## Web Dashboard

### Main Sections

| Section | Features |
|---|---|
| Dashboard | Live sales, order count, average ticket |
| Orders | Search, filter, export |
| Menu | Create and edit products/modifiers |
| Employees | Manage staff and PINs |
| Reports | Sales by time and product |
| Settings | Taxes, devices, printers, preferences |

---

## Offline Mode

### How It Works

When internet is unavailable, the POS app stores orders locally in SQLite. Once the connection returns, queued orders are uploaded to the backend and marked as synced.

### Offline Rules

| Item | Behavior |
|---|---|
| Orders | Stored locally until sync |
| Menu | Loaded from most recent cache |
| Kitchen | Can continue over local network if supported |
| Payments | Cash or external terminal workflow only |
| Sync | Automatic retry with backoff |

---

## Payment Integration

### Payment Model

This POS is payment-agnostic. It does not capture or process card data directly. Instead, it sends the payable amount to the merchant’s own external payment terminal and stores only the terminal reference returned after approval.

### Supported Payment Flow

1. POS calculates order total.
2. Cashier selects cash or card.
3. For card, POS sends amount to external terminal.
4. Terminal handles tap/insert/swipe independently.
5. Terminal returns approval status and transaction reference.
6. POS records the sale and prints receipt.

### Supported Methods

| Method | Description |
|---|---|
| Cash | Manual confirmation in POS |
| Card (External Terminal) | Terminal processes payment directly |
| Mixed | Split across cash and card |
| Gift Card | Optional later phase |

---

## Database Schema

### Main Tables

| Table | Purpose |
|---|---|
| restaurants | Tenant records |
| users | Staff accounts and roles |
| categories | Menu categories |
| products | Saleable products |
| modifier_groups | Modifier collections |
| modifiers | Modifier options |
| orders | Order headers |
| order_items | Items inside orders |
| kitchen_tickets | Kitchen workflow entries |
| shifts | Employee work sessions |
| daily_sales_summary | Aggregated reporting |
| sync_queue | Offline sync tracking |

---

## Reporting & Analytics

### Core Reports

| Report | Description |
|---|---|
| Daily Sales | Revenue, orders, payment mix |
| Shift Report | Cashier performance and totals |
| Product Performance | Top-selling items and revenue |
| Payment Breakdown | Cash vs card totals |
| Average Ticket | Average order value |

---

## Deployment Guide

### Deployment Steps

```bash
# Deploy backend
npm run build
npm run start

# Deploy web dashboard
npm run web:build

# Build mobile app
eas build --platform ios
```

### First Restaurant Setup

1. Create restaurant record.
2. Create owner account and PIN.
3. Load menu.
4. Pair receipt printer.
5. Pair external terminal.
6. Test first order and receipt.
7. Verify reporting dashboard.

---

## Testing

### Core Test Areas

| Area | Cases |
|---|---|
| Orders | Create, edit, pay, void |
| Offline | Queue, reconnect, sync |
| Kitchen | New tickets, status changes |
| Reports | Accurate totals and summaries |
| Hardware | Printer, drawer, scanner, terminal |
| Permissions | Cashier vs manager access |

---

## Roadmap

### Planned Phases

| Phase | Focus |
|---|---|
| Phase 1 | MVP ordering, payment trigger, receipts |
| Phase 2 | Kitchen display, offline sync, refunds |
| Phase 3 | Dashboard expansion, loyalty, integrations |
| Phase 4 | Full-service features, multi-location scaling |

---

## FAQ

**Q: Does this POS process payments directly?**  
No. It stays payment-agnostic and relies on the merchant’s own external terminal.

**Q: Can it work offline?**  
Yes. Orders can be stored locally and synced later.

**Q: Is it built for all restaurant types?**  
Phase 1 is best suited for quick-service and fast-casual restaurants.

**Q: Can multiple restaurants use the same platform?**  
Yes. It is designed as a multi-tenant SaaS platform.

**Q: Does it support kitchen screens?**  
Yes. Kitchen tickets can be shown on a dedicated display or printer.

---

*This structure was adapted from the payment module style and reshaped for the restaurant POS system based on the uploaded markdown files.*
