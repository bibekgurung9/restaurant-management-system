
## Introduction

The backend of the Restaurant Management System is a **Node.js + TypeScript REST API** that powers all restaurant operations.

It handles authentication, role-based access control, and all core business logic.

---

## Features

- Authentication (JWT-based)
- Role-based access control (SUPER_ADMIN, ADMIN, STAFF, CASHIER)
- Menu management APIs
- Order processing system
- Reservation management
- Table management
- Inventory system
- Customer management
- Transaction handling
- Database seeding system
- Cloudinary integration

---

## Tech Stack

- Node.js
- TypeScript
- Express (or custom structure)
- Prisma / ORM (if used)
- JWT Authentication
- Cloudinary

---

## Installation

### 1. Install dependencies

```bash
pnpm install
````

---

### 2. Environment setup

```bash
cp .env.example .env
```

Configure:

* Database connection
* JWT secrets (admin + store)
* Cloudinary credentials

---

### 3. Run in development

```bash
pnpm run dev
```

---

### 4. Build & run production

```bash
pnpm run build
node dist/app.js
```

---

## Database Seeding

To create default users:

```bash
pnpm run seed:admin
```

---

## Default Users

| Role        | Email                                               | Password   |
| ----------- | --------------------------------------------------- | ---------- |
| Super Admin | [super@admin.com.np](mailto:super@admin.com.np)     | super123   |
| Admin       | [admin@admin.com.np](mailto:admin@admin.com.np)     | admin123   |
| Staff       | [staff@admin.com.np](mailto:staff@admin.com.np)     | staff123   |
| Cashier     | [cashier@admin.com.np](mailto:cashier@admin.com.np) | cashier123 |

---

## System Design

* Modular route structure
* Service-based business logic
* Centralized middleware (auth, roles)
* Clean separation of concerns

---

## Notes

* All requests are authenticated via JWT
* Role middleware protects all admin routes
* Seeder should be run only once in production setup