
## Introduction

The frontend of the Restaurant Management System is built with **Next.js**, **TypeScript**, and **Tailwind CSS**.

It provides a full-featured admin dashboard for managing restaurant operations including:

- Orders
- Reservations
- Tables
- Menu management
- Inventory
- Customers
- Transactions
- Reports

The system is role-based and adapts UI based on user permissions.

---

## Features

### Core Modules
- Menu management
- Order management system
- Reservation system
- Table management
- Inventory tracking
- Customer management
- Transactions & payments
- Reporting dashboard

### System Features
- Role-based access control (RBAC)
- Server-side rendering (SSR)
- API abstraction layer (`src/lib/requests`)
- Modular component architecture
- Revalidation-based updates

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

---

## Getting Started

### Prerequisites
- Node.js >= 18
- pnpm (recommended)

---

### Installation

```bash
pnpm install
````

---

### Environment Setup

```bash
cp .env.example .env.local
```

---

### Run Development Server

```bash
pnpm dev
```

App runs at:

```
http://localhost:3000
```

---

## Project Structure

```
src/
├── app/
├── components/
├── config/
├── lib/
├── typings/
├── utils/
```

---

## Data Handling

All API requests are handled via:

```
src/lib/requests
```

This ensures:

* Centralized API logic
* Consistent error handling
* Revalidation support

---

## Notes

* Avoid direct fetch calls
* Use request layer only
* Prefer server components for data fetching