# 🎓 LinguaPet — Language Learning App

A full-stack web application for learning Japanese and English with flashcards, mini-tests, streak tracking, virtual pets, and study buddies.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Auth | JWT |

## Project Structure

```
itss2/
├── client/   # React frontend (port 5173)
└── server/   # Express backend (port 5001)
```

## Getting Started

### 1. Start the Backend

```bash
cd server
npm install
npm start       # or: node server.js
```

Server runs on **http://localhost:5001**

### 2. Start the Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

## Features

| Feature | Description |
|---|---|
| 📇 Flashcards | 3D flip cards, study mode, browse mode, keyboard nav |
| ✨ Auto-Extract | Paste any Japanese/English text → auto-extract vocabulary |
| 📝 Mini Test | Multiple choice quizzes generated from your decks |
| 🔥 Streak | Daily goals, freeze items, milestone badges & coin rewards |
| 🐾 Virtual Pet | Adopts from egg → baby → teen → adult → legendary |
| 👥 Study Buddy | Create groups, invite codes, shared decks, leaderboard |

## API Endpoints

| Route | Description |
|---|---|
| `POST /api/auth/register` | Register new user |
| `POST /api/auth/login` | Login |
| `GET /api/decks` | Get all decks |
| `POST /api/extract` | Extract vocabulary from text |
| `POST /api/test/generate/:deckId` | Generate quiz |
| `GET /api/streak` | Get streak info |
| `GET /api/pet` | Get pet info |
| `POST /api/buddy/create` | Create study group |

## Environment Variables

`server/.env`:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
PORT=5001
```
