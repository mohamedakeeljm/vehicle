# VehicleGuard LK – Smart Vehicle Document Expiry Reminder System 🇱🇰

VehicleGuard LK is a modern, production-ready, mobile-responsive web application designed for Sri Lankan vehicle owners to manage document compliance, vehicle records, and receive automated notifications **15 days, 7 days, 3 days, 1 day before expiry, and on the expiry date**.

---

## 🌟 Key Features

1. **User Authentication & Role-Based Access Control (RBAC)**
   - Registration with Sri Lankan mobile validation (`+94` format)
   - Secure password hashing using `bcryptjs`
   - JWT session management with auto-expiry
   - Password reset via secure tokens and email dispatch
   - Role separation between **Vehicle Owners** and **Administrators**

2. **Vehicle Management (Garage)**
   - Full CRUD: Add, edit, view, and delete vehicles
   - Sri Lankan province categorization (Western, Central, Southern, etc.)
   - Vehicle categories (Car, Motorcycle, Van, Three-Wheeler, Bus, Lorry, SUV, etc.)
   - Vehicle photo uploads (PNG, JPG, WEBP)
   - Unique constraints preventing duplicate license plates within the same user account

3. **Vehicle Document Management**
   - **Revenue License**: License number, issue date, expiry date, upload, renewal status
   - **Vehicle Insurance**: Insurer (SLIC, Ceylinco, etc.), policy number, comprehensive/third-party, dates, upload
   - **Vehicle Emission Test (VET)**: DriveGreen, Laughs Eco, certificate number, test dates
   - **Other / Custom Documents**: Fitness certificate, passenger route permits, speed governor certifications
   - **Renew Document Flow**: Save new expiry dates while strictly preserving the entire historical audit trail with transaction cost, receipt number, and remarks
   - **Secure Certificate Downloads**: Enforces authentication and ownership checks before serving files

4. **Automated Expiry Reminder System**
   - Daily background scheduling in Sri Lanka Standard Time (`Asia/Colombo`)
   - Default reminder milestones: **15 days, 7 days, 3 days, 1 day, and on expiry date**
   - Overdue document alerts for expired records
   - Multi-channel delivery: **In-App notifications** and **Nodemailer email notifications**
   - **Duplicate Delivery Prevention**: Records sent status per (document, channel, milestone, expiry date) so users are never spammed twice
   - Immediate renewal cancellation of outdated reminders
   - Failure retry tracking & execution metrics logged to `scheduled_job_runs`

5. **Analytical User & Admin Dashboards**
   - KPI counters: Total Vehicles, Active Documents, Expiring Within 15 Days, Expired Documents
   - Visual compliance status pie chart (Recharts)
   - Priority expiry alerts table
   - Document Expiry Calendar mapped to Sri Lankan dates
   - **Admin Console**: Live system statistics, background scheduler manual trigger, user account audits, delivery logs, and expiring documents monitor

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React Icons, Recharts
- **Backend**: Node.js, Express.js, REST API, JWT, bcryptjs, Multer, Helmet, Morgan, Express Rate Limit
- **Database**: PostgreSQL (with Prisma ORM), SQLite portability layer for local plug-and-play development
- **Scheduler**: node-cron running in `Asia/Colombo` timezone
- **Emails**: Nodemailer with Ethereal development mail preview and SMTP production support

---

## 🚀 Quick Start & Local Installation

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Backend Setup
```bash
cd backend
npm install

# Copy environment template
cp .env.example .env

# Generate Prisma Client & Migrate Schema
npx prisma generate
npx prisma db push

# Seed Sample Sri Lankan Vehicles and Demo Accounts
node prisma/seed.js

# Start backend server
npm run dev
# Server will run on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start Vite development server
npm run dev
# App will run on http://localhost:5173
```

---

## 🔑 Demo Accounts

The database comes pre-seeded with test accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Vehicle Owner** | `kasun.perera@example.lk` | `Password@123` | Has 3 vehicles (Car, Motorcycle, Tuk) with documents expiring at 15d, 7d, 1d, and overdue |
| **Administrator** | `admin@vehicleguard.lk` | `Admin@12345` | Access to Admin Console, Scheduler Controls & Delivery Logs |

---

## 🧪 Running Automated Tests

Run the full automated test suite covering date calculations, 15-day reminders, scheduler duplicate prevention, vehicle CRUD, and renewal audit history:

```bash
cd backend
npm test
```
All 13 automated test suites will execute and assert compliance.

---

## 📄 License
ISC © VehicleGuard LK Team
