# Maatram Foundation — Student Volunteer Impact Hub

## Project Structure

```
Maatram Impact Hub/
├── frontend/          ← React + Vite (Student & Admin UI)
│   ├── src/
│   │   ├── api/       ← API service functions
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/           ← Node.js + Express (REST API)
│   ├── config/        ← MongoDB connection
│   ├── controllers/   ← Business logic
│   ├── middleware/     ← JWT auth guard
│   ├── models/        ← Mongoose schemas
│   ├── routes/        ← API endpoints
│   ├── .env           ← Secrets (not committed)
│   ├── server.js      ← Entry point
│   └── package.json
│
└── README.md
```

## Database (MongoDB Atlas)
- Provider: MongoDB Atlas
- DB Name: `maatram_db`
- Collections: `users`, `events`, `applications`, `notifications`

## Quick Start

### 1. Start Backend
```bash
cd backend
npm install
npm run dev      # runs on http://localhost:5000
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev      # runs on http://localhost:5173
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Student registration |
| POST | /api/auth/login | Login (student/admin) |
| GET | /api/auth/me | Current user |
| GET | /api/events | List all events |
| POST | /api/events | Admin: create event |
| PUT | /api/events/:id | Admin: update event |
| DELETE | /api/events/:id | Admin: delete event |
| POST | /api/applications | Apply for event |
| GET | /api/applications/my | My applications |
| GET | /api/applications/all | Admin: all applications |
| PUT | /api/applications/:id/status | Admin: approve/reject |
| GET | /api/users/leaderboard | Leaderboard |
| GET | /api/notifications | My notifications |

## Admin Access
Configure admin credentials locally and change any seeded credentials before deployment. Do not commit credentials or environment files.
