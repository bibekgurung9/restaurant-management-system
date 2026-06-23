# Restaurant Management System (RMS)

A full-stack restaurant operations platform built to manage end-to-end restaurant workflows including orders, reservations, tables, inventory, customers, and reporting.

---

## 🚀 Overview

This project is a complete restaurant management system consisting of:

- 🖥️ Frontend — Admin dashboard built with Next.js
- ⚙️ Backend — REST API built with Node.js + TypeScript

It is designed to simulate real-world restaurant operations with role-based access control and structured business workflows.

---

## 📦 Modules

### Frontend Features
- Menu management
- Order management
- Reservations
- Tables
- Inventory
- Customers
- Transactions
- Reports
- Role-based dashboards

### Backend Features
- Authentication (JWT)
- Role-based access control (SUPER_ADMIN, ADMIN, STAFF, CASHIER)
- CRUD APIs for all modules
- Reservation + order workflows
- Database seeding system
- Cloudinary integration (media storage)

---

## 🏗️ Architecture

```

Frontend (Next.js)
↓ REST API
Backend (Node.js + TypeScript)
↓
Database (PostgreSQL/MySQL)

```

---

## 🔐 Default Users (Seeded)

| Role         | Email                  | Password     |
|--------------|----------------------|--------------|
| Super Admin  | super@admin.com.np   | super123     |
| Admin        | admin@admin.com.np   | admin123     |
| Staff        | staff@admin.com.np   | staff123     |
| Cashier      | cashier@admin.com.np | cashier123   |

---

## 🧪 How to Run

Each service has its own setup:

- `/frontend` → Next.js dashboard
- `/backend` → API server

Refer to their individual README files.

---

## ⚙️ Tech Stack

- Next.js
- Node.js
- TypeScript
- Express / Nest-style architecture
- PostgreSQL/MySQL
- Tailwind CSS

---

## 📌 Purpose

This project was built as a **portfolio demonstration of full-stack system design**, including:

- Scalable architecture
- Role-based access control
- Real-world CRUD workflows
- Production-level deployment setup

---

## 📁 Structure

```

restaurant-management-system/
├── frontend/
├── backend/
└── .github/

```
