# ⚔️ Coding Battle — 1v1 Competitive Coding Arena

A real-time **1v1 competitive coding platform** where developers battle each other (or an AI bot) by solving coding challenges. Features ELO-based matchmaking, live code syncing, Monaco editor, and instant verdict execution.

---

## 🚀 Features

- 🎯 **1v1 Real-Time Battles** — Compete against other users or an AI bot in live coding duels
- 🤖 **AI Bot Opponent** — `AlphaCode_AI [BOT]` simulates a typing opponent with realistic progress telemetry
- 🔀 **Smart Matchmaking** — ELO-based queue (±250 range) with platform, difficulty, and topic filters
- 🔒 **Private Rooms** — Create invite-only rooms with a shareable room code
- 📊 **ELO Rating System** — Dynamic ELO rating changes after every match (K=32)
- ⚡ **Live Code Sync** — See opponent's real-time progress (char count, line count, language)
- 🛡️ **Sandboxed Code Execution** — Backend runs submitted code against test cases securely
- 🏆 **Leaderboard** — Global rankings sorted by ELO rating
- 👤 **User Profiles** — Match history, win/loss stats, and streaks
- 🌙 **Cinematic UI** — Built with Next.js, Framer Motion, GSAP, and TailwindCSS

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **Socket.IO** | Real-time bidirectional communication |
| **MongoDB + Mongoose** | Database (users, matches, problems, submissions) |
| **JWT + bcryptjs** | Authentication & password hashing |
| **dotenv** | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with routing |
| **Monaco Editor** | VS Code–grade in-browser code editor |
| **Socket.IO Client** | Real-time match updates |
| **Framer Motion + GSAP** | Animations & transitions |
| **TailwindCSS v4** | Styling |

---

## 📁 Project Structure

```
Coding-Battle-/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── seed.js            # Problem seeding
│   ├── controllers/
│   │   ├── authController.js  # Register / Login
│   │   ├── matchController.js # Match history & retrieval
│   │   └── userController.js  # Leaderboard & profiles
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT auth guard
│   ├── models/
│   │   ├── User.js            # User schema (ELO, wins, streaks)
│   │   ├── Match.js           # Match schema
│   │   ├── Problem.js         # Problem schema + test cases
│   │   └── Submission.js      # Submission record schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── matchRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── executor.js        # Sandboxed code runner
│   │   └── aiReviewService.js # AI review service
│   ├── socket/
│   │   └── socketHandler.js   # All Socket.IO event handlers
│   ├── .env                   # Environment variables (not committed)
│   └── server.js              # Entry point
│
└── frontend/
    ├── public/                # Static assets
    └── src/
        ├── components/        # Reusable UI components
        ├── hooks/             # Custom hooks (useAuth, useSocket)
        ├── layouts/           # DashboardLayout
        ├── pages/             # Next.js pages
        │   ├── index.js       # Landing page
        │   ├── login.js       # Login
        │   ├── register.js    # Register
        │   ├── dashboard.js   # Match lobby & matchmaking
        │   ├── leaderboard.js # Global rankings
        │   ├── match/[id].js  # Active match room
        │   └── profile/[username].js
        ├── styles/
        │   └── globals.css
        └── utils/
            └── api.js         # Axios API client
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local instance or MongoDB Atlas)
- **npm**

---

### 1. Clone the Repository

```bash
git clone https://github.com/akshitbansal2005/Coding-Battle-.git
cd Coding-Battle-
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/codearena
JWT_SECRET=your_super_secret_jwt_key
```

Start the backend server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The backend runs on **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on **http://localhost:3000**

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/leaderboard` | Fetch global leaderboard |
| `GET` | `/api/users/:username` | Get user profile & stats |

### Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/matches/:id` | Get match details |
| `GET` | `/api/matches/user/:userId` | Get user match history |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |

---

## 🔄 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join-matchmaking` | `{ platform, difficulty, topic, timeLimit }` | Enter the matchmaking queue |
| `leave-matchmaking` | — | Exit matchmaking queue |
| `start-bot-match` | `{ platform, difficulty, topic, timeLimit }` | Start a match vs AI bot |
| `create-private-room` | `{ platform, difficulty, topic, timeLimit }` | Create an invite room |
| `join-private-room` | `{ roomCode }` | Join a private room |
| `player-ready` | `{ roomCode, ready }` | Signal ready in lobby |
| `code-sync` | `{ roomCode, progress, charCount, lineCount, language }` | Broadcast live progress |
| `submit-solution` | `{ roomCode, code, language }` | Submit solution for verdict |
| `forfeit-match` | `{ roomCode }` | Forfeit the current match |

### Server → Client
| Event | Description |
|-------|-------------|
| `queue-status` | Matchmaking queue position/status |
| `match-found` | Random match paired, includes problem |
| `private-room-created` | Room created with room code |
| `player-joined` | Opponent joined the room |
| `ready-status-updated` | Both players' ready states |
| `countdown-start` | 5-second countdown begins |
| `battle-start` | Match is live — problem & timer sent |
| `opponent-code-sync` | Live opponent progress update |
| `submission-verdict` | Your submission result |
| `opponent-submission` | Opponent submitted (verdict visible) |
| `match-ended` | Winner, ELO changes, and stats |

---

## 🎮 How to Play

1. **Register / Login** to your account
2. Navigate to the **Dashboard**
3. Choose your match settings:
   - **Platform**: LeetCode, Codeforces, etc.
   - **Difficulty**: Easy / Medium / Hard
   - **Topic**: Arrays, DP, Graphs, etc.
   - **Time Limit**: 15–60 minutes
4. Click **Find Match** to enter the queue, or **vs Bot** to battle `AlphaCode_AI`
5. Once matched, both players **ready up** in the lobby
6. A **5-second countdown** begins, then the battle starts
7. Write your solution in the Monaco editor and **Submit** when done
8. First to pass all test cases wins — ELO updates immediately!

---

## 🏗️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/codearena` |
| `JWT_SECRET` | Secret key for JWT signing | *(required)* |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).

---

<div align="center">
  Made with ⚔️ by <a href="https://github.com/akshitbansal2005">Akshit Bansal</a>
</div>
