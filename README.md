# POS Portal Frontend

React frontend for the POS Portal / Back Office Management System.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **State Management**: TanStack React Query
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Features

- User Authentication (Login/Logout)
- Dashboard with Stats Overview
- Store Management
- Branch Management
- Item Management (with Categories)
- POS Device Management
- User Management (placeholder)
- Role Management (placeholder)
- Audit Logs (placeholder)

## Getting Started

### Prerequisites

- Node.js 20+ (22.12+ recommended)
- npm or yarn

### Installation

```bash
cd pos-portal-frontend
npm install
```

### Environment Setup

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── api/              # API client and service modules
├── components/
│   ├── layout/       # Layout components (Sidebar, Header)
│   └── ui/           # Reusable UI components
├── contexts/         # React contexts (Auth)
├── hooks/            # Custom hooks
├── lib/              # Utilities
├── pages/
│   ├── auth/         # Authentication pages
│   └── dashboard/    # Dashboard pages
└── types/            # TypeScript types
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | User login page |
| `/dashboard` | Main dashboard with stats |
| `/stores` | Store management |
| `/branches` | Branch management |
| `/items` | Item and category management |
| `/pos` | POS device management |
| `/users` | User management |
| `/roles` | Role and permission management |
| `/audit` | Audit log viewer |

## Demo Credentials

When the backend is seeded with demo data:

- **Email**: admin@demo.com
- **Password**: admin123

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## License

UNLICENSED
