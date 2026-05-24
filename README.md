# GoldLedger — Gold Loan Management System

## Overview

GoldLedger is a full-stack fintech-style Gold Loan Management System designed to simulate real-world gold finance business workflows.

The application manages:

* customers
* loans
* payments
* staff operations
* financial analytics
* PDF receipt generation

The system focuses heavily on backend architecture, authentication, authorization, financial workflows, and business logic implementation.

---


# Features

## Authentication & Authorization

* JWT authentication
* secure login system
* role-based access control
* owner/staff permissions

## Customer Management

* customer search
* customer profiles
* guardian details
* address & contact management
* customer loan history

## Loan Management

* create/manage loans
* monthly interest calculation
* outstanding balance tracking
* active/inactive/closed loan lifecycle
* automatic loan closing when outstanding becomes zero

## Payment System

* payment recording
* payment history tracking
* automatic outstanding updates
* payment receipt generation
* PDF receipt download

## Dashboard Analytics

* total loans analytics
* active loan statistics
* outstanding balance overview
* recent payments
* financial reporting

## PDF Receipts

* loan receipt generation
* payment receipt generation
* downloadable PDF documents

## Calculator

* gold loan calculator
* monthly interest calculation
* simple interest estimation

## Live Application

GoldLedger is fully deployed and production accessible.

Users can:

* create customers
* manage loans
* record payments
* generate receipts
* manage staff accounts
* track outstanding balances

without any local setup.


---

# Application Workflow

## 1. Owner Login

The owner logs into the system using secure JWT authentication.

Owner capabilities:

* manage customers
* create loans
* record payments
* create staff accounts
* view analytics
* manage entire business workflow

---

## 2. Customer Creation

Before creating a loan, customer details are added:

* customer name
* guardian name
* phone number
* address

Each customer maintains a complete loan history.

---

## 3. Loan Creation

Owner or staff creates a loan for the customer.

Loan details include:

* loan amount
* gold weight
* gold item description
* monthly interest rate

System automatically:

* calculates interest
* tracks outstanding balance
* manages loan status

---

## 4. Monthly Interest Workflow

Interest is calculated dynamically based on:

* loan amount
* monthly interest rate
* months passed since issue date

Outstanding balance updates automatically.

---

## 5. Payment Recording

Payments can be recorded against active loans.

System automatically:

* updates total paid
* recalculates outstanding balance
* generates payment history

If outstanding balance becomes zero:

* loan status automatically changes to CLOSED

---

## 6. Receipt Generation

After loan/payment creation:

* PDF receipts can be downloaded
* customer and transaction details are included

---

## 7. Staff Management

Owners can:

* create staff accounts
* assign staff roles
* restrict owner-only actions

Staff users can:

* manage customers
* manage loans
* record payments

But cannot:

* create owners
* access restricted admin operations

---

# Tech Stack

## Backend

* Django
* Django REST Framework
* JWT Authentication
* PostgreSQL

## Frontend

* React
* TypeScript
* TanStack Query
* TanStack Router
* Recharts
* Tailwind CSS
* Vite

---

# Architecture

Frontend communicates with backend through REST APIs.

Backend handles:

* authentication
* authorization
* business logic
* financial calculations
* database operations
* PDF generation

---

# Database Design

Core entities:

* User
* Customer
* Loan
* Payment

Relationships:

Customer → Loans → Payments

---

# Live Demo

## Frontend

```text id="m8k2pv"
https://gold-loan-insight.onrender.com
```

## Backend API

```text id="q5t1zn"
https://gold-application-backend.onrender.com
```

---

# Demo Credentials

## Owner Account

```text id="a3f7xk"
Username: Rai
Password: rai123
```

## Staff Account

```text id="n1v8lr"
Username: remo
Password: remo@2026
```

---

# API Example

```text id="e4p6ws"
GET /api/loans/
POST /api/payments/
POST /api/accounts/login/
```


---

# Installation

## Backend Setup

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs on:

```bash
http://127.0.0.1:8000
```

---

## Frontend Setup

```bash
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# Environment Variables

## Backend

```env
SECRET_KEY=
DEBUG=
DATABASE_URL=
```

## Frontend

```env
VITE_API_BASE_URL=
```

---

# Future Improvements

* Excel export support
* overdue payment alerts
* Docker deployment
* audit logging
* EMI support
* SMS notifications
* multi-branch management

---

# Author

Tarun
Full Stack Developer
