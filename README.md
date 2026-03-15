# Clean Drive 🚗

A full-stack fleet management platform for **Admins**, **Fleet Owners**, and **Drivers**.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (role-based) |
| File import | xlsx |

---

## Project Structure
```
clean-drive/
├── backend/
│   ├── prisma/schema.prisma       ← Full DB schema
│   ├── src/
│   │   ├── index.ts               ← Express server entry
│   │   ├── lib/prisma.ts          ← Prisma client
│   │   ├── middleware/auth.ts     ← JWT + role guards
│   │   └── routes/
│   │       ├── auth.ts            ← /api/auth
│   │       ├── admin.ts           ← /api/admin
│   │       ├── fleet.ts           ← /api/fleet
│   │       ├── shifts.ts          ← /api/shifts
│   │       └── drivers.ts         ← /api/drivers
└── frontend/
    └── src/
        ├── App.tsx                ← Route definitions
        ├── hooks/useAuth.tsx      ← Auth context
        ├── lib/api.ts             ← Axios client
        ├── components/            ← Sidebar, StatCard, ProtectedRoute
        └── pages/
            ├── auth/              ← Login
            ├── admin/             ← Admin portal (3 pages)
            ├── fleet/             ← Fleet portal (5 pages)
            └── driver/            ← Driver portal (3 pages)
```

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL (or Docker)

### 1. Clone and install
```bash
git clone https://github.com/VivekShiggs/clean-drive.git
cd clean-drive
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env → set DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run dev
```

### 3. Frontend setup (new terminal)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend → http://localhost:5173
Backend  → http://localhost:4000/health

---

## User Roles & Portals

| Role | Route | Key features |
|------|-------|-------------|
| `SUPER_ADMIN` | `/admin` | Platform stats, all fleets, all drivers |
| `FLEET_OWNER` | `/fleet` | Drivers, vehicles, .xlsx bulk upload, earnings, payslips |
| `DRIVER` | `/driver` | Start/end shift, KM input, today's earnings, shift history |

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create user |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Current user |

### Admin (SUPER_ADMIN only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Platform overview |
| GET | `/api/admin/fleets` | All fleets |
| GET | `/api/admin/drivers` | All drivers |

### Fleet (FLEET_OWNER only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/fleet/stats` | Fleet overview |
| GET | `/api/fleet/drivers` | Fleet drivers + earnings |
| GET | `/api/fleet/vehicles` | Fleet vehicles |
| POST | `/api/fleet/upload` | Bulk .xlsx import |
| GET | `/api/fleet/earnings` | All earnings records |
| POST | `/api/fleet/payslip/:driverId` | Generate payslip |

### Shifts (DRIVER only)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/shifts/start` | Start a shift |
| PATCH | `/api/shifts/:id/end` | End shift + record earnings |
| GET | `/api/shifts/active` | Current active shift |
| GET | `/api/shifts/my` | Shift history |
| PATCH | `/api/shifts/:id/location` | GPS update |

---

## Deploy to Railway
1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a PostgreSQL database service
4. Add backend service (root dir: `/backend`), set env vars
5. Add frontend service (root dir: `/frontend`), set `VITE_API_URL`
6. Set backend start command: `npm run db:migrate && npm run start`

---

## Excel Upload Format

Your `.xlsx` file needs two sheets:

**Sheet: Drivers**
| fullName | email | password | phone | licenceNumber |
|----------|-------|----------|-------|---------------|
| John Smith | john@example.com | Pass123! | 0821234567 | DL123456 |

**Sheet: Vehicles**
| plateNumber | make | model | year | colour |
|-------------|------|-------|------|--------|
| CA 123-456 | Toyota | Corolla | 2022 | White |
