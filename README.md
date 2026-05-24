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

The system focuses heavily on backend architecture, business logic implementation, authentication, and financial workflows.

---

# Features

## Authentication & Authorization

* JWT authentication
* role-based access control
* owner/staff permissions

## Customer Management

* customer search
* customer profiles
* guardian details
* customer history

## Loan Management

* create/manage loans
* monthly interest calculation
* outstanding balance tracking
* loan lifecycle management
* deactivate/close loans

## Payment System

* payment recording
* payment history
* outstanding updates
* payment receipts

## Dashboard Analytics

* financial statistics
* charts and analytics
* recent loans/payments
* business reporting

## PDF Receipts

* loan receipt generation
* payment receipt generation

## Calculator

* gold loan calculator
* simple & compound interest calculations

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
* Recharts
* Tailwind CSS

---

# Architecture

Frontend communicates with backend through REST APIs.

Backend handles:

* authentication
* business logic
* financial calculations
* permissions
* database operations

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

# Screenshots

(Add screenshots here)

---

# Installation

## Backend

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Frontend

```bash
npm install
npm run dev
```

---

# Environment Variables

```env
SECRET_KEY=
DATABASE_URL=
DEBUG=
VITE_API_BASE_URL=
```

---

# Future Improvements

* Excel exports
* Overdue alerts
* Docker deployment
* Audit logs

---

# Author

Your Name
